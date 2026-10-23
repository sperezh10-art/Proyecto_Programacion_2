const db = require("../models");
const Op = db.Sequelize.Op;
const Venta = db.ventas;
const Boleto = db.boletos;
const Concierto = db.conciertos;
const Estadio = db.estadios;
const Asiento = db.asientos;
const Localidad = db.localidades;
const Cliente = db.clientes;
const Precio = db.precios;
const Retencion = db.retenciones;
const Usuario = db.usuario;
const Artista = db.artistas;
const telegram = require("../services/telegram.service.js");

const incluirTodo = [
    { model: Usuario, as: "vendedor", attributes: ["id", "usuario", "nombre"] },
    { model: Cliente, as: "cliente", attributes: ["id", "nombre", "nit", "correo"] },
    {
        model: Boleto,
        as: "boletos",
        include: [{
            model: Asiento,
            as: "asiento",
            include: [{ model: Localidad, as: "localidad", attributes: ["id", "nombre"] }]
        }, {
            model: Localidad,
            as: "localidad",
            attributes: ["id", "nombre"]
        }]
    }
];

function formatearVenta(v) {
    const total = Number(v.total);
    const recibido = v.montoRecibido !== null ? Number(v.montoRecibido) : null;

    return {
        id: v.id,
        numero: "V-" + String(v.id).padStart(6, "0"),
        fecha: v.createdAt,
        vendedor: v.vendedor ? (v.vendedor.nombre || v.vendedor.usuario) : null,
        cliente: v.cliente,
        metodoPago: v.metodoPago,
        total: total,
        montoRecibido: recibido,
        cambio: recibido !== null ? recibido - total : null,
        autorizacion: v.autorizacion,
        boletos: v.boletos.map((b, i) => ({
            id: b.id,
            codigo: "SVB-" + v.id + "-" + String(i + 1).padStart(2, "0"),
            conciertoId: b.conciertoId,
            localidad: b.asiento ? b.asiento.localidad.nombre : (b.localidad ? b.localidad.nombre : null),
            dePie: !b.asiento,
            bloque: b.asiento ? b.asiento.bloque : null,
            fila: b.asiento ? b.asiento.filas : null,
            numero: b.asiento ? b.asiento.numero : null,
            precio: Number(b.precio)
        }))
    };
}

exports.create = async (req, res) => {
    const { usuarioId, clienteId, conciertoId, metodoPago, montoRecibido, autorizacion } = req.body;
    const asientos = Array.isArray(req.body.asientos) ? req.body.asientos : [];
    const cantidades = Array.isArray(req.body.cantidades)
        ? req.body.cantidades.filter(c => c && c.localidadId && Number(c.cantidad) > 0)
        : [];

    if (!usuarioId || !clienteId || !conciertoId || !metodoPago) {
        res.status(400).send({ message: "usuarioId, clienteId, conciertoId y metodoPago son obligatorios" });
        return;
    }
    if (asientos.length === 0 && cantidades.length === 0) {
        res.status(400).send({ message: "Debes enviar al menos un asiento o un boleto de pie" });
        return;
    }
    if (metodoPago !== "EFECTIVO" && metodoPago !== "TARJETA") {
        res.status(400).send({ message: "metodoPago debe ser 'EFECTIVO' o 'TARJETA'" });
        return;
    }

    try {
        const concierto = await Concierto.findByPk(conciertoId, { attributes: ["id", "estadioId"] });
        if (!concierto) {
            res.status(404).send({ message: "No existe el concierto con id=" + conciertoId });
            return;
        }

        const cliente = await Cliente.findByPk(clienteId);
        if (!cliente) {
            res.status(400).send({ message: "No existe el cliente con id=" + clienteId });
            return;
        }

        const lista = asientos.length === 0 ? [] : await Asiento.findAll({
            where: { id: asientos },
            include: [{ model: Localidad, as: "localidad" }]
        });

        if (lista.length !== asientos.length) {
            res.status(400).send({ message: "Uno o más asientos no existen" });
            return;
        }
        const estadio = await Estadio.findByPk(concierto.estadioId, { attributes: ["id", "tipo", "nombre"] });
        const plano = estadio && estadio.tipo ? estadio.tipo : "TEATRO";

        if (lista.some(a => a.localidad.plano !== plano)) {
            res.status(400).send({ message: "Uno o más asientos no pertenecen al recinto de este concierto" });
            return;
        }

        const precios = await Precio.findAll({ where: { conciertoId: concierto.id } });
        const preciosPorLocalidad = new Map(precios.map(p => [p.localidadId, p]));

        const boletos = [];
        for (const a of lista) {
            const p = preciosPorLocalidad.get(a.localidadId);
            if (!p || !Number(p.precio)) {
                res.status(400).send({ message: "La localidad " + a.localidad.nombre + " no tiene precio para este concierto" });
                return;
            }
            if (p.modo === "DE_PIE") {
                res.status(400).send({ message: "La localidad " + a.localidad.nombre + " se vende de pie en este concierto" });
                return;
            }
            const precio = Number(p.precio);
            boletos.push({ conciertoId: concierto.id, asientoId: a.id, localidadId: a.localidadId, precio: precio });
        }

        const dePie = [];
        for (const c of cantidades) {
            const localidad = await Localidad.findByPk(c.localidadId);
            if (!localidad || localidad.plano !== plano) {
                res.status(400).send({ message: "La localidad " + c.localidadId + " no pertenece al recinto de este concierto" });
                return;
            }
            const p = preciosPorLocalidad.get(localidad.id);
            if (!p || !Number(p.precio)) {
                res.status(400).send({ message: "La localidad " + localidad.nombre + " no tiene precio para este concierto" });
                return;
            }
            if (localidad.tipo !== "ZONA" && p.modo !== "DE_PIE") {
                res.status(400).send({ message: "La localidad " + localidad.nombre + " es numerada, elige asientos" });
                return;
            }
            const precio = Number(p.precio);
            dePie.push({ localidad: localidad, cantidad: Number(c.cantidad), precio: precio, cupo: p.cupo || 0 });
            for (let i = 0; i < Number(c.cantidad); i++) {
                boletos.push({ conciertoId: concierto.id, asientoId: null, localidadId: localidad.id, precio: precio });
            }
        }

        const total = boletos.reduce((suma, b) => suma + b.precio, 0);

        if (metodoPago === "EFECTIVO" && (!montoRecibido || Number(montoRecibido) < total)) {
            res.status(400).send({ message: "El monto recibido debe ser mayor o igual al total (Q" + total.toFixed(2) + ")" });
            return;
        }
        if (metodoPago === "TARJETA" && !autorizacion) {
            res.status(400).send({ message: "El número de autorización es obligatorio para pagos con tarjeta" });
            return;
        }

        const montoMinimo = Number(process.env.FELPLEX_MONTO_MINIMO_ID);
        if (cliente.nit === "CF" && montoMinimo && total >= montoMinimo) {
            res.status(400).send({ message: "Para ventas de Q" + montoMinimo.toFixed(2) + " o más se requiere NIT o CUI del cliente" });
            return;
        }

        const deOtros = await Retencion.count({
            where: {
                conciertoId: concierto.id,
                asientoId: asientos,
                usuarioId: { [Op.ne]: usuarioId },
                expira: { [Op.gt]: new Date() }
            }
        });
        if (deOtros > 0) {
            res.status(409).send({ message: "Uno o más asientos están retenidos en otra taquilla" });
            return;
        }

        const ventaId = await db.sequelize.transaction(async (t) => {
            for (const d of dePie) {
                await Localidad.findByPk(d.localidad.id, { transaction: t, lock: t.LOCK.UPDATE });
                const vendidos = await Boleto.count({
                    where: { conciertoId: concierto.id, localidadId: d.localidad.id, asientoId: null },
                    transaction: t
                });
                const quedan = d.cupo - vendidos;
                if (d.cantidad > quedan) {
                    const error = new Error("Solo quedan " + Math.max(0, quedan) + " boletos en " + d.localidad.nombre);
                    error.name = "SinCupo";
                    throw error;
                }
            }

            const nueva = await Venta.create({
                usuarioId: usuarioId,
                clienteId: clienteId,
                total: total,
                metodoPago: metodoPago,
                montoRecibido: metodoPago === "EFECTIVO" ? montoRecibido : null,
                autorizacion: metodoPago === "TARJETA" ? autorizacion : null
            }, { transaction: t });

            await Boleto.bulkCreate(boletos.map(b => ({ ...b, ventaId: nueva.id })), { transaction: t });

            if (asientos.length > 0) {
                await Retencion.destroy({
                    where: { conciertoId: concierto.id, asientoId: asientos },
                    transaction: t
                });
            }

            return nueva.id;
        });

        const venta = await Venta.findByPk(ventaId, {
            include: incluirTodo,
            order: [[{ model: Boleto, as: "boletos" }, "id", "ASC"]]
        });
        const datosVenta = formatearVenta(venta);
        res.send(datosVenta);

        try {
            const datosConcierto = await Concierto.findByPk(concierto.id);
            const artista = await Artista.findByPk(datosConcierto.artistaId);
            telegram.enviarMensaje(telegram.mensajeVenta(datosVenta, datosConcierto, artista, estadio));
        } catch (err) {
            console.log("No se pudo preparar el mensaje de Telegram: " + err.message);
        }
    } catch (err) {
        if (err.name === "SinCupo") {
            res.status(409).send({ message: err.message });
            return;
        }
        if (err.name === "SequelizeUniqueConstraintError") {
            res.status(409).send({ message: "Uno o más asientos ya fueron vendidos para este concierto" });
            return;
        }
        if (err.name === "SequelizeForeignKeyConstraintError") {
            res.status(400).send({ message: "El usuario o el cliente no existen" });
            return;
        }
        res.status(500).send({ message: err.message || "Error al registrar la venta" });
    }
};

exports.findAll = (req, res) => {
    const where = {};

    if (req.query.usuarioId) {
        where.usuarioId = req.query.usuarioId;
    }
    if (req.query.hoy === "1") {
        const inicio = new Date();
        inicio.setHours(0, 0, 0, 0);
        where.createdAt = { [Op.gte]: inicio };
    }

    Venta.findAll({
        where: where,
        include: incluirTodo,
        order: [["id", "DESC"], [{ model: Boleto, as: "boletos" }, "id", "ASC"]]
    })
        .then(data => {
            const ventas = data.map(formatearVenta);
            res.send({
                totalVentas: ventas.length,
                totalBoletos: ventas.reduce((suma, v) => suma + v.boletos.length, 0),
                totalMonto: ventas.reduce((suma, v) => suma + v.total, 0),
                ventas: ventas
            });
        })
        .catch(err => {
            res.status(500).send({ message: err.message || "Error al obtener las ventas" });
        });
};

exports.findOne = (req, res) => {
    Venta.findByPk(req.params.id, {
        include: incluirTodo,
        order: [[{ model: Boleto, as: "boletos" }, "id", "ASC"]]
    })
        .then(data => {
            if (!data) {
                res.status(404).send({ message: "No existe la venta con id=" + req.params.id });
                return;
            }
            res.send(formatearVenta(data));
        })
        .catch(err => {
            res.status(500).send({ message: err.message || "Error al obtener la venta" });
        });
};

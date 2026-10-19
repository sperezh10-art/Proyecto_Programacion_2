const db = require("../models");
const Op = db.Sequelize.Op;
const Venta = db.ventas;
const Boleto = db.boletos;
const Concierto = db.conciertos;
const Asiento = db.asientos;
const Localidad = db.localidades;
const Cliente = db.clientes;
const Precio = db.precios;
const Retencion = db.retenciones;
const Usuario = db.usuario;

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
            localidad: b.asiento.localidad.nombre,
            bloque: b.asiento.bloque,
            fila: b.asiento.filas,
            numero: b.asiento.numero,
            precio: Number(b.precio)
        }))
    };
}

exports.create = async (req, res) => {
    const { usuarioId, clienteId, conciertoId, asientos, metodoPago, montoRecibido, autorizacion } = req.body;

    if (!usuarioId || !clienteId || !conciertoId || !metodoPago) {
        res.status(400).send({ message: "usuarioId, clienteId, conciertoId y metodoPago son obligatorios" });
        return;
    }
    if (!Array.isArray(asientos) || asientos.length === 0) {
        res.status(400).send({ message: "Debes enviar al menos un asiento" });
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

        const lista = await Asiento.findAll({
            where: { id: asientos },
            include: [{ model: Localidad, as: "localidad" }]
        });

        if (lista.length !== asientos.length) {
            res.status(400).send({ message: "Uno o más asientos no existen" });
            return;
        }
        if (lista.some(a => a.localidad.estadioId !== concierto.estadioId)) {
            res.status(400).send({ message: "Uno o más asientos no pertenecen al estadio de este concierto" });
            return;
        }

        const precios = await Precio.findAll({ where: { conciertoId: concierto.id } });
        const preciosPorLocalidad = new Map(precios.map(p => [p.localidadId, Number(p.precio)]));

        const boletos = [];
        for (const a of lista) {
            const precio = preciosPorLocalidad.has(a.localidadId) ? preciosPorLocalidad.get(a.localidadId) : Number(a.localidad.precio);
            if (!precio) {
                res.status(400).send({ message: "La localidad " + a.localidad.nombre + " no tiene precio para este concierto" });
                return;
            }
            boletos.push({ conciertoId: concierto.id, asientoId: a.id, precio: precio });
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
            const nueva = await Venta.create({
                usuarioId: usuarioId,
                clienteId: clienteId,
                total: total,
                metodoPago: metodoPago,
                montoRecibido: metodoPago === "EFECTIVO" ? montoRecibido : null,
                autorizacion: metodoPago === "TARJETA" ? autorizacion : null
            }, { transaction: t });

            await Boleto.bulkCreate(boletos.map(b => ({ ...b, ventaId: nueva.id })), { transaction: t });

            await Retencion.destroy({
                where: { conciertoId: concierto.id, asientoId: asientos },
                transaction: t
            });

            return nueva.id;
        });

        const venta = await Venta.findByPk(ventaId, {
            include: incluirTodo,
            order: [[{ model: Boleto, as: "boletos" }, "id", "ASC"]]
        });
        res.send(formatearVenta(venta));
    } catch (err) {
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

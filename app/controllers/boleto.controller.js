const db = require("../models");
const Boleto = db.boletos;
const Cancelacion = db.cancelaciones;
const Venta = db.ventas;
const Usuario = db.usuario;
const Asiento = db.asientos;
const Localidad = db.localidades;
const Concierto = db.conciertos;
const Artista = db.artistas;
const Estadio = db.estadios;
const Cliente = db.clientes;
const telegram = require("../services/telegram.service.js");
const correo = require("../services/correo.service.js");

exports.validar = async (req, res) => {
    const codigo = req.body.codigo ? String(req.body.codigo).trim().toUpperCase() : "";

    if (!codigo) {
        res.status(400).send({ estado: "NO_EXISTE", message: "No se leyó ningún código" });
        return;
    }

    try {
        const boleto = await Boleto.findOne({
            where: { codigo: codigo },
            include: [
                { model: Asiento, as: "asiento" },
                { model: Localidad, as: "localidad" }
            ]
        });

        if (!boleto) {
            const cancelado = await Cancelacion.findOne({ where: { codigo: codigo } });
            if (cancelado) {
                res.status(409).send({ estado: "CANCELADO", message: "Este boleto fue cancelado, no puede entrar" });
                return;
            }
            res.status(404).send({ estado: "NO_EXISTE", message: "Este código no pertenece a ningún boleto" });
            return;
        }

        const concierto = await Concierto.findByPk(boleto.conciertoId);
        const artista = concierto ? await Artista.findByPk(concierto.artistaId) : null;
        const estadio = concierto ? await Estadio.findByPk(concierto.estadioId) : null;

        let nombreLocalidad = boleto.localidad ? boleto.localidad.nombre : null;
        if (!nombreLocalidad && boleto.asiento) {
            const localidad = await Localidad.findByPk(boleto.asiento.localidadId);
            nombreLocalidad = localidad ? localidad.nombre : null;
        }

        let lugar = "Acceso general · De pie";
        if (boleto.asiento) {
            lugar = "Bloque " + boleto.asiento.bloque + " · Fila " + boleto.asiento.filas + " · Asiento " + boleto.asiento.numero;
        }

        const datos = {
            codigo: boleto.codigo,
            artista: artista ? artista.nombre : null,
            gira: concierto ? concierto.gira : null,
            recinto: estadio ? estadio.nombre : null,
            localidad: nombreLocalidad,
            lugar: lugar,
            venta: "V-" + String(boleto.ventaId).padStart(6, "0")
        };

        if (boleto.usado) {
            datos.estado = "USADO";
            datos.usadoEn = boleto.usadoEn;
            datos.message = "Este boleto ya se usó";
            res.status(409).send(datos);
            return;
        }

        boleto.usado = true;
        boleto.usadoEn = new Date();
        await boleto.save();

        datos.estado = "VALIDO";
        datos.message = "Boleto válido, puede entrar";
        res.send(datos);
    } catch (err) {
        res.status(500).send({ estado: "ERROR", message: err.message || "Error al validar el boleto" });
    }
};

exports.cancelar = async (req, res) => {
    const id = Number(req.params.id);
    const usuarioId = Number(req.body.usuarioId);
    const motivo = req.body.motivo ? String(req.body.motivo).trim() : null;

    if (!Number.isInteger(id) || !Number.isInteger(usuarioId)) {
        res.status(400).send({ message: "Faltan datos para cancelar el boleto" });
        return;
    }

    try {
        const usuario = await Usuario.findByPk(usuarioId);
        if (!usuario || (usuario.rol !== "ADMIN" && usuario.rol !== "Administrador")) {
            res.status(403).send({ message: "Solo un administrador puede cancelar boletos" });
            return;
        }

        const boleto = await Boleto.findByPk(id, {
            include: [
                { model: Asiento, as: "asiento", include: [{ model: Localidad, as: "localidad" }] },
                { model: Localidad, as: "localidad" }
            ]
        });
        if (!boleto) {
            res.status(404).send({ message: "El boleto no existe o ya fue cancelado" });
            return;
        }
        if (boleto.usado) {
            res.status(409).send({ message: "No se puede cancelar un boleto que ya se usó para entrar" });
            return;
        }

        await db.sequelize.transaction(async (t) => {
            await Cancelacion.create({
                boletoId: boleto.id,
                ventaId: boleto.ventaId,
                conciertoId: boleto.conciertoId,
                asientoId: boleto.asientoId,
                localidadId: boleto.localidadId,
                precio: boleto.precio,
                codigo: boleto.codigo,
                motivo: motivo || null,
                usuarioId: usuarioId
            }, { transaction: t });

            const venta = await Venta.findByPk(boleto.ventaId, { transaction: t, lock: t.LOCK.UPDATE });
            venta.total = Math.max(0, Number(venta.total) - Number(boleto.precio));
            await venta.save({ transaction: t });

            await boleto.destroy({ transaction: t });
        });

        const destino = await avisarCancelacion(boleto, usuario, motivo);

        let mensaje = "Boleto " + boleto.codigo + " cancelado. El lugar ya está libre para la venta.";
        if (destino) {
            mensaje += " Se avisó al cliente a " + destino + ".";
        }
        res.send({ message: mensaje });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al cancelar el boleto" });
    }
};

async function avisarCancelacion(boleto, usuario, motivo) {
    try {
        const venta = await Venta.findByPk(boleto.ventaId, { include: [{ model: Cliente, as: "cliente" }] });
        const concierto = await Concierto.findByPk(boleto.conciertoId);
        const artista = concierto ? await Artista.findByPk(concierto.artistaId) : null;
        const estadio = concierto ? await Estadio.findByPk(concierto.estadioId) : null;

        let localidad = "General";
        if (boleto.asiento && boleto.asiento.localidad) {
            localidad = boleto.asiento.localidad.nombre;
        } else if (boleto.localidad) {
            localidad = boleto.localidad.nombre;
        }

        let lugar = "Acceso general · De pie";
        if (boleto.asiento) {
            lugar = "Bloque " + boleto.asiento.bloque + " · Fila " + boleto.asiento.filas + " · Asiento " + boleto.asiento.numero;
        }

        let cliente = null;
        if (venta && venta.cliente && venta.cliente.nit !== "CF") {
            cliente = venta.cliente.nombre;
        }

        const datos = {
            venta: "V-" + String(boleto.ventaId).padStart(6, "0"),
            codigo: boleto.codigo,
            precio: Number(boleto.precio),
            localidad: localidad,
            lugar: lugar,
            motivo: motivo,
            cliente: cliente,
            canceladoPor: usuario.nombre || usuario.usuario,
            artista: artista ? artista.nombre : null,
            gira: concierto ? concierto.gira : null,
            recinto: estadio ? estadio.nombre : null,
            ubicacion: estadio ? [estadio.direccion, estadio.ciudad, estadio.pais].filter(p => p).join(", ") : null,
            concierto: concierto
        };

        telegram.enviarMensaje(telegram.mensajeCancelacion(datos));

        let destino = venta ? venta.correo : null;
        if (!destino && venta && venta.cliente) {
            destino = venta.cliente.correo;
        }
        if (!destino || !destino.includes("@")) {
            return null;
        }
        correo.enviarCancelacion(destino, datos);
        return destino;
    } catch (err) {
        console.log("No se pudo avisar la cancelación: " + err.message);
        return null;
    }
}

exports.qr = async (req, res) => {
    const codigo = String(req.params.codigo || "").trim().toUpperCase();

    if (!/^SVB-[0-9A-F]{1,40}$/.test(codigo)) {
        res.status(400).send({ message: "El código no es válido" });
        return;
    }

    try {
        const imagen = await require("qrcode").toBuffer(codigo, { width: 220, margin: 1 });
        res.type("png").send(imagen);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al generar el QR" });
    }
};

const db = require("../models");
const Boleto = db.boletos;
const Asiento = db.asientos;
const Localidad = db.localidades;
const Concierto = db.conciertos;
const Artista = db.artistas;
const Estadio = db.estadios;

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

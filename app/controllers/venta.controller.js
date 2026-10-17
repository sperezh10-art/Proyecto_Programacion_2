const db = require("../models");
const Venta = db.ventas;
const Boleto = db.boletos;
const Concierto = db.conciertos;
const Asiento = db.asientos;
const Localidad = db.localidades;

exports.create = async (req, res) => {
    const { usuarioId, clienteId, conciertoId, asientos, metodoPago } = req.body;

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

        const total = lista.reduce((suma, a) => suma + Number(a.localidad.precio), 0);

        const venta = await db.sequelize.transaction(async (t) => {
            const nueva = await Venta.create({
                usuarioId: usuarioId,
                clienteId: clienteId,
                total: total,
                metodoPago: metodoPago
            }, { transaction: t });

            const boletos = lista.map(a => ({
                ventaId: nueva.id,
                conciertoId: concierto.id,
                asientoId: a.id,
                precio: a.localidad.precio
            }));
            await Boleto.bulkCreate(boletos, { transaction: t });

            return nueva;
        });

        res.send({
            id: venta.id,
            total: venta.total,
            metodoPago: venta.metodoPago,
            boletos: lista.map(a => ({
                asientoId: a.id,
                localidad: a.localidad.nombre,
                fila: a.filas,
                numero: a.numero,
                precio: a.localidad.precio
            }))
        });
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
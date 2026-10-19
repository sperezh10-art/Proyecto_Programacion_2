const db = require("../models");
const Precio = db.precios;
const Localidad = db.localidades;

exports.create = async (req, res) => {
    const { conciertoId, localidadId, precio } = req.body;

    if (!conciertoId || !localidadId || !precio) {
        res.status(400).send({ message: "conciertoId, localidadId y precio son obligatorios" });
        return;
    }

    try {
        const existente = await Precio.findOne({ where: { conciertoId: conciertoId, localidadId: localidadId } });

        if (existente) {
            existente.precio = precio;
            await existente.save();
            res.send(existente);
            return;
        }

        const nuevo = await Precio.create({ conciertoId: conciertoId, localidadId: localidadId, precio: precio });
        res.send(nuevo);
    } catch (err) {
        if (err.name === "SequelizeForeignKeyConstraintError") {
            res.status(400).send({ message: "El concierto o la localidad no existen" });
            return;
        }
        res.status(500).send({ message: err.message || "Error al guardar el precio" });
    }
};

exports.findByConcierto = (req, res) => {
    Precio.findAll({
        where: { conciertoId: req.params.conciertoId },
        include: [{ model: Localidad, as: "localidad", attributes: ["id", "nombre"] }]
    })
        .then(data => {
            res.send(data.map(p => ({
                id: p.id,
                conciertoId: p.conciertoId,
                localidadId: p.localidadId,
                localidad: p.localidad ? p.localidad.nombre : null,
                precio: p.precio
            })));
        })
        .catch(err => {
            res.status(500).send({ message: err.message || "Error al obtener los precios" });
        });
};

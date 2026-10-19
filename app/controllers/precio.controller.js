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
        const localidad = await Localidad.findByPk(localidadId);
        if (!localidad) {
            res.status(400).send({ message: "El concierto o la localidad no existen" });
            return;
        }

        let modo = req.body.modo === "DE_PIE" ? "DE_PIE" : "NUMERADA";
        if (localidad.tipo === "ZONA") {
            modo = "DE_PIE";
        }
        if (modo === "DE_PIE" && (localidad.tipo === "PALCOS" || localidad.codigo === "CAB")) {
            res.status(400).send({ message: localidad.nombre + " solo se puede vender numerada" });
            return;
        }
        const cupo = modo === "DE_PIE" ? Number(req.body.cupo) : null;
        if (modo === "DE_PIE" && !(cupo > 0)) {
            res.status(400).send({ message: "Indica el aforo de " + localidad.nombre + " (de pie)" });
            return;
        }

        const existente = await Precio.findOne({ where: { conciertoId: conciertoId, localidadId: localidadId } });

        if (existente) {
            existente.precio = precio;
            existente.modo = modo;
            existente.cupo = cupo;
            await existente.save();
            res.send(existente);
            return;
        }

        const nuevo = await Precio.create({ conciertoId: conciertoId, localidadId: localidadId, precio: precio, modo: modo, cupo: cupo });
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
                precio: p.precio,
                modo: p.modo || "NUMERADA",
                cupo: p.cupo
            })));
        })
        .catch(err => {
            res.status(500).send({ message: err.message || "Error al obtener los precios" });
        });
};

exports.remove = async (req, res) => {
    try {
        const vendidos = await db.boletos.count({
            where: { conciertoId: req.params.conciertoId, localidadId: req.params.localidadId }
        });
        if (vendidos > 0) {
            res.status(409).send({ message: "No se puede quitar la localidad: ya tiene boletos vendidos en este concierto" });
            return;
        }
        await Precio.destroy({ where: { conciertoId: req.params.conciertoId, localidadId: req.params.localidadId } });
        res.send({ message: "Localidad retirada del concierto" });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al quitar la localidad" });
    }
};

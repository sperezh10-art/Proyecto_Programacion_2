const db = require("../models");
const Localidad = db.localidades;
const Asiento = db.asientos;

exports.create = (req, res) => {
    if (!req.body.nombre || !req.body.filas || !req.body.asientos_por_fila || !req.body.estadioId) {
        res.status(400).send({ message: "nombre, filas, asientos_por_fila y estadioId son obligatorios" });
        return;
    }

    const localidad = {
        nombre: req.body.nombre,
        bloques: req.body.bloques ? req.body.bloques : 1,
        filas: req.body.filas,
        asientos_por_fila: req.body.asientos_por_fila,
        precio: req.body.precio,
        color: req.body.color,
        estadioId: req.body.estadioId
    };

    Localidad.create(localidad)
        .then(data => {
            const asientos = [];

            for (let b = 0; b < data.bloques; b++) {
                const bloque = String.fromCharCode(65 + b);

                for (let f = 0; f < data.filas; f++) {
                    const fila = String.fromCharCode(65 + f);

                    for (let n = 1; n <= data.asientos_por_fila; n++) {
                        asientos.push({
                            bloque: bloque,
                            filas: fila,
                            numero: n,
                            localidadId: data.id
                        });
                    }
                }
            }

            Asiento.bulkCreate(asientos)
                .then(() => {
                    res.send({ localidad: data, asientosCreados: asientos.length });
                })
                .catch(err => {
                    res.status(500).send({ message: err.message || "Error al crear los asientos" });
                });
        })
        .catch(err => {
            if (err.name === "SequelizeForeignKeyConstraintError") {
                res.status(400).send({ message: "El estadio con id=" + req.body.estadioId + " no existe" });
                return;
            }
            res.status(500).send({ message: err.message || "Error al crear la localidad" });
        });
};

exports.findAll = (req, res) => {
    Localidad.findAll({
        include: [{ model: Asiento, as: "asientos" }]
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({ message: err.message || "Error al obtener las localidades" });
        });
};

exports.findByEstadio = (req, res) => {
    Localidad.findAll({
        where: { estadioId: req.params.estadioId },
        order: [["id", "ASC"]]
    })
        .then(data => {
            res.send(data.map(l => ({
                id: l.id,
                nombre: l.nombre,
                bloques: l.bloques,
                filas: l.filas,
                asientos_por_fila: l.asientos_por_fila,
                totalAsientos: l.bloques * l.filas * l.asientos_por_fila,
                precio: l.precio,
                color: l.color,
                estadioId: l.estadioId
            })));
        })
        .catch(err => {
            res.status(500).send({ message: err.message || "Error al obtener las localidades" });
        });
};

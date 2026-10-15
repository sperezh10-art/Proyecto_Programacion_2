    const db = require("../models");
    const Cliente = db.clientes;

exports.create = (req, res) => {
        if (!req.body.nombre || !req.body.nit || !req.body.correo) {
            res.status(400).send({ message: "Nombre, NIT y correo son obligatorios" });
            return;
        }


        const cliente = {
            nombre: req.body.nombre,
            nit: req.body.nit,
            correo: req.body.correo,
            telefono: req.body.telefono
        };
        };

        Cliente.create(cliente)
            .then(data => {
                res.send({ id: data.id, nombre: data.nombre, nit: data.nit, correo: data.correo, telefono: data.telefono });
            })
            .catch(err => {
                if (err.name === "SequelizeUniqueConstraintError") {
                    res.status(409).send({ message: "Ese cliente ya existe" });
                    return;
                }
                res.status(500).send({ message: err.message || "Error al crear el cliente" });
            });
        
            Cliente.findAll({ where: { nit: req.query.nit } })
            .then(data => {
                res.send(data);
            })
            .catch(err => {
                res.status(500).send({ message: err.message || "Error al buscar el cliente" });
            });


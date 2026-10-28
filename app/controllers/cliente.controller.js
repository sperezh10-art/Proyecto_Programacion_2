const db = require("../models");
const Cliente = db.clientes;
const felplex = require("../services/felplex.service.js");

function limpiarNit(nit) {
    return String(nit || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
}

exports.create = (req, res) => {
    const nit = limpiarNit(req.body.nit);

    if (!req.body.nombre || !nit) {
        res.status(400).send({ message: "Nombre y NIT son obligatorios" });
        return;
    }

    const cliente = {
        nombre: req.body.nombre,
        nit: nit,
        correo: req.body.correo,
        telefono: req.body.telefono
    };

    Cliente.create(cliente)
        .then(data => {
            res.send({ id: data.id, nombre: data.nombre, nit: data.nit, correo: data.correo, telefono: data.telefono });
        })
        .catch(err => {
            if (err.name === "SequelizeUniqueConstraintError") {
                res.status(409).send({ message: "Ya existe un cliente con ese NIT" });
                return;
            }
            res.status(500).send({ message: err.message || "Error al crear el cliente" });
        });
};

exports.findByNit = async (req, res) => {
    const nit = limpiarNit(req.params.nit);

    if (!nit) {
        res.status(400).send({ message: "El NIT no es válido" });
        return;
    }

    try {
        let cliente = await Cliente.findOne({ where: { nit: nit } });
        if (cliente) {
            res.send(cliente);
            return;
        }

        if (nit === "CF") {
            cliente = await Cliente.create({ nombre: "Consumidor Final", nit: "CF" });
            res.send(cliente);
            return;
        }

        const sat = await felplex.buscarNit(nit);
        if (!sat) {
            res.status(404).send({ message: "No se encontró el NIT " + nit });
            return;
        }

        cliente = await Cliente.create({ nombre: sat.nombre, nit: nit, correo: sat.correo });
        res.send(cliente);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al buscar el cliente" });
    }
};
exports.findAll = async (req, res) => {
    const buscar = req.query.buscar ? "%" + String(req.query.buscar).trim() + "%" : null;

    try {
        const filas = await db.sequelize.query(
            `SELECT c.id, c.nombre, c.nit, c.correo, c.telefono,
                    COUNT(DISTINCT v.id)::int AS compras,
                    COUNT(b.id)::int AS boletos,
                    COALESCE(SUM(b.precio), 0) AS total,
                    MAX(v."createdAt") AS "ultimaCompra"
               FROM clientes c
               LEFT JOIN ventas v ON v."clienteId" = c.id
               LEFT JOIN boletos b ON b."ventaId" = v.id
              WHERE c.nit <> 'CF'
                AND (:buscar::text IS NULL OR c.nombre ILIKE :buscar OR c.nit ILIKE :buscar)
              GROUP BY c.id
              ORDER BY MAX(v."createdAt") DESC NULLS LAST, c.nombre
              LIMIT 300`,
            { replacements: { buscar: buscar }, type: db.Sequelize.QueryTypes.SELECT }
        );
        res.send(filas.map(c => ({ ...c, total: Number(c.total) })));
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al obtener los clientes" });
    }
};

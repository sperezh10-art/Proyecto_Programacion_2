const db = require("../models");
const Bitacora = db.bitacora;

exports.findAll = (req, res) => {
    Bitacora.findAll({ order: [["id", "DESC"]] })
        .then(data => {
            res.send(data.map(b => ({
                id: b.id,
                usuarioId: b.usuarioId,
                usuario: b.usuario,
                metodo: b.metodo,
                realizadoPor: b.realizadoPor,
                fecha: b.createdAt
            })));
        })
        .catch(err => {
            res.status(500).send({ message: err.message || "Error al obtener la bitácora" });
        });
};

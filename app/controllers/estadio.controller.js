 
const db = require("../models");
const Estadio = db.estadios;
const Op = db.Sequelize.Op;
const plano = require("../services/plano.service.js");


exports.create = (req, res) => {

    if (!req.body.nombre) {
        res.status(400).send({
            message: "Ningun campo puede quedar vacio"
        });
        return;
    }

    const estadio = {
        nombre: req.body.nombre,
        accesos: req.body.accesos,
        capacidad: req.body.capacidad,
        tipo: ["TEATRO", "ESTADIO", "EXPLANADA"].includes(req.body.tipo) ? req.body.tipo : "TEATRO"
    };


    db.sequelize.transaction(async (t) => {
        const data = await Estadio.create(estadio, { transaction: t });
        await plano.crearPlano(db, data, plano.PLANOS[data.tipo], t);
        return data;
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Error al crear el Estadio"
            });
        });
};


exports.findAll = (req, res) => {
    const nombre = req.query.nombre;
    var condition = nombre ? { nombre: { [Op.iLike]: `%${nombre}%` } } : null;

    Estadio.findAll({ where: condition })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Ha ocurrido algun error al recuperar los estadios"
            });
        });
};


exports.findOne = (req, res) => {
    const id = req.params.id;

    Estadio.findByPk(id)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: "Error al recuperar el estadio con el id=" + id
            });
        });
};


exports.update = (req, res) => {
    const id = req.params.id;
    delete req.body.tipo;

    Estadio.update(req.body, {
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "El Estadio ha sido actualizado exitosamente!"
                });
            } else {
                res.send({
                    message: `No se pudo actualzar el Estadio con el id=${id}. El Estadio no fue encontrado o req.body esta vacio!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Error al actualizar al Estadio con el id=" + id
            });
        });
};


exports.delete = async (req, res) => {
    const id = req.params.id;

    const conciertos = await db.conciertos.count({ where: { estadioId: id } });
    if (conciertos > 0) {
        res.status(400).send({ message: "No se puede eliminar: el recinto tiene conciertos" });
        return;
    }

    db.sequelize.transaction(async (t) => {
        const localidades = await db.localidades.findAll({ where: { estadioId: id }, attributes: ["id"], transaction: t });
        const ids = localidades.map(l => l.id);
        await db.asientos.destroy({ where: { localidadId: ids }, transaction: t });
        await db.localidades.destroy({ where: { id: ids }, transaction: t });
        return Estadio.destroy({ where: { id: id }, transaction: t });
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "El Estadio fue eleiminado exitosamente!"
                });
            } else {
                res.send({
                    message: `No se pudo eliminar el Estadio con el id=${id}. El Estadio no fue encontado!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Error al eliminar el Estadio con id=" + id
            });
        });
};


exports.deleteAll = (req, res) => {
    Estadio.destroy({
        where: {},
        truncate: false
    })
        .then(nums => {
            res.send({ message: `${nums} Los Estadios han sido eliminados exitosamente!` });
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Ha ocurrido algun error al intentar eliminar a todos los Estadios"
            });
        });
};


exports.findAllStatus = (req, res) => {
    Estadio.findAll({ where: { status: true } })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Algun error ha ocurrido al intentar encontrar el Estadio"
            });
        }) 
    
    };
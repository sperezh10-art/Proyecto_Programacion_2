 
const db = require("../models");
const Concierto = db.conciertos;
const Op = db.Sequelize.Op;


exports.create = async (req, res) => {

    if (!req.body.estadio || !req.body.gira || !req.body.hora ||
        !req.body.fecha || !req.body.artista || !req.body.estado) {

        return res.status(400).send({
            message: "Ningun campo puede quedar vacio"
        });
    }

    try {

        // Buscar artista por nombre
        const artista = await db.artistas.findOne({
            where: {
                nombre: req.body.artista
            }
        });

        if (!artista) {
            return res.status(404).send({
                message: "El artista no existe"
            });
        }

        // Buscar estadio por nombre
        const estadio = await db.estadios.findOne({
            where: {
                nombre: req.body.estadio
            }
        });

        if (!estadio) {
            return res.status(404).send({
                message: "El estadio no existe"
            });
        }

        // Crear concierto utilizando los IDs encontrados
        const concierto = {
            gira: req.body.gira,
            estadioId: estadio.id,
            hora: req.body.hora,
            fecha: req.body.fecha,
            artistaId: artista.id,
            estado: req.body.estado
        };

        const data = await db.conciertos.create(concierto);

        res.send(data);

    } catch (err) {

        res.status(500).send({
            message: err.message || "Error al crear el concierto"
        });

    }
};


exports.findAll = (req, res) => {
    const nombre = req.query.nombre;
    var condition = nombre ? { nombre: { [Op.iLike]: `%${nombre}%` } } : null;

    Concierto.findAll({ where: condition })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Ha ocurrido algun error al recuperar los Concierto"
            });
        });
};


exports.findOne = (req, res) => {
    const id = req.params.id;

    Concierto.findByPk(id)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: "Error al recuperar al concierto con el id=" + id
            });
        });
};


exports.update = (req, res) => {
    const id = req.params.id;

    Concierto.update(req.body, {
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "El Concierto ha sido actualizado exitosamente!"
                });
            } else {
                res.send({
                    message: `No se pudo actualzar el Concierto con el id=${id}. El Concierto no fue encontrado o req.body esta vacio!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Error al actualizar al Concierto con el id=" + id
            });
        });
};


exports.delete = (req, res) => {
    const id = req.params.id;

    Concierto.destroy({
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "El Concierto fue eleiminado exitosamente!"
                });
            } else {
                res.send({
                    message: `No se pudo eliminar al Concierto con el id=${id}. El proveedor no fue encontado!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Error al eliminar el Concierto con id=" + id
            });
        });
};


exports.deleteAll = (req, res) => {
    Concierto.destroy({
        where: {},
        truncate: false
    })
        .then(nums => {
            res.send({ message: `${nums} Los Conciertos han sido eliminados exitosamente!` });
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Ha ocurrido algun error al intentar eliminar a todos los Conciertos"
            });
        });
};


exports.findAllStatus = (req, res) => {
    Concierto.findAll({ where: { status: true } })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Algun error ha ocurrido al intentar encontrar al Concierto"
            });
        }) 
    
    };
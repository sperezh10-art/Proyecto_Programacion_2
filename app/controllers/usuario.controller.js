// importamos db los modelos en este caso si tenemos uno o mas, se puede referenciar db."nombreModelo".   
const db = require("../models");
const Usuario = db.usuarios;
const Op = db.Sequelize.Op;

// Crear un nuevo usuario
exports.create = (req, res) => {
    if (!req.body.usuario || !req.body.contrasena) {
        return res.status(400).send({
            message: "Los campos usuario y contrasena son obligatorios."
        });
    }

    const usuario = {
        nombre: req.body.nombre,
        usuario: req.body.usuario,
        contrasena: req.body.contrasena,
        rol: req.body.rol,
        status: req.body.status ?? true
    };

    Usuario.create(usuario)
        .then(data => {
            res.status(201).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message ||
                    "Ocurrio un error al crear el usuario."
            });
        });
};

// Obtener todos los usuarios, opcionalmente filtrados por nombre
exports.findAll = (req, res) => {
    const nombre = req.query.nombre;

    const condition = nombre
        ? { nombre: { [Op.iLike]: `%${nombre}%` } }
        : null;

    Usuario.findAll({ where: condition })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message ||
                    "Ocurrio un error al consultar los usuarios."
            });
        });
};

// Obtener un usuario por su ID
exports.findOne = (req, res) => {
    const id = req.params.id;

    Usuario.findByPk(id)
        .then(data => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({
                    message: `No se encontro el usuario con id=${id}.`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message ||
                    `Error al consultar el usuario con id=${id}.`
            });
        });
};

// Actualizar un usuario por su ID
exports.update = (req, res) => {
    const id = req.params.id;

    Usuario.update(req.body, {
        where: { id: id }
    })
        .then(([num]) => {
            if (num === 1) {
                res.send({
                    message: "Usuario actualizado correctamente."
                });
            } else {
                res.status(404).send({
                    message: `No se pudo actualizar el usuario con id=${id}.`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message ||
                    `Error al actualizar el usuario con id=${id}.`
            });
        });
};

// Eliminar un usuario por su ID
exports.delete = (req, res) => {
    const id = req.params.id;

    Usuario.destroy({
        where: { id: id }
    })
        .then(num => {
            if (num === 1) {
                res.send({
                    message: "Usuario eliminado correctamente."
                });
            } else {
                res.status(404).send({
                    message: `No se encontro el usuario con id=${id}.`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message ||
                    `Error al eliminar el usuario con id=${id}.`
            });
        });
};

// Eliminar todos los usuarios
exports.deleteAll = (req, res) => {
    Usuario.destroy({
        where: {},
        truncate: false
    })
        .then(nums => {
            res.send({
                message: `${nums} usuarios eliminados correctamente.`
            });
        })
        .catch(err => {
            res.status(500).send({
                message: err.message ||
                    "Ocurrio un error al eliminar los usuarios."
            });
        });
};

// Obtener todos los usuarios activos
exports.findAllStatus = (req, res) => {
    Usuario.findAll({
        where: { status: true }
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message ||
                    "Ocurrio un error al consultar los usuarios activos."
            });
        });
};
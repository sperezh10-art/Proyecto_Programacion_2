// importamos db los modelos en este caso si tenemos uno o mas, se puede referenciar db."nombreModelo".   
const db = require("../models");
const Artista = db.artistas;
const Op = db.Sequelize.Op;

// Create and Save a new Client
exports.create = (req, res) => {
    // Validamos que dentro del  request no venga vacio el nombre, de lo contrario returna error
    if (!req.body.nombre) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
        return;
    }

    // Create a Client, definiendo una variable con la estructura del reques para luego solo ser enviada como parametro mas adelante. 
    const artista = {
        nombre: req.body.nombre,
        genero: req.body.genero,
        agencia: req.body.agencia
    };

    // Save a new Client into the database
    Artista.create(artista)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the Client."
            });
        });
};

// Retrieve all Client from the database.
exports.findAll = (req, res) => {
    const nombre = req.query.nombre;
    var condition = nombre ? { nombre: { [Op.iLike]: `%${nombre}%` } } : null;

    Artista.findAll({ where: condition })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving clients."
            });
        });
};

// Find a single Tutorial with an id
exports.findOne = (req, res) => {
    const id = req.params.id;

    Artista.findByPk(id)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: "Error retrieving Cliente with id=" + id
            });
        });
};

// Update a Tutorial by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    Artista.update(req.body, {
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "Artista was updated successfully."
                });
            } else {
                res.send({
                    message: `Cannot update Artista with id=${id}. Maybe Artista was not found or req.body is empty!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Error updating Artista with id=" + id
            });
        });
};

// Delete a Client with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    // utilizamos el metodo destroy para eliminar el objeto mandamos la condicionante where id = parametro que recibimos 
    Artista.destroy({
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "Artista was deleted successfully!"
                });
            } else {
                res.send({
                    message: `Cannot delete Artista with id=${id}. El Artista no fue encontado!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Could not delete Tutorial with id=" + id
            });
        });
};

// Delete all Clients from the database.
exports.deleteAll = (req, res) => {
    Artista.destroy({
        where: {},
        truncate: false
    })
        .then(nums => {
            res.send({ message: `${nums} Artistas were deleted successfully!` });
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while removing all Artistas."
            });
        });
};

// find all active Client, basado en el atributo status vamos a buscar que solo los clientes activos
exports.findAllStatus = (req, res) => {
    Artista.findAll({ where: { status: true } })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving Artista."
            });
        }) 
    
    };
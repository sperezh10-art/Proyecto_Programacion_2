const db = require("../models");
const bcrypt = require("bcryptjs");
const Usuario = db.usuario;

// Crear usuario: guarda la contraseña con hash
exports.registro = (req, res) => {
    if (!req.body.usuario || !req.body.contrasena) {
        res.status(400).send({ message: "Usuario y contraseña son obligatorios" });
        return;
    }

    const usuario = {
        usuario: req.body.usuario,
        contrasena: bcrypt.hashSync(req.body.contrasena, 10),   
        nombre: req.body.nombre,
        rol: req.body.rol ? req.body.rol : "VENDEDOR"
    };

    Usuario.create(usuario)
        .then(data => {
            res.send({ id: data.id, usuario: data.usuario, nombre: data.nombre, rol: data.rol });
        })
        .catch(err => {
            if (err.name === "SequelizeUniqueConstraintError") {
                res.status(409).send({ message: "Ese usuario ya existe" });
                return;
            }
            res.status(500).send({ message: err.message || "Error al crear el usuario" });
        });
};


exports.login = (req, res) => {
    // 1. Que vengan los dos campos
    if (!req.body.usuario || !req.body.contrasena) {
        res.status(400).send({ message: "Usuario y contraseña son obligatorios" });
        return;
    }

    Usuario.findOne({ where: { usuario: req.body.usuario, status: true } })
        .then(data => {
            // 3. No existe o la contraseña no coincide con el hash → 401
            if (!data || !bcrypt.compareSync(req.body.contrasena, data.contrasena)) {
                res.status(401).send({ message: "Usuario o contraseña incorrectos" });
                return;
            }
            if(data.status === false) {
                res.status(403).send({ message: "Usuario deshabilitado" });
                return;
            }
            
            res.send({ id: data.id, usuario: data.usuario, nombre: data.nombre, rol: data.rol });
        })
        .catch(err => {
            res.status(500).send({ message: err.message || "Error al iniciar sesión" });
        });
};
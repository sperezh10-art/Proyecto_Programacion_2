const db = require("../models");
const bcrypt = require("bcryptjs");
const Usuario = db.usuario;
const Codigo = db.codigos;
const Bitacora = db.bitacora;
const correo = require("../services/correo.service.js");
const Op = db.Sequelize.Op;

// Crear usuario: guarda la contraseña con hash
exports.registro = (req, res) => {
    if (!req.body.usuario || !req.body.contrasena) {
        res.status(400).send({ message: "Usuario y contraseña son obligatorios" });
        return;
    }

    if(req.body.rol && req.body.rol !== "ADMIN" && req.body.rol !== "VENDEDOR") {
        res.status(400).send({ message: "Rol inválido. Debe ser 'ADMIN' o 'VENDEDOR'" });
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

async function buscarUsuario(texto) {
    const encontrados = await Usuario.findAll({
        where: {
            status: true,
            [Op.or]: [{ usuario: texto }, { correo: texto }]
        }
    });

    if (encontrados.length === 0) {
        return { error: "No existe un usuario activo con ese usuario o correo", codigo: 404 };
    }
    if (encontrados.length > 1) {
        return { error: "Varios usuarios tienen ese correo, escribe tu nombre de usuario", codigo: 400 };
    }
    return { usuario: encontrados[0] };
}

function ocultarCorreo(direccion) {
    const partes = direccion.split("@");
    return partes[0].substring(0, 2) + "*****@" + partes[1];
}

exports.recuperar = async (req, res) => {
    if (!req.body.usuario) {
        res.status(400).send({ message: "Escribe tu usuario o correo" });
        return;
    }

    try {
        const busqueda = await buscarUsuario(req.body.usuario.trim());
        if (busqueda.error) {
            res.status(busqueda.codigo).send({ message: busqueda.error });
            return;
        }
        const usuario = busqueda.usuario;
        if (!usuario.correo) {
            res.status(400).send({ message: "Este usuario no tiene correo registrado. Pide a un administrador que cambie tu contraseña." });
            return;
        }

        const codigo = String(Math.floor(100000 + Math.random() * 900000));

        await Codigo.update({ usado: true }, { where: { usuarioId: usuario.id, usado: false } });
        await Codigo.create({
            usuarioId: usuario.id,
            codigo: bcrypt.hashSync(codigo, 10),
            expira: new Date(Date.now() + 10 * 60 * 1000)
        });

        const enviado = await correo.enviarCodigo(usuario.correo, usuario.nombre || usuario.usuario, codigo);
        if (!enviado) {
            res.status(500).send({ message: "No se pudo enviar el correo. Intenta más tarde." });
            return;
        }

        res.send({ message: "Te enviamos un código a " + ocultarCorreo(usuario.correo) });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al generar el código" });
    }
};

exports.restablecer = async (req, res) => {
    const usuario = req.body.usuario;
    const codigo = req.body.codigo;
    const contrasena = req.body.contrasena;

    if (!usuario || !codigo || !contrasena) {
        res.status(400).send({ message: "Usuario, código y contraseña nueva son obligatorios" });
        return;
    }
    if (contrasena.length < 8) {
        res.status(400).send({ message: "La contraseña debe tener al menos 8 caracteres" });
        return;
    }

    try {
        const busqueda = await buscarUsuario(usuario.trim());
        if (busqueda.error) {
            res.status(busqueda.codigo).send({ message: busqueda.error });
            return;
        }
        const datos = busqueda.usuario;

        const registro = await Codigo.findOne({
            where: { usuarioId: datos.id, usado: false },
            order: [["id", "DESC"]]
        });

        if (!registro || registro.expira < new Date()) {
            res.status(400).send({ message: "El código venció o no existe. Pide uno nuevo." });
            return;
        }
        if (registro.intentos >= 5) {
            res.status(400).send({ message: "Demasiados intentos. Pide un código nuevo." });
            return;
        }
        if (!bcrypt.compareSync(String(codigo), registro.codigo)) {
            registro.intentos = registro.intentos + 1;
            await registro.save();
            res.status(400).send({ message: "El código no es correcto" });
            return;
        }

        datos.contrasena = bcrypt.hashSync(contrasena, 10);
        await datos.save();

        registro.usado = true;
        await registro.save();

        await Bitacora.create({
            usuarioId: datos.id,
            usuario: datos.usuario,
            metodo: "RECUPERACION",
            realizadoPor: datos.usuario
        });

        res.send({ message: "Tu contraseña se cambió correctamente" });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al cambiar la contraseña" });
    }
};

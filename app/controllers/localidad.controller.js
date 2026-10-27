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

exports.findByEstadio = async (req, res) => {
    try {
        const lista = await Localidad.findAll({
            where: { estadioId: req.params.estadioId },
            order: [["id", "ASC"]]
        });
        res.send(await conConciertos(lista));
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al obtener las localidades" });
    }
};

const Boleto = db.boletos;
const Precio = db.precios;
const Retencion = db.retenciones;
const plano = require("../services/plano.service.js");

function formatear(l, conciertos) {
    return {
        id: l.id,
        codigo: l.codigo,
        nombre: l.nombre,
        plano: l.plano,
        tipo: l.tipo,
        filas: l.filas,
        asientos_por_fila: l.asientos_por_fila,
        porLado: l.porLado,
        color: l.color,
        estadioId: l.estadioId,
        totalAsientos: plano.asientos(l).length,
        conciertos: conciertos || 0
    };
}

async function conConciertos(lista) {
    const precios = await Precio.findAll({
        where: { localidadId: lista.map(l => l.id) },
        attributes: ["localidadId"]
    });
    const conciertos = new Map();
    for (const p of precios) {
        conciertos.set(p.localidadId, (conciertos.get(p.localidadId) || 0) + 1);
    }
    return lista.map(l => formatear(l, conciertos.get(l.id)));
}

exports.findByPlano = async (req, res) => {
    try {
        const lista = await Localidad.findAll({
            where: { plano: String(req.params.plano).toUpperCase() },
            order: [["id", "ASC"]]
        });
        res.send(await conConciertos(lista));
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al obtener las localidades" });
    }
};

exports.update = async (req, res) => {
    try {
        const l = await Localidad.findByPk(req.params.id);
        if (!l) {
            res.status(404).send({ message: "No existe la localidad con id=" + req.params.id });
            return;
        }

        const nombre = req.body.nombre !== undefined ? String(req.body.nombre).trim() : l.nombre;
        if (!nombre) {
            res.status(400).send({ message: "El nombre de la localidad es obligatorio" });
            return;
        }

        const nueva = {
            codigo: l.codigo,
            plano: l.plano,
            tipo: l.tipo,
            filas: req.body.filas !== undefined ? Number(req.body.filas) : l.filas,
            asientos_por_fila: req.body.asientos_por_fila !== undefined ? Number(req.body.asientos_por_fila) : l.asientos_por_fila,
            porLado: req.body.porLado !== undefined ? Number(req.body.porLado) : l.porLado
        };

        const lim = plano.limites(nueva);
        if (lim) {
            const fuera = (v, r) => !(v >= r[0] && v <= r[1]);
            if (fuera(nueva.filas, lim.filas) || fuera(nueva.asientos_por_fila, lim.asientos) || (lim.porLado && fuera(nueva.porLado, lim.porLado))) {
                res.status(400).send({ message: "Las medidas están fuera del tope permitido para " + nombre });
                return;
            }
        }

        nueva.id = l.id;
        const deseados = plano.asientos(nueva);
        const clave = a => a.bloque + "|" + a.filas + "|" + a.numero;
        const quedan = new Set(deseados.map(clave));
        const actuales = await Asiento.findAll({ where: { localidadId: l.id } });
        const existentes = new Set(actuales.map(clave));
        const sobran = actuales.filter(a => !quedan.has(clave(a))).map(a => a.id);
        const faltan = deseados.filter(a => !existentes.has(clave(a)));

        if (sobran.length > 0) {
            const vendidos = await Boleto.count({ where: { asientoId: sobran } });
            if (vendidos > 0) {
                res.status(409).send({ message: "No se puede reducir " + nombre + ": hay asientos vendidos que se eliminarían" });
                return;
            }
        }

        await db.sequelize.transaction(async (t) => {
            if (sobran.length > 0) {
                await Retencion.destroy({ where: { asientoId: sobran }, transaction: t });
                await Asiento.destroy({ where: { id: sobran }, transaction: t });
            }
            if (faltan.length > 0) {
                await Asiento.bulkCreate(faltan, { transaction: t });
            }
            await l.update({
                nombre: nombre,
                color: req.body.color || l.color,
                filas: nueva.filas,
                asientos_por_fila: nueva.asientos_por_fila,
                porLado: nueva.porLado,
                bloques: plano.bloques(nueva).length
            }, { transaction: t });
        });

        const conciertos = await Precio.count({ where: { localidadId: l.id } });
        res.send(formatear(l, conciertos));
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al actualizar la localidad" });
    }
};

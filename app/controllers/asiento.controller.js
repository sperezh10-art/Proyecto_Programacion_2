const db = require("../models");
const Op = db.Sequelize.Op;
const Concierto = db.conciertos;
const Localidad = db.localidades;
const Asiento = db.asientos;
const Boleto = db.boletos;
const Precio = db.precios;
const Retencion = db.retenciones;

exports.findByConcierto = async (req, res) => {
    try {
        const concierto = await Concierto.findByPk(req.params.conciertoId, {
            attributes: ["id", "estadioId"]
        });
        if (!concierto) {
            res.status(404).send({ message: "No existe el concierto con id=" + req.params.conciertoId });
            return;
        }

        const localidades = await Localidad.findAll({
            where: { estadioId: concierto.estadioId },
            include: [{ model: Asiento, as: "asientos" }],
            order: [["id", "ASC"], [{ model: Asiento, as: "asientos" }, "id", "ASC"]]
        });

        const boletos = await Boleto.findAll({
            where: { conciertoId: concierto.id },
            attributes: ["asientoId"]
        });
        const vendidos = new Set(boletos.map(b => b.asientoId));

        const retenciones = await Retencion.findAll({
            where: { conciertoId: concierto.id, expira: { [Op.gt]: new Date() } }
        });
        const retenidos = new Map(retenciones.map(r => [r.asientoId, r.usuarioId]));

        const precios = await Precio.findAll({ where: { conciertoId: concierto.id } });
        const preciosPorLocalidad = new Map(precios.map(p => [p.localidadId, p.precio]));

        const respuesta = localidades.map(l => {
            const asientos = l.asientos.map(a => {
                let estado = "LIBRE";
                if (vendidos.has(a.id)) {
                    estado = "VENDIDO";
                } else if (retenidos.has(a.id)) {
                    estado = "RETENIDO";
                }

                return {
                    id: a.id,
                    bloque: a.bloque,
                    fila: a.filas,
                    numero: a.numero,
                    estado: estado,
                    retenidoPor: estado === "RETENIDO" ? retenidos.get(a.id) : null
                };
            });

            return {
                id: l.id,
                nombre: l.nombre,
                color: l.color,
                precio: preciosPorLocalidad.has(l.id) ? preciosPorLocalidad.get(l.id) : l.precio,
                disponibles: asientos.filter(a => a.estado === "LIBRE").length,
                asientos: asientos
            };
        });

        res.send({ conciertoId: concierto.id, localidades: respuesta });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al obtener los asientos" });
    }
};

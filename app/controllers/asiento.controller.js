const db = require("../models");
const Op = db.Sequelize.Op;
const Concierto = db.conciertos;
const Estadio = db.estadios;
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

        const estadio = await Estadio.findByPk(concierto.estadioId, { attributes: ["id", "tipo"] });
        const plano = estadio && estadio.tipo ? estadio.tipo : "TEATRO";

        const localidades = await Localidad.findAll({
            where: { estadioId: concierto.estadioId },
            include: [{ model: Asiento, as: "asientos" }],
            order: [["id", "ASC"], [{ model: Asiento, as: "asientos" }, "id", "ASC"]]
        });

        const boletos = await Boleto.findAll({
            where: { conciertoId: concierto.id },
            attributes: ["asientoId", "localidadId"]
        });
        const vendidos = new Set(boletos.map(b => b.asientoId));
        const vendidosDePie = new Map();
        for (const b of boletos) {
            if (b.asientoId === null) {
                vendidosDePie.set(b.localidadId, (vendidosDePie.get(b.localidadId) || 0) + 1);
            }
        }

        const retenciones = await Retencion.findAll({
            where: { conciertoId: concierto.id, expira: { [Op.gt]: new Date() } }
        });
        const retenidos = new Map(retenciones.map(r => [r.asientoId, r.usuarioId]));

        const precios = await Precio.findAll({ where: { conciertoId: concierto.id } });
        const preciosPorLocalidad = new Map(precios.map(p => [p.localidadId, p]));

        const respuesta = localidades.map(l => {
            const p = preciosPorLocalidad.get(l.id);
            const dePie = l.tipo === "ZONA" || (p && p.modo === "DE_PIE");

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

            const cupo = p && p.cupo ? p.cupo : 0;

            return {
                id: l.id,
                codigo: l.codigo,
                nombre: l.nombre,
                tipo: l.tipo,
                color: l.color,
                filas: l.filas,
                asientos_por_fila: l.asientos_por_fila,
                porLado: l.porLado,
                modo: dePie ? "DE_PIE" : "NUMERADA",
                capacidad: dePie ? cupo : asientos.length,
                precio: p ? p.precio : null,
                disponibles: dePie
                    ? Math.max(0, cupo - (vendidosDePie.get(l.id) || 0))
                    : asientos.filter(a => a.estado === "LIBRE").length,
                asientos: asientos
            };
        });

        res.send({ conciertoId: concierto.id, tipo: plano, localidades: respuesta });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al obtener los asientos" });
    }
};

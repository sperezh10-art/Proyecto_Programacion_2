const db = require("../models");
const Concierto = db.conciertos;
const Localidad = db.localidades;
const Asiento = db.asientos;
const Boleto = db.boletos;

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

        const respuesta = localidades.map(l => ({
            id: l.id,
            nombre: l.nombre,
            precio: l.precio,
            asientos: l.asientos.map(a => ({
                id: a.id,
                fila: a.filas,
                numero: a.numero,
                estado: vendidos.has(a.id) ? "VENDIDO" : "LIBRE"
            }))
        }));

        res.send({ conciertoId: concierto.id, localidades: respuesta });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al obtener los asientos" });
    }
};
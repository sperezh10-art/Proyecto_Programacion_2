const db = require("../models");
const Op = db.Sequelize.Op;
const Retencion = db.retenciones;
const Boleto = db.boletos;

const MINUTOS = 5;

exports.create = async (req, res) => {
    const { conciertoId, usuarioId, asientos } = req.body;

    if (!conciertoId || !usuarioId || !Array.isArray(asientos)) {
        res.status(400).send({ message: "conciertoId, usuarioId y asientos son obligatorios" });
        return;
    }

    try {
        await Retencion.destroy({ where: { conciertoId: conciertoId, expira: { [Op.lt]: new Date() } } });

        if (asientos.length > 0) {
            const vendidos = await Boleto.count({ where: { conciertoId: conciertoId, asientoId: asientos } });
            if (vendidos > 0) {
                res.status(409).send({ message: "Uno o más asientos ya fueron vendidos" });
                return;
            }

            const deOtros = await Retencion.count({
                where: { conciertoId: conciertoId, asientoId: asientos, usuarioId: { [Op.ne]: usuarioId } }
            });
            if (deOtros > 0) {
                res.status(409).send({ message: "Uno o más asientos están retenidos en otra taquilla" });
                return;
            }
        }

        await Retencion.destroy({ where: { conciertoId: conciertoId, usuarioId: usuarioId } });

        const expira = new Date(Date.now() + MINUTOS * 60 * 1000);
        const nuevas = asientos.map(asientoId => ({
            conciertoId: conciertoId,
            asientoId: asientoId,
            usuarioId: usuarioId,
            expira: expira
        }));
        await Retencion.bulkCreate(nuevas);

        res.send({ conciertoId: conciertoId, asientos: asientos, expira: asientos.length > 0 ? expira : null });
    } catch (err) {
        if (err.name === "SequelizeUniqueConstraintError") {
            res.status(409).send({ message: "Uno o más asientos están retenidos en otra taquilla" });
            return;
        }
        if (err.name === "SequelizeForeignKeyConstraintError") {
            res.status(400).send({ message: "El concierto, el usuario o algún asiento no existen" });
            return;
        }
        res.status(500).send({ message: err.message || "Error al retener los asientos" });
    }
};

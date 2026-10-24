// controllers/factura.controller.js
const facturas = require("../services/factura.service.js");

exports.findAll = async (req, res) => {
    try {
        const lista = await facturas.listar(req.query.ventaId);
        res.send(lista.map(facturas.formatear));
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al obtener las facturas" });
    }
};

exports.findOne = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        res.status(400).send({ message: "El id de la factura no es válido" });
        return;
    }
    try {
        const f = await facturas.cargar(id);
        if (!f) {
            res.status(404).send({ message: "No existe la factura con id=" + id });
            return;
        }
        const detalle = facturas.formatear(f);
        detalle.vendedor = f.vendedor || null;
        detalle.boletos = await facturas.boletosDe(f.ventaId);
        res.send(detalle);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al obtener la factura" });
    }
};

exports.pdf = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        res.status(400).send({ message: "El id de la factura no es válido" });
        return;
    }
    try {
        const pdf = await facturas.obtenerPdf(id);
        if (!pdf) {
            res.status(404).send({ message: "No existe la factura con id=" + id });
            return;
        }
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": 'inline; filename="' + facturas.numero(id) + '.pdf"'
        });
        res.send(pdf);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al obtener el PDF" });
    }
};


exports.diagnostico = async (req, res) => {
    try {
        res.send(await facturas.diagnostico());
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};
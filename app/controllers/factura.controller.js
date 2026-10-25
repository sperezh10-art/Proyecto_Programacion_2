// controllers/factura.controller.js  (v3)
const facturas = require("../services/factura.service.js");

function idValido(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        res.status(400).send({ message: "El id de la factura no es válido" });
        return null;
    }
    return id;
}

function pareceArchivo(tipo, datos) {
    if (!Buffer.isBuffer(datos) || datos.length === 0) return false;
    if (tipo === "pdf") return datos.subarray(0, 4).toString() === "%PDF";
    return datos.toString("utf8", 0, 200).trimStart().replace(/^\uFEFF/, "").startsWith("<");
}

exports.findAll = async (req, res) => {
    try {
        const lista = await facturas.listar(req.query.ventaId);
        res.send(lista.map(facturas.formatear));
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al obtener las facturas" });
    }
};

exports.findOne = async (req, res) => {
    const id = idValido(req, res);
    if (id === null) return;
    try {
        const f = await facturas.cargar(id);
        if (!f) {
            res.status(404).send({ message: "No existe la factura con id=" + id });
            return;
        }
        const detalle = facturas.formatear(f);
        detalle.vendedor = f.vendedor || null;
        detalle.montoRecibido = f.montoRecibido !== null && f.montoRecibido !== undefined ? Number(f.montoRecibido) : null;
        detalle.cambio = detalle.montoRecibido !== null ? detalle.montoRecibido - detalle.total : null;
        detalle.autorizacion = f.autorizacion || null;
        detalle.boletos = await facturas.boletosDe(f.ventaId);
        res.send(detalle);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al obtener la factura" });
    }
};

// GET /:id/xml  y  GET /:id/pdf  -> entrega el archivo guardado en Cloudflare
exports.archivo = tipo => async (req, res) => {
    const id = idValido(req, res);
    if (id === null) return;
    try {
        const r = await facturas.obtenerArchivo(id, tipo);
        if (!r.existe) {
            res.status(404).send({ message: "No existe la factura con id=" + id });
            return;
        }
        if (!r.datos) {
            res.status(404).send({ message: "La factura todavía no tiene " + tipo.toUpperCase() + " guardado" });
            return;
        }
        res.set({
            "Content-Type": facturas.TIPOS[tipo].mime + (tipo === "xml" ? "; charset=utf-8" : ""),
            "Content-Disposition": 'inline; filename="' + facturas.numero(id) + "." + tipo + '"'
        });
        res.send(r.datos);
    } catch (err) {
        res.status(502).send({ message: err.message || "Error al obtener el archivo" });
    }
};

// PUT /:id/xml  y  PUT /:id/pdf  -> recibe el archivo que armó Jasper y lo guarda en Cloudflare
exports.subirArchivo = tipo => async (req, res) => {
    const id = idValido(req, res);
    if (id === null) return;

    if (!pareceArchivo(tipo, req.body)) {
        res.status(400).send({
            message: "Envía el " + tipo.toUpperCase() + " en el cuerpo con Content-Type: " + facturas.TIPOS[tipo].mime
        });
        return;
    }

    try {
        const ok = await facturas.guardarArchivo(id, tipo, req.body);
        if (!ok) {
            res.status(404).send({ message: "No existe la factura con id=" + id });
            return;
        }
        res.status(201).send({ id: id, numero: facturas.numero(id), tipo: tipo, enNube: true });
    } catch (err) {
        res.status(502).send({ message: "No se pudo guardar en Cloudflare: " + err.message });
    }
};

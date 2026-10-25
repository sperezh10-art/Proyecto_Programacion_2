// controllers/factura.controller.js  (v4)
const facturas = require("../services/factura.service.js");

function entero(valor, nombre, res) {
    const n = Number(valor);
    if (!Number.isInteger(n)) {
        res.status(400).send({ message: "El " + nombre + " no es válido" });
        return null;
    }
    return n;
}

function pareceXml(datos) {
    if (!Buffer.isBuffer(datos) || datos.length === 0) return false;
    return datos.toString("utf8", 0, 200).replace(/^\uFEFF/, "").trimStart().startsWith("<");
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
    const id = entero(req.params.id, "id de la factura", res);
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

// GET /ventas?rango=hoy|7|todo&usuarioId=N  -> tabla de Gestión de ventas
exports.ventas = async (req, res) => {
    try {
        res.send(await facturas.listarVentas(req.query.rango, req.query.usuarioId));
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al obtener las ventas" });
    }
};

// GET /ventas/:ventaId  -> ticket (boletos) + datos de la factura de esa venta
exports.ventaDetalle = async (req, res) => {
    const ventaId = entero(req.params.ventaId, "id de la venta", res);
    if (ventaId === null) return;
    try {
        const d = await facturas.detalleVenta(ventaId);
        if (!d) {
            res.status(404).send({ message: "No existe la venta con id=" + ventaId });
            return;
        }
        res.send(d);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al obtener la venta" });
    }
};

// GET /:id/xml  -> el XML guardado en Cloudflare
exports.xml = async (req, res) => {
    const id = entero(req.params.id, "id de la factura", res);
    if (id === null) return;
    try {
        const r = await facturas.obtenerXml(id);
        if (!r.existe) {
            res.status(404).send({ message: "No existe la factura con id=" + id });
            return;
        }
        if (!r.datos) {
            res.status(404).send({ message: "La factura todavía no tiene XML guardado" });
            return;
        }
        res.set({
            "Content-Type": "application/xml; charset=utf-8",
            "Content-Disposition": 'inline; filename="' + facturas.numero(id) + '.xml"'
        });
        res.send(r.datos);
    } catch (err) {
        res.status(502).send({ message: err.message || "Error al obtener el XML" });
    }
};

// PUT /:id/xml  -> recibe el XML que armó Jasper y lo guarda en Cloudflare
exports.subirXml = async (req, res) => {
    const id = entero(req.params.id, "id de la factura", res);
    if (id === null) return;

    if (!pareceXml(req.body)) {
        res.status(400).send({ message: "Envía el XML en el cuerpo con Content-Type: application/xml" });
        return;
    }

    try {
        const ok = await facturas.guardarXml(id, req.body);
        if (!ok) {
            res.status(404).send({ message: "No existe la factura con id=" + id });
            return;
        }
        res.status(201).send({ id: id, numero: facturas.numero(id), tipo: "xml", enNube: true });
    } catch (err) {
        res.status(502).send({ message: "No se pudo guardar en Cloudflare: " + err.message });
    }
};

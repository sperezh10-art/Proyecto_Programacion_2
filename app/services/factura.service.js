const db = require("../models");

const WORKER_URL = (process.env.FACTURAS_WORKER_URL || "").replace(/\/+$/, "");
const WORKER_KEY = process.env.FACTURAS_API_KEY || "";

const consulta = (sql, replacements) =>
    db.sequelize.query(sql, { replacements: replacements || {}, type: db.Sequelize.QueryTypes.SELECT });

function numero(id) {
    return "FAC-" + String(id).padStart(6, "0");
}

function formatear(f) {
    return {
        id: f.id,
        numero: numero(f.id),
        ventaId: f.ventaId,
        nit: f.nit,
        nombre: f.nombre,
        total: Number(f.total),
        fecha: f.createdAt,
        metodoPago: f.metodoPago || null,
        xmlEnNube: f.xmlNube === true
    };
}

async function listar(ventaId) {
    return consulta(
        `SELECT f.id, f."ventaId", f.nit, f.nombre, f.total, f."createdAt", f."xmlNube", v."metodoPago"
           FROM facturas f
           JOIN ventas v ON v.id = f."ventaId"
          WHERE (:ventaId::integer IS NULL OR f."ventaId" = :ventaId::integer)
          ORDER BY f.id DESC
          LIMIT 200`,
        { ventaId: ventaId ? Number(ventaId) : null }
    );
}

async function cargar(id) {
    const filas = await consulta(
        `SELECT f.id, f."ventaId", f.nit, f.nombre, f.total, f."createdAt", f."xmlNube",
                v."metodoPago", v."montoRecibido", v.autorizacion,
                COALESCE(u.nombre, u.usuario) AS vendedor
           FROM facturas f
           JOIN ventas v ON v.id = f."ventaId"
           LEFT JOIN usuarios u ON u.id = v."usuarioId"
          WHERE f.id = :id`,
        { id: id }
    );
    return filas[0] || null;
}

async function boletosDe(ventaId) {
    const filas = await consulta(
        `SELECT b.id, b.precio, b.codigo, b.usado, l.nombre AS localidad, a.bloque, a.filas AS fila, a.numero,
                ar.nombre AS artista, c.fecha
           FROM boletos b
           LEFT JOIN asientos a ON a.id = b."asientoId"
           LEFT JOIN localidades l ON l.id = COALESCE(a."localidadId", b."localidadId")
           JOIN conciertos c ON c.id = b."conciertoId"
           LEFT JOIN artista ar ON ar.id = c."artistaId"
          WHERE b."ventaId" = :ventaId
          ORDER BY b.id`,
        { ventaId: ventaId }
    );
    return filas.map(b => ({
        id: b.id,
        codigo: b.codigo,
        usado: b.usado === true,
        artista: b.artista,
        fecha: b.fecha,
        localidad: b.localidad,
        bloque: b.bloque,
        fila: b.fila,
        numero: b.numero,
        dePie: b.fila === null || b.fila === undefined,
        precio: Number(b.precio)
    }));
}

async function canceladosDe(ventaId) {
    const filas = await consulta(
        `SELECT bc.id, bc.precio, bc.codigo, bc.motivo, bc."createdAt" AS "canceladoEn",
                l.nombre AS localidad, a.bloque, a.filas AS fila, a.numero,
                COALESCE(u.nombre, u.usuario) AS "canceladoPor"
           FROM boletos_cancelados bc
           LEFT JOIN asientos a ON a.id = bc."asientoId"
           LEFT JOIN localidades l ON l.id = COALESCE(a."localidadId", bc."localidadId")
           LEFT JOIN usuarios u ON u.id = bc."usuarioId"
          WHERE bc."ventaId" = :ventaId
          ORDER BY bc.id`,
        { ventaId: ventaId }
    );
    return filas.map(b => ({
        id: b.id,
        codigo: b.codigo,
        localidad: b.localidad,
        bloque: b.bloque,
        fila: b.fila,
        numero: b.numero,
        dePie: b.fila === null || b.fila === undefined,
        precio: Number(b.precio),
        motivo: b.motivo,
        canceladoEn: b.canceladoEn,
        canceladoPor: b.canceladoPor
    }));
}

// ---------- Gestión de ventas ----------

const RANGOS = {
    hoy: `v."createdAt" >= (date_trunc('day', NOW() AT TIME ZONE 'America/Guatemala') AT TIME ZONE 'America/Guatemala')`,
    "7": `v."createdAt" >= NOW() - INTERVAL '7 days'`,
    todo: `TRUE`
};

// Todas las ventas (con o sin factura) para la tabla de Gestión de ventas
async function listarVentas(rango, usuarioId, clienteId) {
    const cond = RANGOS[rango] || RANGOS.hoy;
    const filas = await consulta(
        `SELECT v.id AS "ventaId", v."createdAt" AS fecha, v."metodoPago",
                COALESCE(u.nombre, u.usuario) AS vendedor,
                f.id AS "facturaId", f.nombre AS cliente, f."xmlNube",
                COUNT(b.id)::int AS boletos,
                COALESCE(SUM(b.precio), 0) AS total,
                MIN(ar.nombre) AS artista,
                MIN(c.fecha) AS "fechaConcierto"
           FROM ventas v
           LEFT JOIN usuarios u ON u.id = v."usuarioId"
           LEFT JOIN facturas f ON f."ventaId" = v.id
           LEFT JOIN boletos b ON b."ventaId" = v.id
           LEFT JOIN conciertos c ON c.id = b."conciertoId"
           LEFT JOIN artista ar ON ar.id = c."artistaId"
          WHERE ${cond}
            AND (:usuarioId::integer IS NULL OR v."usuarioId" = :usuarioId::integer)
            AND (:clienteId::integer IS NULL OR v."clienteId" = :clienteId::integer)
          GROUP BY v.id, u.id, f.id
          ORDER BY v.id DESC
          LIMIT 500`,
        { usuarioId: usuarioId ? Number(usuarioId) : null, clienteId: clienteId ? Number(clienteId) : null }
    );
    if (filas.length === 0) return [];

    const locs = await consulta(
        `SELECT b."ventaId", COALESCE(l.nombre, 'General') AS nombre, COUNT(*)::int AS cantidad
           FROM boletos b
           LEFT JOIN asientos a ON a.id = b."asientoId"
           LEFT JOIN localidades l ON l.id = COALESCE(a."localidadId", b."localidadId")
          WHERE b."ventaId" IN (:ids)
          GROUP BY b."ventaId", COALESCE(l.nombre, 'General')
          ORDER BY b."ventaId", 2`,
        { ids: filas.map(f => f.ventaId) }
    );
    const porVenta = {};
    locs.forEach(l => { (porVenta[l.ventaId] = porVenta[l.ventaId] || []).push({ nombre: l.nombre, cantidad: l.cantidad }); });

    return filas.map(f => ({
        ventaId: f.ventaId,
        fecha: f.fecha,
        fechaConcierto: f.fechaConcierto,
        artista: f.artista,
        cliente: f.cliente || "Consumidor final",
        vendedor: f.vendedor,
        metodoPago: f.metodoPago,
        boletos: f.boletos,
        total: Number(f.total),
        facturaId: f.facturaId || null,
        xmlEnNube: f.xmlNube === true,
        localidades: porVenta[f.ventaId] || []
    }));
}

// Una venta con sus boletos (ticket) y los datos de su factura, si existe
async function detalleVenta(ventaId) {
    const filas = await consulta(
        `SELECT v.id AS "ventaId", v."createdAt" AS fecha, v."metodoPago", v."montoRecibido", v.autorizacion,
                COALESCE(u.nombre, u.usuario) AS vendedor,
                f.id AS "facturaId", f.nit, f.nombre, f."xmlNube"
           FROM ventas v
           LEFT JOIN usuarios u ON u.id = v."usuarioId"
           LEFT JOIN facturas f ON f."ventaId" = v.id
          WHERE v.id = :ventaId`,
        { ventaId: ventaId }
    );
    const v = filas[0];
    if (!v) return null;
    const boletos = await boletosDe(ventaId);
    const total = boletos.reduce((s, b) => s + b.precio, 0);
    const recibido = v.montoRecibido !== null && v.montoRecibido !== undefined ? Number(v.montoRecibido) : null;
    return {
        ventaId: v.ventaId,
        fecha: v.fecha,
        vendedor: v.vendedor || null,
        metodoPago: v.metodoPago || null,
        montoRecibido: recibido,
        cambio: recibido !== null ? recibido - total : null,
        autorizacion: v.autorizacion || null,
        cliente: v.nombre || "Consumidor final",
        nit: v.nit || "CF",
        facturaId: v.facturaId || null,
        numeroFactura: v.facturaId ? numero(v.facturaId) : null,
        xmlEnNube: v.xmlNube === true,
        total: total,
        boletos: boletos,
        cancelados: await canceladosDe(ventaId)
    };
}

// ---------- Cloudflare (solo XML) ----------

function configurado() {
    if (!WORKER_URL || !WORKER_KEY) {
        throw new Error("Falta FACTURAS_WORKER_URL o FACTURAS_API_KEY en el servidor");
    }
}

async function subirXml(id, datos) {
    configurado();
    const r = await fetch(WORKER_URL + "/facturas/" + id + "/xml", {
        method: "PUT",
        headers: { "X-API-Key": WORKER_KEY, "Content-Type": "application/xml" },
        body: datos
    });
    if (!r.ok) {
        throw new Error("Cloudflare respondio " + r.status);
    }
}

async function descargarXml(id) {
    configurado();
    const r = await fetch(WORKER_URL + "/facturas/" + id + "/xml", {
        headers: { "X-API-Key": WORKER_KEY }
    });
    if (r.status === 404) return null;
    if (!r.ok) {
        throw new Error("Cloudflare respondio " + r.status);
    }
    return Buffer.from(await r.arrayBuffer());
}

// Devuelve false si la factura no existe. Si Cloudflare falla, lanza el error.
async function guardarXml(id, datos) {
    const f = await cargar(id);
    if (!f) return false;
    await subirXml(id, datos);
    await db.sequelize.query(
        `UPDATE facturas SET "xmlNube" = TRUE, "updatedAt" = NOW() WHERE id = :id`,
        { replacements: { id: id } }
    );
    return true;
}

// { existe: false } | { existe: true, datos: null } | { existe: true, datos: <Buffer> }
async function obtenerXml(id) {
    const f = await cargar(id);
    if (!f) return { existe: false, datos: null };
    if (f.xmlNube !== true) return { existe: true, datos: null };
    return { existe: true, datos: await descargarXml(id) };
}

module.exports = {
    numero, formatear, listar, cargar, boletosDe,
    listarVentas, detalleVenta, guardarXml, obtenerXml
};

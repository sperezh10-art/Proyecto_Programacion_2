// services/factura.service.js  (v3)
// Jasper (en Java) arma el XML de la factura; la API solo lo guarda en Cloudflare
// y lo entrega cuando se pide. El PDF queda soportado para cuando se necesite.
const db = require("../models");

const WORKER_URL = (process.env.FACTURAS_WORKER_URL || "").replace(/\/+$/, "");
const WORKER_KEY = process.env.FACTURAS_API_KEY || "";

const TIPOS = {
    pdf: { mime: "application/pdf", columna: '"pdfNube"', campo: "pdfNube" },
    xml: { mime: "application/xml", columna: '"xmlNube"', campo: "xmlNube" }
};

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
        xmlEnNube: f.xmlNube === true,
        pdfEnNube: f.pdfNube === true
    };
}

async function listar(ventaId) {
    return consulta(
        `SELECT f.id, f."ventaId", f.nit, f.nombre, f.total, f."createdAt", f."pdfNube", f."xmlNube", v."metodoPago"
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
        `SELECT f.id, f."ventaId", f.nit, f.nombre, f.total, f."createdAt", f."pdfNube", f."xmlNube",
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
        `SELECT b.id, b.precio, l.nombre AS localidad, a.bloque, a.filas AS fila, a.numero,
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

function configurado() {
    if (!WORKER_URL || !WORKER_KEY) {
        throw new Error("Falta FACTURAS_WORKER_URL o FACTURAS_API_KEY en el servidor");
    }
}

async function subir(id, tipo, datos) {
    configurado();
    const r = await fetch(WORKER_URL + "/facturas/" + id + "/" + tipo, {
        method: "PUT",
        headers: { "X-API-Key": WORKER_KEY, "Content-Type": TIPOS[tipo].mime },
        body: datos
    });
    if (!r.ok) {
        throw new Error("Cloudflare respondio " + r.status);
    }
}

async function descargar(id, tipo) {
    configurado();
    const r = await fetch(WORKER_URL + "/facturas/" + id + "/" + tipo, {
        headers: { "X-API-Key": WORKER_KEY }
    });
    if (r.status === 404) return null;
    if (!r.ok) {
        throw new Error("Cloudflare respondio " + r.status);
    }
    return Buffer.from(await r.arrayBuffer());
}

// Recibe el archivo que armo Jasper en Java, lo sube a Cloudflare y marca la factura.
// Devuelve false si la factura no existe. Si Cloudflare falla, lanza el error.
async function guardarArchivo(id, tipo, datos) {
    const f = await cargar(id);
    if (!f) return false;
    await subir(id, tipo, datos);
    await db.sequelize.query(
        `UPDATE facturas SET ${TIPOS[tipo].columna} = TRUE, "updatedAt" = NOW() WHERE id = :id`,
        { replacements: { id: id } }
    );
    return true;
}

// { existe: false }                  -> la factura no existe
// { existe: true, datos: null }      -> existe pero ese archivo aun no se ha guardado
// { existe: true, datos: <Buffer> }  -> archivo listo
async function obtenerArchivo(id, tipo) {
    const f = await cargar(id);
    if (!f) return { existe: false, datos: null };
    if (f[TIPOS[tipo].campo] !== true) return { existe: true, datos: null };
    return { existe: true, datos: await descargar(id, tipo) };
}

module.exports = { TIPOS, numero, formatear, listar, cargar, boletosDe, guardarArchivo, obtenerArchivo };

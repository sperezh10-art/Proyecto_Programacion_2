// services/factura.service.js
const db = require("../models");
const PDFDocument = require("pdfkit");

const WORKER_URL = (process.env.FACTURAS_WORKER_URL || "").replace(/\/+$/, "");
const WORKER_KEY = process.env.FACTURAS_API_KEY || "";
const TZ = "America/Guatemala";

const consulta = (sql, replacements) =>
    db.sequelize.query(sql, { replacements: replacements || {}, type: db.Sequelize.QueryTypes.SELECT });

function numero(id) {
    return "FAC-" + String(id).padStart(6, "0");
}

function dinero(n) {
    return "Q " + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fechaHora(d) {
    return new Date(d).toLocaleString("es-GT", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });
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
        enNube: f.pdfNube === true
    };
}

async function listar(ventaId) {
    return consulta(
        `SELECT f.id, f."ventaId", f.nit, f.nombre, f.total, f."createdAt", f."pdfNube", v."metodoPago"
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
        `SELECT f.id, f."ventaId", f.nit, f.nombre, f.total, f."createdAt", f."pdfNube",
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

function ubicacion(b) {
    if (b.dePie) return (b.localidad || "General") + " (de pie)";
    const partes = [b.localidad || ""];
    if (b.bloque) partes.push("Bloque " + b.bloque);
    partes.push("Fila " + b.fila + " Asiento " + b.numero);
    return partes.join(" - ");
}

function crearPdf(f, boletos) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: "LETTER", margin: 50 });
        const trozos = [];
        doc.on("data", t => trozos.push(t));
        doc.on("end", () => resolve(Buffer.concat(trozos)));
        doc.on("error", reject);

        doc.font("Helvetica-Bold").fontSize(20).text("SVB - Venta de boletos");
        doc.font("Helvetica").fontSize(10).fillColor("#666666").text("Factura interna del sistema");
        doc.moveDown(0.8);

        doc.fillColor("#000000").font("Helvetica-Bold").fontSize(16).text(numero(f.id));
        doc.font("Helvetica").fontSize(10);
        doc.text("Fecha: " + fechaHora(f.createdAt));
        doc.text("Venta: V-" + String(f.ventaId).padStart(6, "0"));
        doc.text("Atendido por: " + (f.vendedor || "-"));
        doc.moveDown(0.6);

        doc.font("Helvetica-Bold").text("Cliente");
        doc.font("Helvetica").text("Nombre: " + f.nombre);
        doc.text("NIT: " + f.nit);
        doc.moveDown(1);

        let y = doc.y;
        doc.font("Helvetica-Bold").fontSize(10);
        doc.text("Concierto", 50, y, { width: 190 });
        doc.text("Localidad / asiento", 245, y, { width: 220 });
        doc.text("Precio", 470, y, { width: 90, align: "right" });
        y += 16;
        doc.moveTo(50, y).lineTo(560, y).stroke();
        y += 6;

        doc.font("Helvetica").fontSize(10);
        for (const b of boletos) {
            if (y > 690) {
                doc.addPage();
                y = 50;
            }
            doc.text(b.artista || "Concierto", 50, y, { width: 190, height: 12, ellipsis: true });
            doc.text(ubicacion(b), 245, y, { width: 220, height: 12, ellipsis: true });
            doc.text(dinero(b.precio), 470, y, { width: 90, align: "right" });
            y += 16;
        }

        y += 4;
        doc.moveTo(50, y).lineTo(560, y).stroke();
        y += 8;
        doc.font("Helvetica-Bold").fontSize(13).text("Total: " + dinero(f.total), 50, y, { width: 510, align: "right" });
        y += 26;

        doc.font("Helvetica").fontSize(10);
        doc.text("Forma de pago: " + (f.metodoPago || "-"), 50, y);
        if (f.metodoPago === "TARJETA" && f.autorizacion) {
            doc.text("Autorizacion: " + f.autorizacion);
        }
        if (f.metodoPago === "EFECTIVO" && f.montoRecibido !== null && f.montoRecibido !== undefined) {
            doc.text("Recibido: " + dinero(f.montoRecibido) + "   Cambio: " + dinero(Number(f.montoRecibido) - Number(f.total)));
        }

        doc.end();
    });
}

async function subir(id, pdf) {
    if (!WORKER_URL || !WORKER_KEY) {
        throw new Error("Falta FACTURAS_WORKER_URL o FACTURAS_API_KEY en el servidor");
    }
    const r = await fetch(WORKER_URL + "/facturas/" + id + "/pdf", {
        method: "PUT",
        headers: { "X-API-Key": WORKER_KEY, "Content-Type": "application/pdf" },
        body: pdf
    });
    if (!r.ok) {
        throw new Error("Cloudflare respondio " + r.status);
    }
}

async function descargar(id) {
    const r = await fetch(WORKER_URL + "/facturas/" + id + "/pdf", {
        headers: { "X-API-Key": WORKER_KEY }
    });
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
}

// Arma el PDF, lo sube a Cloudflare y marca la factura como guardada en la nube.
// Si la subida falla no se pierde nada: el PDF se vuelve a generar cuando se pida.
async function generarYSubir(id) {
    const f = await cargar(id);
    if (!f) return null;
    const pdf = await crearPdf(f, await boletosDe(f.ventaId));
    try {
        await subir(id, pdf);
        await db.sequelize.query(
            `UPDATE facturas SET "pdfNube" = TRUE, "updatedAt" = NOW() WHERE id = :id`,
            { replacements: { id: id } }
        );
    } catch (err) {
        console.log("No se pudo subir " + numero(id) + " a Cloudflare: " + err.message);
    }
    return pdf;
}

async function generarPorVenta(ventaId) {
    const filas = await consulta(`SELECT id FROM facturas WHERE "ventaId" = :ventaId`, { ventaId: ventaId });
    if (!filas[0]) return null;
    return generarYSubir(filas[0].id);
}

// Devuelve el PDF desde la nube; si aun no esta alla, lo genera y lo sube.
async function obtenerPdf(id) {
    const f = await cargar(id);
    if (!f) return null;
    if (f.pdfNube && WORKER_URL && WORKER_KEY) {
        try {
            const pdf = await descargar(id);
            if (pdf) return pdf;
        } catch (err) {
            console.log("No se pudo leer " + numero(id) + " de Cloudflare: " + err.message);
        }
    }
    return generarYSubir(id);
}

module.exports = { numero, formatear, listar, cargar, boletosDe, generarYSubir, generarPorVenta, obtenerPdf };

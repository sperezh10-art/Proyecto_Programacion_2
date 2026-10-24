const db = require("../models");
const { QueryTypes } = db.Sequelize;

// "Hoy" y los dias se calculan en hora de Guatemala (Render corre en UTC)
const ZONA = "America/Guatemala";
const HOY = `(NOW() AT TIME ZONE '${ZONA}')::date`;

function consultar(sql) {
    return db.sequelize.query(sql, { type: QueryTypes.SELECT });
}


exports.resumen = async (req, res) => {
    try {
        const [hoyRows, inventarioRows, artistasRows, diasRows, actividadRows] = await Promise.all([
            consultar(`
                SELECT COUNT(*)                          AS transacciones,
                       COALESCE(SUM(v.total), 0)         AS recaudacion,
                       COUNT(DISTINCT v."usuarioId")     AS taquillas,
                       (SELECT COUNT(*) FROM boletos b
                         JOIN ventas v2 ON v2.id = b."ventaId"
                        WHERE (v2."createdAt" AT TIME ZONE '${ZONA}')::date = ${HOY}) AS boletos
                  FROM ventas v
                 WHERE (v."createdAt" AT TIME ZONE '${ZONA}')::date = ${HOY}`),

            consultar(`
                SELECT c.id AS "conciertoId", a.nombre AS artista, c.fecha, e.nombre AS estadio,
                       l.id AS "localidadId", l.codigo, l.nombre AS localidad, l.color,
                       CASE WHEN p.modo = 'DE_PIE' OR l.tipo = 'ZONA'
                            THEN COALESCE(p.cupo, 0)
                            ELSE (SELECT COUNT(*) FROM asientos s WHERE s."localidadId" = l.id)
                       END AS capacidad,
                       (SELECT COUNT(*) FROM boletos b
                          LEFT JOIN asientos s2 ON s2.id = b."asientoId"
                         WHERE b."conciertoId" = c.id
                           AND COALESCE(b."localidadId", s2."localidadId") = l.id) AS vendidos
                  FROM conciertos c
                  JOIN artista     a ON a.id = c."artistaId"
                  JOIN estadios    e ON e.id = c."estadioId"
                  JOIN precios     p ON p."conciertoId" = c.id
                  JOIN localidades l ON l.id = p."localidadId"
                 ORDER BY c.fecha, l.id`),

            consultar(`
                SELECT a.nombre AS artista, a.genero, COUNT(b.id) AS boletos
                  FROM boletos b
                  JOIN conciertos c ON c.id = b."conciertoId"
                  JOIN artista    a ON a.id = c."artistaId"
                 GROUP BY a.id, a.nombre, a.genero
                 ORDER BY boletos DESC`),

            consultar(`
                SELECT to_char(d, 'YYYY-MM-DD') AS dia, COALESCE(SUM(v.total), 0) AS total
                  FROM generate_series(${HOY} - 13, ${HOY}, interval '1 day') AS d
                  LEFT JOIN ventas v ON (v."createdAt" AT TIME ZONE '${ZONA}')::date = d::date
                 GROUP BY d
                 ORDER BY d`),

            consultar(`
                SELECT v.id,
                       to_char(v."createdAt" AT TIME ZONE '${ZONA}', 'YYYY-MM-DD') AS fecha,
                       to_char(v."createdAt" AT TIME ZONE '${ZONA}', 'HH24:MI')    AS hora,
                       u.nombre AS vendedor,
                       COUNT(b.id) AS boletos,
                       (array_agg(a.nombre ORDER BY b.id))[1] AS artista,
                       v.total
                  FROM ventas v
                  JOIN usuarios   u ON u.id = v."usuarioId"
                  LEFT JOIN boletos    b ON b."ventaId" = v.id
                  LEFT JOIN conciertos c ON c.id = b."conciertoId"
                  LEFT JOIN artista    a ON a.id = c."artistaId"
                 GROUP BY v.id, u.nombre
                 ORDER BY v.id DESC
                 LIMIT 8`)
        ]);

        // ---- Hoy ----
        const h = hoyRows[0];
        const recaudacion = Number(h.recaudacion);
        const transacciones = Number(h.transacciones);
        const boletosHoy = Number(h.boletos);
        const hoy = {
            recaudacion: recaudacion,
            transacciones: transacciones,
            boletos: boletosHoy,
            taquillas: Number(h.taquillas),
            promedio: transacciones > 0 ? recaudacion / transacciones : 0,
            boletosPorVenta: transacciones > 0 ? boletosHoy / transacciones : 0
        };

        // ---- Inventario (agrupado por concierto) ----
        const porConcierto = new Map();
        for (const r of inventarioRows) {
            if (!porConcierto.has(r.conciertoId)) {
                porConcierto.set(r.conciertoId, {
                    conciertoId: r.conciertoId,
                    artista: r.artista,
                    fecha: r.fecha,
                    estadio: r.estadio,
                    vendidos: 0,
                    capacidad: 0,
                    porcentaje: 0,
                    localidades: []
                });
            }
            const c = porConcierto.get(r.conciertoId);
            const vendidos = Number(r.vendidos);
            const capacidad = Number(r.capacidad);
            c.vendidos += vendidos;
            c.capacidad += capacidad;
            c.localidades.push({
                localidadId: r.localidadId,
                codigo: r.codigo,
                nombre: r.localidad,
                color: r.color,
                vendidos: vendidos,
                capacidad: capacidad
            });
        }
        const inventario = Array.from(porConcierto.values());
        for (const c of inventario) {
            c.porcentaje = c.capacidad > 0 ? Math.round((c.vendidos / c.capacidad) * 100) : 0;
        }

        const totalVendidos = inventario.reduce((s, c) => s + c.vendidos, 0);
        const totalCapacidad = inventario.reduce((s, c) => s + c.capacidad, 0);
        const aforo = {
            vendidos: totalVendidos,
            capacidad: totalCapacidad,
            porcentaje: totalCapacidad > 0 ? Math.round((totalVendidos / totalCapacidad) * 100) : 0,
            eventos: inventario.length
        };

        res.send({
            hoy: hoy,
            aforo: aforo,
            inventario: inventario,
            artistas: artistasRows.map(a => ({ artista: a.artista, genero: a.genero, boletos: Number(a.boletos) })),
            recaudacion14: diasRows.map(d => ({ dia: d.dia, total: Number(d.total) })),
            actividad: actividadRows.map(a => ({
                id: a.id,
                fecha: a.fecha,
                hora: a.hora,
                vendedor: a.vendedor,
                boletos: Number(a.boletos),
                artista: a.artista,
                total: Number(a.total)
            }))
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error al obtener el panel de control" });
    }
};

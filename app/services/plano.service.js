const PLANOS = {
    TEATRO: [
        { codigo: "VIP", nombre: "VIP", tipo: "FAN", color: "#FF5C8A", filas: 4, asientos_por_fila: 7 },
        { codigo: "PLA", nombre: "Platea", tipo: "FAN", color: "#3CC8E0", filas: 8, asientos_por_fila: 9 },
        { codigo: "PAL", nombre: "Palcos", tipo: "PALCOS", color: "#A18CFF", filas: 2, asientos_por_fila: 3, porLado: 4 },
        { codigo: "BAL", nombre: "Balcón", tipo: "FAN", color: "#5BD68A", filas: 5, asientos_por_fila: 12 }
    ],
    ESTADIO: [
        { codigo: "GLD", nombre: "Golden", tipo: "ZONA", color: "#FF5C8A", filas: 0, asientos_por_fila: 0 },
        { codigo: "CAN", nombre: "Cancha", tipo: "ZONA", color: "#3CC8E0", filas: 0, asientos_por_fila: 0 },
        { codigo: "TRI", nombre: "Tribuna", tipo: "GRADA", color: "#A18CFF", filas: 6, asientos_por_fila: 7 },
        { codigo: "PRE", nombre: "Preferencia", tipo: "GRADA", color: "#6C9BFF", filas: 6, asientos_por_fila: 7 },
        { codigo: "CAB", nombre: "Cabeceras", tipo: "GRADA", color: "#5BD68A", filas: 4, asientos_por_fila: 18 }
    ],
    EXPLANADA: [
        { codigo: "FRS", nombre: "Front Stage", tipo: "ZONA", color: "#FF5C8A", filas: 0, asientos_por_fila: 0 },
        { codigo: "GEN", nombre: "General", tipo: "ZONA", color: "#3CC8E0", filas: 0, asientos_por_fila: 0 },
        { codigo: "GVP", nombre: "Graderío VIP", tipo: "GRADA", color: "#A18CFF", filas: 4, asientos_por_fila: 10 }
    ]
};

const LETRAS = "ABCDEFGHIJKLMNOP";

function limites(l) {
    if (l.tipo === "ZONA") {
        return null;
    }
    if (l.tipo === "PALCOS") {
        return { filas: [1, 3], asientos: [2, 4], porLado: [2, 5] };
    }
    if (l.tipo === "GRADA") {
        if (l.plano === "EXPLANADA") {
            return { filas: [2, 5], asientos: [6, 10] };
        }
        if (l.codigo === "CAB") {
            return { filas: [2, 5], asientos: [10, 20] };
        }
        return { filas: [3, 8], asientos: [4, 7] };
    }
    return { filas: [1, l.codigo === "PLA" ? 10 : 7], asientos: [3, l.codigo === "BAL" ? 13 : 11] };
}

function bloques(l) {
    if (l.tipo === "ZONA") {
        return [];
    }
    if (l.codigo === "CAB") {
        return ["N", "S"];
    }
    if (l.tipo === "PALCOS") {
        const lista = [];
        for (let i = 1; i <= l.porLado; i++) {
            lista.push("I" + i);
        }
        for (let i = 1; i <= l.porLado; i++) {
            lista.push("D" + i);
        }
        return lista;
    }
    return ["A", "B", "C"];
}

function asientos(l) {
    const lista = [];
    for (const b of bloques(l)) {
        for (let f = 0; f < l.filas; f++) {
            for (let n = 1; n <= l.asientos_por_fila; n++) {
                lista.push({ bloque: b, filas: LETRAS[f], numero: n, localidadId: l.id });
            }
        }
    }
    return lista;
}

async function crearPlano(db, estadio, base, transaction) {
    const tipo = estadio.tipo || "TEATRO";
    const nuevas = new Map();
    for (const b of base) {
        const datos = {
            codigo: b.codigo,
            nombre: b.nombre,
            tipo: b.tipo,
            color: b.color,
            filas: b.filas,
            asientos_por_fila: b.asientos_por_fila,
            porLado: b.porLado || null,
            plano: tipo,
            estadioId: estadio.id
        };
        datos.bloques = bloques(datos).length;
        const l = await db.localidades.create(datos, { transaction: transaction });
        await db.asientos.bulkCreate(asientos(l), { transaction: transaction });
        nuevas.set(b.codigo, l);
    }
    return nuevas;
}

async function separarPlanos(db) {
    const Op = db.Sequelize.Op;
    const estadios = await db.estadios.findAll({ order: [["id", "ASC"]] });

    for (const estadio of estadios) {
        const tiene = await db.localidades.count({ where: { estadioId: estadio.id } });
        if (tiene > 0) {
            continue;
        }

        const tipo = estadio.tipo || "TEATRO";
        const todas = await db.localidades.findAll({ where: { estadioId: null, plano: tipo }, order: [["id", "ASC"]] });
        const viejas = [];
        for (const l of todas) {
            if (!viejas.some(v => v.codigo === l.codigo)) {
                viejas.push(l);
            }
        }

        await db.sequelize.transaction(async (t) => {
            const nuevas = await crearPlano(db, estadio, viejas.length > 0 ? viejas : PLANOS[tipo], t);

            const conciertos = await db.conciertos.findAll({ where: { estadioId: estadio.id }, attributes: ["id"], transaction: t });
            const ids = conciertos.map(c => c.id);
            if (ids.length === 0 || viejas.length === 0) {
                return;
            }

            const boletos = await db.boletos.findAll({
                where: { conciertoId: ids, asientoId: { [Op.ne]: null } },
                include: [{ model: db.asientos, as: "asiento", include: [{ model: db.localidades, as: "localidad" }] }],
                transaction: t
            });
            for (const b of boletos) {
                if (!b.asiento || !b.asiento.localidad || b.asiento.localidad.estadioId !== null) {
                    continue;
                }
                const nueva = nuevas.get(b.asiento.localidad.codigo);
                if (!nueva) {
                    continue;
                }
                const asiento = await db.asientos.findOne({
                    where: { localidadId: nueva.id, bloque: b.asiento.bloque, filas: b.asiento.filas, numero: b.asiento.numero },
                    transaction: t
                });
                if (!asiento) {
                    continue;
                }
                await b.update({ asientoId: asiento.id, localidadId: nueva.id }, { transaction: t });
            }

            for (const vieja of viejas) {
                const nueva = nuevas.get(vieja.codigo);
                await db.precios.update({ localidadId: nueva.id }, { where: { conciertoId: ids, localidadId: vieja.id }, transaction: t });
                await db.boletos.update({ localidadId: nueva.id }, { where: { conciertoId: ids, localidadId: vieja.id, asientoId: null }, transaction: t });
            }

            await db.retenciones.destroy({ where: { conciertoId: ids }, transaction: t });
        });
    }
}

module.exports = { PLANOS, limites, bloques, asientos, crearPlano, separarPlanos };

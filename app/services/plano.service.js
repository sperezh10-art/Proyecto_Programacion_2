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

async function sembrar(db) {
    for (const plano of Object.keys(PLANOS)) {
        const hay = await db.localidades.count({ where: { plano: plano } });
        if (hay > 0) {
            continue;
        }
        for (const base of PLANOS[plano]) {
            const datos = Object.assign({ porLado: null }, base, { plano: plano, estadioId: null });
            datos.bloques = bloques(datos).length;
            const l = await db.localidades.create(datos);
            await db.asientos.bulkCreate(asientos(l));
        }
    }
}

module.exports = { PLANOS, limites, bloques, asientos, sembrar };

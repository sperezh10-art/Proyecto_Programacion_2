const db = require("../models");
const Localidad = db.localidades;
const Asiento = db.asientos;

// Crear una localidad y generar todos sus asientos
exports.create = (req, res) => {
    // 1. Validar que vengan todos los datos
    if (!req.body.nombre || !req.body.filas || !req.body.asientos_por_fila || !req.body.precio || !req.body.estadioId) {
        res.status(400).send({ message: "nombre, filas, asientos_por_fila, precio y estadioId son obligatorios" });
        return;
    }

    // 2. Armar la localidad con lo que llegó en el request
    const localidad = {
        nombre: req.body.nombre,
        filas: req.body.filas,
        asientos_por_fila: req.body.asientos_por_fila,
        precio: req.body.precio,
        estadioId: req.body.estadioId
    };

    // 3. Guardar la localidad
    Localidad.create(localidad)
        .then(data => {
            // 4. Generar la lista de asientos (todavía no se guardan)
            const asientos = [];

            for (let f = 0; f < data.filas; f++) {
                const letra = String.fromCharCode(65 + f);   // 0 → "A", 1 → "B", 2 → "C"...

                for (let n = 1; n <= data.asientos_por_fila; n++) {
                    asientos.push({
                        filas: letra,
                        numero: n,
                        localidadId: data.id
                    });
                }
            }

            // 5. Guardar todos los asientos en una sola consulta
            Asiento.bulkCreate(asientos)
                .then(() => {
                    res.send({ localidad: data, asientosCreados: asientos.length });
                })
                .catch(err => {
                    res.status(500).send({ message: err.message || "Error al crear los asientos" });
                });
        })
        .catch(err => {
            // El estadioId no existe en la tabla estadios
            if (err.name === "SequelizeForeignKeyConstraintError") {
                res.status(400).send({ message: "El estadio con id=" + req.body.estadioId + " no existe" });
                return;
            }
            res.status(500).send({ message: err.message || "Error al crear la localidad" });
        });
};

// Traer todas las localidades, cada una con sus asientos
exports.findAll = (req, res) => {
    Localidad.findAll({
        include: [{ model: Asiento, as: "asientos" }]
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({ message: err.message || "Error al obtener las localidades" });
        });
};
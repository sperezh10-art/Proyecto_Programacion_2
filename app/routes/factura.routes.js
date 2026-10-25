// routes/factura.routes.js  (v4)
module.exports = app => {
    const express = require("express");
    const facturas = require("../controllers/factura.controller.js");
    var router = express.Router();

    router.get("/", facturas.findAll);

    // Gestión de ventas (van antes de "/:id" para que no las confunda con un id)
    router.get("/ventas", facturas.ventas);
    router.get("/ventas/:ventaId", facturas.ventaDetalle);

    router.put("/:id/xml", express.raw({ type: ["application/xml", "text/xml"], limit: "5mb" }), facturas.subirXml);
    router.get("/:id/xml", facturas.xml);

    router.get("/:id", facturas.findOne);

    app.use("/api/facturas", router);
};

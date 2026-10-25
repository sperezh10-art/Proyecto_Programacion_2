// routes/factura.routes.js  (v3)
module.exports = app => {
    const express = require("express");
    const facturas = require("../controllers/factura.controller.js");
    var router = express.Router();

    router.get("/", facturas.findAll);

    router.put("/:id/xml", express.raw({ type: ["application/xml", "text/xml"], limit: "5mb" }), facturas.subirArchivo("xml"));
    router.get("/:id/xml", facturas.archivo("xml"));

    router.put("/:id/pdf", express.raw({ type: "application/pdf", limit: "5mb" }), facturas.subirArchivo("pdf"));
    router.get("/:id/pdf", facturas.archivo("pdf"));

    router.get("/:id", facturas.findOne);

    app.use("/api/facturas", router);
};

// routes/factura.routes.js
module.exports = app => {
    const facturas = require("../controllers/factura.controller.js");
    var router = require("express").Router();
    router.get("/diagnostico", facturas.diagnostico);
    router.get("/", facturas.findAll);
    router.get("/:id/pdf", facturas.pdf);
    router.get("/:id", facturas.findOne);

    app.use("/api/facturas", router);
};

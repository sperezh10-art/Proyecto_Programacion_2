module.exports = app => {
    const boletos = require("../controllers/boleto.controller.js");
    var router = require("express").Router();

    router.post("/validar/", boletos.validar);
    router.post("/:id/cancelar", boletos.cancelar);
    router.get("/qr/:codigo", boletos.qr);

    app.use("/api/boletos", router);
};

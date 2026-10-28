module.exports = app => {
    const boletos = require("../controllers/boleto.controller.js");
    var router = require("express").Router();

    router.post("/validar/", boletos.validar);
    router.post("/:id/cancelar", boletos.cancelar);

    app.use("/api/boletos", router);
};

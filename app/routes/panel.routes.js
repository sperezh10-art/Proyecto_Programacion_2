module.exports = app => {
    const panel = require("../controllers/panel.controller.js");
    var router = require("express").Router();

    // Un solo GET con todo lo que muestra el panel de control
    router.get("/", panel.resumen);

    app.use("/api/panel", router);
};

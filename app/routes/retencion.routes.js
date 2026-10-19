module.exports = app => {
    const retenciones = require("../controllers/retencion.controller.js");
    var router = require("express").Router();

    router.post("/create/", retenciones.create);

    app.use("/api/retenciones", router);
};

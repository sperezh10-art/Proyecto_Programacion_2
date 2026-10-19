module.exports = app => {
    const precios = require("../controllers/precio.controller.js");
    var router = require("express").Router();

    router.post("/create/", precios.create);
    router.get("/concierto/:conciertoId", precios.findByConcierto);
    router.delete("/concierto/:conciertoId/localidad/:localidadId", precios.remove);

    app.use("/api/precios", router);
};

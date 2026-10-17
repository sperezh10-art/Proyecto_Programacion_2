module.exports = app => {
    const asientos = require("../controllers/asiento.controller.js");
    var router = require("express").Router();

    router.get("/concierto/:conciertoId", asientos.findByConcierto);

    app.use("/api/asientos", router);
};

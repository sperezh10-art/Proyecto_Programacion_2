module.exports = app => {
    const ventas = require("../controllers/venta.controller.js");
    var router = require("express").Router();

    router.post("/create/", ventas.create);

    app.use("/api/ventas", router);
};
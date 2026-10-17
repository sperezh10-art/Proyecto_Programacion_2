module.exports = app => {
    const clientes = require("../controllers/cliente.controller.js");
    var router = require("express").Router();

    router.post("/create/", clientes.create);
    router.get("/nit/:nit", clientes.findByNit);

    app.use("/api/clientes", router);
};  
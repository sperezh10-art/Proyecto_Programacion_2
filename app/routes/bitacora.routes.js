module.exports = app => {
    const bitacora = require("../controllers/bitacora.controller.js");
    var router = require("express").Router();

    router.get("/contrasenas", bitacora.findAll);

    app.use("/api/bitacora", router);
};

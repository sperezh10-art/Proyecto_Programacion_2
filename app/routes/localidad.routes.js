module.exports = app => {
    const localidad = require("../controllers/localidad.controller.js");
    var router = require("express").Router();

    router.post("/create/", localidad.create);
    router.get("/", localidad.findAll);
   
    app.use("/api/localidades", router);
};
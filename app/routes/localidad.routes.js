module.exports = app => {
    const localidad = require("../controllers/localidad.controller.js");
    var router = require("express").Router();

    router.post("/create/", localidad.create);
    router.get("/", localidad.findAll);
    router.get("/estadio/:estadioId", localidad.findByEstadio);
    router.get("/plano/:plano", localidad.findByPlano);
    router.put("/update/:id", localidad.update);

    app.use("/api/localidades", router);
};

module.exports = app => {
    const artistas = require("../controllers/artista.controller.js");
    var router = require("express").Router();
    // Create a new Client
    router.post("/create/", artistas.create);
    // Retrieve all Client
    router.get("/", artistas.findAll);
    // Retrieve all published Client
    router.get("/status", artistas.findAllStatus);
    // Retrieve a single Client with id
    router.get("/:id", artistas.findOne);
    // Update a Client with id
    router.put("/update/:id", artistas.update);
    // Delete a Client with id
    router.delete("/delete/:id", artistas.delete);
    // Delete all Cliente
    router.delete("/delete/", artistas.deleteAll);
    // Podemos utilizar como una ocpion app.use("EndPoint",router" para simplicar el URI
    // Ej.  http://localhost:Puerto/api/cliente/
    app.use("/api/artista", router);
};
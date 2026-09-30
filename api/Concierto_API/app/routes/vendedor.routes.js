module.exports = app => {
    const vendedores = require("../controllers/vendedor.controller.js");
    var router = require("express").Router();
    // Create a new Client
    router.post("/create/", vendedores.create);
    // Retrieve all Client
    router.get("/", vendedores.findAll);
    // Retrieve all published Client
    router.get("/status", vendedores.findAllStatus);
    // Retrieve a single Client with id
    router.get("/:id", vendedores.findOne);
    // Update a Client with id
    router.put("/update/:id", vendedores.update);
    // Delete a Client with id
    router.delete("/delete/:id", vendedores.delete);
    // Delete all Cliente
    router.delete("/delete/", vendedores.deleteAll);
    // Podemos utilizar como una ocpion app.use("EndPoint",router" para simplicar el URI
    // Ej.  http://localhost:Puerto/api/cliente/
    app.use("/api/vendedor", router);
};
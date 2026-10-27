module.exports = app => {
    const usuarios = require("../controllers/usuario.controller.js");
    var router = require("express").Router();
    // Create a new Client
    router.post("/create/", usuarios.create);
    // Retrieve all Client
    router.get("/", usuarios.findAll);
    // Retrieve all published Client
    router.get("/status", usuarios.findAllStatus);
    // Retrieve a single Client with id
    router.get("/:id", usuarios.findOne);
    // Update a Client with id
    router.put("/update/:id", usuarios.update);
    router.put("/conectado/:id", usuarios.conectado);
    router.put("/desconectar/:id", usuarios.desconectar);
    // Delete a Client with id
    router.delete("/delete/:id", usuarios.delete);
    // Delete all Cliente
    router.delete("/delete/", usuarios.deleteAll);
    // Podemos utilizar como una ocpion app.use("EndPoint",router" para simplicar el URI
    // Ej.  http://localhost:Puerto/api/cliente/
    app.use("/api/usuario", router);
};
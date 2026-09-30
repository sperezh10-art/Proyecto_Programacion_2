module.exports = app => {
    const admins = require("../controllers/admin.controller.js");
    var router = require("express").Router();
    // Create a new Client
    router.post("/create/", admins.create);
    // Retrieve all Client
    router.get("/", admins.findAll);
    // Retrieve all published Client
    router.get("/status", admins.findAllStatus);
    // Retrieve a single Client with id
    router.get("/:id", admins.findOne);
    // Update a Client with id
    router.put("/update/:id", admins.update);
    // Delete a Client with id
    router.delete("/delete/:id", admins.delete);
    // Delete all Cliente
    router.delete("/delete/", admins.deleteAll);
    // Podemos utilizar como una ocpion app.use("EndPoint",router" para simplicar el URI
    // Ej.  http://localhost:Puerto/api/cliente/
    app.use("/api/admin", router);
};
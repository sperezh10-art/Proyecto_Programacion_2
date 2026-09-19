module.exports = app => {

    console.log("Estadios routes cargadas");

    const estadios = require("../controllers/estadio.controller.js");
    var router = require("express").Router();
    
    router.post("/create/", estadios.create);
    
    router.get("/", estadios.findAll);
    
    router.get("/status", estadios.findAllStatus);
  
    router.get("/:id", estadios.findOne);
   
    router.put("/update/:id", estadios.update);
   
    router.delete("/delete/:id", estadios.delete);
    
    router.delete("/delete/", estadios.deleteAll);
    
    app.use("/api/estadios", router);
};
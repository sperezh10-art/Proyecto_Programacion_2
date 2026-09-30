
module.exports = app => {

    console.log("Conciertos routes cargadas");

    const conciertos = require("../controllers/concierto.controller.js");
    var router = require("express").Router();
    
    router.post("/create/", conciertos.create);
    
    router.get("/", conciertos.findAll);
    
    router.get("/status", conciertos.findAllStatus);
  
    router.get("/:id", conciertos.findOne);
   
    router.put("/update/:id", conciertos.update);
   
    router.delete("/delete/:id", conciertos.delete);
    
    router.delete("/delete/", conciertos.deleteAll);
    
    app.use("/api/conciertos", router);
};
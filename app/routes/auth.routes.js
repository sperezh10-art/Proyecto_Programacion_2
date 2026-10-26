module.exports = app => {


    const auth = require("../controllers/auth.controller.js");
    var router = require("express").Router();
    
    router.post("/login/", auth.login);
    router.post("/register/", auth.registro);
    router.post("/recuperar/", auth.recuperar);
    router.post("/restablecer/", auth.restablecer);
    
    
    app.use("/api/auth", router);
};
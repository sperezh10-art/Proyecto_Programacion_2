module.exports = (sequelize, Sequelize) => {
    const Usuario = sequelize.define("usuario", {
        usuario: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true            
        },
        contrasena: {
            type: Sequelize.STRING,
            allowNull: false        
        },
        nombre: {
            type: Sequelize.STRING
        },
        rol: {
            type: Sequelize.STRING  
        },
        status: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        }
    });
    return Usuario;
};
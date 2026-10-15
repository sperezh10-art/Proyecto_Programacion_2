module.exports = (sequelize, Sequelize) => {
    const Cliente = sequelize.define("cliente", {
        nombre: {
            type: Sequelize.STRING,
            allowNull: false,       
        },
        nit: {
            type: Sequelize.STRING,
            unique: true

        },
        correo: {
            type: Sequelize.STRING
        },
        telefono: {
            type: Sequelize.STRING  
        }
    });
    return Cliente;
};
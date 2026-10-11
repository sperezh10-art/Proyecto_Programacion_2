//Utilizamos module.export para exportar objetos para que puedan ser utilizados en otras clases
module.exports = (sequelize, Sequelize) => {
    const Usuario = sequelize.define("usuario", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        usuario: {
            type: Sequelize.STRING,
            allowNull: false
        },
        contrasena: {
            type: Sequelize.STRING,
            allowNull: false
        },
        nombre: {
            type: Sequelize.STRING,
            allowNull: true
        },
        rol: {
            type: Sequelize.STRING,
            allowNull: true
        },
        status: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
            defaultValue: true
        }
    }, {
        tableName: "usuarios",
        timestamps: true
    });

    return Usuario;
};
module.exports = (sequelize, Sequelize) => {

    const Localidad = sequelize.define("localidad", {
        nombre: {
            type: Sequelize.STRING
        },
        filas: {
            type: Sequelize.INTEGER
        },
        asientos_por_fila: {
            type: Sequelize.INTEGER
        },
        precio: {
            type: Sequelize.DECIMAL(10, 2)
        },
        estadioId:{
            type: Sequelize.INTEGER
        }
    }, {
        tableName: "localidades",
        timestamps: false
    });

    return Localidad;
};
module.exports = (sequelize, Sequelize) => {

    const Asiento = sequelize.define("asiento", {
        filas: {
            type: Sequelize.STRING
        },
        numero: {
            type: Sequelize.INTEGER
        },
        localidadId:{
            type: Sequelize.INTEGER
        }
    }, {
        tableName: "asientos",
        timestamps: false
    });

    return Asiento;
};
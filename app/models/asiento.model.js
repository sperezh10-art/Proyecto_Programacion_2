module.exports = (sequelize, Sequelize) => {

    const Asiento = sequelize.define("asiento", {
        bloque: {
            type: Sequelize.STRING,
            defaultValue: "A"
        },
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

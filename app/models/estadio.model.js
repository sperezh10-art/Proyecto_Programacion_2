module.exports = (sequelize, Sequelize) => {

    const Estadio = sequelize.define("estadio", {
        nombre: {
            type: Sequelize.STRING
        },
        accesos: {
            type: Sequelize.INTEGER
        },
        capacidad: {
            type: Sequelize.INTEGER
        }
    }, {
        tableName: "estadios",
        timestamps: false
    });

    return Estadio;
};
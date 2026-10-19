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
        },
        tipo: {
            type: Sequelize.STRING,
            defaultValue: "TEATRO"
        }
    }, {
        tableName: "estadios",
        timestamps: false
    });

    return Estadio;
};
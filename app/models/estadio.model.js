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
        },
        pais: {
            type: Sequelize.STRING
        },
        ciudad: {
            type: Sequelize.STRING
        },
        direccion: {
            type: Sequelize.STRING
        }
    }, {
        tableName: "estadios",
        timestamps: false
    });

    return Estadio;
};
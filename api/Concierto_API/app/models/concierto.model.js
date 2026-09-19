module.exports = (sequelize, Sequelize) => {

    const Concierto = sequelize.define("concierto", {

        ciudad: {
            type: Sequelize.STRING
        },

        estadioId: {
            type: Sequelize.INTEGER
        },

        hora: {
            type: Sequelize.TIME
        },

        fecha: {
            type: Sequelize.DATE
        },

        artistaId: {
            type: Sequelize.INTEGER
        },

        estado: {
            type: Sequelize.STRING
        }

    }, {
        tableName: "conciertos",
        timestamps: false
    });

    return Concierto;
};
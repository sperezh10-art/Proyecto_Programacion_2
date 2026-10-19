module.exports = (sequelize, Sequelize) => {

    const Retencion = sequelize.define("retencion", {
        conciertoId: {
            type: Sequelize.INTEGER
        },
        asientoId: {
            type: Sequelize.INTEGER
        },
        usuarioId: {
            type: Sequelize.INTEGER
        },
        expira: {
            type: Sequelize.DATE
        }
    }, {
        tableName: "retenciones",
        timestamps: false,
        indexes: [
            { unique: true, fields: ["conciertoId", "asientoId"] }
        ]
    });

    return Retencion;
};

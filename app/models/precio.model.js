module.exports = (sequelize, Sequelize) => {

    const Precio = sequelize.define("precio", {
        conciertoId: {
            type: Sequelize.INTEGER
        },
        localidadId: {
            type: Sequelize.INTEGER
        },
        precio: {
            type: Sequelize.DECIMAL(10, 2)
        }
    }, {
        tableName: "precios",
        timestamps: false,
        indexes: [
            { unique: true, fields: ["conciertoId", "localidadId"] }
        ]
    });

    return Precio;
};

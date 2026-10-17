module.exports = (sequelize, Sequelize) => {
    const Boleto = sequelize.define("boleto", {
        ventaId: {
            type: Sequelize.INTEGER
        },
        conciertoId: {
            type: Sequelize.INTEGER
        },
        asientoId: {
            type: Sequelize.INTEGER
        },
        precio: {
            type: Sequelize.DECIMAL(10, 2)
        },
    },
        {
            tableName: "boletos",
            timestamps: false,
            indexes: [
                {
                    unique: true,  fields: ['conciertoId', 'asientoId']
                }
            ]
        }
    );
    return Boleto;
};
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
        localidadId: {
            type: Sequelize.INTEGER
        },
        precio: {
            type: Sequelize.DECIMAL(10, 2)
        },
        codigo: {
            type: Sequelize.STRING
        },
        usado: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        usadoEn: {
            type: Sequelize.DATE
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
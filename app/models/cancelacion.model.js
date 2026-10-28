module.exports = (sequelize, Sequelize) => {
    const Cancelacion = sequelize.define("cancelacion", {
        boletoId: {
            type: Sequelize.INTEGER
        },
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
        motivo: {
            type: Sequelize.STRING
        },
        usuarioId: {
            type: Sequelize.INTEGER
        }
    }, {
        tableName: "boletos_cancelados"
    });
    return Cancelacion;
};

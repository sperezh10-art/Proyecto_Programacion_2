module.exports = (sequelize, Sequelize) => {

    const Bitacora = sequelize.define("bitacora", {
        usuarioId: {
            type: Sequelize.INTEGER
        },
        usuario: {
            type: Sequelize.STRING
        },
        metodo: {
            type: Sequelize.STRING
        },
        realizadoPor: {
            type: Sequelize.STRING
        }
    }, {
        tableName: "bitacora_contrasenas"
    });

    return Bitacora;
};

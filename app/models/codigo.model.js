module.exports = (sequelize, Sequelize) => {

    const Codigo = sequelize.define("codigo", {
        usuarioId: {
            type: Sequelize.INTEGER
        },
        codigo: {
            type: Sequelize.STRING
        },
        expira: {
            type: Sequelize.DATE
        },
        intentos: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        usado: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: "codigos_recuperacion"
    });

    return Codigo;
};

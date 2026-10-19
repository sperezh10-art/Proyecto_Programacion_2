module.exports = (sequelize, Sequelize) => {

    const Localidad = sequelize.define("localidad", {
        nombre: {
            type: Sequelize.STRING
        },
        bloques: {
            type: Sequelize.INTEGER,
            defaultValue: 1
        },
        filas: {
            type: Sequelize.INTEGER
        },
        asientos_por_fila: {
            type: Sequelize.INTEGER
        },
        precio: {
            type: Sequelize.DECIMAL(10, 2)
        },
        color: {
            type: Sequelize.STRING
        },
        codigo: {
            type: Sequelize.STRING
        },
        plano: {
            type: Sequelize.STRING
        },
        tipo: {
            type: Sequelize.STRING
        },
        porLado: {
            type: Sequelize.INTEGER
        },
        estadioId:{
            type: Sequelize.INTEGER
        }
    }, {
        tableName: "localidades",
        timestamps: false
    });

    return Localidad;
};

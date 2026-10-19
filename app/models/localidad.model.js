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
        estadioId:{
            type: Sequelize.INTEGER
        }
    }, {
        tableName: "localidades",
        timestamps: false
    });

    return Localidad;
};

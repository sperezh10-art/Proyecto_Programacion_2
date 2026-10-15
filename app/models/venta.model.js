//Utilizamos module.export para exportar objetos para que puedan ser utilizados en otras clases
module.exports = (sequelize, Sequelize) => {
// usamos el sequelize.defina para "definir" el nombre de la entity en la BD, en este caso "cliente"
// Usamos type.Sequelize para definir el tipo de datos de cada atributo de la entidad 
    const Venta = sequelize.define("venta", {
        usuarioId: {
            type: Sequelize.INTEGER
        },
        clienteId: {
            type: Sequelize.INTEGER
        },
        total: {
            type: Sequelize.DECIMAL(10, 2)
        },
        metodoPago: {
            type: Sequelize.STRING
        },
    });
    return Venta;
};
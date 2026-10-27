//Utilizamos module.export para exportar objetos para que puedan ser utilizados en otras clases
module.exports = (sequelize, Sequelize) => {
    const Usuario = sequelize.define("usuario", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        usuario: {
            type: Sequelize.STRING,
            allowNull: false
        },
        contrasena: {
            type: Sequelize.STRING,
            allowNull: false
        },
        nombre: {
            type: Sequelize.STRING,
            allowNull: true
        },
        rol: {
            type: Sequelize.STRING,
            allowNull: true
        },
        correo: {
            type: Sequelize.STRING,
            allowNull: true
        },
        status: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
            defaultValue: true
        },
        conectadoDesde: {
            type: Sequelize.DATE,
            allowNull: true
        },
        ultimaConexion: {
            type: Sequelize.DATE,
            allowNull: true
        },
        ausente: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        conectado: {
            type: Sequelize.VIRTUAL,
            get() {
                const desde = this.getDataValue("conectadoDesde");
                const ultima = this.getDataValue("ultimaConexion");
                return desde != null && ultima != null && Date.now() - new Date(ultima).getTime() < 60000;
            }
        },
        minutosConectado: {
            type: Sequelize.VIRTUAL,
            get() {
                const desde = this.getDataValue("conectadoDesde");
                if (desde == null) {
                    return 0;
                }
                return Math.floor((Date.now() - new Date(desde).getTime()) / 60000);
            }
        }
    }, {
        tableName: "usuarios",
        timestamps: true
    });

    return Usuario;
};
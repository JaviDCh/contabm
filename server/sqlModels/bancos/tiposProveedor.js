
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

TiposProveedor_sql = sequelize.define('tiposProveedor_sql', {
    tipo: { type: Sequelize.INTEGER, field: 'Tipo', allowNull: false, autoIncrement: false, primaryKey: true,  },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
}, {
     tableName: 'TiposProveedor'
});

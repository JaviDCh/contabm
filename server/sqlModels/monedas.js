
import { sequelize } from './_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

Monedas_sql = sequelize.define('moneda', {
    id: { type: Sequelize.INTEGER, field: 'Moneda', primaryKey: true, autoIncrement: true, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion' },
    simbolo: { type: Sequelize.STRING, field: 'Simbolo' },
    nacionalFlag: { type: Sequelize.BOOLEAN, field: 'NacionalFlag' },
    defaultFlag: { type: Sequelize.BOOLEAN, field: 'DefaultFlag' },
}, {
     tableName: 'Monedas'
});

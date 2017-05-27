
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

// TODO: en algún momento, debemos agregar otras columnas a la definición de esta tabla;
// por ahora, solo necesitamos estas dos ...

ParametrosContab_sql = sequelize.define('parametrosContab', {

    ingresos1: { type: Sequelize.INTEGER, field: 'Ingresos1', allowNull: true, },
    ingresos2: { type: Sequelize.INTEGER, field: 'Ingresos2', allowNull: true, },
    egresos1: { type: Sequelize.INTEGER, field: 'Egresos1', allowNull: true, },
    egresos2: { type: Sequelize.INTEGER, field: 'Egresos2', allowNull: true, },

    cuentaGyP: { type: Sequelize.INTEGER, field: 'CuentaGyP', allowNull: true, },
    multiMoneda: { type: Sequelize.BOOLEAN, field: 'MultiMoneda', allowNull: true, },

    numeracionAsientosSeparadaFlag: { type: Sequelize.BOOLEAN, field: 'NumeracionAsientosSeparadaFlag', allowNull: true, },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, primaryKey: true, autoIncrement: false, },
}, {
     tableName: 'ParametrosContab'
});

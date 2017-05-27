
import { sequelize } from './_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

Compania_sql = sequelize.define('compania', {
    numero: { type: Sequelize.INTEGER, field: 'Numero', primaryKey: true, autoIncrement: true,  },
    nombre: { type: Sequelize.STRING, field: 'Nombre' },
    nombreCorto: { type: Sequelize.STRING, field: 'NombreCorto' },
    abreviatura: { type: Sequelize.STRING, field: 'Abreviatura' },
    rif: { type: Sequelize.STRING, field: 'Rif' },
    direccion: { type: Sequelize.STRING, field: 'Direccion' },
    ciudad: { type: Sequelize.STRING, field: 'Ciudad' },
    entidadFederal: { type: Sequelize.STRING, field: 'EntidadFederal' },
    zonaPostal: { type: Sequelize.STRING, field: 'ZonaPostal' },
    telefono1: { type: Sequelize.STRING, field: 'Telefono1' },
    telefono2: { type: Sequelize.STRING, field: 'Telefono2' },
    fax: { type: Sequelize.STRING, field: 'Fax' },
    monedaDefecto: { type: Sequelize.INTEGER, field: 'MonedaDefecto' },
}, {
     tableName: 'Companias'
});

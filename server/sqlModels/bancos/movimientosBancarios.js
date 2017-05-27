
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

CuentasBancarias_sql = sequelize.define('cuentasBancarias_sql', {
    id: { type: Sequelize.INTEGER, field: 'CuentaInterna', allowNull: false, autoIncrement: true, primaryKey: true },
    cuentaBancaria: { type: Sequelize.STRING, field: 'CuentaBancaria', allowNull: false },
    tipo: { type: Sequelize.STRING, field: 'Tipo', allowNull: false },
    moneda: { type: Sequelize.INTEGER, field: 'Moneda', allowNull: false },
    estado: { type: Sequelize.STRING, field: 'Estado', allowNull: false },
    cuentaContable: { type: Sequelize.INTEGER, field: 'CuentaContable', allowNull: true },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false },
}, {
     tableName: 'CuentasBancarias'
});

Chequeras_sql = sequelize.define('chequeras_sql', {
    id: { type: Sequelize.INTEGER, field: 'NumeroChequera', allowNull: false, autoIncrement: true, primaryKey: true },
    numeroCuenta: { type: Sequelize.INTEGER, field: 'NumeroCuenta', allowNull: false },
    activa: { type: Sequelize.BOOLEAN, field: 'Activa', allowNull: false },
    generica: { type: Sequelize.BOOLEAN, field: 'Generica', allowNull: false },
    fechaAsignacion: { type: Sequelize.DATE, field: 'FechaAsignacion', allowNull: false },
    desde: { type: Sequelize.INTEGER, field: 'Desde', allowNull: true },
    hasta: { type: Sequelize.INTEGER, field: 'Hasta', allowNull: true },
    asignadaA: { type: Sequelize.STRING, field: 'AsignadaA', allowNull: true },
    agotadaFlag: { type: Sequelize.BOOLEAN, field: 'AgotadaFlag', allowNull: true },
    cantidadDeChequesUsados: { type: Sequelize.INTEGER, field: 'CantidadDeChequesUsados', allowNull: true },
    ultimoChequeUsado: { type: Sequelize.INTEGER, field: 'UltimoChequeUsado', allowNull: true },
    cantidadDeCheques: { type: Sequelize.INTEGER, field: 'CantidadDeCheques', allowNull: true },
    usuario: { type: Sequelize.STRING, field: 'Usuario', allowNull: false },
    ingreso: { type: Sequelize.DATE, field: 'Ingreso', allowNull: false },
    ultAct: { type: Sequelize.DATE, field: 'UltAct', allowNull: false },
}, {
     tableName: 'Chequeras'
});


MovimientosBancarios_sql = sequelize.define('movimientosBancarios_sql', {
    transaccion: { type: Sequelize.INTEGER, field: 'Transaccion', allowNull: false },
    tipo: { type: Sequelize.STRING, field: 'Tipo', allowNull: false },
    fecha: { type: Sequelize.DATE, field: 'Fecha', allowNull: false },
    provClte: { type: Sequelize.INTEGER, field: 'ProvClte', allowNull: true },
    beneficiario: { type: Sequelize.STRING, field: 'Beneficiario', allowNull: false },
    concepto: { type: Sequelize.STRING, field: 'Concepto', allowNull: false },
    signo: { type: Sequelize.BOOLEAN, field: 'Signo', allowNull: true },
    montoBase: { type: Sequelize.DECIMAL(10, 2), field: 'MontoBase', allowNull: true },
    comision: { type: Sequelize.DECIMAL(10, 2), field: 'Comision', allowNull: true },
    impuestos: { type: Sequelize.DECIMAL(10, 2), field: 'Impuestos', allowNull: true },
    monto: { type: Sequelize.DECIMAL(10, 2), field: 'Monto', allowNull: false },
    ingreso: { type: Sequelize.DATE, field: 'Ingreso', allowNull: false },
    ultMod: { type: Sequelize.DATE, field: 'UltMod', allowNull: false },
    usuario: { type: Sequelize.STRING, field: 'Usuario', allowNull: false },
    claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', primaryKey: true, autoIncrement: true, allowNull: false },
    claveUnicaChequera: { type: Sequelize.INTEGER, field: 'ClaveUnicaChequera', allowNull: false },
    fechaEntregado: { type: Sequelize.DATE, field: 'FechaEntregado', allowNull: true },
    pagoID: { type: Sequelize.INTEGER, field: 'PagoID', allowNull: true },
}, {
     tableName: 'MovimientosBancarios'
});


// relations / asociations
CuentasBancarias_sql.hasMany(Chequeras_sql, { as: 'chequeras', foreignKey: 'NumeroCuenta' } );
Chequeras_sql.belongsTo(CuentasBancarias_sql, { as: 'cuentaBancaria', foreignKey: 'NumeroCuenta' } );
Chequeras_sql.hasMany(MovimientosBancarios_sql, { as: 'movimientosBancarios', foreignKey: 'ClaveUnicaChequera' } );
MovimientosBancarios_sql.belongsTo(Chequeras_sql, { as: 'chequera', foreignKey: 'ClaveUnicaChequera' } );

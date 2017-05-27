
ConciliacionesBancarias = new Mongo.Collection("conciliacionesBancarias");

let schema = new SimpleSchema({
    _id: { type: String, optional: false, },
    desde: { type: Date, label: 'Desde', optional: false, },
    hasta: { type: Date, label: 'Hasta', optional: false, },
    cuentaBancaria: { type: Number, label: 'Cuenta bancaria ID', optional: false, },
    moneda: { type: Number, label: 'Moneda ID', optional: false, },
    banco: { type: Number, label: 'Banco ID', optional: false, },
    observaciones: { type: String, label: 'Observaciones', optional: true, },
    cia: { type: Number, label: 'Cia Contab ID', optional: false, },

    docState: { type: Number, optional: true },

    ingreso: { type: Date, label: 'Fecha de registro', optional: false, },
    usuario: { type: String, label: 'Usuario', optional: false, },
    ultMod: { type: Date, label: 'Fecha de última modificación', optional: false, },
});

ConciliacionesBancarias.attachSchema(schema);

// ---------------------------------------------------------------------------------------------
ConciliacionesBancarias_movimientosPropios = new Mongo.Collection("conciliacionesBancarias_movimientosPropios");

let schemaMovimientosPropios = new SimpleSchema({
    _id: { type: String, optional: false, },
    conciliacionID: { type: String, optional: false, },
    consecutivo: { type: Number, label: 'Número consecutivo asignado', decimal: false, optional: false, },
    numero: { type: Number, label: 'Número', optional: false, },
    tipo: { type: String, label: 'Tipo', optional: false, },
    fecha: { type: Date, label: 'Fecha', optional: false, },
    beneficiario: { type: String, label: 'Beneficiario', optional: false, },
    concepto: { type: String, label: 'Concepto', optional: false, },
    monto: { type: Number, label: 'Monto', optional: false, decimal: true, },
    fechaEntregado: { type: Date, label: 'Fecha de entrega', optional: true, },
    conciliado: { type: String, label: 'Conciliado (si/no)?', optional: true, },
    consecutivoMovBanco: { type: Number, label: 'Número consecutivo mov banco', decimal: false, optional: true, },
});

ConciliacionesBancarias_movimientosPropios.attachSchema(schemaMovimientosPropios);

// ---------------------------------------------------------------------------------------------
ConciliacionesBancarias_movimientosBanco = new Mongo.Collection("conciliacionesBancarias_movimientosBanco");

let schemaMovimientosBanco = new SimpleSchema({
    _id: { type: String, optional: false, },
    conciliacionID: { type: String, optional: false, },
    consecutivo: { type: Number, label: 'Número consecutivo asignado', decimal: false, optional: false, },
    numero: { type: Number, label: 'Número', optional: true, },
    tipo: { type: String, label: 'Tipo', optional: true, },
    fecha: { type: Date, label: 'Fecha', optional: false, },
    beneficiario: { type: String, label: 'Beneficiario', optional: true, },
    concepto: { type: String, label: 'Concepto', optional: true, },
    monto: { type: Number, label: 'Monto', optional: false, decimal: true, },
    conciliado: { type: String, label: 'Conciliado (si/no)?', optional: true, },
    consecutivoMovPropio: { type: Number, label: 'Número consecutivo mov propio', decimal: false, optional: true, },
});

ConciliacionesBancarias_movimientosBanco.attachSchema(schemaMovimientosBanco);

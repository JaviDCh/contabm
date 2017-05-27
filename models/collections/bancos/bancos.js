

let cuentasBancarias_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    cuentaInterna: { type: Number, label: "ID cuenta bancaria", optional: false, },
    cuentaBancaria: { type: String, label: "Cuenta bancaria", optional: false, },
    tipo: { type: String, label: 'Tipo cuenta', optional: false, },
    moneda: { type: Number, label: 'Moneda cuenta', optional: false, },
    lineaCredito: { type: Number, label: "Línea de crédito", optional: true, decimal: true, },
    estado: { type: String, label: "Estado", optional: false, },
    cuentaContable: { type: Number, label: "Cuenta contable", optional: true, },
    cuentaContableGastosIDB: { type: Number, label: "Cuenta contable IDB", optional: true, },
    numeroContrato: { type: String, label: "Número de contrato", optional: true, },
    cia: { type: Number, label: "Cia Contab", optional: false, },
});


let agencias_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    agencia: { type: Number, label: "Agencia", optional: false },
    nombre: { type: String, label: "Nombre de la agencia", optional: false },
    direccion: { type: String, label: 'Dirección', optional: true },
    telefono1: { type: String, label: 'Telefono', optional: true },
    telefono2: { type: String, label: "Telefono", optional: true, },
    fax: { type: String, label: "Fax", optional: true, },
    contacto1: { type: String, label: "Contacto en la agencia", optional: true, },
    contacto2: { type: String, label: "Contacto en la agencia", optional: true, },
    cuentasBancarias: { type: [cuentasBancarias_SimpleSchema], optional: true, minCount: 0 },
});

let bancos_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    banco: { type: Number, label: "Banco", optional: false },
    nombre: { type: String, label: "Nombre", optional: false },
    nombreCorto: { type: String, label: 'Nombre corto', optional: true },
    abreviatura: { type: String, label: 'Abreviatura', optional: false },
    codigo: { type: String, label: "Debe", optional: true, },
    agencias: { type: [agencias_SimpleSchema], optional: true, minCount: 0 },
});

Bancos = new Mongo.Collection("bancos");
Bancos.attachSchema(bancos_SimpleSchema);

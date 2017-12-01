
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let cuentasBancarias_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    cuentaInterna: { type: Number, label: "ID cuenta bancaria", optional: false, },
    cuentaBancaria: { type: String, label: "Cuenta bancaria", optional: false, },
    tipo: { type: String, label: 'Tipo cuenta', optional: false, },
    moneda: { type: Number, label: 'Moneda cuenta', optional: false, },
    lineaCredito: { type: Number, label: "Línea de crédito", optional: true,  },
    estado: { type: String, label: "Estado", optional: false, },
    cuentaContable: { type: Number, label: "Cuenta contable", optional: true, },
    cuentaContableGastosIDB: { type: Number, label: "Cuenta contable IDB", optional: true, },
    numeroContrato: { type: String, label: "Número de contrato", optional: true, },
    cia: { type: Number, label: "Cia Contab", optional: false, },
})


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
    cuentasBancarias: { type: Array, optional: true, minCount: 0 },
    'cuentasBancarias.$': { type: cuentasBancarias_SimpleSchema },
})

let bancos_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    banco: { type: Number, label: "Banco", optional: false },
    nombre: { type: String, label: "Nombre", optional: false, min: 1, max: 50, },
    nombreCorto: { type: String, label: 'Nombre corto', optional: false, min: 1, max: 10, },
    abreviatura: { type: String, label: 'Abreviatura', optional: false, min: 1, max: 6, },
    codigo: { type: String, label: "Debe", optional: true, min: 1, max: 4, },
    agencias: { type: Array, optional: true, minCount: 0 },
    'agencias.$': { type: agencias_SimpleSchema },
    docState: { type: Number, optional: true, }
})

Bancos = new Mongo.Collection("bancos");
Bancos.attachSchema(bancos_SimpleSchema);

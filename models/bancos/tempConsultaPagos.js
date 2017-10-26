
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let schema = new SimpleSchema({
    _id: { type: String, optional: false },
    claveUnica: { type: Number, label: "Factura ID", optional: false, },
    numeroPago: { type: String, label: "Número del pago", optional: true, },
    fecha: { type: Date, label: "Fecha", optional: false, },
    nombreCompania: { type: String, label: "Compañía", optional: false, },
    simboloMoneda: { type: String, label: "Moneda", optional: false, },
    miSuFlag: { type: String, label: "Mi/Su", optional: false, },
    concepto: { type: String, label: "Concepto", optional: true, },
    monto: { type: Number, label: "Monto", optional: true, },
    user: { type: String, label: 'Mongo user', optional: false, },
});

Temp_Consulta_Bancos_Pagos = new Mongo.Collection("temp_consulta_bancos_pagos");
Temp_Consulta_Bancos_Pagos.attachSchema(schema);


Monedas = new Mongo.Collection("monedas");

let schema = new SimpleSchema({
    _id: { type: String, optional: false },
    moneda: { type: Number, label: "Moneda", optional: false },
    descripcion: { type: String, label: "Descripción", min: 1, max: 50, optional: false },
    simbolo: { type: String, label: "Símbolo", min: 1, max: 6, optional: false },
    nacionalFlag: { type: Boolean, label: "Moneda nacional", optional: false },
    defaultFlag: { type: Boolean, label: "Moneda por defecto", optional: false },
});

Monedas.attachSchema(schema);

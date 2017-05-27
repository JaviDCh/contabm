

ParametrosGlobalBancos = new Mongo.Collection("parametrosGlobalBancos");

let schema = new SimpleSchema({
     _id: { type: String, optional: false },
     claveUnica: { type: Number, label: "Clave única", optional: false },
     agregarAsientosContables: { type: Boolean, label: "Agregar asientos contables", optional: false },
     tipoAsientoDefault: { type: String, label: "Tipo de asientos por defecto", optional: false },
     ivaPorc: { type: Number, label: "Porcentaje de iva", decimal: true, optional: false },
     porcentajeITF: { type: Number, label: "Porcentaje de ITF", optional: true, decimal: true },
     docState: { type: Number, optional: true },
});

ParametrosGlobalBancos.attachSchema(schema);

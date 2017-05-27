
Companias = new Mongo.Collection("companias");

let schema = new SimpleSchema({
    _id: { type: String, optional: false },
    numero: { type: Number, label: "Número", optional: false },
    nombre: { type: String, label: "Nombre", min: 1, max: 50, optional: false },
    nombreCorto: { type: String, label: "Nombre corto", min: 1, max: 25, optional: false },
    abreviatura: { type: String, label: "Abreviatura", min: 1, max: 6, optional: false },
    rif: { type: String, label: "Rif", min: 1, max: 120, optional: true },
    direccion: { type: String, label: "Dirección", min: 1, max: 150, optional: true },
    entidadFederal: { type: String, label: "Entidad federal", min: 1, max: 50, optional: true },
    zonaPostal: { type: String, label: "Zona postal", min: 1, max: 15, optional: true },
    telefono1: { type: String, label: "Teléfono 1", min: 1, max: 14, optional: true },
    telefono2: { type: String, label: "Teléfono 2", min: 1, max: 14, optional: true },
    fax: { type: String, label: "Fax", min: 1, max: 120, optional: true },
    monedaDefecto: { type: String, label: "Moneda por defecto", optional: true },
});

Companias.attachSchema(schema);

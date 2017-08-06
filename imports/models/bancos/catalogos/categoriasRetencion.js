
import { Mongo } from 'meteor/mongo';

// categorías de retención
let simpleSchema = new SimpleSchema({
    categoria: { type: Number, label: "Categoría", optional: false },
    descripcion: { type: String, label: "Descripcion", optional: false, min: 1, max: 30, },

    docState: { type: Number, optional: true },
});

export const CategoriasRetencion = new Mongo.Collection("categoriasRetencion");
CategoriasRetencion.attachSchema(simpleSchema);

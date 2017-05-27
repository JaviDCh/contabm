

// -----------------------------------------------------------------------
// filtros
// -----------------------------------------------------------------------
var schema = new SimpleSchema({
    _id: { type: String,optional: false },
    userId: { type: String,optional: false },
    nombre: { type: String,optional: false },
    filtro: { type: Object,optional: true,blackbox: true }
});

Filtros = new Mongo.Collection("filtros");
Filtros.attachSchema(schema);

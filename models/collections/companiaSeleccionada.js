
CompaniaSeleccionada = new Mongo.Collection("companiaSeleccionada");

var schema = new SimpleSchema({
    companiaID: { type: String,label: "Compañía", optional: false },
    userID: { type: String, label: "Usuario", optional: false}
});

CompaniaSeleccionada.attachSchema(schema);


Meteor.publish(null, function () {
    // nótese como la idea es regresar aquí todos los catálogos ...
    // nota: como el nombre de método es null, los collections se regresan a
    // cada client en forma automática ...

    return [
             TiposProveedor.find(),
             FormasDePago.find(),
    ];
});



Meteor.publish("asientosContables", function (filtro) {

    // debugger;
    filtro = JSON.parse(filtro);
    let selector = {};

    if (filtro._id) {
        selector._id = { $eq: filtro._id };
    };

    if (filtro.numeroAutomatico) {
        selector.numeroAutomatico = { $eq: filtro.numeroAutomatico };
    };

    if (filtro.lote) {
        let search = new RegExp(filtro.lote, 'i');
        selector.lote = search;
    };

    if (filtro.user) {
        selector.user = { $eq: filtro.user };
    };

    if (filtro.cia)
        selector.cia = { $eq: filtro.cia };

    return AsientosContables.find(selector);
});

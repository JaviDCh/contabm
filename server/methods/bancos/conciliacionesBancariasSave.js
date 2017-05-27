
Meteor.methods(
{
    conciliacionesBancariasSave: function (item) {

        // debugger;
        check(item, Object);

        // para regresar el _id; sobre todo del item recién agregado ...
        let itemID = "-999";

        if (item.docState && item.docState == 1) {
            delete item.docState;
            itemID = ConciliacionesBancarias.insert(item);
        };


        if (item.docState && item.docState == 2) {
            delete item.docState;
            ConciliacionesBancarias.update({ _id: item._id }, { $set: item });
            itemID = item._id;
        };


        if (item.docState && item.docState == 3) {
            ConciliacionesBancarias.remove({ _id: item._id });
        };

        return {
            message: `Ok, los datos han sido actualizados en la base de datos.`,
            id: itemID, 
        };
    }
});


import lodash from 'lodash';

Meteor.methods(
{
    'generales.companiasSave': function (items) {

        if (!_.isArray(items) || items.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }


        // NOTA: al menos por ahora, solo permitimos eliminar compañías; debemos agregar la posibilidad de agregar
        // y modificarlas también ...

        var removes = lodash(items).
                      filter((item) => { return item.docState && item.docState == 3; }).
                      value();

        removes.forEach(function (item) {

            let response = null;

            // por supuesto que la eliminación de la compañía fallará si existen registros asociados en otras tablas ...
            response = Async.runSync(function(done) {
                Compania_sql.destroy({ where: { numero: item.numero }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            Companias.remove({ _id: item._id });
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});

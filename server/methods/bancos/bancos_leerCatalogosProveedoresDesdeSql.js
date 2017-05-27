
// leemos los catálogos necesarios para el registro de proveedores desde sql server
// nota: algunos católogos existen siempre en mongo; éstos no y hay que leerlos siempre desde sql
Meteor.methods(
{
    bancos_leerCatalogosProveedoresDesdeSql: function () {
        let response = null;
        response = Async.runSync(function(done) {
            CategoriasRetencion_sql.findAll({ raw: true, })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        let categoriasRetencion = response.result;

        response = null;
        response = Async.runSync(function(done) {
            Ciudades_sql.findAll({ raw: true, })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        let ciudades = response.result;

        return JSON.stringify({
            categoriasRetencion: categoriasRetencion,
            ciudades: ciudades,
        });
    }
});


import moment from 'moment';

Meteor.methods(
{
    proveedores_leerByID_desdeSql: function (pk) {

        check(pk, Match.Integer);

        let response = null;
        response = Async.runSync(function(done) {
            Proveedores_sql.findAll({ where: { proveedor: pk },
                    raw: true,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        let proveedor = response.result[0];

        // cuando el registro es eliminado, simplemente no existe. Regresamos de inmediato ...
        if (!proveedor)
            return null;

        // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
        proveedor.ingreso = proveedor.ingreso ? moment(proveedor.ingreso).add(TimeOffset, 'hours').toDate() : null;
        proveedor.ultAct = proveedor.ultAct ? moment(proveedor.ultAct).add(TimeOffset, 'hours').toDate() : null;

        return JSON.stringify(proveedor);
    }
});

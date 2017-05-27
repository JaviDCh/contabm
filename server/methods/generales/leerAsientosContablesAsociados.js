
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment'; 

Meteor.methods({
   leerAsientosContablesAsociados: function (provieneDe, provieneDe_ID, ciaContabSeleccionada_ID) {

       // leemos desde sql server los asientos contables asociados a una entidad; por ejemplo:
       // facturas, pagos, etc.

        new SimpleSchema({
           provieneDe: { type: String, optional: false, },
           provieneDe_ID: { type: Number, decimal: false, optional: false, },
           ciaContabSeleccionada_ID: { type: Number, decimal: false, optional: false, },
       }).validate({ provieneDe, provieneDe_ID, ciaContabSeleccionada_ID, });


         // ------------------------------------------------------------------------------------
         // ahora que tenemos la chequera, leemos la cantidad de cheques usados para la misma
         query = `Select a.NumeroAutomatico as numeroAutomatico, a.Numero as numero, a.Fecha as fecha,
                  m.Simbolo as simboloMoneda, a.Descripcion as descripcion,
                  Count(d.Partida) As cantPartidas,
	              Sum(d.Debe) As sumOfDebe, Sum(d.haber) As sumOfHaber
                  From Asientos a Left Outer Join dAsientos d
                  On a.NumeroAutomatico = d.NumeroAutomatico
                  Inner Join Monedas m On a.Moneda = m.Moneda
                  Where ProvieneDe = ? And ProvieneDe_ID = ? And a.Cia = ?
                  Group By a.NumeroAutomatico, a.Numero, a.Fecha, m.Simbolo, a.Descripcion `;

         response = null;
         response = Async.runSync(function(done) {
             sequelize.query(query, {
                 replacements: [
                     provieneDe,
                     provieneDe_ID,
                     ciaContabSeleccionada_ID,
                 ], type: sequelize.QueryTypes.SELECT })
                 .then(function(result) { done(null, result); })
                 .catch(function (err) { done(err, null); })
                 .done();
         });

         if (response.error)
             throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

         let asientosAsociados = response.result;

         asientosAsociados.forEach((asiento) => {
             asiento.fecha = moment(asiento.fecha).add(TimeOffset, 'hours').toDate();
         })

         return JSON.stringify(asientosAsociados);
   }
})

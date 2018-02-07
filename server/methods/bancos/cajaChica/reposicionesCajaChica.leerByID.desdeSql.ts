

import * as moment from 'moment';
import { TimeOffset } from '../../../../globals/globals'; 
import SimpleSchema from 'simpl-schema';

import { CajaChica_Reposiciones_sql, CajaChica_Reposiciones_Gastos_sql } from '../../../imports/sqlModels/bancos/cajasChicas'

Meteor.methods(
{
    'reposicionesCajaChica.leerByID.desdeSql': function (pk) {

        new SimpleSchema({
            pk: { type: Number, optional: false, },
        }).validate({ pk });

        let response: any = null;
        response = Async.runSync(function(done) {
            CajaChica_Reposiciones_sql.findAll({ where: { reposicion: pk },
                include: [
                    { model: CajaChica_Reposiciones_Gastos_sql,
                      as: 'cajaChica_reposicion_gastos', },
                ],
                    // raw: true,       // aparentemente, cuando hay Includes, el 'raw' no funciona del todo bien ...
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        let reposicion = {} as any;

        if (response && response.result && response.result.length) {
            reposicion = response.result[0].dataValues;

            // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
            reposicion.fecha = reposicion.fecha ? moment(reposicion.fecha).add(TimeOffset, 'hours').toDate() : null;
            
            if (reposicion.cajaChica_reposicion_gastos) {
                reposicion.cajaChica_reposicion_gastos.forEach((r) => {
                    r.fechaDocumento = r.fechaDocumento ? moment(r.fechaDocumento).add(TimeOffset, 'hours').toDate() : null;
                });
            }
        }

        return JSON.stringify(reposicion);
    }
})

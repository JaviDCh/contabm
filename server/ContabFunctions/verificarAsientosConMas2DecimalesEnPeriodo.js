

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';

let verificarAsientosConMas2DecimalesEnPeriodo = (desde, hasta, ciaContab) => {

    let whereMontosConMasDeDosDecimales = `
        (
            (((abs(d.debe)*100) - CONVERT(bigint,(abs(d.debe)*100))) <> 0) Or
            (((abs(d.haber)*100) - CONVERT(bigint,(abs(d.haber)*100))) <> 0)
        )`;


    query = `Select Count(*) As cantOfAsientos
           From dAsientos d Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico 
           Where a.Fecha Between ? And ? And a.Cia = ? And ${whereMontosConMasDeDosDecimales}`;

    let response = null;
    response = Async.runSync(function(done) {
     sequelize.query(query, {
                               replacements: [
                                   moment(desde).format("YYYY-MM-DD"),
                                   moment(hasta).format("YYYY-MM-DD"),
                                   ciaContab.numero
                               ],
                               type: sequelize.QueryTypes.SELECT
                           })
         .then(function(result) { done(null, result); })
         .catch(function (err) { done(err, null); })
         .done();
    })

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }


    if (response.result[0].cantOfAsientos > 0) {
        return { error: true };
    }

    return { error: false };
}

ContabFunctions.verificarAsientosConMas2DecimalesEnPeriodo = verificarAsientosConMas2DecimalesEnPeriodo;

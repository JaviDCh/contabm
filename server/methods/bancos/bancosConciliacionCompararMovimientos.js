
import numeral from 'numeral';

Meteor.methods(
{
    bancos_conciliacion_CompararMovimientos: function (conciliacion_ID,
                                                       criteriosSeleccionadosArray,
                                                       mantenerComparacionesAnteriores) {

        new SimpleSchema({
            conciliacion_ID: { type: String, optional: false },
            criteriosSeleccionadosArray: { type: String, optional: false },
            mantenerComparacionesAnteriores: { type: Boolean, optional: false }
        }).validate({ conciliacion_ID, criteriosSeleccionadosArray, mantenerComparacionesAnteriores, });

        criteriosSeleccionadosArray = JSON.parse(criteriosSeleccionadosArray);

        if (!criteriosSeleccionadosArray || !_.isArray(criteriosSeleccionadosArray) || !criteriosSeleccionadosArray.length) {
            let message = `Error: no se ha recibido ningún criterio de comparación.<br />
                           Este proceso no puede ser ejecutado si no se indica, al menos, un criterio de comparación.
                          `;
            return {
                error: true,
                message: message
            };
        }

        // primero que hacemos es limpiar alguna comparación anterior; el usuario puede indicar que se
        // mantengan ...
        if (!mantenerComparacionesAnteriores) {
            ConciliacionesBancarias_movimientosPropios.update(
                { conciliacionID: conciliacion_ID },
                { $set: { conciliado: 'no', consecutivoMovBanco: null }},
                { multi: true }
            );

            ConciliacionesBancarias_movimientosBanco.update(
                { conciliacionID: conciliacion_ID },
                { $set: { conciliado: 'no', consecutivoMovPropio: null }},
                { multi: true }
            );
        }

        // leemos cada movimiento (propio) y lo buscamos en la otra tabla (del banco), según el
        // 'criterio de busqueda' que indicó el usuario (monto, fecha, etc.). Si existe, lo
        // actualizamos, en *ambas* tablas, para reflejar que fue encontrado
        let movimientosLeidos = 0;
        let movimientosEncontrados = 0;

        let recordCount = ConciliacionesBancarias_movimientosPropios.find({ conciliacionID: conciliacion_ID, conciliado: 'no' }).count();

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = recordCount;
        let reportarCada = Math.floor(numberOfItems / 10);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('bancos_conciliacionBancaria_reportProgress',
                            { myuserId: this.userId, app: 'bancos', process: 'conciliacionesBancarias' },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        ConciliacionesBancarias_movimientosPropios.find({
            conciliacionID: conciliacion_ID, conciliado: 'no'
        }).forEach((mov) => {

            // TODO: ahora tenemos que 'armar' el filtro para buscar en la otra tabla
            let filtro = construirFiltroComparacion(mov, criteriosSeleccionadosArray);

            // ahora intentamos encontrar en la otra tabla
            let movBanco = ConciliacionesBancarias_movimientosBanco.findOne(filtro);

            if (movBanco) {
                // encontramos el movimiento en la otra tabla; ahora lo actualizamos, en *ambas* tablas,
                // para reflejar que está 'conciliado'
                ConciliacionesBancarias_movimientosPropios.update(
                    { conciliacionID: conciliacion_ID, _id: mov._id, },
                    { $set: { conciliado: 'si', consecutivoMovBanco: movBanco.consecutivo }},
                    { multi: false }
                );

                ConciliacionesBancarias_movimientosBanco.update(
                    { conciliacionID: conciliacion_ID, _id: movBanco._id, },
                    { $set: { conciliado: 'si', consecutivoMovPropio: mov.consecutivo }},
                    { multi: false }
                );

                movimientosEncontrados++;
            }

            movimientosLeidos++;

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 10) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_conciliacionBancaria_reportProgress',
                                    { myuserId: this.userId, app: 'bancos', process: 'conciliacionesBancarias' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_conciliacionBancaria_reportProgress',
                                        { myuserId: this.userId, app: 'bancos', process: 'conciliacionesBancarias' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        });


        let message = `Ok, la comparación de movimientos bancarios se ha efectuado en forma satisfactoria.<br /><br />
                       Los criterios de comparación recibidos fueron: ${criteriosSeleccionadosArray.toString()}.<br />
                       <b>${movimientosLeidos.toString()}</b> movimientos propios fueron leídos; de los cuales,
                       <b>${movimientosEncontrados.toString()}</b> fueron encontrados en los movimientos del banco.
                       `;

        return {
            error: false,
            message: message
        };
    }
});

// para construir el criterio que será usado para buscar un movimiento del banco que
// corresponda al movimiento propio; el usuario puede indicar los criterios de comparación
// que desea usar (fecha, tipo, monto, etc.), en la combinación que desee ...
function construirFiltroComparacion(mov, criteriosSeleccionadosArray) {
    let filtro = {};

    filtro.conciliacionID = mov.conciliacionID;
    filtro.conciliado = 'no';

    if (_.find(criteriosSeleccionadosArray, (x) => { return x === 'numero'; })) {
        filtro.numero = mov.numero;
    }

    if (_.find(criteriosSeleccionadosArray, (x) => { return x === 'beneficiario'; })) {
        filtro.beneficiario = mov.beneficiario;
    }

    if (_.find(criteriosSeleccionadosArray, (x) => { return x === 'tipo'; })) {
        filtro.tipo = mov.tipo;
    }

    if (_.find(criteriosSeleccionadosArray, (x) => { return x === 'concepto'; })) {
        filtro.concepto = mov.concepto;
    }

    if (_.find(criteriosSeleccionadosArray, (x) => { return x === 'fecha'; })) {
        // nótese como 'globalizamos' la fecha para que se encuentre en mongo
        // let fecha = mov.fecha;
        //
        // if (fecha && lodash.isDate(fecha)) {
        //     fecha = moment(fecha).add(TimeOffset, 'hours').toDate();
        // };
        filtro.fecha = mov.fecha;
    }

    if (_.find(criteriosSeleccionadosArray, (x) => { return x === 'monto'; })) {
        filtro.monto = mov.monto;
    }

    return filtro;
};

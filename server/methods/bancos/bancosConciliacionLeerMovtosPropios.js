
Meteor.methods(
{
    bancos_conciliacion_LeerMovtosPropios: function (conciliacionID) {

        // debugger;
        new SimpleSchema({
            conciliacionID: { type: String, optional: false }
          }).validate({ conciliacionID });

          // TODO: leemos la conciliación; no existe: error
          let conciliacionBancaria = ConciliacionesBancarias.findOne(conciliacionID);

          if (!conciliacionBancaria) {
              let message = `Error inesperado: no hemos podido leer la conciliación bancaria indicada.`;
              return {
                  error: true,
                  message: message
              };
          };

        // ---------------------------------------------------------------------------------------------------
        // TODO: leemos los movimientos bancarios para la cuenta y el período en la conciliación leída

        let query = `Select mb.Transaccion as transaccion, mb.Tipo as tipo, mb.Fecha as fecha,
                    mb.Beneficiario as beneficiario, mb.Concepto as concepto, mb.Monto as monto,
                    mb.FechaEntregado as fechaEntregado
                    From MovimientosBancarios mb Inner Join Chequeras ch On mb.ClaveUnicaChequera = ch.NumeroChequera
                    Inner Join CuentasBancarias cb On ch.NumeroCuenta = cb.CuentaInterna
                    Where cb.CuentaInterna = ? And mb.Fecha Between ? And ?
                    Order By mb.Fecha, mb.Transaccion
                    `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, {
                replacements: [
                    conciliacionBancaria.cuentaBancaria,
                    moment(conciliacionBancaria.desde).format('YYYY-MM-DD'),
                    moment(conciliacionBancaria.hasta).format('YYYY-MM-DD'),
                ],
                type: sequelize.QueryTypes.SELECT
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        if (response.result.length == 0) {
            let message = `Error inesperado: no hemos leído ningún movimiento para la cuenta
                    bancaria y el período indicados para la conciliación bancaria.`;
            return {
                error: true,
                message: message
            };
        };

        // eliminamos los items en la tabla en mongo
        ConciliacionesBancarias_movimientosPropios.remove({ conciliacionID: conciliacionID });

        // para identificar cada movimiento con un simple número local al proceso...
        let consecutivo = 1;
        response.result.forEach((item) => {

            let movimientoBancario = {};

            movimientoBancario._id = new Mongo.ObjectID()._str;
            movimientoBancario.conciliacionID = conciliacionBancaria._id;
            movimientoBancario.consecutivo = consecutivo;
            movimientoBancario.numero = parseInt(item.transaccion);
            movimientoBancario.tipo = item.tipo;
            movimientoBancario.fecha = item.fecha ? moment(item.fecha).add(TimeOffset, 'hours').toDate() : null;
            movimientoBancario.beneficiario = item.beneficiario;
            movimientoBancario.concepto = item.concepto;
            movimientoBancario.monto = item.monto;
            movimientoBancario.fechaEntregado = item.fechaEntregado ? moment(item.fechaEntregado).add(TimeOffset, 'hours').toDate() : null;
            movimientoBancario.conciliado = 'no';
            
            ConciliacionesBancarias_movimientosPropios.insert(movimientoBancario);
            consecutivo++;
        });

        let message = `Ok, ${response.result.length.toString()} movimientos bancarios han sido leídos
                       desde la base de datos, para la cuenta bancaria y el período indicados para la
                       conciliación bancaria.`;

        return {
            error: false,
            message: message
        };
    }
});

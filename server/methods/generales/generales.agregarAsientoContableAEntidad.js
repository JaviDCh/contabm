
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import lodash from 'lodash';

Meteor.methods({
   'generales.agregarAsientoContableAEntidad': function (provieneDe, provieneDe_ID, ciaContabSeleccionada_ID) {

       // agregamos el asiento que corresponde al registro de una entidad, por ejemplo: factura, pago, nómina,
       // movimiento bancario, etc.
        new SimpleSchema({
           provieneDe: { type: String, optional: false, },
           provieneDe_ID: { type: Number, decimal: false, optional: false, },
           ciaContabSeleccionada_ID: { type: Number, decimal: false, optional: false, },
       }).validate({ provieneDe, provieneDe_ID, ciaContabSeleccionada_ID, });

       let currentUser = Meteor.user();
       let entidadOriginal = {};

       // leemos la 'entidad' (mov banc, factura, pago, etc.) usando el pk que recibimos en este método
       switch (provieneDe) {
           case "Bancos":
               let leerMovimientoBancario = leerMovimientoBancarioDesdeSqlServer(provieneDe_ID);
               if (leerMovimientoBancario.error)
                    return {
                        error: true,
                        message: leerMovimientoBancario.message
                    };
                entidadOriginal = leerMovimientoBancario.movimientoBancario;
                break;
            case "Facturas":
                let leerFactura = leerFacturaDesdeSqlServer(provieneDe_ID);
                if (leerFactura.error)
                     return {
                         error: true,
                         message: leerFactura.message
                     };
                 entidadOriginal = leerFactura.factura;
                 break;
           default:
               return {
                   error: true,
                   message: `Error: el valor pasado a esta función para 'provieneDe' (${provieneDe}) no es válido.
                             Por favor revise.`
               };
       }


       // ----------------------------------------------------------------------------------------------------------------------------
       // leemos parametrosGlobalBancos (pero en mongo) ...
       let parametrosGlobalBancos = ParametrosGlobalBancos.findOne();

       if (!parametrosGlobalBancos) {
           return {
               error: true,
               message: `Error: no existe un registro, o sus datos no se han definido,
                         en la tabla <em>parámetros global bancos</em>.`
           };
       }

       if (!parametrosGlobalBancos.agregarAsientosContables) {
           return {
               error: true,
               message: `Error: en la tabla <em>parámetros global bancos</em> se debe indicar que se
                         desea agregar asientos en <em>Contab</em>.`
           };
       }

       if (!parametrosGlobalBancos.tipoAsientoDefault) {
           return {
               error: true,
               message: `Error: en la tabla <em>parámetros global bancos</em> se debe indicar un
                         tipo de asientos a usar <em>por defecto</em>.`
           };
       }

       let tipoAsientoDefault = parametrosGlobalBancos.tipoAsientoDefault;

       // ----------------------------------------------------------------------------------------------------------------------------
       // leemos la compañía contab seleccionada
       let companiaContab = Companias.findOne({ numero: ciaContabSeleccionada_ID });

       if (!companiaContab) {
           return {
               error: true,
               message: `Error inesperado: no hemos podido leer la compañía <em>Contab</em> que se ha seleccionado`
           };
       }


       let fechaAsiento = null;

       switch (provieneDe) {
           case 'Bancos':
               fechaAsiento = entidadOriginal.fecha;
               break;
           case 'Facturas':
                if (entidadOriginal.cxCCxPFlag === 1) {
                    fechaAsiento = entidadOriginal.fechaRecepcion;      // cxp
                } else {
                    fechaAsiento = entidadOriginal.fechaEmision;        // cxc
                }
               break;
           default:
       }


       // ----------------------------------------------------------------------------------------------
       // nótese como determinamos el último día del mes (wow javascript!!) ...
       // fechaAsiento = new Date(fechaAsiento.getFullYear(), fechaAsiento.getMonth() + 1, 0);

       let mesFiscal = ContabFunctions.determinarMesFiscal(fechaAsiento, companiaContab.numero);

       if (mesFiscal.error) {
           return {
               error: true,
               message: mesFiscal.errorMessage ? mesFiscal.errorMessage : "Error: mensaje de error indefinido."
           };
       }

       let factorCambio = ContabFunctions.leerCambioMonedaMasReciente(fechaAsiento);

       if (factorCambio.error) {
           return {
               error: true,
               message: factorCambio.errorMessage ? factorCambio.errorMessage : "Error: mensaje de error indefinido."
           };
       }

       // validamos el mes cerrado en Contab
       let validarMesCerradoContab = ContabFunctions.validarMesCerradoEnContab(fechaAsiento, companiaContab.numero);

       if (validarMesCerradoContab && validarMesCerradoContab.error) {
           if (validarMesCerradoContab.errMessage) {
               return {
                   error: true,
                   message: validarMesCerradoContab.errMessage
               };
           } else {
               throw new Meteor.Error("error-validacion", "Error: mensaje de error indefinido (?!?).");
           }
       }


       // --------------------------------------------------------------------------------------
       // agregamos el asiento contable ...
       let numeroNegativoAsiento = ContabFunctions.determinarNumeroNegativoAsiento(fechaAsiento, companiaContab.numero);

       if (numeroNegativoAsiento.error) {
           return {
               error: true,
               message: numeroNegativoAsiento.errorMessage ? numeroNegativoAsiento.errorMessage : "Error: mensaje de error indefinido."
           };
       }


       let agregarAsientoContable = null;

       switch (provieneDe) {
           case "Bancos":
               agregarAsientoContable = agregarAsientoContable_MovimientoBancario(entidadOriginal,
                                                                                  tipoAsientoDefault,
                                                                                  companiaContab,
                                                                                  fechaAsiento,
                                                                                  mesFiscal,
                                                                                  factorCambio,
                                                                                  numeroNegativoAsiento,
                                                                                  provieneDe_ID,
                                                                                  currentUser);
               break;
           case "Facturas":
               agregarAsientoContable = agregarAsientoContable_Factura(entidadOriginal,
                                                                       tipoAsientoDefault,
                                                                       companiaContab,
                                                                       fechaAsiento,
                                                                       mesFiscal,
                                                                       factorCambio,
                                                                       numeroNegativoAsiento,
                                                                       provieneDe_ID,
                                                                       currentUser);

               break;
       }

       // regresamos un un objeto que contiene un probable error,
       // o el pk del asiento contable recién agregado
       return agregarAsientoContable;
   }
})


// --------------------------------------------------------------------------
// para leer el movimiento bancario desde sql server
function leerMovimientoBancarioDesdeSqlServer(pk) {

    // leemos el movimiento bancario desde sql server
    let response = null;
    response = Async.runSync(function(done) {
       MovimientosBancarios_sql.findAll({ where: { claveUnica: pk }, raw: true, })
           .then(function(result) { done(null, result); })
           .catch(function (err) { done(err, null); })
           .done();
    });

    if (response.error)
       throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

       // cuando el registro es eliminado, simplemente no existe. Regresamos de inmediato ...
       if (!response.result.length)
           return {
               error: true,
               message: `Error inesperado: no pudimos leer el <em>movimiento bancario</em> original
                         (pk: ${provieneDe_ID.toString()}) desde la base de datos.`
           };



    let movimientoBancario = response.result[0];
    // -------------------------------------------------------------------------------------------------
    // nótese que 'transaccion' es bigInt en sql server; por esta razón, regresa como un String
    // convertimos de nuevo a un integer

    // primero nos aseguramos que el valor no es un número, pero es un string que contiene un número ...
    if (!lodash.isFinite(movimientoBancario.transaccion) && !isNaN(movimientoBancario.transaccion)) {
       // ahora convertimos el valor a numérico, y luego nos aseguramos que sea un entero ...
       let transaccion =  +movimientoBancario.transaccion;             // convierte el string a Number
       if (lodash.isInteger(transaccion)) {
           movimientoBancario.transaccion = transaccion;
       };
    };
    // -------------------------------------------------------------------------------------------------


    // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
    movimientoBancario.fecha = movimientoBancario.fecha ? moment(movimientoBancario.fecha).add(TimeOffset, 'hours').toDate() : null;
    movimientoBancario.fechaEntregado = movimientoBancario.fechaEntregado ? moment(movimientoBancario.fechaEntregado).add(TimeOffset, 'hours').toDate() : null;
    movimientoBancario.ingreso = movimientoBancario.ingreso ? moment(movimientoBancario.ingreso).add(TimeOffset, 'hours').toDate() : null;
    movimientoBancario.ultMod = movimientoBancario.ultMod ? moment(movimientoBancario.ultMod).add(TimeOffset, 'hours').toDate() : null;

    // pareciera que al leer desde sql server, sequelize agrega la propiedad ClaveUnicaChequera, que
    // corresponde a la chequera; hay una relación entre el movimiento bancario y su chequera que se llama,
    // justamente, ClaveUnicaChequera. Aunque aquí no intentamos leer la chequera del movimiento,
    // sequelize agrega esta propiedad con el valor del id de la chequera; la eliminamos ...
    delete movimientoBancario.ClaveUnicaChequera;

    return { movimientoBancario: movimientoBancario };
};


// --------------------------------------------------------------------------
// para leer la factura desde sql server
function leerFacturaDesdeSqlServer(pk) {

    let response = null;
    response = Async.runSync(function(done) {
       Facturas_sql.findAll({ where: { claveUnica: pk }, raw: true, })
           .then(function(result) { done(null, result); })
           .catch(function (err) { done(err, null); })
           .done();
    });

    if (response.error)
       throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

       // cuando el registro es eliminado, simplemente no existe. Regresamos de inmediato ...
       if (!response.result.length)
           return {
               error: true,
               message: `Error inesperado: no pudimos leer la <em>factura</em> original
                         (pk: ${provieneDe_ID.toString()}) desde la base de datos.`
           };



    let factura = response.result[0];

    // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
    factura.fechaEmision = factura.fechaEmision ? moment(factura.fechaEmision).add(TimeOffset, 'hours').toDate() : null;
    factura.fechaRecepcion = factura.fechaRecepcion ? moment(factura.fechaRecepcion).add(TimeOffset, 'hours').toDate() : null;
    factura.ingreso = factura.ingreso ? moment(factura.ingreso).add(TimeOffset, 'hours').toDate() : null;
    factura.ultAct = factura.ultAct ? moment(factura.ultAct).add(TimeOffset, 'hours').toDate() : null;

    return { factura: factura };
};




function leerChequera(pk) {
    response = Async.runSync(function(done) {
        Chequeras_sql.findAll({ where: { id: pk }, raw: true })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (!response.result.length) {
        let message = `Error: no hemos encontrado un registro en la tabla <em>Chequeras</em> (en <em>Bancos</em>)
            que corresponda al movimiento bancario.`;

        return { error: true, errMessage: message };
    };

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


    let chequera = response.result[0];
    return { chequera: chequera };
};



// -----------------------------------------------------------------------------------
// construimos y agregamos el asiento contable para el movimiento bancario
function agregarAsientoContable_MovimientoBancario(entidadOriginal, tipoAsientoDefault, companiaContab,
                                                   fechaAsiento, mesFiscal, factorCambio, numeroNegativoAsiento,
                                                   provieneDe_ID, currentUser) {

    // leemos la chequera del movimiento bancario, para obtener la cuenta bancaria del movimiento
    // nótese que las chequeras exiten en mongo ...
    let leerChequeraDesdeSqlServer = leerChequera(entidadOriginal.claveUnicaChequera);

    if (leerChequeraDesdeSqlServer.error) {
        return {
            error: true,
            message: leerChequeraDesdeSqlServer.message
        };
    };

    let chequera = leerChequeraDesdeSqlServer.chequera;


    // leemos cuenta bancaria, en mongo, para obtener cuenta contable y moneda;
    // también banco para mostrar nombre en asiento
    let banco = Bancos.findOne({ 'agencias.cuentasBancarias.cuentaInterna': chequera.numeroCuenta });

    if (!banco) {
        return {
            error: true,
            message: `Error inesperado: no hemos podido encontrar un banco para la cuenta bancaria
            '${chequera.numeroCuenta.toString()}'.<br />
            Debe existir una banco para esta cuenta bancaria en <em>Catálogos</em>. Nota: probablemente Ud. deba
            ejecutar la opción <em>Copiar catálogos</em> en el menú <em>Generales</em>.`
        };
    };

    let cuentaBancaria = {};

    _.forEach(banco.agencias, (agencia) => {
        // la cuenta bancaria está en alguna de las agencias del banco ...
        cuentaBancaria = _.find(agencia.cuentasBancarias, (x) => { return x.cuentaInterna == chequera.numeroCuenta; });
        if (cuentaBancaria)
            return false;           // logramos un 'break' en el (lodash) forEach ..
    });

    if (!cuentaBancaria || _.isEmpty(cuentaBancaria)) {
        return {
            error: true,
            message: `Error inesperado: no hemos podido leer la cuenta bancaria a la cual está asociada
            el movimiento bancario.<br />
            Debe existir una cuenta bancaria para el movimiento en <em>Catálogos</em>. Nota: probablemente Ud. deba
            ejecutar la opción <em>Copiar catálogos</em> en el menú <em>Generales</em>.`
        };
    }

    if (!cuentaBancaria.cuentaContable) {
        return {
            error: true,
            message: `Error: aparentemente, la cuenta bancaria no tiene una cuenta contable
            definida en el <em>catálogo de cuentas contables</em>.<br />
            Por favor, revise la cuenta bancaria y defina una cuenta contable para la misma.`
        };
    }

    let moneda = Monedas.findOne({ moneda: cuentaBancaria.moneda });

    // ------------------------------------------------------------------------------
    // intentamos obtener una cuenta contable para la compañía (proveedor/cliente)
    let cuentaContableCompaniaID = null;
    let leerCuentaContableDefinida = null;

    if (entidadOriginal.provClte) {
        if (entidadOriginal.monto <= 0) {
            // cuentas de proveedores (CxP) ...
            leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(
                1,
                entidadOriginal.provClte,
                0,
                cuentaBancaria.moneda,
                companiaContab.numero,
                null);
            } else {
            // cuentas de clientes (CxC) ...
            leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(
                7,
                entidadOriginal.provClte,
                0,
                cuentaBancaria.moneda,
                companiaContab.numero,
                null);
        }

        if (leerCuentaContableDefinida.error) {
            return {
                error: true,
                message: `Error: no hemos podido leer una cuenta contable para la compañía
                indicada para el movimiento bancario.
                Las cuentas contables de compañías deben estar definidas en el catálogo
                <em>Definición de cuentas contables</em> (<em>Bancos / Catálogos</em>).<br />
                Por favor, defina una cuenta contable para la compañía asociada al movimiento bancario.`
            };
        }

        cuentaContableCompaniaID = leerCuentaContableDefinida.cuentaContableID;
    }
    // ------------------------------------------------------------------------------

    let cuentaContable_movBancos_impuestos = null;
    let cuentaContable_movBancos_comision = null;

    // ---------------------------------------------------------------------------------------------------------------
    // intentamos obtener una cuenta contable para contabilizar la comisión que cobra el banco (si existe una)
    leerCuentaContableDefinida = null;

    if (entidadOriginal.comision) {

        // cuentas de proveedores (CxP) ...
        leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(
            15,
            entidadOriginal.provClte,
            0,
            cuentaBancaria.moneda,
            companiaContab.numero,
            null);

        if (leerCuentaContableDefinida.error) {
            return {
                error: true,
                message: `Error: no hemos podido leer una cuenta contable para contabilizar el monto de comisión
                indicado para el movimiento bancario.
                La cuenta contable definida para contabilizar las comisiones que cobra el banco, debe estar definida en
                <em>Definición de cuentas contables</em> (<em>Bancos / Catálogos</em>).<br />
                Por favor, defina esta cuenta contable como se indica y luego regrese e intente completar, nuevamente, este proceso.`
            };
        }

        cuentaContable_movBancos_comision = leerCuentaContableDefinida.cuentaContableID;
    }
    // ------------------------------------------------------------------------------

    // ---------------------------------------------------------------------------------------------------------------
    // intentamos obtener una cuenta contable para contabilizar la comisión que cobra el banco (si existe una)
    leerCuentaContableDefinida = null;

    if (entidadOriginal.impuestos) {

        // cuentas de proveedores (CxP) ...
        leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(
            16,
            entidadOriginal.provClte,
            0,
            cuentaBancaria.moneda,
            companiaContab.numero,
            null);

        if (leerCuentaContableDefinida.error) {
            return {
                error: true,
                message: `Error: no hemos podido leer una cuenta contable para contabilizar el monto de impuesto
                indicado para el movimiento bancario.
                La cuenta contable definida para contabilizar el impuesto que cobra el banco, debe estar definida en
                <em>Definición de cuentas contables</em> (<em>Bancos / Catálogos</em>).<br />
                Por favor, defina esta cuenta contable como se indica y luego regrese e intente completar, nuevamente, este proceso.`
            };
        }

        cuentaContable_movBancos_impuestos = leerCuentaContableDefinida.cuentaContableID;
    }
    // ------------------------------------------------------------------------------


    let mesCalendario = fechaAsiento.getMonth() + 1;
    let anoCalendario = fechaAsiento.getFullYear();

    let asientoContable = {
        // numeroAutomatico: ,
        numero: numeroNegativoAsiento.numeroNegativoAsiento,
        mes: mesCalendario,
        ano: anoCalendario,
        tipo: tipoAsientoDefault,
        fecha: fechaAsiento,
        descripcion: entidadOriginal.concepto,
        moneda: moneda.moneda,
        monedaOriginal:moneda.moneda,
        convertirFlag:  true,
        factorDeCambio: factorCambio.factorCambio,
        provieneDe: "Bancos",
        provieneDe_id: provieneDe_ID,
        ingreso: new Date(),
        ultAct:  new Date(),
        copiablaFlag: true,
        asientoTipoCierreAnualFlag: false,
        mesFiscal: mesFiscal.mesFiscal,
        anoFiscal: mesFiscal.anoFiscal,
        usuario: currentUser.emails[0].address,
        lote: null,
        cia: companiaContab.numero,
        };


    // ----------------------------------------------------------------------------------------------------------------
    // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos 4.3 horas a cada una ...
    let asientoContable_sql = _.cloneDeep(asientoContable);
    asientoContable_sql.fecha = moment(asientoContable.fecha).subtract(TimeOffset, 'h').toDate();
    asientoContable_sql.ingreso = moment(asientoContable.ingreso).subtract(TimeOffset, 'h').toDate();
    asientoContable_sql.ultAct = moment(asientoContable.ultAct).subtract(TimeOffset, 'h').toDate();

    let response = null;
    response = Async.runSync(function(done) {
        AsientosContables_sql.create(asientoContable_sql)
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    let asientoAgregado = response.result.dataValues;

    let partidasAsientoContable = [];


    // ya grabamos el asiento; ahora vamos a grabar las partidas ...
    // --------------------------------------------------------------------------------------
    // ahora agregamos la partida para la cuenta bancaria
      let numeroPartida = 10;

      // primero agregamos el gasto a la cuenta contable definida para el itf
      let partidaAsiento = {
          numeroAutomatico: asientoAgregado.numeroAutomatico,
          partida: numeroPartida,
          cuentaContableID: cuentaBancaria.cuentaContable,
          descripcion: entidadOriginal.concepto.length > 75 ?
                       entidadOriginal.concepto.substr(0, 75) :
                       entidadOriginal.concepto,
          referencia: entidadOriginal.transaccion,
          debe: entidadOriginal.montoBase >= 0 ? entidadOriginal.montoBase : 0,
          haber: entidadOriginal.montoBase < 0 ? Math.abs(entidadOriginal.montoBase) : 0,
      };

      // agregamos la partida a un array; cada item en el array será luego agregado a dAsientos en sql server
      partidasAsientoContable.push(partidaAsiento);









      // agregamos un monto de comisión, si existe
      if (entidadOriginal.comision) {

          numeroPartida += 10;

          partidaAsiento = {};

          let partidaAsiento = {
              numeroAutomatico: asientoAgregado.numeroAutomatico,
              partida: numeroPartida,
              cuentaContableID: cuentaBancaria.cuentaContable,
              descripcion: entidadOriginal.concepto.length > 75 ?
                           entidadOriginal.concepto.substr(0, 75) :
                           entidadOriginal.concepto,
              referencia: entidadOriginal.transaccion,
              debe: entidadOriginal.comision >= 0 ? entidadOriginal.comision : 0,
              haber: entidadOriginal.comision < 0 ? Math.abs(entidadOriginal.comision) : 0,
          };

          // agregamos la partida a un array; cada item en el array será luego agregado a dAsientos en sql server
          partidasAsientoContable.push(partidaAsiento);
      }


      // agregamos un monto de impuestos, si existe
      if (entidadOriginal.impuestos) {

          numeroPartida += 10;

          partidaAsiento = {};

          let partidaAsiento = {
              numeroAutomatico: asientoAgregado.numeroAutomatico,
              partida: numeroPartida,
              cuentaContableID: cuentaBancaria.cuentaContable,
              descripcion: entidadOriginal.concepto.length > 75 ?
                           entidadOriginal.concepto.substr(0, 75) :
                           entidadOriginal.concepto,
              referencia: entidadOriginal.transaccion,
              debe: entidadOriginal.impuestos >= 0 ? entidadOriginal.impuestos : 0,
              haber: entidadOriginal.impuestos < 0 ? Math.abs(entidadOriginal.impuestos) : 0,
          };

          // agregamos la partida a un array; cada item en el array será luego agregado a dAsientos en sql server
          partidasAsientoContable.push(partidaAsiento);
      }
























      // agregamos la partida que corresponde a la compañía (proveedor o cliente)
      if (entidadOriginal.provClte) {
          numeroPartida += 10;

            partidaAsiento = {};

            partidaAsiento = {
                numeroAutomatico: asientoAgregado.numeroAutomatico,
                partida: numeroPartida,
                cuentaContableID: cuentaContableCompaniaID,
                descripcion: entidadOriginal.concepto.length > 75 ?
                             entidadOriginal.concepto.substr(0, 75) :
                             entidadOriginal.concepto,
                referencia: entidadOriginal.transaccion,
                debe: entidadOriginal.montoBase < 0 ? Math.abs(entidadOriginal.montoBase) : 0,
                haber: entidadOriginal.montoBase >= 0 ? entidadOriginal.montoBase : 0,
            };

            // agregamos la partida a un array; cada item en el array será luego agregado a dAsientos en sql server
            partidasAsientoContable.push(partidaAsiento);
      }


      // agregamos la partida que corresponde al monto de comisión (si existe una)
      if (entidadOriginal.comision) {
          numeroPartida += 10;

            partidaAsiento = {};

            partidaAsiento = {
                numeroAutomatico: asientoAgregado.numeroAutomatico,
                partida: numeroPartida,
                cuentaContableID: cuentaContable_movBancos_comision,
                descripcion: entidadOriginal.concepto.length > 75 ?
                             entidadOriginal.concepto.substr(0, 75) :
                             entidadOriginal.concepto,
                referencia: entidadOriginal.transaccion,
                debe: entidadOriginal.comision < 0 ? Math.abs(entidadOriginal.comision) : 0,
                haber: entidadOriginal.comision >= 0 ? entidadOriginal.comision : 0,
            };

            // agregamos la partida a un array; cada item en el array será luego agregado a dAsientos en sql server
            partidasAsientoContable.push(partidaAsiento);
      }


      // agregamos la partida que corresponde al monto de impuestos (si existe uno)
      if (entidadOriginal.impuestos) {
          numeroPartida += 10;

            partidaAsiento = {};

            partidaAsiento = {
                numeroAutomatico: asientoAgregado.numeroAutomatico,
                partida: numeroPartida,
                cuentaContableID: cuentaContable_movBancos_impuestos,
                descripcion: entidadOriginal.concepto.length > 75 ?
                             entidadOriginal.concepto.substr(0, 75) :
                             entidadOriginal.concepto,
                referencia: entidadOriginal.transaccion,
                debe: entidadOriginal.impuestos < 0 ? Math.abs(entidadOriginal.impuestos) : 0,
                haber: entidadOriginal.impuestos >= 0 ? entidadOriginal.impuestos : 0,
            };

            // agregamos la partida a un array; cada item en el array será luego agregado a dAsientos en sql server
            partidasAsientoContable.push(partidaAsiento);
      }

      // ahora recorremos el array de partidas y agregamos cada una a dAsientos en sql server; nótese que la idea es
      // que las de mayor monto vayan primero

      numeroPartida = 0;
      lodash(partidasAsientoContable).orderBy(['debe', 'haber'], ['desc', 'desc']).forEach((partida) => {

          // renumeramos la partida ...
          numeroPartida += 10;
          partida.partida = numeroPartida;

          response = Async.runSync(function(done) {
              dAsientosContables_sql.create(partida)
                  .then(function(result) { done(null, result); })
                  .catch(function (err) { done(err, null); })
                  .done();
          })

          if (response.error) {
              throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
          }
      })

      return {
          asientoContableAgregadoID: asientoAgregado.numeroAutomatico
      };
};


function agregarAsientoContable_Factura(entidadOriginal, tipoAsientoDefault, companiaContab,
                                        fechaAsiento, mesFiscal, factorCambio, numeroNegativoAsiento,
                                        provieneDe_ID, currentUser) {

        let mesCalendario = fechaAsiento.getMonth() + 1;
        let anoCalendario = fechaAsiento.getFullYear();

        let asientoContable = {
            // numeroAutomatico: ,
            numero: numeroNegativoAsiento.numeroNegativoAsiento,
            mes: mesCalendario,
            ano: anoCalendario,
            tipo: tipoAsientoDefault,
            fecha: fechaAsiento,
            descripcion: entidadOriginal.concepto.length <= 250 ?
                         entidadOriginal.concepto :
                         entidadOriginal.concepto.toString().substring(0, 250),
            moneda: entidadOriginal.moneda,
            monedaOriginal: entidadOriginal.moneda,
            convertirFlag:  true,
            factorDeCambio: factorCambio.factorCambio,
            provieneDe: "Facturas",
            provieneDe_id: provieneDe_ID,
            ingreso: new Date(),
            ultAct:  new Date(),
            copiablaFlag: true,
            asientoTipoCierreAnualFlag: false,
            mesFiscal: mesFiscal.mesFiscal,
            anoFiscal: mesFiscal.anoFiscal,
            usuario: currentUser.emails[0].address,
            lote: null,
            cia: companiaContab.numero,
        };

        // leemos cuenta bancaria (está en mongo) pues luego lo usamos para obtener las cuentas contables
        let proveedor = Proveedores.findOne({ proveedor: entidadOriginal.proveedor });

        if (!proveedor) {
            return {
                error: true,
                message: `Error inesperado: no pudimos leer los datos de la compañía indicada en la factura.<br />
                Debe existir una compañía para esta factura en <em>Catálogos</em>. Nota: probablemente Ud. deba
                ejecutar la opción <em>Copiar catálogos</em> en el menú <em>Bancos / Generales</em>.`
            };
        };


        // creamos un array con las partidas del asiento, para grabarlas a sql al final


        // --------------------------------------------------------------------------------------
        // partida para registrar la compra o venta (gasto o ingresos por venta)
        let partida = {};
        let partidasAsientoContable = [];
        let leerCuentaContableDefinida = null;
        let montoAsiento = 0;

        let cuentaContableDefinidaID = 0;
        let conceptoDefinicionCuentaContable = 0;

        if (entidadOriginal.cxCCxPFlag == 1) {
            conceptoDefinicionCuentaContable = 2;
        } else {
            conceptoDefinicionCuentaContable = 8;
        }

        leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
                                                                                entidadOriginal.proveedor,
                                                                                proveedor.tipo,
                                                                                entidadOriginal.moneda,
                                                                                companiaContab.numero,
                                                                                null);

        if (leerCuentaContableDefinida.error) {
            if (entidadOriginal.cxCCxPFlag == 1) {
                return {
                    error: true,
                    message: `Error: no se ha encontrado una cuenta contable definida para
                              contabilizar las compras (Compras).
                              Por favor defina una cuenta contable para contabilizar las compras.`
                }
            } else {
                return {
                    error: true,
                    message: `no se ha encontrado una cuenta contable definida para
                        contabilizar las ventas (Ventas).
                        Por favor defina una cuenta contable para contabilizar las ventas.`
                }
            }
        }

        partida = {};

        partida.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;;

        partida.descripcion = entidadOriginal.concepto.length > 75 ?
                              entidadOriginal.concepto.substring(0, 75) :
                              entidadOriginal.concepto;

        partida.referencia = entidadOriginal.numeroFactura.toString();

        montoAsiento = (entidadOriginal.montoFacturaSinIva ? entidadOriginal.montoFacturaSinIva : 0) +
                       (entidadOriginal.montoFacturaConIva ? entidadOriginal.montoFacturaConIva : 0);

        partida.debe = 0;
        partida.haber = 0;

        if (entidadOriginal.cxCCxPFlag == 1) {
            // CxP
            if (montoAsiento >= 0)
                partida.debe = montoAsiento;
            else
                // nótese que las NC trane su monto negativo ...
                partida.haber = montoAsiento * -1;
        } else {
            // CxC
            if (montoAsiento >= 0)
                partida.haber = montoAsiento;
            else
                // nótese que las NC trane su monto negativo ...
                partida.debe = montoAsiento * -1;
        }

        partidasAsientoContable.push(partida);

        // -----------------------------------------------------------------------------------------------------
        // partida para registrar el monto del iva; aunque este monto se registra en la tabla Facturas_Impuestos,
        // también existe en la factura
        if (entidadOriginal.iva) {
            cuentaContableDefinidaID = 0;
            conceptoDefinicionCuentaContable = 0;

            if (entidadOriginal.cxCCxPFlag == 1)
                conceptoDefinicionCuentaContable = 4;
            else
                conceptoDefinicionCuentaContable = 9;

            leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
                                                                                    entidadOriginal.proveedor,
                                                                                    proveedor.tipo,
                                                                                    entidadOriginal.moneda,
                                                                                    companiaContab.numero,
                                                                                    null);

            if (leerCuentaContableDefinida.error) {
                if (entidadOriginal.cxCCxPFlag == 1) {
                    return {
                        error: true,
                        message: `Error: no se ha encontrado una cuenta contable definida para contabilizar el Iva (Iva).
                                  Por favor defina una cuenta contable para contabilizar el Iva.`
                    }
                } else {
                    return {
                        error: true,
                        message: `Error: no se ha encontrado una cuenta contable definida para contabilizar el Iva (Iva por pagar).
                            Por favor defina una cuenta contable para contabilizar el Iva.`
                    }
                }
            }

            partida = {};

            partida.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;;

            partida.descripcion = entidadOriginal.concepto.length > 75 ?
                                  entidadOriginal.concepto.substring(0, 75) :
                                  entidadOriginal.concepto;

            partida.referencia = entidadOriginal.numeroFactura.toString();

            montoAsiento = entidadOriginal.iva;

            partida.debe = 0;
            partida.haber = 0;

            if (entidadOriginal.cxCCxPFlag == 1) {
                // CxP
                if (montoAsiento >= 0)
                    partida.debe = montoAsiento;
                else
                    // nótese que las NC trane su monto negativo ...
                    partida.haber = montoAsiento * -1;
            } else {
                // CxC
                if (montoAsiento >= 0)
                    partida.haber = montoAsiento;
                else
                    // nótese que las NC trane su monto negativo ...
                    partida.debe = montoAsiento * -1;
            }

            partidasAsientoContable.push(partida);
        }

        // -----------------------------------------------------------------------------------------------------
        // partida para registrar la cuenta por cobrar o pagar ...
        cuentaContableDefinidaID = 0;
        conceptoDefinicionCuentaContable = 0;

        if (entidadOriginal.cxCCxPFlag == 1)
            conceptoDefinicionCuentaContable = 1;
        else
            conceptoDefinicionCuentaContable = 7;

        leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
                                                                                entidadOriginal.proveedor,
                                                                                proveedor.tipo,
                                                                                entidadOriginal.moneda,
                                                                                companiaContab.numero,
                                                                                null);

        if (leerCuentaContableDefinida.error) {
            if (entidadOriginal.cxCCxPFlag == 1) {
                return {
                    error: true,
                    message: `Error: no se ha encontrado una cuenta contable definida para la compañía (Compañía (CxP)).
                              Por favor defina una cuenta contable para la compañia.`
                }
            } else {
                return {
                    error: true,
                    message: `Error: no se ha encontrado una cuenta contable definida para la compañía (Compañía (CxC)).
                        Por favor defina una cuenta contable para la compañia.`
                }
            }
        }

        partida = {};

        partida.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;;

        partida.descripcion = entidadOriginal.concepto.length > 75 ?
                              entidadOriginal.concepto.substring(0, 75) :
                              entidadOriginal.concepto;

        partida.referencia = entidadOriginal.numeroFactura.toString();

        // calculamos el total a pagar a la compañía
        montoAsiento =
            (
            (entidadOriginal.montoFacturaSinIva ? entidadOriginal.montoFacturaSinIva : 0) +
            (entidadOriginal.montoFacturaConIva ? entidadOriginal.montoFacturaConIva : 0) +
            (entidadOriginal.iva ? entidadOriginal.iva : 0) +
            (entidadOriginal.otrosImpuestos ? entidadOriginal.otrosImpuestos : 0) -
            (entidadOriginal.impuestoRetenido ? entidadOriginal.impuestoRetenido : 0) -
            (entidadOriginal.retencionSobreIva ? entidadOriginal.retencionSobreIva : 0) -
            (entidadOriginal.otrasRetenciones ? entidadOriginal.otrasRetenciones : 0) -
            (entidadOriginal.anticipo ? entidadOriginal.anticipo : 0)
            );

        partida.debe = 0;
        partida.haber = 0;

        if (entidadOriginal.cxCCxPFlag == 1) {
            // CxP
            if (montoAsiento >= 0)
                partida.haber = montoAsiento;
            else
                // nótese que las NC trane su monto negativo ...
                partida.debe = montoAsiento * -1;
        } else {
            // CxC
            if (montoAsiento >= 0)
                partida.debe = montoAsiento;
            else
                // nótese que las NC trane su monto negativo ...
                partida.haber = montoAsiento * -1;
        }

        partidasAsientoContable.push(partida);


        // -----------------------------------------------------------------------------------------------------
        // partida para registrar el monto cobrado o pagado por anticipado
        if (entidadOriginal.anticipo) {
            cuentaContableDefinidaID = 0;
            conceptoDefinicionCuentaContable = 0;

            if (entidadOriginal.cxCCxPFlag == 1)
                conceptoDefinicionCuentaContable = 12;
            else
                conceptoDefinicionCuentaContable = 12;

            leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
                                                                                    entidadOriginal.proveedor,
                                                                                    proveedor.tipo,
                                                                                    entidadOriginal.moneda,
                                                                                    companiaContab.numero,
                                                                                    null);

            if (leerCuentaContableDefinida.error) {
                if (entidadOriginal.cxCCxPFlag == 1) {
                    return {
                        error: true,
                        message: `Error: no se ha encontrado una cuenta contable definida para
                                  contabilizar el monto de anticipo (Anticipo en pago de facturas).
                                  Por favor defina una cuenta contable para contabilizar el anticipo.`
                    }
                } else {
                    return {
                        error: true,
                        message: `Error: no se ha encontrado una cuenta contable definida para
                                  contabilizar el monto de anticipo (Anticipo en pago de facturas).
                                  Por favor defina una cuenta contable para contabilizar el anticipo.`
                    }
                }
            }

            partida = {};

            partida.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;;

            partida.descripcion = entidadOriginal.concepto.length > 75 ?
                                  entidadOriginal.concepto.substring(0, 75) :
                                  entidadOriginal.concepto;

            partida.referencia = entidadOriginal.numeroFactura.toString();

            montoAsiento = entidadOriginal.anticipo;

            partida.debe = 0;
            partida.haber = 0;

            if (entidadOriginal.cxCCxPFlag == 1) {
                // CxP
                if (montoAsiento >= 0)
                    partida.haber = montoAsiento;
                else
                    // nótese que las NC trane su monto negativo ...
                    partida.debe = montoAsiento * -1;
            } else {
                // CxC
                if (montoAsiento >= 0)
                    partida.debe = montoAsiento;
                else
                    // nótese que las NC trane su monto negativo ...
                    partida.haber = montoAsiento * -1;
            }

            partidasAsientoContable.push(partida);
        }


        // -----------------------------------------------------------------------------------------------------
        // partida para registrar el ISLR retenido
        if (entidadOriginal.impuestoRetenido) {
            cuentaContableDefinidaID = 0;
            conceptoDefinicionCuentaContable = 0;

            if (entidadOriginal.cxCCxPFlag == 1)
                conceptoDefinicionCuentaContable = 3;
            else
                conceptoDefinicionCuentaContable = 3;

            leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
                                                                                    entidadOriginal.proveedor,
                                                                                    proveedor.tipo,
                                                                                    entidadOriginal.moneda,
                                                                                    companiaContab.numero,
                                                                                    null);

            if (leerCuentaContableDefinida.error) {
                if (entidadOriginal.cxCCxPFlag == 1) {
                    return {
                        error: true,
                        message: `Error: no se ha encontrado una cuenta contable definida para
                                  contabilizar la retención sobre el ISLR (Impuestos retenidos).
                                  Por favor defina una cuenta contable para contabilizar la retención sobre el ISLR.`
                    }
                } else {
                    return {
                        error: true,
                        message: `Error: no se ha encontrado una cuenta contable definida para
                                  contabilizar la retención sobre el ISLR (Impuestos retenidos).
                                  Por favor defina una cuenta contable para contabilizar la retención sobre el ISLR.`
                    }
                }
            }

            partida = {};

            partida.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;;

            partida.descripcion = entidadOriginal.concepto.length > 75 ?
                                  entidadOriginal.concepto.substring(0, 75) :
                                  entidadOriginal.concepto;

            partida.referencia = entidadOriginal.numeroFactura.toString();

            montoAsiento = entidadOriginal.impuestoRetenido;

            partida.debe = 0;
            partida.haber = 0;

            if (entidadOriginal.cxCCxPFlag == 1) {
                // CxP
                if (montoAsiento >= 0)
                    partida.haber = montoAsiento;
                else
                    // nótese que las NC trane su monto negativo ...
                    partida.debe = montoAsiento * -1;
            } else {
                // CxC
                if (montoAsiento >= 0)
                    partida.debe = montoAsiento;
                else
                    // nótese que las NC trane su monto negativo ...
                    partida.haber = montoAsiento * -1;
            }

            partidasAsientoContable.push(partida);
        }

        // -----------------------------------------------------------------------------------------------------
        // partida para registrar el IVA retenido
        if (entidadOriginal.retencionSobreIva) {
            cuentaContableDefinidaID = 0;
            conceptoDefinicionCuentaContable = 0;

            if (entidadOriginal.cxCCxPFlag == 1)
                conceptoDefinicionCuentaContable = 5;
            else
                conceptoDefinicionCuentaContable = 5;

            leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
                                                                                    entidadOriginal.proveedor,
                                                                                    proveedor.tipo,
                                                                                    entidadOriginal.moneda,
                                                                                    companiaContab.numero,
                                                                                    null);

            if (leerCuentaContableDefinida.error) {
                if (entidadOriginal.cxCCxPFlag == 1) {
                    return {
                        error: true,
                        message: `Error: no se ha encontrado una cuenta contable definida para
                                  contabilizar la retención sobre el IVA (Retención sobre iva).
                                  Por favor defina una cuenta contable para contabilizar la retención sobre el IVA.`
                    }
                } else {
                    return {
                        error: true,
                        message: `Error: no se ha encontrado una cuenta contable definida para
                                  contabilizar la retención sobre el IVA (Retención sobre iva).
                                  Por favor defina una cuenta contable para contabilizar la retención sobre el IVA.`
                    }
                }
            }

            partida = {};

            partida.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;;

            partida.descripcion = entidadOriginal.concepto.length > 75 ?
                                  entidadOriginal.concepto.substring(0, 75) :
                                  entidadOriginal.concepto;

            partida.referencia = entidadOriginal.numeroFactura.toString();

            montoAsiento = entidadOriginal.retencionSobreIva;

            partida.debe = 0;
            partida.haber = 0;

            if (entidadOriginal.cxCCxPFlag == 1) {
                // CxP
                if (montoAsiento >= 0)
                    partida.haber = montoAsiento;
                else
                    // nótese que las NC trane su monto negativo ...
                    partida.debe = montoAsiento * -1;
            } else {
                // CxC
                if (montoAsiento >= 0)
                    partida.debe = montoAsiento;
                else
                    // nótese que las NC trane su monto negativo ...
                    partida.haber = montoAsiento * -1;
            }

            partidasAsientoContable.push(partida);
        }

        // ----------------------------------------------------------------------------------------------------------------
        // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos 4.3 horas a cada una ...
        let asientoContable_sql = _.cloneDeep(asientoContable);
        asientoContable_sql.fecha = moment(asientoContable.fecha).subtract(TimeOffset, 'h').toDate();
        asientoContable_sql.ingreso = moment(asientoContable.ingreso).subtract(TimeOffset, 'h').toDate();
        asientoContable_sql.ultAct = moment(asientoContable.ultAct).subtract(TimeOffset, 'h').toDate();

        let response = Async.runSync(function(done) {
        AsientosContables_sql.create(asientoContable_sql)
           .then(function(result) { done(null, result); })
           .catch(function (err) { done(err, null); })
           .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        let asientoAgregado = response.result.dataValues;

        // ahora recorremos el array de partidas del asiento y agregamos a sql cada una de ellas
        let numeroPartida = 0;
        partidasAsientoContable.forEach((partidaAsiento) => {
            numeroPartida += 10;

            partidaAsiento.numeroAutomatico = asientoAgregado.numeroAutomatico,
            partidaAsiento.partida = numeroPartida,

            response = Async.runSync(function(done) {
                dAsientosContables_sql.create(partidaAsiento)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        });

        return {
            asientoContableAgregadoID: asientoAgregado.numeroAutomatico
        };
}

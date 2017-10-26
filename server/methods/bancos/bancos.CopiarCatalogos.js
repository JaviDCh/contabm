
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import numeral from 'numeral';
import SimpleSchema from 'simpl-schema';
import { Monedas } from '/imports/collections/monedas';
import { Monedas_sql } from '/server/imports/sqlModels/monedas';
import { Companias } from '/imports/collections/companias';

Meteor.methods(
{
    'bancos.CopiarCatalogos': function () {

        let response = null;

        // ---------------------------------------------------------------------------------------------------
        // Compañías (empresas usuarias) - copiamos a mongo desde contab
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            Compania_sql.findAndCountAll( { raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.count;
        let reportarCada = Math.floor(numberOfItems / 20);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcess = 9;
        let currentProcess = 1;
        EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                            { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id del doc que existe ...

            let itemExisteID = Companias.findOne({ numero: item.numero }, { fields: { _id: true }});

            let compania = {
                _id: itemExisteID ? itemExisteID._id : new Mongo.ObjectID()._str,
                numero: item.numero,
                nombre: item.nombre,
                nombreCorto: item.nombreCorto,
                abreviatura: item.abreviatura,
                rif: item.rif,
                direccion: item.direccion,
                entidadFederal: item.entidadFederal,
                zonaPostal: item.zonaPostal,
                telefono1: item.telefono1,
                telefono2: item.telefono2,
                fax: item.fax,

                emailServerName: item.emailServerName,
                emailServerPort: item.emailServerPort, 
                emailServerSSLFlag: item.emailServerSSLFlag,
                emailServerCredentialsUserName: item.emailServerCredentialsUserName,
                emailServerCredentialsPassword: item.emailServerCredentialsPassword,

                monedaDefecto: item.monedaDefecto,
                suspendidoFlag: item.suspendidoFlag, 
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si el doc fue encontrado arriba
            if (itemExisteID && itemExisteID._id)
                Companias.update({ _id: itemExisteID._id }, { $set: compania });
            else
                Companias.insert(compania);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                    { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                        { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });



        // ---------------------------------------------------------------------------------------------------
        // Monedas - copiamos a mongo desde contab
        // ---------------------------------------------------------------------------------------------------
        // debugger;
        response = Async.runSync(function(done) {
            Monedas_sql.findAndCountAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 20);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;
        EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                            { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id del doc que existe ...

            let itemExisteID = Monedas.findOne({ moneda: item.moneda }, { fields: { _id: true }});

            let moneda = {
                _id: itemExisteID ? itemExisteID._id : new Mongo.ObjectID()._str,
                moneda: item.moneda,
                descripcion: item.descripcion,
                simbolo: item.simbolo,
                nacionalFlag: item.nacionalFlag,
                defaultFlag: item.defaultFlag,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si el doc fue encontrado arriba
            if (itemExisteID && itemExisteID._id) {
                Monedas.update({ _id: itemExisteID._id }, { $set: moneda });
            }
            else {
                Monedas.insert(moneda);
            }

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                    { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                        { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        // ---------------------------------------------------------------------------------------------------
        // Parámetros Bancos - copiamos a mongo desde contab
        // ---------------------------------------------------------------------------------------------------
        let query = `Select RetencionSobreIvaFlag, RetencionSobreIvaPorc, FooterFacturaImpresa_L1,
        FooterFacturaImpresa_L2, FooterFacturaImpresa_L3, Cia
        From ParametrosBancos`;

        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT})
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = response.result.length;
        reportarCada = Math.floor(numberOfItems / 20);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;
        EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                            { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id del doc que existe ...

            let itemExisteID = ParametrosBancos.findOne({ cia: item.Cia }, { fields: { _id: true }});

            let document = {
                _id: itemExisteID ? itemExisteID._id : new Mongo.ObjectID()._str,

                retencionSobreIvaFlag: item.RetencionSobreIvaFlag,
                retencionSobreIvaPorc: item.RetencionSobreIvaPorc,
                footerFacturaImpresa_L1: item.FooterFacturaImpresa_L1,
                footerFacturaImpresa_L2: item.FooterFacturaImpresa_L2,
                footerFacturaImpresa_L3: item.FooterFacturaImpresa_L3,

                cia: item.Cia,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si el doc fue encontrado arriba
            if (itemExisteID && itemExisteID._id)
                ParametrosBancos.update({ _id: itemExisteID._id }, { $set: document });
            else
                ParametrosBancos.insert(document);


            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                    { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                        { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });



        // ---------------------------------------------------------------------------------------------------
        // Parámetros Global Bancos - copiamos a mongo desde contab
        // ---------------------------------------------------------------------------------------------------
        query = `Select ClaveUnica, AgregarAsientosContables, TipoAsientoDefault, IvaPorc
        From ParametrosGlobalBancos`;

        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT})
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = response.result.length;
        reportarCada = Math.floor(numberOfItems / 20);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;
        EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                            { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id del doc que existe ...

            let itemExisteID = ParametrosGlobalBancos.findOne({ claveUnica: item.ClaveUnica }, { fields: { _id: true }});

            let document = {
                _id: itemExisteID ? itemExisteID._id : new Mongo.ObjectID()._str,

                claveUnica: item.ClaveUnica,
                agregarAsientosContables: item.AgregarAsientosContables,
                tipoAsientoDefault: item.TipoAsientoDefault,
                ivaPorc: item.IvaPorc,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si el doc fue encontrado arriba
            if (itemExisteID && itemExisteID._id)
                ParametrosGlobalBancos.update({ _id: itemExisteID._id }, { $set: document });
            else
                ParametrosGlobalBancos.insert(document);


            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                    { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                        { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });


        // ---------------------------------------------------------------------------------------------------
        // Bancos - copiamos a mongo desde sql
        // ---------------------------------------------------------------------------------------------------
        query = `Select * From Bancos`;

        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT})
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = response.result.length;
        reportarCada = Math.floor(numberOfItems / 20);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;
        EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                            { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id del doc que existe ...

            let itemExisteID = Bancos.findOne({ banco: item.Banco }, { fields: { _id: true }});

            let document = {
                _id: itemExisteID ? itemExisteID._id : new Mongo.ObjectID()._str,

                banco: item.Banco,
                nombre: item.Nombre,
                nombreCorto: item.NombreCorto,
                abreviatura: item.Abreviatura,
                codigo: item.Codigo,
                agencias: []
            };

            // leemos las agencias, cuentas bancarias y agencias, y las agregamos a mongo ...
            query = `Select * From Agencias Where Banco = ?`;

            let response_Agencias = Async.runSync(function(done) {
                sequelize.query(query, { replacements: [ item.Banco ], type: sequelize.QueryTypes.SELECT})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response_Agencias.error)
                throw new Meteor.Error(response_Agencias.error && response_Agencias.error.message ? response_Agencias.error.message : response_Agencias.error.toString());

            response_Agencias.result.forEach((agencia) => {

                let agenciaMongo = {
                    _id: new Mongo.ObjectID()._str,
                    agencia: agencia.Agencia,
                    nombre: agencia.Nombre,
                    direccion: agencia.Direccion,
                    telefono1: agencia.Telefono1,
                    telefono2: agencia.Telefono2,
                    fax: agencia.Fax,
                    contacto1: agencia.Contacto1,
                    contacto2: agencia.Contacto2,
                    cuentasBancarias: [],
                };

                query = `Select * From CuentasBancarias Where Agencia = ?`;

                let response_CuentasBancarias = Async.runSync(function(done) {
                    sequelize.query(query, { replacements: [ agencia.Agencia ], type: sequelize.QueryTypes.SELECT})
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response_CuentasBancarias.error)
                    throw new Meteor.Error(response_CuentasBancarias.error && response_CuentasBancarias.error.message ? response_CuentasBancarias.error.message : response_CuentasBancarias.error.toString());

                response_CuentasBancarias.result.forEach((cuentaBancaria) => {

                    let cuentaBancariaMongo = {
                        _id: new Mongo.ObjectID()._str,
                        cuentaInterna: cuentaBancaria.CuentaInterna,
                        cuentaBancaria: cuentaBancaria.CuentaBancaria,
                        tipo: cuentaBancaria.Tipo,
                        moneda: cuentaBancaria.Moneda,
                        lineaCredito: cuentaBancaria.LineaCredito,
                        estado: cuentaBancaria.Estado,
                        cuentaContable: cuentaBancaria.CuentaContable,
                        cuentaContableGastosIDB: cuentaBancaria.CuentaContableGastosIDB,
                        numeroContrato: cuentaBancaria.NumeroContrato,
                        cia: cuentaBancaria.Cia,
                        chequeras: [],
                    };

                    agenciaMongo.cuentasBancarias.push(cuentaBancariaMongo);
                });

                document.agencias.push(agenciaMongo);
            });

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si el doc fue encontrado arriba
            if (itemExisteID && itemExisteID._id) {
                // eliminamos las agencias y las registramos nuevamente, con sus cuentas y chequeras ...
                Bancos.update({ _id: itemExisteID._id }, { $unset: { agencias: true } });
                Bancos.update({ _id: itemExisteID._id }, { $set: document });
            }
            else
                Bancos.insert(document);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                    { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                        { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        // ---------------------------------------------------------------------------------------------------
        // Chequeras - copiamos a mongo desde sql (en una table separada)
        // ---------------------------------------------------------------------------------------------------
        query = `Select * From Chequeras`;

        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT})
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = response.result.length;
        reportarCada = Math.floor(numberOfItems / 30);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;
        EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                            { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        // esta función regresa una lista 'plana' con los bancos y sus cuentas
        // (la información en bancos es una lista de bancos con arreglos de agencias y luego cuentas)
        let cuentasBancariasList = FuncionesGlobalesBancos.flattenBancos(null);

        response.result.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id del doc que existe ...

            let itemExisteID = Chequeras.findOne({ numeroChequera: item.NumeroChequera }, { fields: { _id: true }});
            let cuentaBancaria = _.find(cuentasBancariasList, (x) => { return x.cuentaInterna === item.NumeroCuenta; });

            let document = {
                _id: itemExisteID ? itemExisteID._id : new Mongo.ObjectID()._str,

                numeroChequera: item.NumeroChequera,
                numeroCuenta: item.NumeroCuenta,
                activa: item.Activa,
                generica: item.Generica,
                fechaAsignacion: item.FechaAsignacion,
                desde: item.Desde,
                hasta: item.Hasta,
                asignadaA: item.AsignadaA,
                agotadaFlag: item.AgotadaFlag,
                cantidadDeChequesUsados: item.CantidadDeChequesUsados,
                // UltimoChequeUsado es bigint en sql server y viene como string ...
                ultimoChequeUsado: item.UltimoChequeUsado ? parseInt(item.UltimoChequeUsado) : null,
                cantidadDeCheques: item.CantidadDeCheques,
                usuario: item.Usuario,
                ingreso: item.Ingreso,
                ultAct: item.UltAct,

                // estos fields no existen en sql; los agregamos aquí para que el manejo de este
                // collection sea más fácil
                numeroCuentaBancaria: cuentaBancaria ? cuentaBancaria.cuentaBancaria : null,
                banco: cuentaBancaria ? cuentaBancaria.banco : null,
                abreviaturaBanco: cuentaBancaria ? cuentaBancaria.nombreBanco : null,
                moneda: cuentaBancaria ? cuentaBancaria.moneda : null,
                simboloMoneda: cuentaBancaria ? cuentaBancaria.simboloMoneda : null,

                cia: cuentaBancaria ? cuentaBancaria.cia : null,
            };

            // aparentemente, collection2 no envía correctamente el mensaje de error al cliente (desde el servidor);
            // por ese motivo, y aunque ésto agrega un overhead enorme, validamos *antes* de actualizar mongo ...
            let isValid = false;
            let errores = [];

            isValid = Chequeras.simpleSchema().namedContext().validate(document);

            if (!isValid) {
                Chequeras.simpleSchema().namedContext().invalidKeys().forEach(function (error) {
                    errores.push(`El valor '${error.value}' no es adecuado para el campo
                                 '${Chequeras.simpleSchema().label(error.name)}';
                                 error de tipo '${error.type}' (chequera #: ${document.numeroChequera.toString()}).`);

                });
            };

            if (errores && errores.length) {
                let errorMessages = "Se han encontrado errores al intentar guardar las modificaciones efectuadas en " +
                                    "la base de datos:<br /><br />" +
                                        errores.reduce(function (previous, current) {
                                            if (previous == "")
                                                // first value
                                                return current;
                                            else
                                                return previous + "<br />" + current;
                                        }, "");
                throw new Meteor.Error(errores);
            }


            if (itemExisteID && itemExisteID._id) {
                Chequeras.update({ _id: itemExisteID._id }, { $set: document });
            }
            else {
                Chequeras.insert(document);
            }

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                    { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                        { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
        });


        // ---------------------------------------------------------------------------------------------------
        // Proveedores - copiamos a mongo desde contab
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            Proveedores_sql.findAndCountAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 30);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;
        EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                            { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id del doc que existe ...
            let itemExisteID = Proveedores.findOne({ proveedor: item.proveedor }, { fields: { _id: true }});

            let document = {
                _id: itemExisteID ? itemExisteID._id : new Mongo.ObjectID()._str,
                proveedor: item.proveedor,
                nombre: item.nombre ? item.nombre : 'Indefinido',
                abreviatura: item.abreviatura ? item.abreviatura : 'Indefinido',
                rif: item.rif ? item.rif : 'Indefinido',
                beneficiario: item.beneficiario,
                concepto: item.concepto,
                montoCheque: item.montoCheque,

                monedaDefault: item.monedaDefault,
                formaDePagoDefault: item.formaDePagoDefault,
                tipo: item.tipo,
                proveedorClienteFlag: item.proveedorClienteFlag,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si el doc fue encontrado arriba
            if (itemExisteID && itemExisteID._id)
                Proveedores.update({ _id: itemExisteID._id }, { $set: document });
            else
                Proveedores.insert(document);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                    { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                        { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });


        // ---------------------------------------------------------------------------------------------------
        // tipos de proveedor - copiamos a mongo desde contab
        // ---------------------------------------------------------------------------------------------------
        // debugger;
        response = Async.runSync(function(done) {
            TiposProveedor_sql.findAndCountAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 30);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;
        EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                            { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id del doc que existe ...

            let itemExisteID = TiposProveedor.findOne({ tipo: item.tipo }, { fields: { _id: true }});

            let document = {
                _id: itemExisteID ? itemExisteID._id : new Mongo.ObjectID()._str,
                tipo: item.tipo,
                descripcion: item.descripcion,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si el doc fue encontrado arriba
            if (itemExisteID && itemExisteID._id)
                TiposProveedor.update({ _id: itemExisteID._id }, { $set: document });
            else
                TiposProveedor.insert(document);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                    { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                        { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });


        // ---------------------------------------------------------------------------------------------------
        // formas de pago - copiamos a mongo desde contab
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            FormasDePago_sql.findAndCountAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 30);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;
        EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                            { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id del doc que existe ...

            let itemExisteID = FormasDePago.findOne({ formaDePago: item.formaDePago }, { fields: { _id: true }});

            let document = {
                _id: itemExisteID ? itemExisteID._id : new Mongo.ObjectID()._str,
                formaDePago: item.formaDePago,
                descripcion: item.descripcion,
                numeroDeCuotas: item.numeroDeCuotas,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si el doc fue encontrado arriba
            if (itemExisteID && itemExisteID._id)
                FormasDePago.update({ _id: itemExisteID._id }, { $set: document });
            else
                FormasDePago.insert(document);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                    { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_copiarCatalogos_reportProgress',
                                        { myuserId: this.userId, app: 'bancos', process: 'copiarCatalogos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });


        return "Ok, los catálogos han sido cargados desde <em>Contab</em> en forma satisfactoria.";
    }
});

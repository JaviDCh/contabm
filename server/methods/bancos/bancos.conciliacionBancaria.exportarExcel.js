
import moment from 'moment';
import lodash from 'lodash';
import numeral from 'numeral';
import JSZip from 'jszip';
import XlsxInjector from 'xlsx-injector';
import fs from 'fs';
import path from 'path';

// para grabar el contenido (doc word/excel creado en base al template) a un file (collectionFS) y regresar el url
// para poder hacer un download (usando el url) desde el client ...
import { grabarDatosACollectionFS_regresarUrl } from '/server/imports/general/grabarDatosACollectionFS_regresarUrl';

Meteor.methods(
{
    'bancos.conciliacionBancaria.exportarExcel': function (movimientosPropiosNoEncontrados,
                                                           movimientosBancoNoEncontrados,
                                                           banco, moneda, cuentaBancaria,
                                                           ciaSeleccionada)
    {
        // debugger;
        // let Future = Npm.require('fibers/future');
        // let XlsxInjector = Meteor.npmRequire('xlsx-injector');
        // let fs = Npm.require('fs');
        // let path = Npm.require('path');

        new SimpleSchema({
            movimientosPropiosNoEncontrados: { type: String, optional: false },
            movimientosBancoNoEncontrados: { type: String, optional: false },
            ciaSeleccionada: { type: Object, blackbox: true, optional: false }
        }).validate({ movimientosPropiosNoEncontrados, movimientosBancoNoEncontrados, ciaSeleccionada, });

        movimientosPropiosNoEncontrados = JSON.parse(movimientosPropiosNoEncontrados);
        movimientosBancoNoEncontrados = JSON.parse(movimientosBancoNoEncontrados);

        // agregamos una linea de total a cada array
        let movimientosPropiosNoEncontrados2 = [];

        let lineaTotales = {
            fecha: '',
            consecutivo: '',
            numero: banco,
            tipo: moneda,
            beneficiario: cuentaBancaria,
            concepto: `${numeral(movimientosPropiosNoEncontrados.length).format('0,0')} movtos bancarios`,
            monto: lodash.sumBy(movimientosPropiosNoEncontrados, 'monto'),
            tipoReg: 1,
        };

        movimientosPropiosNoEncontrados2.push(lineaTotales);

        // en ambos arrays, las fechas vienen serializadas como strings
        movimientosPropiosNoEncontrados.forEach((x) =>
        {
            x.fecha = moment(x.fecha).format("DD-MMM-YYYY");
            x.tipoReg = 0;
            movimientosPropiosNoEncontrados2.push(x); ;
        });




        // agregamos una linea de total a cada array
        let movimientosBancoNoEncontrados2 = [];

        lineaTotales = {
            fecha: '',
            consecutivo: '',
            numero: banco,
            tipo: moneda,
            beneficiario: cuentaBancaria,
            concepto: `${numeral(movimientosBancoNoEncontrados.length).format('0,0')} movtos bancarios`,
            monto: lodash.sumBy(movimientosBancoNoEncontrados, 'monto'),
            tipoReg: 1,
        };

        movimientosBancoNoEncontrados2.push(lineaTotales);

        // en ambos arrays, las fechas vienen serializadas como strings
        let movimientoBanco = {};
        movimientosBancoNoEncontrados.forEach((x) =>
        {
            movimientoBanco = {};

            movimientoBanco.fecha = moment(x.fecha).format("DD-MMM-YYYY");
            movimientoBanco.tipoReg = 0;

            movimientoBanco.consecutivo = x.consecutivo;
            movimientoBanco.numero = x.numero ? x.numero : "";
            movimientoBanco.tipo = x.tipo ? x.tipo : "";
            movimientoBanco.beneficiario = x.beneficiario ? x.beneficiario : "";
            movimientoBanco.concepto = x.concepto ? x.concepto : "";
            movimientoBanco.monto = x.monto;

            movimientosBancoNoEncontrados2.push(movimientoBanco); ;
        });

        // finalmente, producimos un resumen de movimientos no encontrados, de acueerdo a su tipo
        let groupByTipoArray = lodash.groupBy(movimientosPropiosNoEncontrados, 'tipo');
        let resumenPorTipoArray = [];
        let resumenPorTipo = {};

        // primiero agregamos la linea 'resumen'
        for (let key in groupByTipoArray) {
            resumenPorTipo = {
                tipo: key,
                cantidad: groupByTipoArray[key].length,
                monto: lodash.sumBy(groupByTipoArray[key], 'monto'),
                tipoReg: 0,
            };
            resumenPorTipoArray.push(resumenPorTipo);
        };

        // agregamos una linea de totales ...
        resumenPorTipo = {
            tipo: "",
            cantidad: movimientosPropiosNoEncontrados.length,
            monto: lodash.sumBy(movimientosPropiosNoEncontrados, 'monto'),
            tipoReg: 1,
        };
        resumenPorTipoArray.push(resumenPorTipo);

        // ----------------------------------------------------------------------------------------------------
        // obtenemos el directorio en el server donde están las plantillas (guardadas por el usuario mediante collectionFS)
        // nótese que usamos un 'setting' en setting.json (que apunta al path donde están las plantillas)
        // nótese que la plantilla (doc excel) no es agregada por el usuario; debe existir siempre con el
        // mismo nombre ...
        let templates_DirPath = Meteor.settings.public.collectionFS_path_templates;
        let temp_DirPath = Meteor.settings.public.collectionFS_path_tempFiles;

        let templatePath = path.join(templates_DirPath, 'bancos', 'bancosConciliacionBancaria.xlsx');
        // ----------------------------------------------------------------------------------------------------
        // nombre del archivo que contendrá los resultados ...
        let userID2 = Meteor.user().emails[0].address.replace(/\./g, "_");
        userID2 = userID2.replace(/\@/g, "_");
        let outputFileName = 'bancosConciliacionBancaria.xlsx'.replace('.xlsx', `_${userID2}.xlsx`);
        let outputPath  = path.join(temp_DirPath, 'bancos', outputFileName);

        // Object containing attributes that match the placeholder tokens in the template
        let values = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            items: movimientosPropiosNoEncontrados2,
        };

        let values2 = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            items: movimientosBancoNoEncontrados2,
        };

        let values3 = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            items: lodash.orderBy(resumenPorTipoArray, ['tipoReg', 'tipo'], ['desc', 'asc']),
        };

        // Open a workbook
        let workbook = new XlsxInjector(templatePath);

        let sheetNumber = 1;
        workbook.substitute(sheetNumber, values);

        sheetNumber = 2;
        workbook.substitute(sheetNumber, values2);

        sheetNumber = 3;
        workbook.substitute(sheetNumber, values3);

        // Save the workbook
        workbook.writeFile(outputPath);

        // leemos el archivo que resulta de la instrucción anterior; la idea es pasar este 'nodebuffer' a la función que sigue para:
        // 1) grabar el archivo a collectionFS; 2) regresar su url (para hacer un download desde el client) ...
        let buf = fs.readFileSync(outputPath);      // no pasamos 'utf8' como 2do. parámetro; readFile regresa un buffer

        // el meteor method *siempre* resuelve el promise *antes* de regresar al client; el client recibe el resultado del
        // promise y no el promise object; en este caso, el url del archivo que se ha recién grabado (a collectionFS) ...

        // nótese que en el tipo de plantilla ponemos 'no aplica'; la razón es que esta plantilla no es 'cargada' por el usuario y de las
        // cuales hay diferentes tipos (islr, iva, facturas, cheques, ...). Este tipo de plantilla es para obtener algún tipo de reporte
        // en excel y no tiene un tipo definido ...
        return grabarDatosACollectionFS_regresarUrl(buf, outputFileName, 'no aplica', 'bancos', ciaSeleccionada, Meteor.user(), 'xlsx');

        // let future = new Future();
        //
        // // Load an XLSX file into memory
        // fs.readFile(outputPath, Meteor.bindEnvironment(function(err, content) {
        //
        //     if(err)
        //         throw new Meteor.Error('error-leer-plantilla-excel',
        //             `Error: se ha producido un error al intentar leer el <em>archivo resultado</em> de este
        //              proceso en el servidor.
        //              El nombre del archivo que se ha intentado leer es: ${outputPath}.
        //              El mensaje de error recibido es: ${err.toString()}.
        //             `);
        //
        //     // el método regresa *antes* que la ejecución de este código que es asyncrono. Usamos Future para
        //     // que el método espere a que todo termine para regresar ...
        //     let newFile = new FS.File();
        //     let data2 = new Buffer(content);
        //
        //     newFile.attachData( data2, {type: 'xlsx'}, Meteor.bindEnvironment(function( err ) {
        //         if(err)
        //             throw new Meteor.Error('error-grabar-archivo-collectionFS',
        //                 `Error: se ha producido un error al intentar grabar el archivo a un directorio en el servidor.
        //                  El nombre del directorio en el servidor es: ${Meteor.settings.public.collectionFS_path_tempFiles}.
        //                  El mensaje de error recibido es: ${err.toString()}.
        //                 `);
        //
        //         newFile.name(outputFileName);
        //         // Collections.Builds.insert( file );
        //
        //         // agregamos algunos valores al file que vamos a registrar con collectionFS
        //         newFile.metadata = {
        //             user: Meteor.user().emails[0].address,
        //             nombreArchivo: outputFileName,
        //             aplicacion: 'bancos',
        //             cia: ciaSeleccionada._id,
        //         };
        //
        //         // intentamos eliminar el archivo antes de agregarlo nuevamente ...
        //         Files_CollectionFS_tempFiles.remove({ 'metadata.nombreArchivo': outputFileName });
        //
        //         Files_CollectionFS_tempFiles.insert(newFile, Meteor.bindEnvironment(function (err, fileObj) {
        //             // Inserted new doc with ID fileObj._id, and kicked off the data upload using HTTP
        //
        //             if (err) {
        //                 throw new Meteor.Error('error-grabar-archivo-collectionFS',
        //                     `Error: se ha producido un error al intentar grabar el archivo a un directorio en el servidor.
        //                      El nombre del directorio en el servidor es: ${Meteor.settings.public.collectionFS_path_tempFiles}.
        //                      El mensaje de error recibido es: ${err.toString()}.
        //                     `);
        //             };
        //
        //             // tenemos que esperar que el file efectivamente se guarde, para poder acceder su url ...
        //             // nótese como Meteor indica que debemos agregar un 'fiber' para correr el callback, pues
        //             // su naturaleza es asynchrona ...
        //             Files_CollectionFS_tempFiles.on("stored", Meteor.bindEnvironment(function (fileObj, storeName) {
        //                 const url = fileObj.url({store: storeName});
        //                 let result = {
        //                     linkToFile: url
        //                 };
        //                 future['return'](result);
        //             }));
        //         }));
        //     }));
        // }));
        //
        // return future.wait();
    }
});



Meteor.methods(
{
    contab_codificacionesContablesConsulta_exportarExcel: function (subTituloConsulta,
                                                                    codificacionContable,
                                                                    ciaSeleccionada)
    {
        // debugger;
        let Future = Npm.require('fibers/future');
        let XlsxInjector = Meteor.npmRequire('xlsx-injector');
        let fs = Npm.require('fs');
        let path = Npm.require('path');

        check(ciaSeleccionada, Object);

        // ----------------------------------------------------------------------------------------------------
        // obtenemos el directorio en el server donde están las plantillas (guardadas por el usuario mediante collectionFS)
        // nótese que usamos un 'setting' en setting.json (que apunta al path donde están las plantillas)
        // nótese que la plantilla (doc excel) no es agregada por el usuario; debe existir siempre con el
        // mismo nombre ...
        let templates_DirPath = Meteor.settings.public.collectionFS_path_templates;
        let temp_DirPath = Meteor.settings.public.collectionFS_path_tempFiles;

        let templatePath = path.join(templates_DirPath, 'contab', 'contabConsultaCodificacionesContables.xlsx');

        // ----------------------------------------------------------------------------------------------------
        // nombre del archivo que contendrá los resultados ...
        let userID2 = Meteor.user().emails[0].address.replace(/\./g, "_");
        userID2 = userID2.replace(/\@/g, "_");
        let outputFileName = 'contabConsultaCodificacionesContables.xlsx'.replace('.xlsx', `_${userID2}.xlsx`);
        let outputPath  = path.join(temp_DirPath, 'contab', outputFileName);

        // leemos los saldos que el usuario acaba de filtrar ...
        let codificacionesContables = CodificacionesContables_movimientos.find(
            {
                codificacionContable_ID: codificacionContable._id,
                user: this.userId,
            }).fetch();


        // agregamos los niveles 'previos' (grupos) al collection; ejemplo: si un código es:
        // 2 01 01 001, agregamos: 2, 2 01 y 2 01 01. Estos son los niveles 'previos' al código
        // y deben formar parte del registro para agrupar por ellos ...

        codificacionesContables.forEach((x) => {
            let niveles = x.codigoContable.split(' ');
            // grabamos hasta el penúltimo
            let nivelAnterior = "";
            let cantidadNiveles = 0;
            for (let i = 0; i <= niveles.length - 2; i++) {
                let nivel = i + 1;
                // cada nivel se forma agregando a él mismo los anteriores (ej: 2, 2 01, 2 01 01, 2 01 01 01, ...)
                x[`nivel_${nivel.toString()}`] = nivelAnterior ? nivelAnterior + " " + niveles[i].toString() :
                                                                niveles[i].toString();
                nivelAnterior = x[`nivel_${nivel.toString()}`];
                cantidadNiveles++;
            };

            // para cada item en el array, completamos niveles 'parent' hasta que hayan 5
            for (let i = cantidadNiveles + 1; i <= 5; i++) {
                x[`nivel_${i.toString()}`] = "*xyzxyz*";        // no existe el nivel, lo agregamos (siempre hasta 5)
            };
        });

        // ahora que agregamos los 'niveles previos' (de grupo) al collection, construimos un array de 'keys'
        // para agrupar por ellas ...
        let keysArray = ['simboloMoneda'];

        for (let i = 1; i <= 5; i++) {
            keysArray.push(`nivel_${i.toString()}`);
        };

        // agregamos el resto de los keys ...
        keysArray.push('codigoContable');
        keysArray.push('cuentaContable');

        // finalmente, agrupamos todo el array de acuerdo a sus claves (keys)
        let groupByArray = Global_Methods.groupByMulti(codificacionesContables, keysArray);

        let items = [];
        let numeroGrupo = 0;

        // recorremos el objeto que resultó de agrupar por todas las claves arriba ...
        for (let moneda in lodash(groupByArray).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {
            let itemsBy_Moneda = groupByArray[moneda];
            agregarResumen_moneda(items, codificacionesContables, moneda);

            for (let nivel_1 in lodash(itemsBy_Moneda).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {
                let itemsBy_MonedaN1 = itemsBy_Moneda[nivel_1];      // siempre existirá un nivel 1 (total)
                agregarResumen_nivelTotal1(items, codificacionesContables, moneda, nivel_1)

                for (let nivel_2 in lodash(itemsBy_MonedaN1).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {
                    let itemsBy_MonedaN1N2 = itemsBy_MonedaN1[nivel_2];
                    if (nivel_2 != "*xyzxyz*") {
                        agregarResumen_nivelTotal2(items, codificacionesContables, moneda, nivel_1, nivel_2);
                    };

                    for (let nivel_3 in lodash(itemsBy_MonedaN1N2).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {
                        let itemsBy_MonedaN1N2N3 = itemsBy_MonedaN1N2[nivel_3];
                        if (nivel_3 != "*xyzxyz*") {
                            agregarResumen_nivelTotal3(items, codificacionesContables, moneda, nivel_1, nivel_2, nivel_3);
                        };

                        for (let nivel_4 in lodash(itemsBy_MonedaN1N2N3).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {
                            let itemsBy_MonedaN1N2N3N4 = itemsBy_MonedaN1N2N3[nivel_4];
                            if (nivel_4 != "*xyzxyz*") {
                                agregarResumen_nivelTotal4(items, codificacionesContables, moneda, nivel_1, nivel_2, nivel_3, nivel_4);
                            };

                            for (let nivel_5 in lodash(itemsBy_MonedaN1N2N3N4).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {
                                let itemsBy_MonedaN1N2N3N4N5 = itemsBy_MonedaN1N2N3N4[nivel_5];
                                if (nivel_5 != "*xyzxyz*") {
                                    agregarResumen_nivelTotal5(items, codificacionesContables, moneda, nivel_1, nivel_2, nivel_3, nivel_4, nivel_5);
                                };

                                for (let codigo in lodash(itemsBy_MonedaN1N2N3N4N5).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {
                                    let itemsBy_MonedaN1N2N3N4N5Codigo = itemsBy_MonedaN1N2N3N4N5[codigo];
                                    agregarResumen_codigoContable(items, codificacionesContables, moneda, nivel_1, nivel_2, nivel_3, nivel_4, nivel_5, codigo);

                                    for (let cuenta in lodash(itemsBy_MonedaN1N2N3N4N5Codigo).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {
                                        let itemsBy_MonedaN1N2N3N4N5CodigoCuenta = itemsBy_MonedaN1N2N3N4N5Codigo[cuenta];
                                        agregarResumen_cuentaContable(items, itemsBy_MonedaN1N2N3N4N5CodigoCuenta);
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };


        // Object containing attributes that match the placeholder tokens in the template
        let values = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            subTitulo: subTituloConsulta,
            items: items,
        };

        // Open a workbook
        let workbook = new XlsxInjector(templatePath);
        let sheetNumber = 1;
        workbook.substitute(sheetNumber, values);

        // existen 3 hojas; eliminamos movimientos (asientos) para la 2da. y cuentas contables para la 3ra.
        // sheet #2
        lodash.remove(items, (x) => { return x.tipoReg == 0; });    // eliminamos los movimientos (asientos)
        values = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            subTitulo: subTituloConsulta,
            items: items,
        };

        sheetNumber = 2;
        workbook.substitute(sheetNumber, values);

        // sheet #3
        lodash.remove(items, (x) => { return x.tipoReg == 1; });        // eliminamos las cuentas contables
        values = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            subTitulo: subTituloConsulta,
            items: items,
        };

        sheetNumber = 3;
        workbook.substitute(sheetNumber, values);


        // Save the workbook
        workbook.writeFile(outputPath);

        let future = new Future();

        // Load an XLSX file into memory
        fs.readFile(outputPath, Meteor.bindEnvironment(function(err, content) {

            if(err)
                throw new Meteor.Error('error-leer-plantilla-excel',
                    `Error: se ha producido un error al intentar leer el <em>archivo resultado</em> de este
                     proceso en el servidor.
                     El nombre del archivo que se ha intentado leer es: ${outputPath}.
                     El mensaje de error recibido es: ${err.toString()}.
                    `);

            // el método regresa *antes* que la ejecución de este código que es asyncrono. Usamos Future para
            // que el método espere a que todo termine para regresar ...
            let newFile = new FS.File();
            let data2 = new Buffer(content);

            newFile.attachData( data2, {type: 'xlsx'}, Meteor.bindEnvironment(function( err ) {
                if(err)
                    throw new Meteor.Error('error-grabar-archivo-collectionFS',
                        `Error: se ha producido un error al intentar grabar el archivo a un directorio en el servidor.
                         El nombre del directorio en el servidor es: ${Meteor.settings.public.collectionFS_path_tempFiles}.
                         El mensaje de error recibido es: ${err.toString()}.
                        `);

                newFile.name(outputFileName);
                // Collections.Builds.insert( file );

                // agregamos algunos valores al file que vamos a registrar con collectionFS
                newFile.metadata = {
                    user: Meteor.user().emails[0].address,
                    nombreArchivo: outputFileName,
                    aplicacion: 'contab',
                    cia: ciaSeleccionada._id,
                };

                // intentamos eliminar el archivo antes de agregarlo nuevamente ...
                Files_CollectionFS_tempFiles.remove({ 'metadata.nombreArchivo': outputFileName });

                Files_CollectionFS_tempFiles.insert(newFile, Meteor.bindEnvironment(function (err, fileObj) {
                    // Inserted new doc with ID fileObj._id, and kicked off the data upload using HTTP

                    if (err) {
                        throw new Meteor.Error('error-grabar-archivo-collectionFS',
                            `Error: se ha producido un error al intentar grabar el archivo a un directorio en el servidor.
                             El nombre del directorio en el servidor es: ${Meteor.settings.public.collectionFS_path_tempFiles}.
                             El mensaje de error recibido es: ${err.toString()}.
                            `);
                    };

                    // tenemos que esperar que el file efectivamente se guarde, para poder acceder su url ...
                    // nótese como Meteor indica que debemos agregar un 'fiber' para correr el callback, pues
                    // su naturaleza es asynchrona ...
                    Files_CollectionFS_tempFiles.on("stored", Meteor.bindEnvironment(function (fileObj, storeName) {
                        const url = fileObj.url({store: storeName});
                        let result = {
                            linkToFile: url
                        };
                        future['return'](result);
                    }));
                }));
            }));
        }));

        return future.wait();
    }
});


// ------------------------------------------------------------------------------------------
// las funciones que siguen se ejecutan cuando rompe cada grupo; cada una, simplemente,
// agrega un item al array que luego será escrito a Excel. Cada vez que rompe un grupo,
// se agrega un resumen (1 row) a Excel. Cuando llegamos al último grupo, se escriben
// a Excel todos sus items (un row por item)

function agregarResumen_moneda(items, collection, moneda) {

    let subCollection = lodash.filter(collection, (x) => { return x.simboloMoneda == moneda; });
    let firstItem = subCollection[0];
    let descripcion = Monedas.findOne({ simbolo: firstItem.simboloMoneda });

    let item = {
            codigo: firstItem.simboloMoneda,
            nombreCodigo: descripcion ? descripcion.descripcion : "Indefinido",

            fecha:  "",
            monedaOriginal: "",
            numeroComprobante: "",
            descripcion: "",
            referencia: "",

            saldoInicial: lodash.sumBy(subCollection, 'saldoInicial'),
            debe: lodash.sumBy(subCollection, 'debe'),
            haber: lodash.sumBy(subCollection, 'haber'),
            saldo: lodash.sumBy(subCollection, 'saldo'),
            cantMovtos: subCollection.length,

            grupo: '********',
            tipoReg: 8,
    };
    items.push(item);
};

function agregarResumen_nivelTotal1(items, collection, moneda, n1) {

    let subCollection = lodash.filter(collection, (x) => {
        return x.simboloMoneda == moneda && x.nivel_1 == n1;
    });
    let firstItem = subCollection[0];
    let descripcion = CodificacionesContables_codigos.findOne(
        {
            codificacionContable_ID: firstItem.codificacionContable_ID,
            codigo: n1
        });

    let item = {
            codigo: firstItem.nivel_1,
            nombreCodigo: descripcion ? descripcion.descripcion : "Indefinido",

            fecha:  "",
            monedaOriginal: "",
            numeroComprobante: "",
            descripcion: "",
            referencia: "",

            saldoInicial: lodash.sumBy(subCollection, 'saldoInicial'),
            debe: lodash.sumBy(subCollection, 'debe'),
            haber: lodash.sumBy(subCollection, 'haber'),
            saldo: lodash.sumBy(subCollection, 'saldo'),
            cantMovtos: subCollection.length,

            grupo: '*******',
            tipoReg: 7,
    };
    items.push(item);
};

function agregarResumen_nivelTotal2(items, collection, moneda, n1, n2) {

    let subCollection = lodash.filter(collection, (x) => {
        return x.simboloMoneda == moneda && x.nivel_1 == n1 && x.nivel_2 == n2;
    });
    let firstItem = subCollection[0];
    let descripcion = CodificacionesContables_codigos.findOne(
        {
            codificacionContable_ID: firstItem.codificacionContable_ID,
            codigo: n2
        });

    let item = {
            codigo: firstItem.nivel_2,
            nombreCodigo: descripcion ? descripcion.descripcion : "Indefinido",

            fecha:  "",
            monedaOriginal: "",
            numeroComprobante: "",
            descripcion: "",
            referencia: "",

            saldoInicial: lodash.sumBy(subCollection, 'saldoInicial'),
            debe: lodash.sumBy(subCollection, 'debe'),
            haber: lodash.sumBy(subCollection, 'haber'),
            saldo: lodash.sumBy(subCollection, 'saldo'),
            cantMovtos: subCollection.length,

            grupo: '******',
            tipoReg: 6,
    };
    items.push(item);
};

function agregarResumen_nivelTotal3(items, collection, moneda, n1, n2, n3) {

    let subCollection = lodash.filter(collection, (x) => {
        return x.simboloMoneda == moneda && x.nivel_1 == n1 && x.nivel_2 == n2 && x.nivel_3 == n3;
    });
    let firstItem = subCollection[0];
    let descripcion = CodificacionesContables_codigos.findOne(
        {
            codificacionContable_ID: firstItem.codificacionContable_ID,
            codigo: n3
        });

    let item = {
            codigo: firstItem.nivel_3,
            nombreCodigo: descripcion ? descripcion.descripcion : "Indefinido",

            fecha:  "",
            monedaOriginal: "",
            numeroComprobante: "",
            descripcion: "",
            referencia: "",

            saldoInicial: lodash.sumBy(subCollection, 'saldoInicial'),
            debe: lodash.sumBy(subCollection, 'debe'),
            haber: lodash.sumBy(subCollection, 'haber'),
            saldo: lodash.sumBy(subCollection, 'saldo'),
            cantMovtos: subCollection.length,

            grupo: '*****',
            tipoReg: 5,
    };
    items.push(item);
};

function agregarResumen_nivelTotal4(items, collection, moneda, n1, n2, n3, n4) {

    let subCollection = lodash.filter(collection, (x) => {
        return x.simboloMoneda == moneda && x.nivel_1 == n1 && x.nivel_2 == n2 && x.nivel_3 == n3 && x.nivel_4 == n4;
    });
    let firstItem = subCollection[0];
    let descripcion = CodificacionesContables_codigos.findOne(
        {
            codificacionContable_ID: firstItem.codificacionContable_ID,
            codigo: n4
        });

    let item = {
            codigo: firstItem.nivel_4,
            nombreCodigo: descripcion ? descripcion.descripcion : "Indefinido",

            fecha:  "",
            monedaOriginal: "",
            numeroComprobante: "",
            descripcion: "",
            referencia: "",

            saldoInicial: lodash.sumBy(subCollection, 'saldoInicial'),
            debe: lodash.sumBy(subCollection, 'debe'),
            haber: lodash.sumBy(subCollection, 'haber'),
            saldo: lodash.sumBy(subCollection, 'saldo'),
            cantMovtos: subCollection.length,

            grupo: '****',
            tipoReg: 4,
    };
    items.push(item);
};

function agregarResumen_nivelTotal5(items, collection, moneda, n1, n2, n3, n4, n5) {

    let subCollection = lodash.filter(collection, (x) => {
        return x.simboloMoneda == moneda && x.nivel_1 == n1 && x.nivel_2 == n2 && x.nivel_3 == n3
                                         && x.nivel_4 == n4 && x.nivel_5 == n5;
    });
    let firstItem = subCollection[0];
    let descripcion = CodificacionesContables_codigos.findOne(
        {
            codificacionContable_ID: firstItem.codificacionContable_ID,
            codigo: n5
        });

    let item = {
            codigo: firstItem.nivel_5,
            nombreCodigo: descripcion ? descripcion.descripcion : "Indefinido",

            fecha:  "",
            monedaOriginal: "",
            numeroComprobante: "",
            descripcion: "",
            referencia: "",

            saldoInicial: lodash.sumBy(subCollection, 'saldoInicial'),
            debe: lodash.sumBy(subCollection, 'debe'),
            haber: lodash.sumBy(subCollection, 'haber'),
            saldo: lodash.sumBy(subCollection, 'saldo'),
            cantMovtos: subCollection.length,

            grupo: '***',
            tipoReg: 3,
    };
    items.push(item);
};

function agregarResumen_codigoContable(items, collection, moneda, n1, n2, n3, n4, n5, codigo) {

    let subCollection = lodash.filter(collection, (x) => {
        return x.simboloMoneda == moneda && x.nivel_1 == n1 && x.nivel_2 == n2 && x.nivel_3 == n3
                                         && x.nivel_4 == n4 && x.nivel_5 == n5 && x.codigoContable == codigo;
    });
    let firstItem = subCollection[0];

    let item = {
            codigo: firstItem.codigoContable,
            nombreCodigo: firstItem.nombreCodigoContable,

            fecha:  "",
            monedaOriginal: "",
            numeroComprobante: "",
            descripcion: "",
            referencia: "",

            saldoInicial: lodash.sumBy(subCollection, 'saldoInicial'),
            debe: lodash.sumBy(subCollection, 'debe'),
            haber: lodash.sumBy(subCollection, 'haber'),
            saldo: lodash.sumBy(subCollection, 'saldo'),
            cantMovtos: subCollection.length,

            grupo: '**',
            tipoReg: 2,
    };
    items.push(item);
};

function agregarResumen_cuentaContable(items, collection) {
    let firstItem = collection[0];
    let item = {
            codigo: firstItem.cuentaContable,
            nombreCodigo: firstItem.nombreCuentaContable,

            fecha:  "",
            monedaOriginal: "",
            numeroComprobante: "",
            descripcion: "",
            referencia: "",

            saldoInicial: lodash.sumBy(collection, 'saldoInicial'),
            debe: lodash.sumBy(collection, 'debe'),
            haber: lodash.sumBy(collection, 'haber'),
            saldo: lodash.sumBy(collection, 'saldo'),
            cantMovtos: collection.length,

            grupo: '*',
            tipoReg: 1,
    };
    items.push(item);

    lodash.orderBy(collection, ['fecha'], ['asc']).
           forEach((movimiento) => {
        // finalmente, escribimos un row para cada mon/ano/cuenta/monOrig a Excel;
        // estos son los rows de tipo 'detalle'
        item = {
            codigo: "",
            nombreCodigo: "",

            fecha: moment(movimiento.fecha).format("DD-MM-YYYY"),
            monedaOriginal: movimiento.simboloMonedaOriginal,
            numeroComprobante: movimiento.comprobante ? movimiento.comprobante : 0,
            descripcion: movimiento.descripcion,
            referencia: movimiento.referencia ? movimiento.referencia : "",

            saldoInicial: movimiento.saldoInicial,
            debe: movimiento.debe,
            haber: movimiento.haber,
            saldo: movimiento.saldo,
            cantMovtos: 0,
            grupo: '',
            tipoReg: 0,
        };
        items.push(item);
    });
};




import * as numeral from 'numeral';
import moment from 'moment';
import * as lodash from 'lodash';
import * as angular from 'angular';

import { Companias } from '../../../../imports/collections/companias';
import { CompaniaSeleccionada } from '../../../../imports/collections/companiaSeleccionada';
import { Filtros } from '../../../../imports/collections/general/filtros'; 
import { Temp_Consulta_Contab_ActivosFijos } from '../../../../imports/collections/contab/temp.contab.consulta.activosFijos'; 

import { DialogModal } from '../../../generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '../../../imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Catalogos_ActivosFijos_Controller",
['$stateParams', '$state', '$scope', '$modal', 'uiGridConstants', '$interval', 
function ($stateParams, $state, $scope,  $modal, uiGridConstants, $interval) {

    $scope.showProgress = false;

    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
    };

    $scope.origen = $stateParams.origen;

    // para obtener el reporte de la reposición, necesitamos el address de ContabSysNet; está en settings 
    let contabSysNet_app_address = Meteor.settings.public.contabSysNet_app_address;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.setIsEdited = function (value) {
        if (!$scope.reposicion.docState) { 
            $scope.reposicion.docState = 2;
        }

        return;
    }

    $scope.helpers({
        ciaContabSeleccionada: () => {
            return CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
        },
        companiaSeleccionada: () => {
            return Companias.findOne($scope.ciaContabSeleccionada &&
                                     $scope.ciaContabSeleccionada.companiaID ?
                                     $scope.ciaContabSeleccionada.companiaID :
                                     -999,
                                     { fields:
                                        {
                                            numero: true,
                                            nombre: true,
                                            nombreCorto: true
                                        } });
        },
    })


    $scope.refresh0 = function () {
        if ($scope.reposicion && $scope.reposicion.docState && $scope.reposicion.docState === 1) { 
            DialogModal($modal, "<em>Bancos - Caja chica - Reposiciones</em>",
                                `Ud. está ahora agregando un registro nuevo, no hay nada que refrescar.<br />
                                 Ud. puede deshacer los cambios y, nuevamente, intentar agregar un nuevo registro, si hace un  
                                 <em>click</em> en <em>Nuevo, e indica que desea perder los cambios. <br /><br />
                                 También puede hacer un <em>click</em> en <em>Regresar</em>, para deshacer los cambios y regresar a la lista. 
                                 `,
                                false); 
            return; 
        }

        if ($scope.reposicion && $scope.reposicion.docState) {
            DialogModal($modal, "<em>Bancos - Caja chica - Reposiciones</em>",
                                `Aparentemente, Ud. ha efectuado cambios; aún así,
                                desea <em>refrescar el registro</em> y perder los cambios?`,
                                true).then(
                function (resolve) {
                    refresh();
                },
                function (err) {
                    return true;
                })

            return;
        }
        else { 
            refresh();
        }
    }

    let refresh = () => {
        // si el usuario hace un click en Refresh, leemos nuevamente el item seleccionado en la lista ...
        $scope.reposicion = {};
        // $scope.aplicarFiltro();

        if (itemSeleccionado) {
            // inicializarItem regresa un promise; cuando se ejecuta, regresa la reposición ... 
            inicializarItem(itemSeleccionado.reposicion, $scope, contabSysNet_app_address).then((result) => { 
                // en este momento, podemos hacer algo con el registro que se leyó de la base de datos ... 
            })
        }

        $scope.alerts = [];
    }

    // este es el tab 'activo' en angular bootstrap ui ...
    // NOTA IMPORTANTE: esta propiedad cambio a partir de 1.2.1 en angular-ui-bootstrap. Sin embargo, parece que
    // atmosphere no tiene esta nueva versión (se quedó en 0.13.0) y no pudimos instalarla desde NPM. La verdad,
    // cuando podamos actualizar angular-ui-bootstrap a una nueve vesión, la propiedad 'active' va en el tabSet
    // y se actualiza con el index de la página (0, 1, 2, ...). Así resulta mucho más intuitivo y fácil
    // establecer el tab 'activo' en ui-bootstrap ...
    $scope.activeTab = { tab1: true, tab2: false, tab3: false, };

    let reposiciones_ui_grid_api = null;

    let itemSeleccionado = {} as any;
    let itemSeleccionadoParaSerEliminado = false;

    $scope.activosFijos_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        showGridFooter: true,
        enableFiltering: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            reposiciones_ui_grid_api = gridApi;
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                itemSeleccionado = {};
                if (row.isSelected) {
                    itemSeleccionado = row.entity;

                    if (itemSeleccionadoParaSerEliminado) {
                        // cuando el usuario hace un click en 'x' para eliminar el item en la lista, no lo mostramos en el tab que sigue
                        itemSeleccionadoParaSerEliminado = false;
                        return;
                    }
                }
                else
                    return;
            })
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    }

    $scope.activosFijos_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
            '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableColumnMenu: false,
            enableSorting: false,
            width: 25
        },
        {
            name: 'reposicion',
            field: 'reposicion',
            displayName: '##',
            width: 60,
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',

            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            width: '80',
            enableFiltering: false,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
        {       
            name: 'estadoActual',
            field: 'estadoActual',
            displayName: 'Estado',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'cajaChica',
            field: 'cajaChica',
            displayName: 'Caja chica',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: false,
            type: 'string'
        },
        {
            name: 'observaciones',
            field: 'observaciones',
            displayName: 'Observaciones',
            width: 200,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: false,
            type: 'string'
        },
        {
            name: 'lineas',
            field: 'lineas',
            displayName: 'Lineas',
            width: 60,
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',

            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: false,
            type: 'number'
        },
        {
            name: 'montoNoImponible',
            field: 'montoNoImponible',
            displayName: 'No imponible',
            width: '120',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            pinnedLeft: false,
            type: 'number'
        },
        {
            name: 'montoImponible',
            field: 'montoImponible',
            displayName: 'Imponible',
            width: '120',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            pinnedLeft: false,
            type: 'number'
        },
        {
            name: 'iva',
            field: 'iva',
            displayName: 'Iva',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            pinnedLeft: false,
            type: 'number'
        },
        {
            name: 'total',
            field: 'total',
            displayName: 'Total',
            width: '120',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            pinnedLeft: false,
            type: 'number'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            pinnedLeft: false,
            width: 25
        },
    ]

    $scope.deleteItem = function (item) {
        // nótese como  indicamos que el usuario no quiere seleccionar el item en la lista, solo marcarlo para ser eliminado;
        // la idea es que el item se marque para ser eliminado, pero no se muestre (sus detalles) en el tab que sigue ...
        if (item.docState && item.docState === 1) {
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove($scope.activosFijos, (x:any) => { return x._id === item._id; });
            itemSeleccionadoParaSerEliminado = true;
        }
        else {
            item.docState = 3;

            if (lodash.some($scope.activosFijos, (x:any) => { return x._id === item._id; })) {
                // creo que ésto no debería ser necesario! sin embargo, al actualizar item arriba no se actualiza el item que corresponde en
                // el array ($scope.proveedores)
                lodash.find($scope.activosFijos, (x:any) => { return x._id === item._id; }).docState = 3;
            }

            itemSeleccionadoParaSerEliminado = true;
        }
    }

    $scope.eliminar = function () {

        if ($scope.reposicion && $scope.reposicion.docState && $scope.reposicion.docState === 1) {
            DialogModal($modal, "<em>Bancos - Caja chica - Reposiciones</em>",
                                `La reposición de caja chica que Ud. intenta eliminar es <em>nueva</em>. No hay nada que 
                                 eliminar (pues no se ha grabado aún).<br />
                                 Ud. puede <em>revertir</em> la creación del registro si ejecuta cualquier otra acción e indica que desea 
                                 <em>perder los cambios</em> que ha registrado hasta ahora, para el registro nuevo. 
                                `,
                                false).then();
            return;
        }

        $scope.reposicion.docState = 3;
    }

    $scope.nuevo = function () {
        if ($scope.reposicion && $scope.reposicion.docState) {
            DialogModal($modal, "<em>Bancos - Caja chica - Reposiciones</em>",
                                `Aparentemente, Ud. ha efectuado cambios; aún así,
                                desea <em>agregar un nuevo registro</em> y perder los cambios?`,
                                true).then(
                function (resolve) {
                    // inicializarItem regresa un promise; cuando se ejecuta, regresa la reposición ... 
                    inicializarItem(0, $scope, contabSysNet_app_address).then((result) => { 
                        // en este momento, podemos hacer algo con el registro que se ha recién leído en la base de datos
                    })
                },
                function (err) {
                    return;
                })
        }
        else { 
            // inicializarItem regresa un promise; cuando se ejecuta, regresa la reposición ... 
            inicializarItem(0, $scope, contabSysNet_app_address).then((result) => { 
                // en este momento, podemos hacer algo con el registro que se ha recién leído en la base de datos
            })
        }
    }

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    }

    $scope.aplicarFiltro = function () {
        $scope.showProgress = true;

        Meteor.call('contab.activosFijos.LeerDesdeSql', JSON.stringify($scope.filtro), $scope.companiaSeleccionada.numero, (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
                $scope.$apply();
                return;
            }

            // ------------------------------------------------------------------------------------------------------
            // guardamos el filtro indicado por el usuario
            if (Filtros.findOne({ nombre: 'contab.activosFijos', userId: Meteor.userId() })) { 
                // el filtro existía antes; lo actualizamos
                // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                Filtros.update(Filtros.findOne({ nombre: 'contab.activosFijos', userId: Meteor.userId() })._id,
                                { $set: { filtro: $scope.filtro } },
                                { validate: false });
            }
            else { 
                Filtros.insert({
                    _id: new Mongo.ObjectID()._str,
                    userId: Meteor.userId(),
                    nombre: 'contab.activosFijos',
                    filtro: $scope.filtro
                });
            }
            // ------------------------------------------------------------------------------------------------------
            // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
            leerPrimerosRegistrosDesdeServidor(50);

            // nótese como establecemos el tab 'activo' en ui-bootstrap; ver nota arriba acerca de ésto ...
            $scope.activeTab = { tab1: false, tab2: true, tab3: false, };
        })
    }

    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'contab.activosFijos', userId: Meteor.userId() });

    if (filtroAnterior) { 
        $scope.filtro = lodash.clone(filtroAnterior.filtro);
    }
    // ------------------------------------------------------------------------------------------------------

    $scope.activosFijos_ui_grid.data = [];

    let recordCount = 0;
    let limit = 0;

    function leerPrimerosRegistrosDesdeServidor(cantidadRecs) {
        // cuando el usuario indica y aplica un filtro, leemos los primeros 50 registros desde mongo ...
        limit = cantidadRecs;
        Meteor.call('getCollectionCount', 'Temp_Consulta_Contab_ActivosFijos', (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
                $scope.$apply();
                return;
            }

            // el método regresa la cantidad de items en el collection (siempre para el usuario)
            recordCount = result;
            $scope.leerRegistrosDesdeServer(limit);
        })
    }


    let subscriptionHandle = {} as any;
    $scope.leerRegistrosDesdeServer = function (limit) {
        // la idea es 'paginar' los registros que se suscriben, de 50 en 50
        // el usuario puede indicar 'mas', para leer 50 más; o todos, para leer todos los registros ...
        $scope.showProgress = true;

        // lamentablemente, tenemos que hacer un stop al subscription cada vez que hacemos una nueva,
        // pues el handle para cada una es diferente; si no vamos deteniendo cada una, las anteriores
        // permanecen pues solo detenemos la última al destruir el stop (cuando el usaurio sale de
        // la página). Los documents de subscriptions anteriores permanecen en minimongo y el reactivity
        // de los subscriptions también ...
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        }

        subscriptionHandle =
        Meteor.subscribe('temp.contab.consulta.activosFijos.list', limit, () => {

            let meteorUserId = Meteor.userId();

            $scope.helpers({
                activosFijos: () => {
                    return Temp_Consulta_Contab_ActivosFijos.find({ user: meteorUserId }, { sort: { claveUnica: 1 }});
                }
            })

            $scope.activosFijos_ui_grid.data = $scope.activosFijos;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `${numeral($scope.activosFijos.length).format('0,0')} registros
                    (de ${numeral(recordCount).format('0,0')}) han sido seleccionados ...`
            });

            $scope.showProgress = false;
            $scope.$apply();
        })
    }

    $scope.leerMasRegistros = function () {
        limit += 50;    // la próxima vez, se leerán 50 más ...
        $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
    }

    $scope.leerTodosLosRegistros = function () {
        // simplemente, leemos la cantidad total de registros en el collection (en el server y para el user)
        limit = recordCount;
        $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
    }

    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'bancos', process: 'leerBancosCajaChicaDesdeSqlServer' });
    EventDDP.addListener('bancos_cajaChica_reportProgressDesdeSqlServer', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't excecute this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    })
    // ------------------------------------------------------------------------------------------------------

    $scope.showProgress = true;
    Meteor.call('contab.activosFijos.leerTablasCatalogosDesdeSqlServer', $scope.companiaSeleccionada.numero, (err, result) => {

        if (err) {
            let errorMessage = mensajeErrorDesdeMethod_preparar(err);

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: errorMessage
            });

            $scope.showProgress = false;
            $scope.$apply();
            return;
        }

        let catalogos = JSON.parse(result);

        $scope.cajasChicas = catalogos.cajasChicas;
        $scope.rubrosCajaChica = catalogos.rubrosCajaChica; 
        $scope.proveedores = catalogos.proveedores; 

        $scope.gastos_ui_grid.columnDefs[2].editDropdownOptionsArray = $scope.rubrosCajaChica;
        $scope.gastos_ui_grid.columnDefs[4].editDropdownOptionsArray = $scope.proveedores; 

        $scope.showProgress = false;
        $scope.$apply();
    })

    // ------------------------------------------------------------------------------------------------
    // cuando el usuario sale de la página, nos aseguramos de detener (ie: stop) el subscription,
    // para limpiar los items en minimongo ...
    $scope.$on('$destroy', function() {
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        }
    })
}
])


function inicializarItem(itemID, $scope, contabSysNet_app_address) {

    return new Promise(function(resolve:any, reject:any) { 
        if (itemID == 0) {
            $scope.showProgress = true;
            $scope.reposicion = {};
            let usuario =  Meteor.user();
    
            $scope.reposicion = {
                reposicion: 0,
                fecha: new Date(),
                estadoActual: "AB", 
                cajaChica_reposicion_gastos: [], 
                docState: 1
            };
    
            $scope.alerts.length = 0;               // pueden haber algún 'alert' en la página ...
            $scope.reportLink = "#";                // para invalidar el link que permite imprimir, hasta que el usuario grabe ... 
            $scope.activeTab = { tab1: false, tab2: false, tab3: true, };
            $scope.showProgress = false;
            
            resolve($scope.activoFijo); 
        }
        else {
            $scope.showProgress = true;
    
            // nótese que ejecutamos un promise que lee el item en la base de datos (server) y lo regresa 
            item_leerByID_desdeSql(itemID, $scope).then( 
    
                function (result:any) { 
                    $scope.activoFijo = {};
                    $scope.activosFijos_ui_grid.data = []; 
                    $scope.activoFijo = JSON.parse(result);
    
                    if (!$scope.activoFijo || ($scope.activoFijo && lodash.isEmpty($scope.activoFijo))) {
                        // el usuario eliminó el registro y, por eso, no pudo se leído desde sql
                        $scope.activoFijo = {};
                        $scope.showProgress = false;
                        $scope.$apply();
    
                        return;
                    }
    
                    // las fechas vienen serializadas como strings; convertimos nuevamente a dates ...
                    $scope.activoFijo.fecha = $scope.activoFijo.fecha ? moment($scope.activoFijo.fecha).toDate() : null;
    
                    if ($scope.activoFijo.cajaChica_reposicion_gastos) { 
                        $scope.activoFijo.cajaChica_reposicion_gastos.forEach((g) => { 
                            g.fechaDocumento = g.fechaDocumento ? moment(g.fechaDocumento).toDate() : null;
                        })
                    }
    
                    if (!Array.isArray($scope.activoFijo.cajaChica_reposicion_gastos)) { 
                        $scope.activoFijo.cajaChica_reposicion_gastos = [];
                    } 
    
                    // nótese como establecemos el tab 'activo' en ui-bootstrap; ver nota arriba acerca de ésto ...
                    $scope.activeTab = { tab1: false, tab2: false, tab3: true, };
    
                    $scope.showProgress = false;
                    $scope.$apply();

                    resolve($scope.activoFijo); 
    
                }).catch(function(err) { 
    
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);
    
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });
    
                    $scope.showProgress = false;
    
                    $scope.$apply();
                    reject(err); 
                })
        }
        

        // construimos el link que permite obtener el reporte para la reposición, desde ContabSysNet ... 
        $scope.reportLink = "#";
        if (itemID && contabSysNet_app_address) {
            $scope.reportLink = `${contabSysNet_app_address}/ReportViewer4.aspx?user=${Meteor.userId()}&cia=${$scope.companiaSeleccionada.numero}&report=reposicionCajaChica&reposicion=${itemID}`;
        }
    })
}


function item_leerByID_desdeSql(pk, $scope) {
    return new Promise(function(resolve, reject) { 
        // ejecutamos un método para leer el asiento contable en sql server y grabarlo a mongo (para el current user)
        Meteor.call('reposicionesCajaChica.leerByID.desdeSql', pk, (err, result) => {

            if (err) {
                reject(err); 
            } else { 
                resolve(result); 
            }
        })
    })
}
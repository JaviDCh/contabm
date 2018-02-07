

import numeral from 'numeral';
import moment from 'moment';
import lodash from 'lodash';

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

import { DialogModal } from '/client/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

import { Temp_Consulta_Bancos_CajaChica } from '/imports/collections/bancos/temp.bancos.consulta.cajaChica'; 

angular.module("contabm").controller("Bancos_CajaChica_Reposiciones_Controller",
['$stateParams', '$state', '$scope', '$modal', 'uiGridConstants', function ($stateParams, $state, $scope,  $modal, uiGridConstants) {

    $scope.showProgress = false;

    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
    };

    $scope.origen = $stateParams.origen;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.setIsEdited = function (value) {
        if ($scope.proveedor.docState)
            return;

        $scope.proveedor.docState = 2;
    };

    $scope.estadosCajaChicaArray = [
        { estado: "AB", descripcion: "Abierta" },
        { estado: "CE", descripcion: "Cerrada" },
        { estado: "RE", descripcion: "Revisada" },
        { estado: "AP", descripcion: "Aprobada" },
        { estado: "CA", descripcion: "Cancelada" },
        { estado: "CO", descripcion: "Contabilizada" },
        { estado: "AN", descripcion: "Anulada" },
    ];

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
        if ($scope.proveedor && $scope.proveedor.docState) {
            var promise = DialogModal($modal,
                                    "<em>Bancos - Proveedores</em>",
                                    `Aparentemente, Ud. ha efectuado cambios; aún así,
                                        desea <em>refrescar el registro</em> y perder los cambios?`,
                                    true);

            promise.then(
                function (resolve) {
                    $scope.refresh();
                },
                function (err) {
                    return true;
                });

            return;
        }
        else
            $scope.refresh();
    }

    $scope.refresh = () => {
        // si el usuario hace un click en Refresh, leemos nuevamente el proveedor seleccionado en la lista ...
        $scope.proveedor = {};
        // $scope.aplicarFiltro();

        if (itemSeleccionado) {
            inicializarItem(itemSeleccionado.proveedor, $scope);
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
    let itemSeleccionado = {};

    let itemSeleccionadoParaSerEliminado = false;

    $scope.reposiciones_ui_grid = {

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

                    // leemos, desde sql, el registro seleccionado en la lista
                    inicializarItem(itemSeleccionado.reposicion, $scope);
                }
                else
                    return;
            });
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    }

    $scope.reposiciones_ui_grid.columnDefs = [
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
            pinnedLeft: true,
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
            pinnedLeft: true,
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
            pinnedLeft: true,
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
            pinnedLeft: true,
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
            lodash.remove($scope.reposiciones, (x) => { return x._id === item._id; });
            itemSeleccionadoParaSerEliminado = true;
        }
        else {
            item.docState = 3;

            if (lodash.some($scope.reposiciones, (x) => { return x._id === item._id; })) {
                // creo que ésto no debería ser necesario! sin embargo, al actualizar item arriba no se actualiza el item que corresponde en
                // el array ($scope.proveedores)
                lodash.find($scope.reposiciones, (x) => { return x._id === item._id; }).docState = 3;
            }

            itemSeleccionadoParaSerEliminado = true;
        }
    }

    $scope.eliminar = function () {
        $scope.reposicion.docState = 3;
    }

    $scope.nuevo = function () {
        inicializarItem(0, $scope);
    }

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    }

    $scope.aplicarFiltro = function () {
        $scope.showProgress = true;

        Meteor.call('bancos.cajaChica.LeerDesdeSql', JSON.stringify($scope.filtro), $scope.companiaSeleccionada.numero, (err, result) => {

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
            if (Filtros.findOne({ nombre: 'bancos.cajaChica', userId: Meteor.userId() })) { 
                // el filtro existía antes; lo actualizamos
                // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                Filtros.update(Filtros.findOne({ nombre: 'bancos.cajaChica', userId: Meteor.userId() })._id,
                                { $set: { filtro: $scope.filtro } },
                                { validate: false });
            }
            else { 
                Filtros.insert({
                    _id: new Mongo.ObjectID()._str,
                    userId: Meteor.userId(),
                    nombre: 'bancos.cajaChica',
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

    let gastos_ui_grid_api = null;
    let itemSeleccionado_gastos = {};

    $scope.gastos_ui_grid = {

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

            gastos_ui_grid_api = gridApi;
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                itemSeleccionado_gastos = {};
                if (row.isSelected) {
                    itemSeleccionado_gastos = row.entity;
                }
                else { 
                    return;
                }
            })
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row.id;
        },
        getRowIdentity: function (row) {
            return row.id;
        }
    }

    $scope.rubrosCajaChica = []; 
    $scope.proveedores = []; 

    $scope.gastos_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
            '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: brown; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableColumnMenu: false,
            enableSorting: false,
            pinnedLeft: true,
            width: 25
        },
        {
            name: 'rubro',
            field: 'rubro',
            displayName: 'Rubro',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',

            cellFilter: 'mapDropdown:row.grid.appScope.rubrosCajaChica:"rubro":"descripcion"',
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'rubro',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.rubrosCajaChica,

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            pinnedLeft: true,
            type: 'number'
        },
        {       
            name: 'descripcion ',
            field: 'descripcion',
            displayName: 'Descripción',
            width: 100,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'proveedor ',
            field: 'proveedor',
            displayName: 'Proveedor',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',

            cellFilter: 'mapDropdown:row.grid.appScope.proveedores:"proveedor":"abreviatura"',
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'proveedor',
            editDropdownValueLabel: 'abreviatura',
            editDropdownOptionsArray: $scope.proveedores,

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            pinnedLeft: true,
            type: 'number'
        },
        {       
            name: 'nombre ',
            field: 'nombre',
            displayName: 'Proveedor',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {       
            name: 'rif',
            field: 'rif',
            displayName: 'Rif',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'fechaDocumento',
            field: 'fechaDocumento',
            displayName: 'Fecha',
            width: '80',
            enableFiltering: false,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            pinnedLeft: true,
            type: 'date'
        },
        {       
            name: 'numeroDocumento   ',
            field: 'numeroDocumento',
            displayName: '#Doc',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'numeroControl ',
            field: 'numeroControl',
            displayName: '#Control',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            pinnedLeft: false,
            type: 'string'
        },
        {
            name: 'montoNoImponible',
            field: 'montoNoImponible',
            displayName: 'No imponible',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            pinnedLeft: false,
            type: 'number'
        },
        {
            name: 'monto',
            field: 'monto',
            displayName: 'Imponible',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            pinnedLeft: false,
            type: 'number'
        },
        {
            name: 'ivaPorc ',
            field: 'ivaPorc',
            displayName: 'Iva %',
            width: '60',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
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
            enableCellEdit: true,
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
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            pinnedLeft: false,
            type: 'number'
        },
        {
            name: 'afectaLibroCompras ',
            field: 'total',
            displayName: 'Libro comp?',
            width: '60',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableCellEdit: true,
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: false,
            type: 'boolean'
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


    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'bancos.cajaChica', userId: Meteor.userId() });

    if (filtroAnterior) { 
        $scope.filtro = lodash.clone(filtroAnterior.filtro);
    }
    // ------------------------------------------------------------------------------------------------------

    $scope.reposiciones_ui_grid.data = [];

    let recordCount = 0;
    let limit = 0;

    function leerPrimerosRegistrosDesdeServidor(cantidadRecs) {
        // cuando el usuario indica y aplica un filtro, leemos los primeros 50 registros desde mongo ...
        limit = cantidadRecs;
        Meteor.call('getCollectionCount', 'Temp_Consulta_Bancos_CajaChica', (err, result) => {

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


    let subscriptionHandle = null;
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
        Meteor.subscribe('temp.bancos.consulta.cajaChica.list', limit, () => {

            let meteorUserId = Meteor.userId();

            $scope.helpers({
                reposiciones: () => {
                    return Temp_Consulta_Bancos_CajaChica.find({ user: meteorUserId }, { sort: { reposicion: 1 }});
                }
            })

            $scope.reposiciones_ui_grid.data = $scope.reposiciones;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `${numeral($scope.reposiciones.length).format('0,0')} registros
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

    // -------------------------------------------------------------------------
    // Grabar las modificaciones hechas al registro
    // -------------------------------------------------------------------------
    $scope.grabar = function () {

        if (!$scope.reposicion.docState) {
            DialogModal($modal, "<em>Reposiciones de caja chica</em>",
                                `Aparentemente, <em>no se han efectuado cambios</em> en el registro.
                                No hay nada que grabar.`,
                                false).then();
            return;
        };

        grabar2();
    }


    function grabar2() {
        $scope.showProgress = true;

        // obtenemos un clone de los datos a guardar ...
        let editedItem = lodash.cloneDeep($scope.reposicion);

        // nótese como validamos cada item antes de intentar guardar en el servidor
        let isValid = false;
        let errores = [];

        if (editedItem.docState != 3) {
            isValid = Proveedores_SimpleSchema.namedContext().validate(editedItem);

            if (!isValid) {
                Proveedores_SimpleSchema.namedContext().validationErrors().forEach(function (error) {
                    errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Proveedores_SimpleSchema.label(error.name) + "'; error de tipo '" + error.type + "'.");
                });
            }
        }

        if (errores && errores.length) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Se han encontrado errores al intentar guardar las modificaciones efectuadas en la base de datos:<br /><br />" +
                    errores.reduce(function (previous, current) {

                        if (previous == "")
                            // first value
                            return current;
                        else
                            return previous + "<br />" + current;
                    }, "")
            });

            $scope.showProgress = false;
            return;
        }

        Meteor.call('proveedoresSave', editedItem, (err, result) => {

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

            if (result.error) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: result.message
                });
                $scope.showProgress = false;
                $scope.$apply();
            } else {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message
                });

                // el meteor method regresa siempre el _id del item; cuando el usuario elimina, regresa "-999"
                let claveUnicaRegistro = result.id;

                // nótese que siempre, al registrar cambios, leemos el registro desde sql server; la idea es
                // mostrar los datos tal como fueron grabados y refrescarlos para el usuario. Cuando el
                // usuario elimina el registro, su id debe regresar en -999 e InicializarItem no debe
                // encontrar nada ...
                inicializarItem(claveUnicaRegistro, $scope);
            }
        })
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
    Meteor.call('bancos.cajaChica.leerTablasCatalogosDesdeSqlServer', $scope.companiaSeleccionada.numero, (err, result) => {

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

        $scope.gastos_ui_grid.columnDefs[1].editDropdownOptionsArray = $scope.rubrosCajaChica;
        $scope.gastos_ui_grid.columnDefs[3].editDropdownOptionsArray = $scope.proveedores; 

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


function inicializarItem(itemID, $scope) {
    if (itemID == 0) {
        $scope.showProgress = true;
        $scope.reposicion = {};
        let usuario =  Meteor.user();
        $scope.reposicion =
        {
            reposicion: 0,
            fecha: new Date(),
            docState: 1
        };

        $scope.gastos_ui_grid.data = []; 

        $scope.showProgress = false;$scope.alerts.length = 0;               // pueden haber algún 'alert' en la página ...
        $scope.activeTab = { tab1: false, tab2: false, tab3: true, };
    }
    else {
      $scope.showProgress = true;
      item_leerByID_desdeSql(itemID, $scope);
    }
}


function item_leerByID_desdeSql(pk, $scope) {
    // ejecutamos un método para leer el asiento contable en sql server y grabarlo a mongo (para el current user)
    Meteor.call('reposicionesCajaChica.leerByID.desdeSql', pk, (err, result) => {

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

        $scope.reposicion = {};
        $scope.reposicion = JSON.parse(result);

        if (!$scope.reposicion || ($scope.reposicion && lodash.isEmpty($scope.reposicion))) {
            // el usuario eliminó el empleado y, por eso, no pudo se leído desde sql
            $scope.reposicion = {};
            $scope.showProgress = false;
            $scope.$apply();

            return;
        }

        // las fechas vienen serializadas como strings; convertimos nuevamente a dates ...
        $scope.reposicion.fecha = $scope.reposicion.fecha ? moment($scope.reposicion.fecha).toDate() : null;

        if ($scope.reposicion.cajaChica_reposicion_gastos) { 
            $scope.reposicion.cajaChica_reposicion_gastos.forEach((g) => { 
                g.fechaDocumento = g.fechaDocumento ? moment(g.fechaDocumento).toDate() : null;
            })
        }

        $scope.gastos_ui_grid.data = []; 
        if ($scope.reposicion.cajaChica_reposicion_gastos) { 
            $scope.gastos_ui_grid.data = $scope.reposicion.cajaChica_reposicion_gastos;
        } 

        // nótese como establecemos el tab 'activo' en ui-bootstrap; ver nota arriba acerca de ésto ...
        $scope.activeTab = { tab1: false, tab2: false, tab3: true, };

        $scope.showProgress = false;
        $scope.$apply();
    })
}

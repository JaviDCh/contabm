

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { DialogModal } from '/client/generales/angularGenericModal'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Contab_AsientoContableLista_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal', 'uiGridConstants',
function ($scope, $stateParams, $state, $meteor, $modal, uiGridConstants) {

    $scope.origen = $stateParams.origen;
    var pageNumber = $stateParams.pageNumber;
    
    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0, 
        message: "", 
    };

    // -------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'contab', process: 'asientos.lista.corregirAsientosMas2Decimales' });
    EventDDP.addListener('contab_asientos.lista.corregirAsientosMas2Decimales_reportProgress', function(process) {
        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        $scope.processProgress.message = process.message ? process.message : null;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    })
    // -------------------------------------------------------------------------------------------------------

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaContab = {};

    if (companiaContabSeleccionada)
        companiaContab = Companias.findOne(companiaContabSeleccionada.companiaID);
    // ------------------------------------------------------------------------------------------------

    $scope.regresarALista = function () {
        $scope.$parent.alerts.length = 0; 
        $state.go("contab.asientosContables.filter", { origen: $scope.origen });
    }


    $scope.nuevo = function () {
        $state.go('contab.asientosContables.asientoContable', {
            origen: $scope.origen,
            id: "0",
            pageNumber: 0,                          // nota: por ahora no vamos a paginar; tal vez luego, cuando esto funcione bien ...
            vieneDeAfuera: false
        })
    }


    $scope.imprimir = function() {

        if (!_.isArray($scope.asientosContables) || _.isEmpty($scope.asientosContables)) {
            DialogModal($modal, "<em>Asientos Contables</em>",
                        "Aparentemente, no se han seleccionado registros; no hay nada que imprimir.",
                        false).then();
            return;
        };

        let ordenarListadoPorFechaRegistro = false;

        var modalInstance = $modal.open({
            templateUrl: 'client/contab/asientosContables/imprimirListadoAsientosContables.html',
            controller: 'ImprimirListadoAsientosContablesModalController',
            size: 'md',
            resolve: {
                ciaSeleccionada: function () {
                    return companiaContab;
                },
            }
        }).result.then(
              function (resolve) {

                  let opciones = {
                      ordenarListadoPorFechaRegistro: resolve.ordenarPorFechaRegistro,
                      saveToDisk: resolve.saveToDisk
                  };

                  AsientosContables_Methods.imprimirListadoAsientosContables($scope.asientosContables, companiaContab, opciones);

                  return true;
              },
              function (cancel) {
                  return true;
              });
      };

    $scope.exportarAsientosContables_csv = () => {

        if (!_.isArray($scope.asientosContables) || _.isEmpty($scope.asientosContables)) {
            DialogModal($modal, "<em>Asientos Contables - Exportar formato csv</em>",
                        "Aparentemente, no se han seleccionado registros; no hay nada que exportar.",
                        false).then();
            return;
        };

        var modalInstance = $modal.open({
            templateUrl: 'client/contab/asientosContables/exportarAsientosContables_csv_Modal.html',
            controller: 'ExportarAsientosContables_csv_ModalController',
            size: 'md',
            resolve: {
                companiaContabSeleccionada: () => {
                    return companiaContab;
                }
            }
        }).result.then(
              function (resolve) {
                  return true;
              },
              function (cancel) {
                  return true;
              });

    };


    let asientosContables_ui_grid_api = null;
    let asientoContableSeleccionado = {};

    $scope.asientosContables_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            asientosContables_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                asientoContableSeleccionado = {};

                if (row.isSelected) {
                    asientoContableSeleccionado = row.entity;
                    asientoContable_leerByID_desdeSql(asientoContableSeleccionado.numeroAutomatico);
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
    };


    $scope.asientosContables_ui_grid.columnDefs = [
        {
            name: 'numero',
            field: 'numero',
            displayName: '#',
            width: '60',
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
            enableFiltering: true,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
        {
            name: 'tipo',
            field: 'tipo',
            displayName: 'Tipo',
            width: '70',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'descripcion',
            field: 'descripcion',
            displayName: 'Descripción',
            width: '240',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: '50',
            enableFiltering: true,
            cellFilter: 'monedaSimboloFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'monedaOriginal',
            field: 'monedaOriginal',
            displayName: 'Mon orig',
            width: '80',
            enableFiltering: true,
            cellFilter: 'monedaSimboloFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'cantidadPartidas',
            field: 'cantidadPartidas',
            displayName: 'Lineas',
            width: '50',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'totalDebe',
            field: 'totalDebe',
            displayName: 'Total debe',
            width: '120',
            enableFiltering: true,
            cellFilter: 'currencyFilter',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'totalHaber',
            field: 'totalHaber',
            displayName: 'Total haber',
            width: '120',
            enableFiltering: true,
            cellFilter: 'currencyFilter',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'factorDeCambio',
            field: 'factorDeCambio',
            displayName: 'Factor cambio',
            width: '90',
            enableFiltering: true,
            cellFilter: 'currencyFilter',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'provieneDe',
            field: 'provieneDe',
            displayName: 'Origen',
            width: '80',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'asientoTipoCierreAnualFlag',
            field: 'asientoTipoCierreAnualFlag',
            displayName: 'Cierre anual',
            width: '80',
            enableFiltering: true,
            cellFilter: 'boolFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'boolean'
        },
        {
            name: 'ingreso',
            field: 'ingreso',
            displayName: 'Ingreso',
            width: '100',
            enableFiltering: true,
            cellFilter: 'dateTimeFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
        {
            name: 'ultAct',
            field: 'ultAct',
            displayName: 'Ult act',
            width: '100',
            enableFiltering: true,
            cellFilter: 'dateTimeFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
    ];


    function asientoContable_leerByID_desdeSql(pk) {

        $scope.showProgress = true;

        // ejecutamos un método para leer el asiento contable en sql server y grabarlo a mongo (para el current user)
        Meteor.call('asientoContable_leerByID_desdeSql', pk, (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);
                
                $scope.$parent.alerts.length = 0;
                $scope.$parent.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });
    
                $scope.showProgress = false;
                $scope.$apply();
    
                return;
            }

            $state.go('contab.asientosContables.asientoContable', {
                origen: $scope.origen,
                id: result.asientoContableMongoID,
                pageNumber: 0,
                vieneDeAfuera: false
            })
        })
    }

    $scope.asientosContables = []
    $scope.asientosContables_ui_grid.data = [];

    // suscribimos a los asientos que se han leído desde sql y grabado a mongo para el usuario
    $scope.showProgress = true;
    Meteor.subscribe('tempConsulta_asientosContables', () => {

        $scope.asientosContables = Temp_Consulta_AsientosContables.find({ user: Meteor.userId() },
                                                                        { sort: { fecha: true, numero: true }})
                                                                  .fetch();

        $scope.asientosContables_ui_grid.data = $scope.asientosContables;

        $scope.$parent.alerts.length = 0;
        $scope.$parent.alerts.push({
            type: 'info',
            msg: `<b>${$scope.asientosContables.length.toString()}</b> registros han sido seleccionados ...`
        });

        $scope.showProgress = false;
        $scope.$apply();
    });

    $scope.exportarAsientosContables = () => {
        var modalInstance = $modal.open({
            templateUrl: 'client/contab/asientosContables/exportarAArchivoTexto_Modal.html',
            controller: 'ExportarAArchivoTextoModal_Controller',
            size: 'md',
            resolve: {
                companiaContabSeleccionada: () => {
                    return companiaContab;
                }
            }
        }).result.then(
              function (resolve) {
                  return true;
              },
              function (cancel) {
                  return true;
              });
    }


    $scope.importarAsientosContables = () => {
        var modalInstance = $modal.open({
            templateUrl: 'client/contab/asientosContables/importarAsientosDesdeArchivoTexto_Modal.html',
            controller: 'ImportarAsientosDesdeArchivoTexto_Controller',
            size: 'md',
            resolve: {
                companiaContabSeleccionada: () => {
                    return companiaContab;
                }
            }
        }).result.then(
              function (resolve) {
                  return true;
              },
              function (cancel) {
                  return true;
              });
    }


    $scope.corregirMontosMas2Decimales = function() { 

        $scope.showProgress = true; 

        // construimos un array con los IDs de los asientos en la lista, para enviarlo a un meteor method que corrija estos 
        // asientos ... 
        let asientosSeleccionadosArray = []; 

        for (let asiento of $scope.asientosContables) { 
            asientosSeleccionadosArray.push(asiento.numeroAutomatico); 
        }

        Meteor.call('asientosContables.mas2decimales.corregir', asientosSeleccionadosArray, (err, result) => {

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
                
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: result.message
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result.message
            });

            $scope.showProgress = false;
            $scope.$apply();
        })
        
    }

  }
]);


import lodash from 'lodash';
import { Monedas } from '/imports/collections/monedas';

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

AngularApp.controller("Contab_AsientoContableFiltro_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal', 'uiGridConstants',
function ($scope, $stateParams, $state, $meteor, $modal, uiGridConstants) {

    $scope.showProgress = false;

    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
    };

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.origen = $stateParams.origen;

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaContab = {};

    if (companiaContabSeleccionada)
        companiaContab = Companias.findOne(companiaContabSeleccionada.companiaID, { fields: { numero: true, nombre: true, nombreCorto: true } });
    // ------------------------------------------------------------------------------------------------


    // -------------------------------------------------------------------------------------------
    // leemos los catálogos en el $scope

    $scope.helpers({

        tiposAsientoContable: () => {
            return TiposAsientoContable.find();
        },

        monedas: () => {
            return Monedas.find();
        },

        cuentasContables: () => {
            return CuentasContables2.find({ cia: companiaContab.numero, totDet: 'D' }, { sort: { cuenta: true }});
        },

    });


    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    };


    $scope.aplicarFiltroYAbrirLista = function () {

        if (lodash.isEmpty($scope.filtro)) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: `Por favor indique un <b><em>filtro</em></b> a este proceso. La ejecución de este proceso sin la aplicación de un filtro seria,
                      probablemente, muy costosa.`
            });

            return;
        }

        $scope.showProgress = true;
        $scope.filtro.cuentasContables = [];

        cuentasContablesSeleccionadas.forEach((x) => { $scope.filtro.cuentasContables.push(x); });

        Meteor.call('contab.asientosContables.LeerDesdeSqlServer', JSON.stringify($scope.filtro), companiaContab.numero, (err, result) => {

            if (err) {

                let errorMessage = "<b>Error:</b> se ha producido un error al intentar ejecutar la operación.";
                if (err.errorType)
                    errorMessage += " (" + err.errorType + ")";

                errorMessage += "<br />";

                if (err.message)
                    // aparentemente, Meteor compone en message alguna literal que se regrese en err.reason ...
                    errorMessage += err.message + " ";
                else {
                    if (err.reason)
                        errorMessage += err.reason + " ";

                    if (err.details)
                        errorMessage += "<br />" + err.details;
                };

                if (!err.message && !err.reason && !err.details)
                    errorMessage += err.toString();


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
            if (Filtros.findOne({ nombre: 'asientosContables', userId: Meteor.userId() }))
                // el filtro existía antes; lo actualizamos
                // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                Filtros.update(Filtros.findOne({ nombre: 'asientosContables', userId: Meteor.userId() })._id,
                               { $set: { filtro: $scope.filtro } },
                               { validate: false });
            else
                Filtros.insert({
                    _id: new Mongo.ObjectID()._str,
                    userId: Meteor.userId(),
                    nombre: 'asientosContables',
                    filtro: $scope.filtro
                });
            // ------------------------------------------------------------------------------------------------------

            // // suscribimos a los asientos que se han leído desde sql y grabado a mongo para el usuario
            // Meteor.subscribe('tempConsulta_asientosContables', () => {

                $scope.showProgress = false;
                $state.go('contab.asientosContables.lista', { origen: $scope.origen, pageNumber: -1 });
            // });
        });
    };


    let cuentasContables_ui_grid_api = null;
    let cuentasContablesSeleccionadas = [];

    $scope.cuentasContables_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableFiltering: true,
      //   enableCellEdit: false,
      //   enableCellEditOnFocus: false,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: true,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            cuentasContables_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                if (row.isSelected) {
                    cuentasContablesSeleccionadas.push(row.entity.id);
                }
                else {
                    _.remove(cuentasContablesSeleccionadas, (x) => { return x === row.entity.id; });
                    return;
                };
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


    $scope.cuentasContables_ui_grid.columnDefs = [
        {
            name: 'cuenta',
            field: 'cuenta',
            displayName: 'Cuenta',
            width: 150,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'descripcion',
            field: 'descripcion',
            displayName: 'Descripción',
            width: 250,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'actSusp',
            field: 'actSusp',
            displayName: 'Act/Susp',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'cia',
            field: 'cia',
            displayName: 'Cia contab',
            cellFilter: 'companiaAbreviaturaFilter',
            width: 100,
            enableFiltering: false,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'number'
        },
    ];


    $scope.cuentasContables_ui_grid.data = $scope.cuentasContables;

    $scope.nuevo = function () {
        $state.go("contab.asientosContables.asientoContable", { origen: 'edicion', id: '0', pageNumber: -1, vieneDeAfuera: false });
    };


    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación

    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'asientosContables', userId: Meteor.userId() });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior)
        $scope.filtro = _.clone(filtroAnterior.filtro);


    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'contab', process: 'leerAsientosDesdeSqlServer' });
    EventDDP.addListener('contab_leerAsientosDesdeSqlServer_reportProgress', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
}
]);

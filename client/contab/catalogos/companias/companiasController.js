

import lodash from 'lodash';

angular.module("contabM.contab.catalogos").controller("Catalogos_Companias_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      }

      // ------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada; solo para impedir eliminarla ...
      let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
      let companiaContabSeleccionada = {};

      if (companiaSeleccionada)
          companiaContabSeleccionada = Companias.findOne(companiaSeleccionada.companiaID);
      // ------------------------------------------------------------------------------------------------

      let companias_ui_grid_api = null;
      let itemSeleccionado = {};

      $scope.companias_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableCellEdit: false,
          enableCellEditOnFocus: true,
          enableRowSelection: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

              companias_ui_grid_api = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  //debugger;
                  itemSeleccionado = {};
                  if (row.isSelected) {
                      itemSeleccionado = row.entity;
                  }
                  else
                      return;
              });

              gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                  if (newValue != oldValue) {
                      if (!rowEntity.docState) {
                          rowEntity.docState = 2;
                      };
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


      $scope.companias_ui_grid.columnDefs = [
          {
              name: 'docState',
              field: 'docState',
              displayName: '',
              cellTemplate:
              '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableColumnMenu: false,
              enableSorting: false,
              width: 25
          },
          {
              name: 'numero',
              field: 'numero',
              displayName: '#',
              width: 40,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'nombre',
              field: 'nombre',
              displayName: 'Nombre',
              width: 250,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'nombreCorto',
              field: 'nombreCorto',
              displayName: 'Nombre corto',
              width: 150,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'abreviatura',
              field: 'abreviatura',
              displayName: 'Abreviatura',
              width: 100,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'rif',
              field: 'rif',
              displayName: 'Rif',
              width: 100,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'delButton',
              displayName: '',
              cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableSorting: false,
              width: 25
          },
      ];

      $scope.deleteItem = function (item) {
          if (item.docState && item.docState === 1)
              // si el item es nuevo, simplemente lo eliminamos del array
              _.remove($scope.companias, (x) => { return x._id === item._id; });
          else
              item.docState = 3;
      };




      $scope.save = function () {

           $scope.showProgress = true;

           // eliminamos los items eliminados; del $scope y del collection
           let editedItems = _.filter($scope.companias, function (item) { return item.docState; });

           // nótese como validamos cada item antes de intentar guardar (en el servidor)
           let isValid = false;
           let errores = [];

           editedItems.forEach((item) => {
               if (item.docState != 3) {
                   isValid = Companias.simpleSchema().namedContext().validate(item);

                   if (!isValid) {
                       Companias.simpleSchema().namedContext().invalidKeys().forEach(function (error) {
                           errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + Companias.simpleSchema().label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
                       });
                   }
               }
           })


           // impedimos que el usuario intente eliminar la compañía que está ahora seleccionada ...
           if (lodash.some(editedItems, (x) => { return x._id === companiaContabSeleccionada._id; })) {
             $scope.alerts.push({
                 type: 'danger',
                 msg: "Error: Ud. no puede eliminar la compañia que está ahora seleccionada."
             });

             $scope.showProgress = false;
             return;
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
           };

           Meteor.call('generales.companiasSave', editedItems, (err, result) => {

             if (err) {
                 let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

                 $scope.alerts.length = 0;
                 $scope.alerts.push({
                     type: 'danger',
                     msg: errorMessage
                 });

                 $scope.showProgress = false;
                 $scope.$apply();

                 return;
             }

             // por alguna razón, que aún no entendemos del todo, si no hacemos el subscribe nuevamente,
             // se queda el '*' para registros nuevos en el ui-grid ...

             // NOTA: el publishing de este collection es 'automático'; muchos 'catálogos' se publican
             // de forma automática para que estén siempre en el cliente ...

             // TODO: revisar éste código; Compañías viene en forma automática; debe venir al cliente y refrescar todo en forma
             // automática ...

            //  cuentasContablesSubscriptioHandle = Meteor.subscribe("cuentasContables", {
            //      onReady: function () {
             //
            //        $scope.helpers({
            //            companias: () => {
            //              return Companias.find(companiasFilter, { sort: { nombre: 1 } });
            //            }
            //        });
             //
            //        $scope.companias_ui_grid.data = [];
            //        $scope.companias_ui_grid.data = $scope.companias;
             //
            //        $scope.showProgress = false;
            //        $scope.$apply();
            //      },
            //    })

                $scope.companias = [];
                $scope.helpers({
                     companias: () => {
                       return Companias.find(companiasFilter, { sort: { nombre: 1 } });
                     }
                 });

                 $scope.companias_ui_grid.data = [];
                 $scope.companias_ui_grid.data = $scope.companias;

                 $scope.alerts.length = 0;
                 $scope.alerts.push({
                     type: 'info',
                     msg: result
                 });

                $scope.showProgress = false;
                $scope.$apply();
             })
           }



























      // -------------------------------------------------------------------------------------------------
      // compañías permitidas: para algunas usuarios, el administrador puede asignar solo algunas compañías; el
      // resto estarían restringidas para el mismo. Las agregamos en un array y regeresamos solo éstas, para que
      // el usuario solo pueda seleccionar en ese grupo ...
      let companiasPermitidas = [];
      let currentUser = Meteor.users.findOne(Meteor.userId());

      if (currentUser) {
          if (currentUser.companiasPermitidas) {
              currentUser.companiasPermitidas.forEach((companiaID) => {
                  companiasPermitidas.push(companiaID)
              });
          };
      };

      let companiasFilter = companiasPermitidas.length ?
                            { _id: { $in: companiasPermitidas }} :
                            { _id: { $ne: "xyz_xyz" }};
      // -------------------------------------------------------------------------------------------------

      $scope.helpers({
          companias: () => {
            return Companias.find(companiasFilter, { sort: { nombre: 1 } });
          }
      });

      $scope.companias_ui_grid.data = $scope.companias;
}
]);

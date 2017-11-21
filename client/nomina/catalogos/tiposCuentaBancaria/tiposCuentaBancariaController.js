

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm").controller("Catalogos_Nomina_TiposCuentaBancaria_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

    //   debugger;
      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      $scope.tiposCuentaBancaria_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
        //   enableCellEdit: false,
        //   enableCellEditOnFocus: false,
          enableRowSelection: false,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 35,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

            //   // marcamos el contrato como actualizado cuando el usuario edita un valor
            //   gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
            //       if (newValue != oldValue)
            //           if (!rowEntity.docState)
            //               rowEntity.docState = 2;
            //   });
          },
          // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
          rowIdentity: function (row) {
              return row._id;
          },

          getRowIdentity: function (row) {
              return row._id;
          }
      };


      $scope.tiposCuentaBancaria_ui_grid.columnDefs = [
          {
              name: 'tipoCuenta',
              field: 'tipoCuenta',
              displayName: 'Tipo',
              width: "*",
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'descripcion',
              field: 'descripcion',
              displayName: 'Descripción',
              width: "*",
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
      ];

    //   $scope.companias = $scope.$meteorCollection(
    //       function() { return Companias.find({}, { sort: { nombre: 1 } }); } , false);

      $scope.helpers({
          tiposDeCuentaBancaria: () => {
            return TiposDeCuentaBancaria.find({}, { sort: { descripcion: 1 } });
          }
      });

      $scope.tiposCuentaBancaria_ui_grid.data = $scope.tiposDeCuentaBancaria;
}
]);

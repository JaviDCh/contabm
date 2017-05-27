

// Este controller (angular) se carga con la página primera del programa
AngularApp.controller("Contab_PersistirCuentasContables_Controller",
['$scope', '$meteor', '$modal', '$reactive', function ($scope, $meteor, $modal, $reactive) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        this.alerts.splice(index, 1);
    };

    $scope.persistirCatalogoCuentasContables = function() {

        $scope.showProgress = true;

        $meteor.call('contab.cloneCatalogoCuentasContables').then(
          function (data) {

              // una vez que el (server) method clonea el collection en CuentasContables2,
              // hacemos la sincronización ...

              // 1) en el servidor, simplemente, el método copia cada item en CuentasContables a CuentasContables2
              // 2) en el cliente, al sincronizar, el collection llega al cliente y se queda allí ... 
              CuentasContables2.clear();
              CuentasContables2.sync();

              Tracker.autorun(() => {
                  // mostramos un mensaje cuando el (dumb) collection ha sincronizado ..
                  if (CuentasContables2.synced()) {
                      $scope.alerts.length = 0;
                      $scope.alerts.push({
                          type: 'info',
                          msg: data
                      });

                      $scope.showProgress = false;
                      $scope.$apply();
                  };
              });
          },
          function (err) {
              let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: errorMessage
              });

              $scope.showProgress = false;
          });
      };


    }
]);

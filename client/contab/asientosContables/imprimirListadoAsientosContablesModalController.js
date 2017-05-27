
AngularApp.controller('ImprimirListadoAsientosContablesModalController',
['$scope', '$modalInstance', '$modal',
function ($scope, $modalInstance, $modal) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        $modalInstance.close({
            ordenarPorFechaRegistro: $scope.parametros.ordenarPorFechaRegistro,
            saveToDisk: $scope.parametros.saveFileToDisk 
        });
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.submitted = false;
    $scope.parametros = {};

    $scope.submitListadoAsientosContablesForm = function () {
        $scope.submitted = true;
        if ($scope.listadoAsientosContablesForm.$valid) {
            $scope.submitted = false;
            // para que la clase 'ng-submitted deje de aplicarse a la forma ... button
            $scope.listadoAsientosContablesForm.$setPristine();
            $scope.ok();
        };
    };
}
]);

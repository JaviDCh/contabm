
AngularApp.controller("Bancos_ConciliacionesBancarias_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal',
function ($scope, $stateParams, $state, $meteor, $modal) {
      // ------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada
      let ciaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
      let companiaSeleccionada = {};

      if (ciaContabSeleccionada)
          companiaSeleccionada = Companias.findOne(ciaContabSeleccionada.companiaID, { fields: { numero: true, nombre: true, nombreCorto: true } });

      $scope.companiaSeleccionada = {};

      if (companiaSeleccionada)
          $scope.companiaSeleccionada = companiaSeleccionada;
      else
          $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
      // ------------------------------------------------------------------------------------------------

      $scope.showProgress = true;

      // ---------------------------------------------------------------------------------------------
      // construimos un array de cuentas bancarios, adecuado para mostrar en la lista en el filtro ...

      // en nuestro programa, el collecion Bancos tiene un array de agencias y, dentro, un array
      // de cuentas bancarias; con la siguiente función, regresamos una lista 'plana' para acceder
      // en forma más fácil las cuentas bancarias
      let cuentasBancariasList = FuncionesGlobalesBancos.flattenBancos(companiaSeleccionada);
      $scope.cuentasBancarias = [];

      cuentasBancariasList.forEach((cuenta) => {
          let cuentaBancaria = {
              _id: new Mongo.ObjectID()._str,
              cuentaBancaria: cuenta.cuentaInterna,
              descripcion: `${cuenta.nombreBanco} - ${cuenta.simboloMoneda} - ${cuenta.cuentaBancaria}`,
              banco: cuenta.banco,
              moneda: cuenta.moneda,
          };

          $scope.cuentasBancarias.push(cuentaBancaria);
      });

      $scope.showProgress = false;
  }
]);

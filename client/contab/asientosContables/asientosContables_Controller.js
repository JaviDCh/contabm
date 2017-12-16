

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

angular.module("contabm").controller("Contab_AsientosContables_Controller", ['$scope', '$stateParams', '$state', function ($scope, $stateParams, $state) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }
    
    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = {};

    if (companiaSeleccionada) { 
        companiaSeleccionadaDoc = Companias.findOne(companiaSeleccionada.companiaID, { fields: { numero: true, nombre: true, nombreCorto: true } });
    }
        
    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc) { 
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    } 
    else { 
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    } 
    // ------------------------------------------------------------------------------------------------


    // ejecutamos un método para leer los centros de costro desde sql server 
    // los centros de costro no existen en mongo; los leemos directamente desde sql server y los agregamos a un array en $scope para que estén 
    // disponiles para todos los children de este state ... 
    $scope.showProgress = true;
    $scope.centrosCosto = [];

    Meteor.call('contab.leerCentrosCostro.desdeSqlServer',(err, result) => {

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

        $scope.centrosCosto = JSON.parse(result); 

        $scope.showProgress = false;
        $scope.$apply();
    })
  }
]);

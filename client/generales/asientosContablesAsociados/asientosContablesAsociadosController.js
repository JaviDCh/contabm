
import moment from 'moment';

AngularApp.controller('AsientosContablesAsociados_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', '$state', 'provieneDe', 'entidadID', 'ciaSeleccionada', 'origen',
function ($scope, $modalInstance, $modal, $meteor, $state, provieneDe, entidadID, ciaSeleccionada, origen) {

    // abrimos un modal para mostrar los asientos contables asociados a alguna entidad; ejemplos de
    // entidades son: bancos, facturas, nomina, pagos, etc.

    // un ejemplo de un asiento asociado a un movimiento bancario, tendría estos valores en estos
    // campos: ProvieneDe: 'Bancos', ProvieneDe_ID: claveUnica del movimiento bancario.

    // origen: edicion/consulta; la idea es permitir o no editar el asiento contable mostrado o
    // permtir construir uno ...

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.companiaSeleccionada = ciaSeleccionada;

    $scope.ok = function (asientoContableID) {
        // regresamos el _id del asiento que el usuario seleccionó en la lista ...
        // let result = { asientoContableID: asientoContableID };
        // $modalInstance.close(result);
        $modalInstance.close('Ok');
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.provieneDe = "";

    switch (provieneDe) {
        case "Bancos":
            $scope.provieneDe = "Movimientos bancarios";
            break;
        case "Facturas":
            $scope.provieneDe = "Facturas";
            break;
        default:
            $scope.provieneDe = "Indefinido (??)";
    }

    $scope.origen = origen;
    $scope.asientosContablesAsociadosList = [];

    $scope.showProgress = true;

    Meteor.call('leerAsientosContablesAsociados', provieneDe, entidadID, ciaSeleccionada.numero, (err, result) =>  {

        if (err) {
            let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

            $scope.alerts.length = 0;
            $scope.alerts.push({ type: 'danger', msg: errorMessage });

            $scope.showProgress = false;
            $scope.$apply();

            return;
        }

        let asientosContablesAsociadosList = JSON.parse(result);

        // las fechas siempre quedan como strings luego de serializadas
        asientosContablesAsociadosList.forEach((x) => {
            x.fecha = moment(x.fecha).format('DD-MMM-YYYY');
        })

        $scope.asientosContablesAsociadosList = asientosContablesAsociadosList;

        $scope.alerts.length = 0;
        $scope.alerts.push({
            type: 'info',
            msg: `Ok, <b>${asientosContablesAsociadosList.length}</b> asientos contables han sido
                  leídos para esta entidad.<br />
                  Haga un <em>click</em> en alguno de ellos para mostrarlo en forma separada.`,
        });

        $scope.showProgress = false;
        $scope.$apply();
    })


    $scope.mostrarAsientoSeleccionado = (asientoContableID) => {

        $scope.showProgress = false;

        // cerramos el modal y regresamos el pk del asiento seleccionado ...
        // $scope.ok(asientoContableID);

        // ejecutamos un método para leer el asiento contable en sql server y grabarlo a mongo
        // (para el current user)
        Meteor.call('asientoContable_leerByID_desdeSql', asientoContableID, (err, result) => {

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
            };

            let filtro = {
                _id: result.asientoContableMongoID
            };

            // nótese como angular nos permite abrir un route desde el code y, con window.open, en otro Tab ...
            var url2 = $state.href('contab.asientosContables.asientoContable',
                                   {
                                       origen: origen,
                                       id: result.asientoContableMongoID,
                                       pageNumber: 0,
                                       vieneDeAfuera: true
                                   });

            window.open(url2, '_blank');

            $scope.showProgress = false;
        });
    };

    $scope.agregarAsientoContable = () => {
        $scope.showProgress = true;
        // ejecutamos un método en el servidor que lee la 'entidad' (factura, mov banc, pago, etc.) y
        // agrega un asiento contable para la mismo ...
        Meteor.call('generales.agregarAsientoContableAEntidad', provieneDe, entidadID, ciaSeleccionada.numero, (err, result) => {

            if (err) {
                let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage,
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            if (result.error) {
                // se produjo un error al intentar construir y grabar el asiento contable asociado
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: result.message,
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            // luego de agregado el asiento para la entidad, leemos y mostramos en la lista ...
            Meteor.call('leerAsientosContablesAsociados', provieneDe, entidadID, ciaSeleccionada.numero, (err, result) => {

                if (err) {
                    let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: errorMessage });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                let asientosContablesAsociadosList = JSON.parse(result);

                // las fechas siempre quedan como strings luego de serializadas
                asientosContablesAsociadosList.forEach((x) => {
                    x.fecha = moment(x.fecha).format('DD-MMM-YYYY');
                });

                $scope.asientosContablesAsociadosList = asientosContablesAsociadosList;

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: `Ok, <b>${asientosContablesAsociadosList.length}</b> asientos contables han sido leídos para
                          esta entidad.<br />
                          Haga un <em>click</em> en alguno de ellos para mostrarlo en forma separada.`,
                })

                $scope.showProgress = false;
                $scope.$apply();
            })
        })
    }
}
]);

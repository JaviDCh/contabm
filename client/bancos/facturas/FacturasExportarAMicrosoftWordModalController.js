
import moment from 'moment'; 

AngularApp.controller('FacturasExportarAMicrosoftWordModalController',
['$scope', '$modalInstance', '$modal', '$meteor', 'tiposArchivo', 'aplicacion', 'ciaSeleccionada', 'factura', 'facturasFiltro', 'user',
function ($scope, $modalInstance, $modal, $meteor, tiposArchivo, aplicacion, ciaSeleccionada, factura, facturasFiltro, user) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.companiaSeleccionada = ciaSeleccionada;

    $scope.ok = function () {
        $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.helpers({
        template_files: () => {
            return Files_CollectionFS_Templates.find({
                'metadata.tipo': { $in: tiposArchivo },
                'metadata.aplicacion': aplicacion,
            });
        },
    });

    $scope.downLoadWordDocument = false;
    $scope.selectedFile = {};
    $scope.downLoadLink = "";

    $scope.obtenerDocumentoWord = (file) => {
        $scope.showProgress = true;

        if (file.metadata.tipo === 'BANCOS-RET-IMP-IVA') {
            // construimos y pasamos el período al meteor method
            let periodoRetencion = `${moment(factura.fechaRecepcion).format('MM')} - ${moment(factura.fechaRecepcion).format('YYYY')}`;

            $meteor.call('bancos.facturas.obtenerComprobanteRetencionIva',
                         file._id,
                         file.metadata.tipo,
                         ciaSeleccionada,
                         user,
                         factura.proveedor,
                         factura.numeroComprobante,
                         periodoRetencion,
                         file.original.name).then(
                function (data) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: `Ok, el documento (Word) ha sido construido en forma exitosa.<br />
                              Haga un <em>click</em> en el <em>link</em> que se muestra para obtenerlo.`,
                    });

                    $scope.selectedFile = file;
                    $scope.downLoadLink = data;
                    $scope.downLoadWordDocument = true;

                    $scope.showProgress = false;
                },
                function (err) {

                    let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: errorMessage });

                    $scope.showProgress = false;
                })
        } else if (file.metadata.tipo === 'BANCOS-RET-IMP-ISLR') {
            $meteor.call('bancos.facturas.obtenerComprobanteRetencionIslr',
                         file._id,
                         file.metadata.tipo,
                         user,
                         factura.claveUnica,
                         file.original.name).then(
                function (data) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: `Ok, el documento (Word) ha sido construido en forma exitosa.<br />
                              Haga un <em>click</em> en el <em>link</em> que se muestra para obtenerlo.`,
                    });

                    $scope.selectedFile = file;
                    $scope.downLoadLink = data;
                    $scope.downLoadWordDocument = true;

                    $scope.showProgress = false;
                },
                function (err) {

                    let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: errorMessage });

                    $scope.showProgress = false;
                })
        } else if (file.metadata.tipo === 'BANCOS-FACTURAS') {
            $meteor.call('bancos.facturas.obtenerFacturaImpresa',
                         file._id,
                         file.metadata.tipo,
                         user,
                         facturasFiltro,
                         file.original.name).then(
                function (data) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: `Ok, el documento (Word) ha sido construido en forma exitosa.<br />
                              Haga un <em>click</em> en el <em>link</em> que se muestra para obtenerlo.`,
                    });

                    $scope.selectedFile = file;
                    $scope.downLoadLink = data;
                    $scope.downLoadWordDocument = true;

                    $scope.showProgress = false;
                },
                function (err) {

                    let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: errorMessage });

                    $scope.showProgress = false;
                })
        };
    };

    // --------------------------------------------------------------------------------------------------------------------
    // suscribimos a las imagenes registradas para la cia seleccionada
    $scope.showProgress = true;

    $scope.subscribe("template_files", () => { return [ aplicacion, tiposArchivo, ]; }, {
        onReady: function () {
            $scope.showProgress = false;
            $scope.$apply();
        },
        onStop: function (error) {
            $scope.showProgress = false;
            $scope.$apply();
      }
    });
  // --------------------------------------------------------------------------------------------------------------------
}
]);

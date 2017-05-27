
AngularApp.controller('BancosConciliacionBancariaImportarDesdeExcel_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', 'conciliacionBancariaID', 'companiaSeleccionada',
function ($scope, $modalInstance, $modal, $meteor, conciliacionBancariaID, companiaSeleccionada) {

    // debugger;
    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.companiaSeleccionada = companiaSeleccionada;

    // para leer el archivo seleccionado mediante el Input ...
    let userSelectedFile = null;
    $scope.uploadFile = function(files) {
      userSelectedFile = files[0];
    };

    // para validar que la fecha sea un Date correcto
    let ValidDateFormats = [ "DD-MM-YYYY", "DD-MM-YY" ];

    // para cargar el array de lineas desde el documento Excel
    let lineasLeidasDesdeExcel = [];

    $scope.submit_TratarFilesForm = function () {

          $scope.submitted = true;

          $scope.alerts.length = 0;

          if (!userSelectedFile) {
              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: `Aparentemente, Ud. no ha seleccionado un archivo (Excel) desde su PC aún.<br />
                        Ud. debe seleccionar un archivo (Excel) antes de intentar ejecutar este proceso.`
              });

              return;
          };

          if ($scope.tratarFilesForm.$valid) {
              $scope.submitted = false;
              $scope.tratarFilesForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

              $scope.showProgress = true;

              let f = userSelectedFile;

              var reader = new FileReader();
              var name = f.name;

              let lineasExcelLeidas = 0;
              let lineasExcelObviadas = 0;

              reader.onload = function(e) {
                    let data = e.target.result;

                    let workbook = XLSX.read(data, {type: 'binary'});
                    let first_sheet_name = workbook.SheetNames[0];

                    /* Get worksheet */
                    var worksheet = workbook.Sheets[first_sheet_name];

                    /* DO SOMETHING WITH workbook HERE */
                    let lineasEnDocumentoExcel = XLSX.utils.sheet_to_json(worksheet, {raw: true});

                    lineasLeidasDesdeExcel.length = 0;

                    lineasEnDocumentoExcel.forEach((linea) => {

                        let numero = linea['numero'] ? linea['numero'].toString() : "";
                        numero = linea['número'] ? linea['número'].toString() : "";
                        let tipo = linea['tipo'] ? linea['tipo'] : null;
                        let fecha = linea['fecha'] ? linea['fecha'] : null;
                        let beneficiario = linea['beneficiario'] ? linea['beneficiario'] : null;
                        let concepto = linea['concepto'] ? linea['concepto'] : null;
                        let monto = linea['monto'] ? linea['monto'] : null;

                        // intentamos convertir el monto y la fecha a valores adecuados
                        // Excel regresa un entero, cantidad de días desde 1.900, para las fechas
                        if (lodash.isInteger(fecha)) {
                            fecha = FuncionesGlobales.getJsDateFromExcel(fecha);
                            // aparentemte, si quitamos la hora a la fecha anterior, queda la fecha
                            // del día en forma adecuada; lo hacemos con moment
                            fecha = moment(moment(fecha).format("YYYY-MM-DD"), "YYYY-MM-DD").toDate(); 
                        };

                        // si la fecha no vino como un entero (ej: 40603), tal vez sea un verdadero date
                        // pero como un string ...
                        if (!_.isDate(fecha) && moment(fecha, ValidDateFormats, true).isValid()) {
                            // la fecha no es válida pero es un string válido
                            fecha = moment(fecha).toDate();
                        };

                        // por ahora, el monto debe siempre venir en español: 1000,75 o 1.000,75 ...
                        // pero lo convertimos a un Number válido en JS ...
                        if (monto) {
                            if (!lodash.isFinite(monto)) {
                                monto = monto.toString().trim();
                                monto = monto.replace(".", "");
                                monto = monto.replace(",", ".");    // ahora debe ser: 10.7, 100.75, 1058.15, etc.
                                // validamos que el string sea un Number
                                if (!isNaN(parseFloat(monto)) && isFinite(monto)) {
                                    monto = parseFloat(monto);
                                };
                            };
                        };

                        // isFinite valida que el valor corresponda a un Number, pero no NaN or Infinity
                        if (fecha && lodash.isDate(fecha) && monto && lodash.isFinite(monto)) {
                            let item = {
                                _id: new Mongo.ObjectID()._str,
                                numero: numero,
                                tipo: tipo,
                                fecha: fecha,
                                beneficiario: beneficiario,
                                concepto: concepto,
                                monto: monto,
                            };

                            lineasLeidasDesdeExcel.push(item);
                            lineasExcelLeidas++;
                        } else {
                            lineasExcelObviadas++;
                        };
                    });


                    // cerramos el modal y terminamos ...
                    $(":file").filestyle('clear');              // para regresar el input (file) a su estado inicial (ie: no selected file)
                    $(":file").filestyle('disabled', false);     // (no) desabilitamos el input-file

                    $scope.showProgress = false;

                    promise = DialogModal($modal,
                                          `<em>Conciliación bancaria - Movimientos del banco - Importar desde Excel</em>`,
                                          `Ok, este proceso ha leído <b>${lineasExcelLeidas.toString()}</b>
                                           movimientos bancarios desde el documento Excel.<br />
                                           Además, ha obviado <b>${lineasExcelObviadas.toString()}</b> lineas, por no contener una
                                           fecha y/o un monto válidos.<br /><br />
                                           Ud. debe hacer un <em>click</em> en <em>Registrar movimientos del banco</em>
                                           para que los movimientos leídos sean grabados en la base de datos.
                                          `,
                                          false).then();
              };

              reader.readAsBinaryString(f);
        };
    };


    $scope.registrarMovimientosBanco = () => {

        $scope.showProgress = true;

        $meteor.call('bancos_conciliacion_GrabarMovtosBanco',
                     conciliacionBancariaID,
                     JSON.stringify(lineasLeidasDesdeExcel)).then(
            function (data) {

                if (data.error) {
                    // el método que intenta grabar los cambis puede regresar un error cuando,
                    // por ejemplo, la fecha corresponde a un mes ya cerrado en Bancos ...
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: data.message
                    });
                    $scope.showProgress = false;
                } else {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: data.message
                    });

                    $scope.showProgress = false;
                };
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


    $modalInstance.rendered.then(function(){
        // para mejorar el style al input type="file" ...
        // nótese que, en caso de bootstrap modals, ponemos en 'rendered'; de otra forma, los estilos no se aplican
        // correctamente al input ...
        $(":file").filestyle();
        $(":file").filestyle('buttonName', 'btn-primary');
        $(":file").filestyle('buttonText', '&nbsp;&nbsp;1) Seleccione un documento Excel ...');
        $(":file").filestyle('disabled', false);
        $(":file").filestyle({iconName: "glyphicon-file"});
        $(":file").filestyle('size', 'sm');
        // $(":file").filestyle({input: false});
    });
}
]);

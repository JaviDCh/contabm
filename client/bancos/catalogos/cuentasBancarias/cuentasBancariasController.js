

// Este controller (angular) se carga con la página primera del programa
AngularApp.controller("Catalogos_CuentasBancarias_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      // ------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada
      let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
      let companiaSeleccionadaDoc = {};

      if (companiaSeleccionada)
          companiaSeleccionadaDoc = Companias.findOne(companiaSeleccionada.companiaID, { fields: { numero: true, nombre: true, nombreCorto: true } });

      $scope.companiaSeleccionada = {};

      if (companiaSeleccionadaDoc)
          $scope.companiaSeleccionada = companiaSeleccionadaDoc;
      else
          $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
      // ------------------------------------------------------------------------------------------------

      let bancos_ui_grid_api = null;
      let bancoSeleccionado = {};

      $scope.bancos_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableRowSelection: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

              bancos_ui_grid_api = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  bancoSeleccionado = {};

                  $scope.agencias_ui_grid.data = [];
                  $scope.cuentasBancarias_ui_grid.data = [];

                  if (row.isSelected) {
                      bancoSeleccionado = row.entity;
                      $scope.agencias_ui_grid.data = bancoSeleccionado.agencias ? bancoSeleccionado.agencias : [];
                  }
                  else
                      return;
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

      $scope.bancos_ui_grid.columnDefs = [
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
              name: 'codigo',
              field: 'codigo',
              displayName: 'Código',
              width: 80,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
      ];


      let agencias_ui_grid_api = null;
      let agenciaSeleccionada = {};

      $scope.agencias_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableRowSelection: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

              agencias_ui_grid_api = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  //debugger;
                  agenciaSeleccionada = {};
                  $scope.cuentasBancarias_ui_grid.data = [];

                  if (row.isSelected) {
                      agenciaSeleccionada = row.entity;
                      $scope.cuentasBancarias_ui_grid.data =
                            agenciaSeleccionada.cuentasBancarias ?
                            _.filter(agenciaSeleccionada.cuentasBancarias, (x) => {
                                return x.cia === companiaSeleccionadaDoc.numero;
                            }) :
                            [];
                  }
                  else
                      return;
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


      $scope.agencias_ui_grid.columnDefs = [
          {
              name: 'nombre',
              field: 'nombre',
              displayName: 'Nombre',
              width: 120,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'direccion',
              field: 'direccion',
              displayName: 'Dirección',
              width: 150,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'telefono1',
              field: 'telefono1',
              displayName: 'Teléfono',
              width: 80,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'telefono2',
              field: 'telefono2',
              displayName: 'Teléfono',
              width: 80,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'fax',
              field: 'fax',
              displayName: 'Fax',
              width: 80,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'contacto1',
              field: 'contacto1',
              displayName: 'Contacto',
              width: 100,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'contacto2',
              field: 'contacto2',
              displayName: 'Contacto',
              width: 100,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
      ];

      let cuentasBancarias_ui_grid_api = null;
      let cuentaBancariaSeleccionada = {};

      $scope.cuentaBancaria_ChequeraSeleccionada = "";          // para mostrar el nombre de la cuenta sobre el grid de chequeras

      let chequerasSubscriptionHandle = null;

      $scope.cuentasBancarias_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableRowSelection: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,
          onRegisterApi: function (gridApi) {

              cuentasBancarias_ui_grid_api = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  cuentaBancariaSeleccionada = {};

                  $scope.chequeras_ui_grid.data = [];
                  $scope.cuentaBancaria_ChequeraSeleccionada = "";

                  if (row.isSelected) {
                      cuentaBancariaSeleccionada = row.entity;

                      // TODO: suscribirnos a las chequeras de la cuenta bancaria y mostrarlas en el ui-grid ...
                      let filtro = { numeroCuenta: cuentaBancariaSeleccionada.cuentaInterna };

                      $scope.showProgress = true;

                      if (chequerasSubscriptionHandle)
                          chequerasSubscriptionHandle.stop();

                      chequerasSubscriptionHandle =
                      Meteor.subscribe('chequeras', JSON.stringify(filtro), () => {

                          $scope.helpers({
                              chequerasList: () => {
                                  return Chequeras.find(
                                      {
                                          numeroCuenta: cuentaBancariaSeleccionada.cuentaInterna },
                                          { sort: { numeroChequera: 1 }
                                      }).fetch();;
                              },
                          });

                          $scope.chequeras_ui_grid.data = $scope.chequerasList;

                          $scope.cuentaBancaria_ChequeraSeleccionada = bancoSeleccionado.nombre +
                                                                       " - " +
                                                                       cuentaBancariaSeleccionada.cuentaBancaria;

                          $scope.showProgress = false;
                          $scope.$apply();
                      });
                  }
                  else
                      return;
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


      $scope.cuentasBancarias_ui_grid.columnDefs = [
          {
              name: 'cuentaBancaria',
              field: 'cuentaBancaria',
              displayName: 'Cuenta bancaria',
              width: 160,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'tipo',
              field: 'tipo',
              displayName: 'Tipo',
              width: 60,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'moneda',
              field: 'moneda',
              displayName: 'Moneda',
              width: 60,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              cellFilter: 'monedaSimboloFilter',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'lineaCredito',
              field: 'lineaCredito',
              displayName: 'Crédito',
              width: 120,
              headerCellClass: 'ui-grid-rightCell',
              cellClass: 'ui-grid-rightCell',
              cellFilter: 'currencyFilterAndNull',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'estado',
              field: 'estado',
              displayName: 'Estado',
              width: 60,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'cuentaContable',
              field: 'cuentaContable',
              displayName: 'Cuenta contable',
              width: 120,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              cellFilter: 'cuentasContables_soloCuenta',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'cuentaContableGastosIDB',
              field: 'cuentaContableGastosIDB',
              displayName: 'Cuenta contable IDB',
              width: 120,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              cellFilter: 'cuentasContables_soloCuenta',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'numeroContrato',
              field: 'numeroContrato',
              displayName: 'Contrato',
              width: 120,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'cia',
              field: 'cia',
              displayName: 'Cia Contab',
              width: 80,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              cellFilter: 'companiaAbreviaturaFilter',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
      ];

      let chequeras_ui_grid_api = null;
      let chequeraSeleccionada = {};

      $scope.chequeras_ui_grid = {

          enableSorting: true,
          enableCellEdit: false,
          enableFiltering: false,
          enableCellEditOnFocus: true,
          showColumnFooter: false,
          enableRowSelection: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

              chequeras_ui_grid_api = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  //debugger;
                  chequeraSeleccionada = {};

                  if (row.isSelected) {
                      chequeraSeleccionada = row.entity;
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

      $scope.chequeras_ui_grid.columnDefs = [
          {
              name: 'docState',
              field: 'docState',
              displayName: ' ',
              cellTemplate:
              '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableColumnMenu: false,
              enableSorting: false,
              width: 25
          },
          {
              name: 'numeroChequera',
              field: 'numeroChequera',
              displayName: '#',
              width: 60,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number',
          },
          {
              name: 'activa',
              field: 'activa',
              displayName: 'Activa',
              width: 60,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              cellFilter: 'boolFilter',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'boolean',
          },
          {
              name: 'generica',
              field: 'generica',
              displayName: 'Genérica',
              width: 70,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              cellFilter: 'boolFilter',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'boolean',
          },
          {
              name: 'fechaAsignacion',
              field: 'fechaAsignacion',
              displayName: 'F asignación',
              width: 90,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              cellFilter: 'dateFilter',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'date',
          },
          {
              name: 'desde',
              field: 'desde',
              displayName: 'Desde',
              width: 80,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'number',
          },
          {
              name: 'hasta',
              field: 'hasta',
              displayName: 'Hasta',
              width: 80,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'number',
          },
          {
              name: 'cantidadDeCheques',
              field: 'cantidadDeCheques',
              displayName: 'Cant chk',
              width: 80,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number',
          },
          {
              name: 'ultimoChequeUsado',
              field: 'ultimoChequeUsado',
              displayName: 'Ult chq usado',
              width: 100,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number',
          },
          {
              name: 'asignadaA',
              field: 'asignadaA',
              displayName: 'Asignada a',
              width: 100,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'string',
          },
          {
              name: 'agotadaFlag',
              field: 'agotadaFlag',
              displayName: 'Agotada',
              width: 60,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              cellFilter: 'boolFilter',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'boolean',
          },
          {
              name: 'cantidadDeChequesUsados',
              field: 'cantidadDeChequesUsados',
              displayName: 'Cant chq usados',
              width: 110,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number',
          },
          {
              name: 'delButton',
              displayName: ' ',
              cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableSorting: false,
              width: 25
          },
      ];



      $scope.deleteItem = function (item) {
          if (item.docState && item.docState === 1)
              // si el item es nuevo, simplemente lo eliminamos del array
              _.remove($scope.chequerasList, (x) => { return x._id === item._id; });
          else
              item.docState = 3;
      };

      $scope.nuevaChequera = function () {

          if (!bancoSeleccionado || _.isEmpty(bancoSeleccionado)) {
              DialogModal($modal, "<em>Chequeras - Agregar chequeras</em>",
                                  `Ud. debe seleccionar un banco en la lista.`,
                                 false).then();
              return;
          };

          if (!agenciaSeleccionada || _.isEmpty(agenciaSeleccionada)) {
              DialogModal($modal, "<em>Chequeras - Agregar chequeras</em>",
                                  `Ud. debe seleccionar una agencia en la lista.`,
                                 false).then();
              return;
          };

          if (!cuentaBancariaSeleccionada || _.isEmpty(cuentaBancariaSeleccionada)) {
              DialogModal($modal, "<em>Chequeras - Agregar chequeras</em>",
                                  `Ud. debe seleccionar una cuenta bancaria en la lista.`,
                                 false).then();
              return;
          };

          // el catálogo que mantenemos en mongo no es idéntico al que existe (real) en sql. En mongo,
          // cuando hacemos 'Copiar catálogos' agregamos una cantidad de items adicionales para facilidad
          // en su manejo posterior ...

          let item = {
              _id: new Mongo.ObjectID()._str,
              numeroChequera: 0,
              numeroCuenta: cuentaBancariaSeleccionada.cuentaInterna,

              activa: true,
              generica: false,
              fechaAsignacion: new Date(),
              cantidadDeCheques: 0,                 // actualizamos en server al guardar

              usuario: Meteor.userId(),
              ingreso: new Date(),
              ultAct: new Date(),

              // los items que siguen no existen en Chequeras (sql); sin embargo, si lo agregamos a mongo
              // cuando el usuario hacer 'Copiar catálogos' ...
              numeroCuentaBancaria: cuentaBancariaSeleccionada.cuentaBancaria,
              banco: bancoSeleccionado.banco,
              abreviaturaBanco: bancoSeleccionado.abreviatura,
              moneda: cuentaBancariaSeleccionada.moneda,
              simboloMoneda: Monedas.findOne({ moneda: cuentaBancariaSeleccionada.moneda }).simbolo,
              cia: cuentaBancariaSeleccionada.cia,

              docState: 1,
          };

          $scope.chequerasList.push(item);

          $scope.chequeras_ui_grid.data = [];
          if (_.isArray($scope.chequerasList)) {
              $scope.chequeras_ui_grid.data = $scope.chequerasList;
          }
      };

      $scope.corregirChequera = () => {

          if (!chequeraSeleccionada || _.isEmpty(chequeraSeleccionada)) {
              DialogModal($modal, "<em>Bancos - Chequeras - Corregir chequeras</em>",
                                  "Ud. debe seleccionar la chequera que desea corregir antes de intentar ejecutar esta función.",
                                  false).then();
              return;
          };

          $scope.showProgress = true;

          $meteor.call('corregirChequera', chequeraSeleccionada.numeroChequera).then(
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


      $scope.helpers({
          bancos: () => {
            return Bancos.find({}, { sort: { nombre: 1 } });
          }
      });


    $scope.save = function () {
         $scope.showProgress = true;

         let editedItems = _.filter($scope.chequerasList, function (item) { return item.docState; });

         // nótese como validamos cada item antes de intentar guardar (en el servidor)
         let isValid = false;
         let errores = [];

         editedItems.forEach((item) => {
             if (item.docState != 3) {
                 isValid = Chequeras.simpleSchema().namedContext().validate(item);

                 if (!isValid) {
                     Chequeras.simpleSchema().namedContext().invalidKeys().forEach(function (error) {
                         errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + Chequeras.simpleSchema().label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
                     });
                 }
             }
         });

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

         $meteor.call('bancos.chequerasSave', editedItems).then(
           function (data) {

               $scope.alerts.length = 0;
               $scope.alerts.push({
                   type: 'info',
                   msg: data
               });

               // por alguna razón, que aún no entendemos del todo, si no hacemos el subscribe nuevamente,
               // se queda el '*' para registros nuevos en el ui-grid ...
               $scope.chequerasList = [];
               $scope.chequeras_ui_grid.data = [];

               let filtro = { numeroCuenta: cuentaBancariaSeleccionada.cuentaInterna };

               if (chequerasSubscriptionHandle) {
                   chequerasSubscriptionHandle.stop();
               }

               chequerasSubscriptionHandle =
               Meteor.subscribe('chequeras', JSON.stringify(filtro), () => {
                   $scope.helpers({
                       chequerasList: () => {
                           return Chequeras.find(
                               {
                                   numeroCuenta: cuentaBancariaSeleccionada.cuentaInterna },
                                   { sort: { numeroChequera: 1 }
                               }).fetch();;
                       },
                   });

                   $scope.chequeras_ui_grid.data = $scope.chequerasList;

                   $scope.cuentaBancaria_ChequeraSeleccionada = bancoSeleccionado.nombre +
                                                                " - " +
                                                                cuentaBancariaSeleccionada.cuentaBancaria;

                   $scope.showProgress = false;
                   $scope.$apply();
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



      $scope.bancos_ui_grid.data = $scope.bancos;
      $scope.agencias_ui_grid.data = [];
      $scope.cuentasBancarias_ui_grid.data = [];
      $scope.chequeras_ui_grid.data = [];

      // detenemos los publishers cuando el usuario deja la página
      $scope.$on("$destroy", () => {
          if (chequerasSubscriptionHandle && chequerasSubscriptionHandle.stop) {
              chequerasSubscriptionHandle.stop();
          };
      });
}
]);

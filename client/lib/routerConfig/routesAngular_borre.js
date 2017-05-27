

AngularApp.config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
  function ($urlRouterProvider, $stateProvider, $locationProvider) {

        $locationProvider.html5Mode(true);

          $stateProvider
        // ----------------------------------------------------------------
        // nomina
        // ----------------------------------------------------------------
        .state('borre', {
            url: '/borre',
            templateUrl: 'client/borre/main.html',
            controller: 'Borre_Main_Controller'
        })
  }
]);

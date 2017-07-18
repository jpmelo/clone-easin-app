/*
* Copyright 2017 EUROPEAN UNION
* 
* Licensed under the GPL, Version 3
* You may not use this work except in compliance with the Licence.
* You may obtain a copy of the Licence at:
*
* https://www.gnu.org/licenses/gpl-3.0.html
* 
* Unless required by applicable law or agreed to in writing, software distributed under the Licence is distributed on an "AS IS" basis,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the Licence for the specific language governing permissions and limitations under the Licence.
*/

// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('MYGEOSS', ['ionic', 'ngResource', 'ngCordova', 'MYGEOSS.controllers', 'MYGEOSS.services', 'MYGEOSS.constants', 'MYGEOSS.directives', 'angular-carousel', 'angular-click-outside'])

.run(function($ionicPlatform, $rootScope, $q, $cordovaFile, $cordovaDevice, $cordovaNetwork, $cordovaSQLite, $dataBaseFactory, $photoFactory, $easinFactoryLocal, $authenticationFactory) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      //cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    //UUID
    $rootScope.UUID = $cordovaDevice.getUUID();

    //init camera option to avoid load to quickly
    $photoFactory.initOptionsCameraCamera();
    $photoFactory.initOptionsCameraLibrary();

    //DATABASE init
    //var db = $cordovaSQLite.openDB("mygeoss.db");
    var db = window.sqlitePlugin.openDatabase({name: 'mygeoss.db', location: 'default'}, function(success){
      // $dataBaseFactory.set(db);
      // $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS reports (id integer primary key, specie text, images text, coordinates text, date text, abundance text, habitat text, comment text, status text)").then(
      //   function(success){
      //     console.log('success create table');
      //     console.log(success);
      //   },
      //   function(error){
      //     console.error('error creqte tqble');
      //     console.error(error);
      //   }
      // );
    }, function(error){});
    //$dataBaseFactory.set(db);
    $dataBaseFactory.set(db);
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS reports (id integer primary key, specie text, images text, coordinates text, date text, abundance text, habitat text, comment text, status text)").then(
      function(success){
        console.log('success create table');
        console.log(success);
      },
      function(error){
        console.error('error creqte tqble');
        console.error(error);
      }
    );

    //createPictureFolder
    if (ionic.Platform.isIOS() || ionic.Platform.isIPad()){
      $rootScope.deviceStorageLocation = cordova.file.documentsDirectory;
    }else if (ionic.Platform.isAndroid()){
       $rootScope.deviceStorageLocation = cordova.file.externalApplicationStorageDirectory;
    }
    $cordovaFile.createDir($rootScope.deviceStorageLocation, "IASimg", false).then(
      function (success) {
        console.log("success create IASimg dir");
      }, function (error) {
        console.log("error create IASimg dir");
        console.error(error);
      }
    );

    //Check session and log in status
    $authenticationFactory.checkSessionLocal();

    //overwritte cordovanetwork function, to rreturn isOnline true even if the newtwork type is unknow
    $cordovaNetwork.isOnline = function () {
    return navigator.connection.type !== Connection.NONE;
    };
    $cordovaNetwork.isOffline = function () {
        return navigator.connection.type === Connection.NONE;
    };

    //Send pending observations
    if($cordovaNetwork.isOnline === true){
      console.log('ONline');
      $easinFactoryLocal.getAllObservationByStatus('pending').then(
        function(success){
          var arrayPromise = [];
          angular.forEach(success, function(observation, key){
             var specie = angular.fromJson(observation.specie);
             var abundance = angular.fromJson(observation.abundance);
             var images = angular.fromJson(observation.images);
             var coordinates = angular.fromJson(coordinates);
             arrayPromise.push($easinFactory.sendObservation(specie.LSID, $rootScope.UUID, abundance.number+" "+abundance.scale, abundance.precision, "Habitat : "+observation.habitat+". Comment : "+observation.comment, images, 'false',  [coordinates[0], coordinates[1]], "Point"));
          });
          $q.all(arrayPromise).then(function(success){console.log('sendDataOk')});
        },function(error){console.error('eroooooor');}
      );
    }else{
      console.log('ooflibne');
    }


    //Accessibility
    // if (ionic.Platform.isAndroid()){
    //   console.log('android');
    //   MobileAccessibility.usePreferredTextZoom(false);
    // }
    MobileAccessibility.usePreferredTextZoom(false);
    //
    // MobileAccessibility.usePreferredTextZoom(true);
    // function getTextZoomCallback(textZoom) {
    //     console.log('Current text zoom = ' + textZoom + '%')
    // }

    // MobileAccessibility.getTextZoom(function(textZoom){
    //   console.log('Current text zoom = ' + textZoom + '%')
    //    -moz-text-size-adjust, -webkit-text-size-adjust, and -ms-text-size-adjust.
    // });


  });
})

//ROUTING//
.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', { //Main template, contain the menu
    url: '/app',
    abstract: true,
    templateUrl: 'partials/app.html',
    controller: 'AppCtrl'
  })
  
  .state('app.home', {
    cache: false,
    url: '/home',
      views: {
        'mainContent': {
          templateUrl: 'partials/home.html',
          controller: 'HomeCtrl'
        }
      }
  })

  .state('app.specieList', { //Main template, contain the menu
    url: '/specieList',
    views: {
        'mainContent': {
          templateUrl: 'partials/specieList.html',
          controller: 'SpecieListCtrl'
        }
      }
  })

  .state('app.specie', { 
    cache: false,
    url: '/specie/:specie',
    views: {
        'mainContent': {
          templateUrl: 'partials/specie.html',
          controller: 'SpecieCtrl'
        }
      }
  })

  .state('app.reportSighting', { 
    cache: false,
    url: '/reportSighting/{id:int}',
    views: {
        'mainContent': {
          templateUrl: 'partials/reportSighting.html',
          controller: 'ReportSightingCtrl'
        }
      }
  })

  .state('app.sob', {
    cache: false,
    url: '/sob/:sobId',
    views: {
      'mainContent': {
        templateUrl: 'partials/sob.html',
        controller: 'SOBCtrl'
      }
    }
  })

  .state('app.my_records', {
    url: '/my_records',
    cache: false,
    views: {
      'mainContent': {
        templateUrl: 'partials/my_records.html',
        controller: 'MyRecordsCtrl'
      }
    }
  })

  .state('app.contact', {
    url: '/contact',
    views: {
      'mainContent': {
        templateUrl: 'partials/contact.html',
        controller: 'ContactCtrl'
      }
    }
  })

  .state('app.links', {
    url: '/links',
    views: {
      'mainContent': {
        templateUrl: 'partials/links.html',
        controller: 'LinksCtrl'
      }
    }
  })

  .state('app.about', {
    url: '/about',
    views: {
      'mainContent': {
        templateUrl: 'partials/about.html',
        controller: 'AboutCtrl'
      }
    }
  })

  .state('app.sightingMap', {
    url: '/sightingMap',
    views: {
      'mainContent': {
        templateUrl: 'partials/sightingMap.html',
        controller: 'SightingMapCtrl'
      }
    }
  })

  .state('app.login', {
    url: '/login',
    views: {
      'mainContent': {
        templateUrl: 'partials/login.html',
        controller: 'LoginCtrl'
      }
    }
  })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
})



//CONFIG//
.config(function($ionicConfigProvider) {
  $ionicConfigProvider.views.maxCache(1);

  // note that you can also chain configs
 $ionicConfigProvider.backButton.text('').icon('ion-chevron-left');
 $ionicConfigProvider.views.swipeBackEnabled(false);
 //$ionicConfigProvider.tabs.position('top'); 
 //$ionicConfigProvider.views.transition('none');

});

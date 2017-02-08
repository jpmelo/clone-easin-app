/*
* Copyright 2007 EUROPEAN UNION
* 
* Licensed under the EUPL, Version 1.1 or – as soon they will be approved by the European Commission - subsequent versions of the EUPL (the "Licence");
* You may not use this work except in compliance with the Licence.
* You may obtain a copy of the Licence at:
*
* https://joinup.ec.europa.eu/software/page/eupl
* 
* Unless required by applicable law or agreed to in writing, software distributed under the Licence is distributed on an "AS IS" basis,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the Licence for the specific language governing permissions and limitations under the Licence.
*/

angular.module('MYGEOSS.controllers', [])

.controller('AppCtrl', function($scope, $rootScope, $state, $q, $ionicModal, $ionicHistory, $cordovaInAppBrowser, $ionicPlatform, $cordovaNetwork, $networkFactory, $easinFactoryLocal, $easinFactory, $authenticationFactory) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  $scope.appCtrl = {
    session : $authenticationFactory.getSession(),
    user : $authenticationFactory.getUser(),
    accessibilityFont: {
      'font-size': '100%',
      'line-height': '1'
    },
    accessibilitySpecial: {
      'height': '100%'
    }
  };

  $scope.accessibilityFont = {
    bigText: {
      '-moz-text-size-adjust': '100%',
      '-webkit-text-size-adjust': '100%',
      '-ms-text-size-adjust': '100%',
    }
  }

  //Accessibility
  $ionicPlatform.ready(function() {
    $scope.setAccessibiltyText = function(){
      MobileAccessibility.updateTextZoom(function(textZoom){
        // if (ionic.Platform.isIOS()){
          MobileAccessibility.setTextZoom(100, function(success){console.log('set textZoom 100%');}); //need to setup to 100% because retrieving the textZoom apply the textZoom to the view...
        // }
        
        console.log('Current text zoom = ' + textZoom + '%');
        // if (textZoom > 200){
        //   textZoom = 200;
        // }
        if (textZoom > 140){
          $scope.appCtrl.accessibilitySpecial = {
            'height': 'auto'
          }
        }
        // $scope.appCtrl.accessibilitySpecial = {
        //     'height': 'auto',
        //     'color': 'red !important'
        //   }
        $scope.appCtrl.accessibilityFont ={ 
          // '-moz-text-size-adjust': textZoom+ '%',
          // '-webkit-text-size-adjust': textZoom+ '%',
          // '-ms-text-size-adjust': textZoom+ '%',
          // 'line-height': '1',
          'font-size': textZoom+'%',
          'line-height': '1'
          //'font-size': textZoom+'%'
          //'max-height': '100000px'
        };
      });
     };

    $scope.setAccessibiltyText();
    
  });

  $ionicPlatform.on('resume', function(event) {
      console.log('resume')
      $scope.setAccessibiltyText(); 
  });


  $scope.openExternalLinks = function(uri){
    ionic.Platform.ready(function() {
      $cordovaInAppBrowser.open(uri, "_system");
    });
  },

  $scope.openMailLinks = function(mail){
     $cordovaInAppBrowser.open("mailto:"+ mail, "_system");
  };

  $scope.backToHome = function(){
    if($scope.mainMenu === true) $scope.changeMainMenu();
    $ionicHistory.clearCache();
    $state.go('app.home');
  };
    
  //Send observation with status "pending"
  $scope.sendPendingObservation = function(){
    //Background Task
      $easinFactoryLocal.getAllObservationByStatus('pending').then(
        function(success){
          var arrayPromiseSend = [];
          var arrayDelete = [];
          angular.forEach(success, function(observation, key){
             var specie = angular.fromJson(observation.specie);
             var abundance = angular.fromJson(observation.abundance);
             var images = angular.fromJson(observation.images);
             var coordinates = angular.fromJson(observation.coordinates);
             //console.log()

             arrayPromiseSend.push($easinFactory.sendObservation(specie.LSID, $rootScope.UUID, abundance.number+" "+abundance.scale, abundance.precision, "Habitat : "+observation.habitat+". Comment : "+observation.comment, images, 'false',  [coordinates[0], coordinates[1]], "Point"));
             arrayDelete.push(observation.id);
          });
          $q.all(arrayPromiseSend).then(
            function(success){
              console.log('Data sent to the server');
              angular.forEach(arrayDelete, function(id, key){
                $easinFactoryLocal.deleteObservation(id);
              });
            }, function(err){
              console.error('Error sending data to the server');
              //if error change statut to 'complete'
              angular.forEach(arrayDelete, function(id, key){
                $easinFactoryLocal.updateObservationStatus(id, 'incomplete');
              });
            }
          );
        },function(error){console.error('eroooooor');}
      );
  };


  //Comment to use ionic serve
  ionic.Platform.ready(function() {
    if($cordovaNetwork.isOnline() === true){
      $networkFactory.setNetworkState(true);
      $scope.sendPendingObservation();
    }else{
      $networkFactory.setNetworkState(false);
    }

    // listen for Online event
    $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
      if ($networkFactory.getNetworkState()) return; //avoid to fire the event 2 times in a row
      console.log('online');
      $networkFactory.setNetworkState(true);
      $scope.sendPendingObservation();
    });

    // listen for Offline event
    $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
      if (!$networkFactory.getNetworkState()) return; //avoid to fire the event 2 times in a row
      console.log('offline');
      $networkFactory.setNetworkState(false);
    })
  });
  //

  $scope.mainMenu = false;
  $scope.changeMainMenu = function(){
    $scope.mainMenu = !$scope.mainMenu;
  };

  // Acknowledgement
  $ionicModal.fromTemplateUrl('partials/modals/modal_acknowledgement.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal_acknowledgement = modal;
  });

  $scope.closeModalAcknowledgement = function() {
    $scope.modal_acknowledgement.hide();
  };
  $scope.showModalAcknowledgement = function() {
    $scope.modal_acknowledgement.show();
  };

  // Disclaimer
  $ionicModal.fromTemplateUrl('partials/modals/modal_disclaimer.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal_disclaimer = modal;
  });

  $scope.closeModalDisclaimer = function() {
    $scope.modal_disclaimer.hide();
  };
  $scope.showModalDisclaimer = function() {
    $scope.modal_disclaimer.show();
  };

  // Legal Notice
  $ionicModal.fromTemplateUrl('partials/modals/modal_legal_notice.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal_legal_notice = modal;
  });

  $scope.closeModalLegalNotice = function() {
    $scope.modal_legal_notice.hide();
  };
  $scope.showModalLegalNotice = function() {
    $scope.modal_legal_notice.show();
  };

  // Privacy Statement
  $ionicModal.fromTemplateUrl('partials/modals/modal_privacy.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal_privacy = modal;
  });

  $scope.closeModalPrivacy = function() {
    $scope.modal_privacy.hide();
  };
  $scope.showModalPrivacy = function() {
    $scope.modal_privacy.show();
  };

  // EU IAS Regulation
  $ionicModal.fromTemplateUrl('partials/modals/modal_regulation.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal_regulation = modal;
  });

  $scope.closeModalRegulation = function() {
    $scope.modal_regulation.hide();
  };
  $scope.showModalRegulation = function() {
    $scope.modal_regulation.show();
  };
  
})

/*
 * Home Controller
 * ------------------------------------------------------------
 */
.controller('HomeCtrl', function($scope, $rootScope, $state, $geolocationFactory) {
  $scope.goToState = function(state){
    $state.go(state);
  };
  $scope.$on('$ionicView.beforeEnter', function(e) {
    if($scope.mainMenu === true) $scope.changeMainMenu();
  });
})


/*
 * Specie List Controller
 * ------------------------------------------------------------
 */
.controller('SpecieListCtrl', ['$scope', '$rootScope','$state', '$timeout', '$speciesFactory', function($scope, $rootScope, $state, $timeout, $speciesFactory){
  $scope.$on('$ionicView.beforeEnter', function(e) {
    if($scope.mainMenu === true) $scope.changeMainMenu();
  });

  $scope.dummyClass = {'test': true};
  /* Fix iOS view that don't repaint when keyboard close (Safari webkit bug...) */
  ionic.on('native.keyboardhide', function(){
    $timeout(function(){
      $scope.dummyClass.test = !$scope.dummyClass.test;
      $scope.testRepaint={'opacity': 1};
      $scope.$apply();
    }, 500);
    
   // console.log($scope.dummyClass);
   // console.log('keyboard_close');
  });
  // $scope.$on


  /* Get species data from the internal json file*/
  $speciesFactory.getAll().then(function(success){
    $scope.species = success.species;
  });

  //Filters
  $scope.openSubFilters = false;
  $scope.styleAnimaliaButton = { 'background-image': "url(img/filter_animal.svg)" };

  $scope.filters = {
      common_name: "",
      type: "",
      habitat_filter: "",
      family: ""
  };

  $scope.openAnimaliaFilters = function(){
    if($scope.openSubFilters === false){
      $scope.openSubFilters = true;
      $scope.filters.type = "Animalia";
      if ($scope.filters.family === ""){
        $scope.styleAnimaliaButton = { 'background-image': "url(img/filter_animal-active.svg)" };
        $scope.styleAnimaliaSubFilterButton = { 'background-image':  "url(img/filter_animal-active.svg)"};
      }else{
        $scope.styleAnimaliaButton = { 'background-image': "url(img/filter_"+$scope.filters.family+"-active.svg)" };
      }
    }else{
      $scope.openSubFilters = false;
    }
  };

  $scope.changePlantaeFilters = function(){
    if($scope.filters.type === "Plantae"){
      $scope.openSubFilters = false;
      $scope.filters.family = "";
      $scope.styleAnimaliaButton = { 'background-image': "url(img/filter_animal.svg)" };
    }
  };


  $scope.changeFamily = function(){
    if ($scope.filters.family === ""){
      $scope.styleAnimaliaButton = { 'background-image': "url(img/filter_animal-active.svg)" };
      $scope.styleAnimaliaSubFilterButton = { 'background-image':  "url(img/filter_animal-active.svg)"};
    }else{
      $scope.styleAnimaliaButton = { 'background-image': "url(img/filter_"+$scope.filters.family+"-active.svg)" };
      $scope.styleAnimaliaSubFilterButton = { 'background-image':  "url(img/filter_animal.svg)"};
    }
  }

  $scope.changeFamilyAnyAnimalia = function(){
    if ($scope.filters.family === ""){
        $scope.filters.type = "";
        $scope.openSubFilters = false;
        $scope.styleAnimaliaButton = { 'background-image': "url(img/filter_animal.svg)" };
        $scope.styleAnimaliaSubFilterButton = { "background-image":  "url(img/filter_animal.svg)"};
    }else{
      $scope.styleAnimaliaSubFilterButton = { "background-image":  "url(img/filter_animal-active.svg)"};  
      $scope.styleAnimaliaButton = { "background-image":  "url(img/filter_animal-active.svg)"};  
      $scope.filters.family = "";
    }
  };

  $scope.resetFilters = function(){
    $scope.openSubFilters = false;
    $scope.styleAnimaliaButton = { 'background-image': "url(img/filter_animal.svg)" };
    // closeKeyboard();
    $scope.filters = {
        common_name: "",
        type: "",
        habitat_filter: "",
        family: ""
    };
    $scope.customSearchCSnameInput = "";
    $scope.dummyClass.test = !$scope.dummyClass.test;
    $scope.testRepaint={'opacity': 1};
    //$scope.$apply();
  };

  // $scope.customSearchCSname = {'common_name': "", "scientific_name": ""};
  $scope.customSearchCSnameInput = "";
  $scope.customSearchCSname = function(specie){
    return (angular.lowercase(specie.common_name).indexOf(angular.lowercase($scope.customSearchCSnameInput) || '') !== -1 ||
                angular.lowercase(specie.scientific_name).indexOf(angular.lowercase($scope.customSearchCSnameInput) || '') !== -1);
  };



  $scope.goToSpecie = function(specie){
   $state.go('app.specie', {specie: angular.toJson(specie)});
  };


}])



/*
 * Specie Controller
 * ------------------------------------------------------------
 */
.controller('SpecieCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$timeout', '$ionicPopup', function($scope, $rootScope, $state, $stateParams, $timeout, $ionicPopup) {
  $scope.$on('$ionicView.beforeEnter', function(e) {
    if($scope.mainMenu === true) $scope.changeMainMenu();
  });

  $scope.specie = angular.fromJson($stateParams.specie);
  $scope.activeTemplate = "specie_photos";

  $scope.specieCtrl = {
    activeIndex: 0
  }

  $scope.images = [];
  angular.forEach($scope.specie.photos, function(value, key){
    $scope.images.push({url: 'data/photos/'+$scope.specie.photos[key].src, caption: $scope.specie.photos[key].author});
  });

  $scope.photoBrowser = function(index){
    photoBrowserStandalone(index, $scope.images);
  }

  function photoBrowserStandalone(index, images){
    var myApp = new Framework7({
        init: false, //IMPORTANT - just do it, will write about why it needs to false later
    });
    var myPhotoBrowserStandalone = myApp.photoBrowser({
        type: 'standalone',
        theme: 'light',
        photos : $scope.images,
        swipeToClose: false,
        loop: false,
        initialSlide: index,
        navbar: false,
        toolbar: false,
        domInsertion: '#specie_pictures', //Custom added parameter to choose where display the gallery
        onSlideChangeStart: function(){
          //console.log(myPhotoBrowserStandalone.activeIndex);
          $scope.specieCtrl.activeIndex = myPhotoBrowserStandalone.activeIndex;
          //$scope.specieCtrl

          //console.log($scope.specieCtrl.activeIndex);
          $scope.$apply();
          return myPhotoBrowserStandalone.activeIndex;
        },
        onClose: function(){
          myApp = undefined;
        },
        onOpen: function (pb) { //use hammerJS feature to use pinchZoom on android
          var target = pb.params.loop ? pb.swiper.slides : pb.slides;
          target.each(function( index ) {
            var hammertime = new Hammer(this);
            hammertime.get('pinch').set({ enable: true });
            hammertime.on( 'pinchstart', pb.onSlideGestureStart );
            hammertime.on( 'pinchmove', pb.onSlideGestureChange );
            hammertime.on( 'pinchend', pb.onSlideGestureEnd );
          });
        }
    });
    myPhotoBrowserStandalone.open();
  }

}])

/*
 * Report a Sighting Controller
 * ------------------------------------------------------------
 */
.controller('ReportSightingCtrl', ['$scope', '$rootScope', '$stateParams', function($scope, $rootScope, $stateParams){
    $scope.$on('$ionicView.beforeEnter', function(e) {
      if($scope.mainMenu === true) $scope.changeMainMenu();
    });

    // $scope.$on('$ionicView.beforeEnter', function(e) {
    //   if($scope.mainMenu === true) $scope.changeMainMenu();
    // });

  $scope.cameFromReportSighting = true;
  $scope.specie = {};
}])

/*
 * SOB Controller
 * -------------------------------------------------------------
 */
.controller('SOBCtrl', ['$scope', '$stateParams', '$cacheFactory', '$ionicLoading', '$easinFactoryREST', 'CONFIG', function($scope, $stateParams, $cacheFactory, $ionicLoading, $easinFactoryREST, CONFIG){ 
  $scope.$on('$ionicView.beforeEnter', function(e) {
    if($scope.mainMenu === true) $scope.changeMainMenu();
  });

  $ionicLoading.show({
    template: "<ion-spinner icon='bubbles'></ion-spinner>",
    delay: 0
  });

  $scope.sobId = $stateParams.sobId;
  $scope.activeTemplate = "sob_information";

  $easinFactoryREST.get({reportId: $scope.sobId},
    function(data){  //get SOB Informations
      console.log('ok');
      $scope.SOB = data;

      // console.log('init sob picutre');
      // console.log($scope.SOB);

      $scope.sobCtrl = {
        activeIndex: 0
      }

      $scope.images = [];
      angular.forEach($scope.SOB.properties.Image, function(value, key){
        //console.log(value);
        $scope.images.push({url: value, caption: ""});
      });

      $scope.photoBrowser = function(index){
        photoBrowserStandalone(index, $scope.images);
      }

      function photoBrowserStandalone(index, images){
        var myApp = new Framework7({
            init: false, //IMPORTANT - just do it, will write about why it needs to false later
        });
        var myPhotoBrowserStandalone = myApp.photoBrowser({
            type: 'standalone',
            theme: 'light',
            photos : $scope.images,
            swipeToClose: false,
            loop: false,
            initialSlide: index,
            navbar: false,
            toolbar: false,
            caption: false,
            domInsertion: '#sob_pictures', //Custom added parameter to choose where display the gallery
            onSlideChangeStart: function(){
             // console.log(myPhotoBrowserStandalone.activeIndex);
              $scope.sobCtrl.activeIndex = myPhotoBrowserStandalone.activeIndex;
              //$scope.specieCtrl

              //console.log($scope.sobCtrl.activeIndex);
              $scope.$apply();
              return myPhotoBrowserStandalone.activeIndex;
            },
            onClose: function(){
              myApp = undefined;
            },
            onOpen: function (pb) { //use hammerJS feature to use pinchZoom on android
              var target = pb.params.loop ? pb.swiper.slides : pb.slides;
              target.each(function( index ) {
                var hammertime = new Hammer(this);
                hammertime.get('pinch').set({ enable: true });
                hammertime.on( 'pinchstart', pb.onSlideGestureStart );
                hammertime.on( 'pinchmove', pb.onSlideGestureChange );
                hammertime.on( 'pinchend', pb.onSlideGestureEnd );
              });
            }
        });
        myPhotoBrowserStandalone.open();
      }

      $ionicLoading.hide();
    }
    ,
    function(error){
      //error
      console.error('error');
     $ionicLoading.hide();
    }
  );
}])

/*
 * User records Controller
 * -------------------------------------------------------------
 */
.controller('MyRecordsCtrl', ['$scope', '$rootScope', '$state', '$filter', '$cacheFactory', '$cordovaNetwork', '$cordovaFile', '$ionicActionSheet', '$ionicLoading', '$ionicPopup', '$easinFactoryREST', '$easinFactory', '$easinFactoryLocal', '$authenticationFactory', 'TEXT', 'CONFIG', function($scope, $rootScope, $state, $filter, $cacheFactory, $cordovaNetwork, $cordovaFile, $ionicActionSheet, $ionicLoading, $ionicPopup, $easinFactoryREST, $easinFactory, $easinFactoryLocal, $authenticationFactory, TEXT, CONFIG){
  
  $scope.$on('$ionicView.beforeEnter', function(e) {
    if($scope.mainMenu === true) $scope.changeMainMenu();
  });
  //Local observations
  $scope.savedObservations = [];

  $scope.init = function(){
    $scope.savedObservations = [];
    $easinFactoryLocal.getAllObservation().then(
      function(success){
        //console.log(success);
        angular.forEach(success, function(observation, key){
          if(observation.status !== 'pending'){ //don't select pending observations, they will be automatically sendend to the server. Rq : We can create a function in the service to select with a query in the DB
            obj = { 
              id: observation.id,
              specie: angular.fromJson(observation.specie),
              status:  observation.status
            }
            $scope.savedObservations.push(obj);
          }  
        });
        //console.log(success);
      },
      function(error){
        if(error === 'No result'){
          //remove all photo from directory folder;
          $cordovaFile.createDir($rootScope.deviceStorageLocation, "IASimg", true).then(
            function (success) {
              //console.log("success create IASimg dir");
              console.log(success);
            }, function (error) {
              //console.log("error create IASimg dir");
              console.error(error);
            }
          );
        }
        //$scope.savedObservations = [];
        console.error(error);
      }
    );
  };
  
    
  //Delete report
  //TODO ionic spinning and confirm message for delete
  $scope.actionRemoveEntry = function(id){
    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
      destructiveText: 'Delete',
      titleText: 'Delete this report?',
      cancelText: 'Cancel',
      cancel: function() {
            // add cancel code..
            //alert("cancel");
      },
      destructiveButtonClicked: function() {
        $easinFactoryLocal.deleteObservation(id).then(
          function(success){
            $scope.init();
          }
        );
        return true;
      }
    });
  };

  $scope.modify = function(id){
    $state.go('app.reportSighting', {id: id});
  };

  $scope.actionSendEntry = function(id){
    if ($authenticationFactory.checkSessionLocal()){
      // Show the action sheet
      var hideSheet = $ionicActionSheet.show({
        titleText: 'Send this report?',
        cancelText: 'Cancel',
        buttons: [
            { text: 'Send report' }
        ],
        cancel: function() {
              // add cancel code..
              //alert("cancel");
        },
        buttonClicked: function(index) {
          if(index === 0) {
            $ionicLoading.show({
              template: "<ion-spinner icon='bubbles'></ion-spinner>",
              delay: 0
            });

            $easinFactoryLocal.getObservationByID(id).then(
              function(report){
                var specie = angular.fromJson(report.specie);
                var abundance = angular.fromJson(report.abundance);
                var images = angular.fromJson(report.images);
                var coordinates = angular.fromJson(report.coordinates);
                // var wrongCoordinates = angular.fromJson(report.coordinates);
                // var coordinates = [];
                // coordinates[0] = wrongCoordinates[1];
                // coordinates[1] = wrongCoordinates[0];

                //console.log(coordinates);
                //return true;

                if($cordovaNetwork.isOnline() === true){ //if online, send
                  $easinFactory.sendObservation(specie.LSID+"", $rootScope.UUID, abundance.number+" "+abundance.scale, abundance.precision, "Habitat : "+report.habitat+". Comment : "+report.comment, images, false, coordinates, "Point").then(
                    function(success){
                      $cacheFactory.get('customQueryCache').removeAll();
                      $easinFactoryLocal.deleteObservation(id).then(
                        function(success){
                          $ionicLoading.hide();
                          $scope.retrieveServerObservation();
                          $scope.init();
                        },
                        function(err){
                          $ionicLoading.hide();
                          $scope.init();
                        }
                      );
                    },
                    function(err){
                      console.error('$easinFactory.sendObservation');
                      //console.error(err);
                      $ionicLoading.hide();
                      $scope.init();
                    }
                  );
                }else{ //if online, saveDraft
                  var status = "pending";
                  $easinFactoryLocal.updateObservation(specie, images, coordinates, report.date, abundance, report.habitat, report.comment, status ,report.id ).then(
                    function(success){
                      $ionicLoading.hide();
                      $scope.init();
                    },
                    function(error){
                      //console.log('error update entry, process save send data');
                      $ionicLoading.hide();
                      $scope.init();
                    }
                  );
                }
              },
              function(err){
                $ionicLoading.hide();
                $scope.init();
              }
            );
            return true;
          }
        }
      });
    }else{
      var confirmPopup = $ionicPopup.confirm({
        title: TEXT.errorNoLogged_label,
        template: TEXT.errorNoLogged_content,
        okText: TEXT.errorNoLogged_okText
      });
      confirmPopup.then(function(res) {
        if(res){
          $state.go('app.login');
        }else {
         // console.log('You are not sure');
        }
      });
    } 
  };

  //Server observations
  $scope.retrieveServerObservation = function(){
    $ionicLoading.show({
      template: "<ion-spinner icon='bubbles'></ion-spinner>",
      delay: 0
    });

    $easinFactoryREST.query(
      function(data){
        //$scope.serverObservations = $filter('filter')(data, {properties: {ICCID : $rootScope.UUID}});
        if ($authenticationFactory.getUserEmailReport() !== "" && $authenticationFactory.getUserEmailReport() !== undefined && $authenticationFactory.getUserEmailReport() !== "undefined" ){
          $scope.serverObservations = $filter('filter')(data, {properties: {OAUTHID : $authenticationFactory.getUserEmailReport()}});
          $ionicLoading.hide();
          data = null;
        }else{
          $scope.serverObservations = [];
          $ionicLoading.hide();
          data = null;
        } 
      },
      function(error){
        //console.error("error data marker : "+error);
        //console.error(error);
        $ionicLoading.hide();
      }
    );

  };
  //Init
  $scope.init();
  $scope.retrieveServerObservation();

}])

/*
 * Contact Controller
 * ------------------------------------------------------------
 */
.controller('ContactCtrl', ['$scope', '$rootScope', 'CONFIG', function($scope, $rootScope, CONFIG){
  $scope.$on('$ionicView.beforeEnter', function(e) {
    if($scope.mainMenu === true) $scope.changeMainMenu();
  });

  $scope.contactMail = CONFIG.contactMail;
}])

/*
 * Links Controller
 * ------------------------------------------------------------
 */
.controller('LinksCtrl', ['$scope', '$rootScope', function($scope, $rootScope){
  $scope.$on('$ionicView.beforeEnter', function(e) {
    if($scope.mainMenu === true) $scope.changeMainMenu();
  });
  
}])

/*
 * About Controller
 * ------------------------------------------------------------
 */
.controller('AboutCtrl', ['$scope', '$rootScope', function($scope, $rootScope){
  $scope.$on('$ionicView.beforeEnter', function(e) {
    if($scope.mainMenu === true) $scope.changeMainMenu();
  });
  
}])

/*
 * Sighting Map global Controller
 * ------------------------------------------------------------
 */
.controller('SightingMapCtrl', ['$scope', '$filter', '$easinFactoryREST', '$geolocationFactory', '$cordovaNetwork', '$networkFactory', function($scope, $filter, $easinFactoryREST, $geolocationFactory, $cordovaNetwork, $networkFactory){
  $scope.$on('$ionicView.beforeEnter', function(e) {
    if($scope.mainMenu === true) $scope.changeMainMenu();
  });
  
  //offline management
    ionic.Platform.ready(function() {
      if ($networkFactory.getNetworkState() === true){
      //if ($cordovaNetwork.isOnline() === true){
        $scope.offline = "";
        //create leafletMap
        $scope.leafletMap = function(latitude, longitude){ 
          $scope.map = L.map('map', {zoomControl: false}).setView([latitude, longitude], 17); 
          L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            //maxZoom: 18,
            //minZoom: 13
          }).addTo($scope.map);
        
          //marker options
          var geojsonMarkerOptions = {
            radius: 8,
            fillColor: "#ff7800",
            color: "#000000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          };

          //TODO : use cach system to avoid reload all species

          //get all observation from the API
          $easinFactoryREST.query(
            //parameter, empty for the moment, better to user custome request in $easinFactory
            //success
            function(data){
              //filter data to have just the right specie
              //data = $filter('filter')(data, {properties: {LSID : $scope.specie.LSID}});

              data.forEach(function(sob){
                if (sob.properties.Status === "Submitted"){
                //if (sob.properties.Status === "Submitted1"){
                  L.geoJson(sob, {
                    style: function(feature) {
                      return {color: "#FE2E2E"};
                    },
                    pointToLayer: function(feature, latlng) {
                      return new L.CircleMarker(latlng, {radius: 3, fillOpacity: 0.85});
                    }
                  }).addTo($scope.map);
                }else if (sob.properties.Status == "Validated" || sob.properties.Status == "Prevalidated"){
                   //}else if (sob.properties.Status == "Validated" || sob.properties.Status == "Submitted"){
                  L.geoJson(sob).addTo($scope.map).bindPopup(
                     sob.properties.Abundance +  " (" + sob.properties.Precision +" )" +
                    "<br/><b>Date : </b>" + $filter('limitTo')(sob.createdAt, 10, 0) + " " + $filter('limitTo')(sob.createdAt, 7, 12) +
                    "<br/><b>Status : </b>" + sob.properties.Status +
                    "<br/><a href='#/app/sob/"+ sob._id +"'>View details</a>"
                  );
                }
              });

            },
            //error
            function(error){
              //console.error("error data marker : "+error);
            }
          );
        }

        //run
        $geolocationFactory.get().then(
          function(success){
            $scope.leafletMap(success.latitude, success.longitude);
          },
          function(error){
            $scope.leafletMap(error.latitude, error.longitude);
          }
        );
      }else{
        $scope.offline = "You need a network connection to use this feature";
      }
    }); 
}])


/*
 * Login Controller
 * ------------------------------------------------------------
 */
.controller('LoginCtrl', ['$scope', '$state', '$rootScope', '$cacheFactory', '$ionicModal', '$ionicLoading', '$ionicPopup', '$ionicHistory', '$authenticationFactory', 'TEXT', function($scope, $state, $rootScope, $cacheFactory, $ionicModal, $ionicLoading, $ionicPopup, $ionicHistory, $authenticationFactory, TEXT){
  $scope.$on('$ionicView.beforeEnter', function(e) {
    if($scope.mainMenu === true) $scope.changeMainMenu();
    $scope.isLogged = $authenticationFactory.checkSessionLocal();
    //console.log($scope.isLogged);
    //console.log('current time : '+ new Date().getTime()+". token time : "+$authenticationFactory.getSession().timestamp);
  });



  $scope.testNonce = function(){
    //console.log("init getnoNCE");
    $authenticationFactory.getNonce().then(
      function(success){
        //console.log("success getnonce");
        //console.log(success);
      }, function(error){
        //console.error('error getnonce');
        //console.error(error);
      }
    );

    var tmpEmail = "";

  };

  $scope.test = function(){
    //console.log($authenticationFactory.getSession());
    $authenticationFactory.checkSession($authenticationFactory.getSession().sessionToken).then(
      function(success){
        console.log('success checksiion');
        //console.log(success);
      }, function(error){
        console.error('error checkssion');
        //console.error(error);
      }
    );
  };


  $scope.login = function(loginForm){
    $ionicLoading.show({
      template: "<ion-spinner icon='bubbles'></ion-spinner>",
      delay: 0
    });
    $authenticationFactory.login(loginForm.email, loginForm.password).then(
      function(success){
        console.log('success login');
        //console.log(success);
        $ionicLoading.hide();
        $ionicHistory.nextViewOptions({
          historyRoot: true
        });
        $scope.appCtrl.session = $authenticationFactory.updateSession(success.SessionToken, new Date().getTime(), true);
        var user = {
          username: "",
          firstname: "",
          lastname: "",
          email: loginForm.email
        };
        $scope.appCtrl.user = $authenticationFactory.updateUser(user, true);
        $authenticationFactory.setUserEmailReport(loginForm.email);
        $cacheFactory.get('customQueryCache').removeAll();
        $state.go('app.home');
      },
      function(error){
        console.error("error login");
        //console.error(error);
        var errorMessage = error.data.Message;
        // if (error.data){
        //   errorMessage = error.data.replace(/newnonce:-+[0-9]*/g,'');
        // }
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: TEXT.errorLogin_label,
          template: errorMessage
        });
      }
    );
  };

  $scope.register = function(registrationForm){
    $ionicLoading.show({
      template: "<ion-spinner icon='bubbles'></ion-spinner>",
      delay: 0
    });
    $authenticationFactory.registration(registrationForm.email, registrationForm.username, registrationForm.firstname, registrationForm.lastname, registrationForm.password, registrationForm.confirmpassword).then(
      function(success){
        $ionicLoading.hide();
        $ionicHistory.nextViewOptions({
          historyRoot: true
        });
        $scope.appCtrl.session = $authenticationFactory.updateSession(success.SessionToken, new Date().getTime(), true);
        var user = {
          username: "",
          firstname: "",
          lastname: "",
          email: registrationForm.email
        };
        $authenticationFactory.setUserEmailReport(registrationForm.email);
        $scope.appCtrl.user = $authenticationFactory.updateUser(user, true);
        $state.go('app.home');
      },
      function(error){
        var errorMessage = error.data.Errors[0].ErrorMessage;
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: TEXT.errorRegistration_label,
          template: errorMessage
        });
      }
    );
  };

  $scope.changePassword = function(changePwdForm){
    $ionicLoading.show({
      template: "<ion-spinner icon='bubbles'></ion-spinner>",
      delay: 0
    });
    $authenticationFactory.changePassword(changePwdForm.email, changePwdForm.oldpassword, changePwdForm.newpassword, changePwdForm.confirmpassword).then(
      function(success){
        console.log('succes changepw');
       // console.log(success);
        $ionicLoading.hide();
        $ionicHistory.nextViewOptions({
          historyRoot: true
        });

        $scope.appCtrl.session = $authenticationFactory.updateSession(success.SessionToken, new Date().getTime(), true);
        var user = {
          username: "",
          firstname: "",
          lastname: "",
          email: changePwdForm.email
        };
        $authenticationFactory.setUserEmailReport(changePwdForm.email);
        $scope.appCtrl.user = $authenticationFactory.updateUser(user, true);
        $state.go('app.home');
      },
      function(error){
        console.error('error changepw');
        //console.error(error);
        // var errorMessage = "Error during changing password process";
        // if (error.data){
        //   errorMessage = error.data.replace(/newnonce:+[0-9]*/g,'');
        // }
        var errorMessage = error.data.Message;
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: 'Error',
          template: errorMessage
        });
      }
    );
  };

  $scope.forgot = function(forgotPwdForm){
    $ionicLoading.show({
      template: "<ion-spinner icon='bubbles'></ion-spinner>",
      delay: 0
    });
    $authenticationFactory.forgotPassword(forgotPwdForm.email).then(
      function(success){
        console.log('succes forgotpw');
        //console.log(success);
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: TEXT.successForgotPassword_label,
          template: "A reset token was sent to : "+forgotPwdForm.email+". <br/> Copy the code in the 'Reset Token' field to set up a new password for your account."
        });
        tmpEmail = forgotPwdForm.email;
        $scope.forgotPwdStep = 2;
      },
      function(error){
        console.error('error cforgotpw');
        //console.error(error);
        // var errorMessage = "Error during the process";
        // if (error.data){
        //   errorMessage = error.data.replace(/newnonce:+[0-9]*/g,'');
        // }
        var errorMessage = error.data.Message;
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: 'Error',
          template: errorMessage
        });
      }
    );
  };

  $scope.reset = function(resetPwdForm){
    $ionicLoading.show({
      template: "<ion-spinner icon='bubbles'></ion-spinner>",
      delay: 0
    });
    $authenticationFactory.resetPassword(tmpEmail, resetPwdForm.newpassword, resetPwdForm.confirmpassword, resetPwdForm.resettoken).then(
      function(success){
        console.log('succes resetpw');
        //console.log(success);
        $ionicLoading.hide();
        $ionicHistory.nextViewOptions({
          historyRoot: true
        });
        //$scope.appCtrl.session = $authenticationFactory.updateSession(success.replace(/SessionToken:/g, new Date().getTime(), ''), true);
        $scope.appCtrl.session = $authenticationFactory.updateSession(success.SessionToken, new Date().getTime(), true);
        var user = {
          username: "",
          firstname: "",
          lastname: "",
          email: tmpEmail
        };
        $scope.appCtrl.user = $authenticationFactory.updateUser(user, true);
        $state.go('app.home');
      },
      function(error){
        console.error('error resetpw');
        //console.error(error);
        // var errorMessage = "Error during the process";
        // if (error.data){
        //   errorMessage = error.data.toJson.replace(/newnonce:+[0-9]*/g,'');
        // }
        var errorMessage = error.data.Message;
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: 'Error',
          template: errorMessage
        });
      }
    );
  };

  $scope.logout = function(){
    $authenticationFactory.logout();
    $scope.isLogged = false;
    $authenticationFactory.updateSession('', 0, false);
    $authenticationFactory.setUserEmailReport("");
    $cacheFactory.get('customQueryCache').removeAll();
  };

  /*Registration modal*/
  $ionicModal.fromTemplateUrl('partials/modals/modal_register.html', {
    scope: $scope,
    animation: 'jelly'
  }).then(function(modal) {
    $scope.registerModal = modal;
  });
  $scope.openRegisterModal = function() {
    $scope.registerModal.show();
  };
  $scope.closeRegisterModal = function() {
    $scope.registerModal.hide();
  };
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.registerModal.remove();
  });

  /*Change password modal*/
  $ionicModal.fromTemplateUrl('partials/modals/modal_changePwd.html', {
    scope: $scope,
    animation: 'jelly'
  }).then(function(modal) {
    $scope.changePwdModal = modal;
  });
  $scope.openChangePwdModal = function() {
    $scope.changePwdModal.show();
  };
  $scope.closeChangePwdModal = function() {
    $scope.changePwdModal.hide();
  };
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.changePwdModal.remove();
  });

  /*Forgot password modal*/
  $ionicModal.fromTemplateUrl('partials/modals/modal_forgotPwd.html', {
    scope: $scope,
    animation: 'jelly'
  }).then(function(modal) {
    $scope.forgotPwdModal = modal;
  });
  $scope.openForgotPwdModal = function() {
    $scope.forgotPwdStep = 1;
    $scope.forgotPwdModal.show();
  };
  $scope.closeForgotPwdModal = function() {
    $scope.forgotPwdModal.hide();
  };
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.forgotPwdModal.remove();
  });
  
}])

;




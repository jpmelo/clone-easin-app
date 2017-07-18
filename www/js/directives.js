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

angular.module('MYGEOSS.directives', [])


/*
 * Specie Controller -- Photos
 * ------------------------------------------------------------
 */

.directive('speciePhotos', function() {
  return {
    restrict: 'E',
    templateUrl: 'partials/specie_pictures.html',
    controller: function($scope){
      $scope.photoBrowser(0); //open gallery at 1st picture
      //$scope.myPhotoBrowserStandalone.open();
    }
  }
})

/*
 * Specie Controller -- Information
 * ------------------------------------------------------------
 */
.directive('specieInformation', function() {
  return {
    restrict: 'E',
    templateUrl: 'partials/specie_information.html',
    controller: function($scope){
      $scope.linkObservation = [];
      var i = 0;
      while(i < $scope.specie.further_information){
        var foo = cordova.InAppBrowser.open($scope.specie.further_information[i], "_system");
        $scope.linkObservation.push(foo);
        i++;
      }
    }
  }
})


/*
 * Specie Controller -- Map
 * ------------------------------------------------------------
 */
.directive('specieMap', function() {
  return {
    restrict: 'E',
    templateUrl: 'partials/specie_map.html',
    controller: function($scope, $filter, $easinFactoryREST, $geolocationFactory, $cordovaNetwork, $networkFactory){

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

  

            //get all observation from the API
            $easinFactoryREST.query(
              //parameter, empty for the moment, better to user custome request in $easinFactory
              //success
              function(data){
                //filter data to have just the right specie
                data = $filter('filter')(data, {properties: {LSID : $scope.specie.LSID}});

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
                console.error("error data marker : "+error);
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
      
    }
  }
})

/*
 * Report a sighting (use in Specie controller too)
 * ------------------------------------------------------------
 */
.directive('specieReportSighting', function() {
  return {
    restrict: 'E',
    templateUrl: 'partials/specie_report_sighting.html',
    controller: function($scope, $rootScope, $state, $stateParams, $timeout, $filter, $sce, $q, $cacheFactory, $cordovaNetwork, $ionicModal, $ionicLoading, $ionicHistory, $ionicActionSheet, $ionicPopup, $speciesFactory, $easinFactory, $easinFactoryLocal, $geolocationFactory, $dateFactory, $photoFactory, $networkFactory, $authenticationFactory, TEXT, $cordovaDevice, CONFIG){
      /*
       * Init data
       * ----------
       */

      $ionicLoading.show({
        template: "<ion-spinner icon='bubbles'></ion-spinner>",
        delay: 0
      });

      var maxPhotos = 3;

      //error
      $scope.errorSelectSpecie = "";
      $scope.errorScale = "";
      $scope.errorPicture = "";
      $scope.errorHabitat = "";


      /*if($stateParams.id > 0){ //if it's a saved draft
        //alert('ok parameter');
        $easinFactoryLocal.getObservationByID(id)

      }else{
        alert("no parameter");
      }*/
      $easinFactoryLocal.getObservationByID($stateParams.id).then(
        function(savedReport){ //if there is a saved draft in the DB

          //coordinates
          if(angular.fromJson(savedReport.coordinates).length < 2){
            $geolocationFactory.get().then(
              function(success){
                $scope.coordinates = {latitude: success.latitude, longitude: success.longitude};
                 $timeout(function() {
                    $ionicLoading.hide();
                }, 150);
              },
              function(error){
                $scope.coordinates = {latitude: error.latitude, longitude: error.longitude};
                $timeout(function() {
                    $ionicLoading.hide();
                }, 150);
              }
            );
          }else{
            $scope.coordinates = {latitude: angular.fromJson(savedReport.coordinates)[1], longitude: angular.fromJson(savedReport.coordinates)[0]};
            $timeout(function() {
                  $ionicLoading.hide();
              }, 150);
          }

          //date
          $scope.date = new Date(savedReport.date); //$filter('date')(savedReport.date, 'yyyy-MM-dd')
          $scope.abundance = angular.fromJson(savedReport.abundance);
          $scope.habitat = savedReport.habitat;
          $scope.comment = savedReport.comment;
          
          //specie
          $scope.specie = angular.fromJson(savedReport.specie);
          if($scope.specie.common_name === undefined || $scope.specie.common_name === 'undefined' || $scope.specie.common_name === ""){
            $scope.displaySelectSpecie = "Select a species";
          }else{
            $scope.displaySelectSpecie = $scope.specie.common_name;
          }

          //TODO MANAGE IMAGES
          $scope.images = [];
          var imageIterateur = 0;
          var savedImages = angular.fromJson(savedReport.images);
          if (savedImages.length > 0){
            $scope.images = savedImages;
          }
          // if (savedImages.length > 0){
          //   var arrayPromiseImages = [];
          //   while(imageIterateur < savedImages.length){
          //     arrayPromiseImages.push($photoFactory.readAsDataURL(savedImages[imageIterateur].path, savedImages[imageIterateur].file));
          //     imageIterateur++;
          //   }
          //   $q.all(arrayPromiseImages).then(
          //     function(success){
          //       imageIterateur = 0;
          //       while(imageIterateur < success.length){
          //         $scope.images.push({
          //             file: savedImages[imageIterateur].file,
          //             path: savedImages[imageIterateur].path,
          //             base64: success[imageIterateur]
          //         });
          //         //savedImages[imageIterateur].base64 = success[imageIterateur];
          //         imageIterateur++;
          //       }

          //     },
          //     function(err){

          //     }
          //   );
          // }else{

          // }
        },
        function(error){ //If it's a new draft

          $geolocationFactory.get().then(
            function(success){
              $scope.coordinates = {latitude: success.latitude, longitude: success.longitude};
               $timeout(function() {
                  $ionicLoading.hide();
              }, 150);
            },
            function(error){
              $scope.coordinates = {latitude: error.latitude, longitude: error.longitude};
              $timeout(function() {
                  $ionicLoading.hide();
              }, 150);
            }
          );

         
          $scope.date = new Date();
          $scope.abundance = {scale: "coverage in km²", number: "", precision: "Estimated"};
          $scope.habitat = "";
          //$sce.trustAsHtml("coverage in km&sup2;")
          $scope.comment = "";
          $scope.images = [];
          $scope.displaySelectSpecie = "Select a species";

        }
      );
     
      /*
       ** Select specie
       ** --------------
       */

      $speciesFactory.getAll().then(function(success){
        $scope.species = success.species;
      });

      $scope.changeSpecie = function(specie){
        $scope.specie = specie;
        $scope.displaySelectSpecie = $scope.specie.common_name;
      };
      //$scope.specie = {};


      $scope.openModalReportSightingSpecieList = function(){
        // $scope.modalReportSightingSpecieList = {};
        // $ionicModal.fromTemplateUrl('partials/modals/report_sighting_specieList.html', {
        //   scope: $scope,
        //   animation: 'slide-in-up',
        //   backdropClickToClose: false,
        //   hardwareBackButtonClose: false
        // }).then(function(modal) {
        //   $scope.modalReportSightingSpecieList = modal;
        //   $scope.modalReportSightingSpecieList.show();
        // });
        $scope.modalReportSightingSpecieList.show();
      };

      $scope.hideModalReportSightingSpecieList = function(){
        $scope.modalReportSightingSpecieList.hide();
      };

      var createModalSpeciesList = function(){
        $scope.modalReportSightingSpecieList = {};
        $ionicModal.fromTemplateUrl('partials/modals/report_sighting_specieList.html', {
          scope: $scope,
          animation: 'slide-in-up',
          backdropClickToClose: false,
          hardwareBackButtonClose: false
        }).then(function(modal) {
          $scope.modalReportSightingSpecieList = modal;
          //$scope.modalReportSightingSpecieList.show();
        });
      };

      createModalSpeciesList();

      /*
       ** Location
       ** ---------
       */

      //create leafletMap
      /*$scope.leafletMap = function(latitude, longitude){ 
        $scope.map = L.map('map', {zoomControl: false}).setView([latitude, longitude], 17); 
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
          minZoom: 13
        }).addTo($scope.map);
      };


      $scope.openModalReportSightingMap = function(){
        $scope.modalReportSightingMap = {};
        $scope.map = {};
        var numberMarker = 0;
        var addedMarker;

        $ionicModal.fromTemplateUrl('partials/modals/report_sighting_map.html', {
          scope: $scope,
          animation: 'slide-in-up',
          backdropClickToClose: false,
          hardwareBackButtonClose: false
        }).then(function(modal) {
          $scope.modalReportSightingMap = modal;
          $scope.modalReportSightingMap.show();
          //if ($networkFactory.getNetworkState() === true){
          if ($cordovaNetwork.isOnline() === true){
            $scope.offline = "";
            $scope.leafletMap($scope.coordinates.latitude, $scope.coordinates.longitude);
            var initialMarker = new L.marker([$scope.coordinates.latitude, $scope.coordinates.longitude], {clickable: true}).addTo($scope.map);

            $scope.map.on('click', function(e) {
              $scope.map.removeLayer(initialMarker);
              if(numberMarker < 1){
                addedMarker = new L.marker(e.latlng, {clickable: true});
                addedMarker.addTo($scope.map);
                numberMarker++;
                $scope.coordinates = {latitude: e.latlng.lat, longitude: e.latlng.lng};
              }else{
                $scope.map.removeLayer(addedMarker);
                addedMarker = new L.marker(e.latlng, {clickable: true});
                addedMarker.addTo($scope.map);
                $scope.coordinates = {latitude: e.latlng.lat, longitude: e.latlng.lng};
              }
            }); 
          }else{
            $scope.offline = "You need a network connection to use this feature";
          }     
        });
      };

      $scope.hideModalReportSightingMap = function(){
        $scope.modalReportSightingMap.remove();
      };*/

      $scope.leafletMap = function(latitude, longitude){ 
        $scope.map.container = L.map('map', {zoomControl: false}).setView([latitude, longitude], 17); 
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
          // maxZoom: 18,
          // minZoom: 13
        }).addTo($scope.map.container);
      };

      $scope.map = {"container": ""};
      $scope.openModalReportSightingMap2 = function(){
        $scope.modalReportSightingMap = {};
        
        var numberMarker = 0;

        $ionicModal.fromTemplateUrl('partials/modals/report_sighting_map.html', {
          scope: $scope,
          animation: 'slide-in-up',
          backdropClickToClose: false,
          hardwareBackButtonClose: false
        }).then(function(modal) {
          $scope.modalReportSightingMap = modal;   
        });
      };

      $scope.openModalReportSightingMap2();

      $scope.openModalReportSightingMap = function(){
        //$scope.modalReportSightingMap = {};
        //if ($scope.map != undefined) { $scope.map.remove(); }
        //$scope.map = {};
        var numberMarker = 0;
        var addedMarker;
        $scope.modalReportSightingMap.show();
          //if ($networkFactory.getNetworkState() === true){
          if ($cordovaNetwork.isOnline() === true){
            $scope.offline = "";
            $scope.leafletMap($scope.coordinates.latitude, $scope.coordinates.longitude);
            var initialMarker = new L.marker([$scope.coordinates.latitude, $scope.coordinates.longitude], {clickable: true}).addTo($scope.map.container);

            $scope.map.container.on('click', function(e) {
              $scope.map.container.removeLayer(initialMarker);
              if(numberMarker < 1){
                addedMarker = new L.marker(e.latlng, {clickable: true});
                addedMarker.addTo($scope.map.container);
                numberMarker++;
                $scope.coordinates = {latitude: e.latlng.lat, longitude: e.latlng.lng};
              }else{
                $scope.map.container.removeLayer(addedMarker);
                addedMarker = new L.marker(e.latlng, {clickable: true});
                addedMarker.addTo($scope.map.container);
                $scope.coordinates = {latitude: e.latlng.lat, longitude: e.latlng.lng};
              }
            }); 
          }else{
            $scope.offline = "You need a network connection to use this feature";
          }     
      };

      $scope.hideModalReportSightingMap = function(){
        if ($scope.map.container != undefined) { $scope.map.container.remove(); }
        $scope.modalReportSightingMap.hide();
      };

      $scope.$on('$destroy', function() {
        console.log('destroy, remove modal event');
        $scope.modalReportSightingMap.remove();
      });
      /*
      ** Date
      ** ---------
      */
      $scope.pickDate = function(){
        $dateFactory.datePicker().then(
          function(success){
            $scope.date = success;
          },
          function(error){
            $scope.date = new Date();
          }
        );
      };

      /*
      ** Pictures
      ** ------------
      */
      $scope.camera = function(){
        $ionicLoading.show({
          template: "<ion-spinner icon='bubbles'></ion-spinner>",
          delay: 0
        });
        $photoFactory.photoCamera().then(
          function(imgUri){
            window.resolveLocalFileSystemURL(imgUri, function(fileEntry) {
                //console.log(fileEntry);
                console.log("got file: " + fileEntry.fullPath);

                var fileName = fileEntry.name;
                var fullNativeUrl = fileEntry.nativeURL;
                var pathNativeUrl = fullNativeUrl.replace(fileName, "");
                var newFileName = new Date().getTime()+""+fileName;
                $photoFactory.movePhoto(pathNativeUrl, fileName, $rootScope.deviceStorageLocation+'IASimg', newFileName).then(
                  function(success){
                    console.log('successMovephoto');
                    //console.log(success);
                    var imageData = {file: success.name, path: $rootScope.deviceStorageLocation+'IASimg/', fileEntryObject: success};
                    $scope.images.push(imageData);
                    $ionicLoading.hide();
                  },
                  function(error){
                    $ionicLoading.hide();
                    console.error('error move photocamera');
                   // console.error(error);
                  }
                );

            }, function (error) {
              // If don't get the FileEntry (which may happen when testing
              // on some emulators), copy to a new FileEntry.
              console.error('resolveLocalFileSystemURL');
              //console.error(error);
            });
            //$cordovaFile

            // console.log("success directives");
            // var split = success.split("/");
            // var file = split[split.length-1];
            // var path = success.replace(file, "");
            // path = path.replace("content://", "file://");
            // var imageData = {file: file, path: path};
            
            /*  try with file path, convert into base64 when you send the picture only */
          
            // $scope.images.push(imageData);
            // $ionicLoading.hide();


            // $photoFactory.readAsDataURL(path, file).then(
            //   function(success){
            //     imageData.base64 = success;
            //     $scope.images.push(imageData);

            //     $ionicLoading.hide();
            //     console.log("success read data");
            //   },
            //   function(error){
            //     $ionicLoading.hide();
            //     console.log("error read data");
            //   }
            // );
          },
          function(error){ 
            $ionicLoading.hide();
            console.log("error directives photocamera");
          }
        );
      };

      $scope.library = function(){
        ionic.Platform.ready(function() {
          window.imagePicker.getPictures(
              function(results) {
                  for (var i = 0; i < results.length; i++) {
                      console.log('Image URI: ' + results[i]);
                  }

                  window.resolveLocalFileSystemURL(results[0], function(fileEntry) {
                    //console.log(fileEntry);
                    console.log("got file: " + fileEntry.fullPath);

                    var fileName = fileEntry.name;
                    var fullNativeUrl = fileEntry.nativeURL;
                    var pathNativeUrl = fullNativeUrl.replace(fileName, "");
                    var newFileName = new Date().getTime()+""+fileName;
                    $photoFactory.movePhoto(pathNativeUrl, fileName, $rootScope.deviceStorageLocation+'IASimg', newFileName).then(
                      function(success){
                        console.log('successMovephoto');
                        //console.log(success);
                        var imageData = {file: success.name, path: $rootScope.deviceStorageLocation+'IASimg/', fileEntryObject: success};
                        //console.log("file : "+imageData.file+ " path: "+imageData.path);
                        $scope.images.push(imageData);
                        $ionicLoading.hide();
                      },
                      function(error){
                        $ionicLoading.hide();
                        console.error('errormovephotocamera');
                        console.error(error);
                      }
                    );
                  }, function (error) {
                    // If don't get the FileEntry (which may happen when testing
                    // on some emulators), copy to a new FileEntry.
                    console.error('resolveLocalFileSystemURL');
                    //console.error(error);
                     $ionicLoading.hide();
                      //createNewFileEntry(imgUri);
                  });
              }, function (error) {
                  console.log('Error: ' + error);
              }, {
                  maximumImagesCount: 1,
                  width: 650,
                  quality: 75

              }
          );
        });
      }


      //Add picture
      $scope.addPhoto = function(){
        if ($scope.images.length >= maxPhotos){
          $ionicPopup.alert({
            title: TEXT.errorAddPhoto_label,
            template: TEXT.errorAddPhoto_content
          });
        }else{
          // Show the action sheet
          var hideSheet = $ionicActionSheet.show({
            buttons: [
              { text: 'camera' },
              { text: 'my device' }
            ],
            titleText: 'Select photo from',
            cancelText: 'Cancel',
            cancel: function() {
                // add cancel code..
                //alert("cancel");
            },
            buttonClicked: function(index) {
              switch (index){
              case 0 :
                //Handle Camera
                $scope.camera();
                return true;
              case 1 :
                //Handle on my phone
                $scope.library();
                return true;
              }
            }
          });
        }
      };

      //Delete picture
      $scope.deletePhoto = function(indexI){
        // Show the action sheet
        var index = indexI;
        var hideSheet = $ionicActionSheet.show({
          destructiveText: 'Delete',
          titleText: 'Delete this picture?',
          cancelText: 'Cancel',
          cancel: function() {
                // add cancel code..
          },
          destructiveButtonClicked: function() {
            $photoFactory.removePhoto($scope.images[index].path, $scope.images[index].file);
            $scope.images.splice(index,1); //delet 
            return true;
          }
        });
      };

      /*
       * Send data
       * ----------
       */  

      $scope.sendData = function(){
        var canSendData = true;
        $scope.cantSendDataMessage = "";
        $scope.errorSelectSpecie = "";
        $scope.errorScale = "";
        $scope.errorPicture = "";

        if ($scope.specie.LSID === undefined || $scope.specie.LSID === 'undefined' || $scope.specie.LSID === ""){
          canSendData = false;
          $scope.errorSelectSpecie = "error";
          $scope.cantSendDataMessage += "Please select a species. </br>";
        }
        if ($scope.images.length <= 0){
          canSendData = false;
          $scope.errorPicture = "error";
          $scope.cantSendDataMessage += "Please include at least one picture of your observation. </br>";
        }

        if($scope.abundance.number === 0 || $scope.abundance.number === undefined || $scope.abundance.number === 'undefined' || $scope.abundance.number === "" || $scope.abundance.number === "0"){
          canSendData = false;
          $scope.errorScale = "error";
          $scope.cantSendDataMessage += "Please indicate a scale for your observation. </br>";
        }

        if ($scope.habitat=== undefined || $scope.habitat === 'undefined' || $scope.habitat === ""){
          canSendData = false;
          $scope.errorHabitat = "error";
          $scope.cantSendDataMessage += "Please select an habitat. </br>";
        }


        if (canSendData === true){
          if(!$authenticationFactory.checkSessionLocal()){ //Check if user is logged
            canSendData = false;
            var confirmPopup = $ionicPopup.confirm({
              title: TEXT.errorNoLogged_label,
              template: TEXT.errorNoLogged_content,
              okText: TEXT.errorNoLogged_okText
            });

            confirmPopup.then(function(res) {
              if(res){
                console.log('You are sure');
                $scope.saveDraft();
              }else {
                console.log('You are not sure');
              }
            });
          }else{
            $ionicLoading.show({
              template: "<ion-spinner icon='bubbles'></ion-spinner>",
              delay: 0
            });
            //todo : verify coordinates order
            if ($cordovaNetwork.isOnline() === true){ //if online send data
              $easinFactory.sendObservation($scope.specie.LSID, $rootScope.UUID, $scope.abundance.number+" "+$scope.abundance.scale, $scope.abundance.precision, "Habitat : "+$scope.habitat+". Comment : "+$scope.comment, $scope.images, 'false',  [$scope.coordinates.longitude, $scope.coordinates.latitude], "Point").then(
                function(success){
                  if($stateParams.id > 0){ //if it was a saved draft, delete it from the DB
                    $easinFactoryLocal.deleteObservation($stateParams.id);
                    $ionicLoading.hide();

                    $ionicPopup.alert({
                       title: 'Success',
                       template: 'Draft sent.'
                     }).then(function(success){
                        $cacheFactory.get('customQueryCache').removeAll();
                        $ionicHistory.nextViewOptions({
                          historyRoot: true
                        });
                        $scope.backToHome();
                     }, function(error){});

                   // $scope.backToHome();
                  }else{
                    $ionicLoading.hide();

                    $ionicPopup.alert({
                       title: 'Success',
                       template: 'Draft sent.'
                     }).then(function(success){
                      $cacheFactory.get('customQueryCache').removeAll();
                        $ionicHistory.nextViewOptions({
                          historyRoot: true
                        });
                        $scope.backToHome();
                     }, function(error){});

                    //$scope.backToHome();
                  }
                },
                function(error){
                  $ionicLoading.hide();
                  $ionicPopup.alert({
                   title: 'Error',
                   template: error
                  });
                }
              );
            }else{
              $scope.saveDraft('pending');
            }
          }
        }else{
          $ionicPopup.alert({
           title: 'Missing field',
           template: $scope.cantSendDataMessage
          });
        }
      };

      /*
       * Save Draft
       * -----------
       */

      $scope.saveDraft = function(statusP){
        
        $ionicLoading.show({
          template: "<ion-spinner icon='bubbles'></ion-spinner>",
          delay: 0
        });

        ionic.Platform.ready(function() {
          if (statusP === undefined || statusP === 'undefined' || statusP === ""){
            var status = 'complete';
          }else{
            var status = statusP;
          }
          if ($scope.specie.LSID === undefined || $scope.specie.LSID === 'undefined' || $scope.specie.LSID === ""){
            status = 'incomplete';
            var specie = {};
          }else{
            //var specie = {LSID: ''};
            var specie = $scope.specie;
          }
          if ($scope.images.length <= 0){
            status = 'incomplete';
            var images = [];
          }else{
            var images = [];
            angular.forEach($scope.images, function(image, key){
              obj = { 
                path: image.path,
                file: image.file
              }
              images.push(obj);
            });
          }
          if ($scope.habitat=== undefined || $scope.habitat === 'undefined' || $scope.habitat === ""){
            status = 'incomplete';
            $scope.habitat = "";
          }

          var coordinates = [$scope.coordinates.longitude, $scope.coordinates.latitude];

          if($stateParams.id > 0){ //If paramaeters, update
             $easinFactoryLocal.updateObservation(specie, images, coordinates, $scope.date, $scope.abundance, $scope.habitat, $scope.comment, status, $stateParams.id).then(
              function(success){
                  $ionicLoading.hide();
                  $ionicPopup.alert({
                     title: 'Success',
                     template: 'Draft updated.'
                   }).then(function(success){
                      $ionicHistory.nextViewOptions({
                        historyRoot: true
                      });
                      $scope.backToHome();
                   }, function(error){});
                  //$scope.backToHome();
              },
              function(error){
                $ionicLoading.hide();
                $ionicPopup.alert({
                 title: 'Error saving draft',
                 template: error
                });
              }
            );
          }else{ //if not parameters, add new
            $easinFactoryLocal.saveObservation(specie, images, coordinates, $scope.date, $scope.abundance, $scope.habitat, $scope.comment, status).then(
              function(success){
                  $ionicLoading.hide();


                   $ionicPopup.alert({
                     title: 'Success',
                     template: 'Draft saved'
                   }).then(function(success){
                      $ionicHistory.nextViewOptions({
                        historyRoot: true
                      });
                      $scope.backToHome();
                   }, function(error){});
                  //$scope.backToHome();
              },
              function(error){
                $ionicLoading.hide();
                $ionicPopup.alert({
                 title: 'Error saving draft',
                 template: error
                });
              }
            );
          }
        });
      };
    }
  }
})

/*
 * SOB Controller -- Photos
 * ------------------------------------------------------------
 */

.directive('sobPhotos', function() {
  return {
    restrict: 'E',
    templateUrl: 'partials/sob_pictures.html',
    controller: function($scope){
      $scope.photoBrowser(0);
    }
  }
})

/*
 * SOB Controller -- Information
 * ------------------------------------------------------------
 */
.directive('sobInformation', function() {
  return {
    restrict: 'E',
    templateUrl: 'partials/sob_information.html',
    controller: function($scope){
      
    }
  }
})


/*
 * img background work with collection-repeat
 * --------------------------------------------
 */
 .directive('backImg', function(){
    return function(scope, element, attrs){
        var url = attrs.backImg;
        var content = element;
        content.css({
            'background-image': 'url(data/thumbnails/' + url +')',
            'background-size' : 'cover'
        });
    };
})

;

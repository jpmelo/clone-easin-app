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

angular.module('MYGEOSS.services', [])

/** Species Factory
* Get all species and their data in a local json file
*/
.factory('$speciesFactory', ['$http', '$q', function($http, $q){
	var currentSpecie = ""; //object, the selected specie informations
	var obj = {};

	obj.getAll = function(){
		var def = $q.defer();
		$http.get("data/species/species2.json").then(
			function(success){
				def.resolve(success.data);
			},
			function(error){
				def.reject(error);
			}
		);
		return def.promise;
	};
	obj.setCurrentSpecie = function(specie){
		currentSpecie = specie;
	};
	obj.getCurrentSpecie = function(){
		return currentSpecie;
	};
	return obj;
}])



/* $easinFactoryREST
* Communicate with the EASIN REST API
*/ 
.factory('$easinFactoryREST', ['$resource','CONFIG', '$cacheFactory', function ($resource, CONFIG, $cacheFactory) {
  var customQueryCache = $cacheFactory('customQueryCache'); 
	return $resource(CONFIG.serverApiUrl + "reports/:reportId", {reportId:'@id'},
		{
			'update': {method: 'PUT', timeout: 60000, headers:{'Content-Type': 'application/json'}},
      'get':    {method:'GET', timeout: 60000, cache: true},
	  	'save':   {method:'POST', timeout: 60000},
	  	'query':  {method:'GET', isArray:true, timeout: 90000, cache: customQueryCache},
	  	'remove': {method:'DELETE', timeout: 10000},
			'delete': {method:'DELETE', timeout: 10000} 
		}
	);
}])

/* $photoFactory
*
*/
.factory('$photoFactory', ['$q', '$cordovaCamera', '$cordovaFile', '$cordovaDevice', function($q, $cordovaCamera, $cordovaFile, $cordovaDevice){
  var obj = {};

  var optionsCameraCamera;
  var optionsCameraLibrary;

    //init option here, to avoid the Camera load in the injection before the device is ready
    obj.initOptionsCameraCamera = function(){
      optionsCameraCamera = {
        quality : 60,
        destinationType : Camera.DestinationType.FILE_URI,
        targetWidth : 700,
        //targetHeight: 800,
        sourceType: Camera.PictureSourceType.CAMERA,
        encodingType: Camera.EncodingType.JPEG,
        correctOrientation: true,
        saveToPhotoAlbum: true, //true provok an error on android...
        allowEdit: false
      };
    };

    obj.initOptionsCameraLibrary = function(){
      optionsCameraLibrary = {
        quality : 60,
        destinationType : Camera.DestinationType.FILE_URI,
        //targetWidth : 800,
        //targetHeight: 800,
        correctOrientation: false,
        sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM,
        encodingType: Camera.EncodingType.JPEG,
        saveToPhotoAlbum: false,
        allowEdit: false
      }
    };

    obj.photoCamera = function(){
      var def = $q.defer();
      ionic.Platform.ready(function() {
          $cordovaCamera.getPicture(optionsCameraCamera).then(
            function(imageData){
              def.resolve(imageData);
            },
            function(error){
          def.reject();
            }
          );
      });
      return def.promise;
    };

    obj.photoLibrary = function(){
      var def = $q.defer();
      ionic.Platform.ready(function() {
          $cordovaCamera.getPicture(optionsCameraLibrary).then(
           function(imageData){
              console.log('success photoLibrary');
              console.log(imageData);
              def.resolve(imageData);
            },
            function(error){
              console.error('errorp photoLibrary');
              console.error(error);
              def.reject(error);
            }
          );
      });
      return def.promise;
    };

    obj.removePhoto = function(path, file){ //convert into BASE64
      var def = $q.defer();
      ionic.Platform.ready(function() {
          $cordovaFile.removeFile(path, file).then(
            function(success){
              console.log("Success remove picture : "+path+file);
              def.resolve(success);
            },
            function(error){
              console.error("Error remove picture : "+path+file);
              def.reject(error);
            }
          );
      });
      return def.promise;
    };

    obj.movePhoto = function(path, file, newPath, newFile){
      var def = $q.defer();
      ionic.Platform.ready(function() {
          $cordovaFile.moveFile(path, file, newPath, newFile).then(
            function(success){
              console.log("Success move picture : "+path+file+" to "+newPath+newFile);
              def.resolve(success);
            },
            function(error){
              console.error(error);
              console.error("Error move picture : "+path+file+" to "+newPath+newFile);
              def.reject(error);
            }
          );
      });
      return def.promise;
    };

    obj.readAsDataURL = function(path, file){ //convert into BASE64
      var def = $q.defer();
      ionic.Platform.ready(function() {
          $cordovaFile.readAsDataURL(path, file).then(
            function(success){
              console.log("succes read data as url");
              def.resolve(success);
            },
            function(error){
              def.reject(error);
            }
          );
      });
      return def.promise;
    };

    obj.generateName = function(){
      var date = new Date();
      name = date.getTime();
      return name;
    };

    obj.getLibraryPathAndroid = function(data){
      var deferred = $q.defer();
      ionic.Platform.ready(function() {
        if($cordovaDevice.getPlatform() === 'Android'){

          //plugin https://www.npmjs.com/package/cordova-plugin-filepath
          //deferred.resolve(data);
          window.FilePath.resolveNativePath(data, function(result) {
            console.log("resolveNativePath");
            console.log(result);
            deferred.resolve(result);
            //deferred.resolve('file://' + result);
          }, function (error) {
            console.error('resolveNativePath');
            console.error(error);
              deferred.reject('error convert uri android');
          });
          //deferred.resolve(data);
        }else{
          deferred.resolve(data);
        }
      });
      return deferred.promise;
    }

    return obj;
}])

/** $easinFactory
* Utils functions to manage data with the $easinFactoryREST
*
* @param {string} LSID - The specie LSID identifier
* @param {string} ICCID - Use device UUID
* @param {string} Abundance - Abundance of the specie, scale + number
* @param {string} Precision - Estimated or Measured count
* @param {string} Comment - Comment field + habitat radio button
* @param {Object[]} Images - Array of images
* @param {string} Images[].path - Path of the file in the system
* @param {string} Images[].file - File's name + extension
* @param {boolean} Anonymous - If the observation is sent anonymous or not
* @param {Object[]} coordinates - Array of coordinates
* @param {number} coordinates[0] - Latitude 
* @param {number} coordinates[1] - Longitude 
* @param {string} geometryType - Type of the geomtrique object (for the moment only Point) 
*/
.factory('$easinFactory', ['$q', '$easinFactoryREST', '$photoFactory', '$authenticationFactory', function($q, $easinFactoryREST, $photoFactory, $authenticationFactory){
  var obj = {};

  obj.sendObservation = function(LSID, ICCID, Abundance, Precision, Comment, Images, Anonymous, coordinates, geometryType){
    //confog application/json!!!
    var def = $q.defer();
    var specieObservation = {
      "properties": "",
      "geometry": "",
      "type": ""
    };
    var convertedBase64 = [];
    var promiseDeletePhoto = [];

    if (arguments.length < 9){
      def.reject('Missing parameters');
    }

    //Images conversion into array of base64 pictures
    var arrayPromise = [];
    var i = 0;
    while (i < Images.length){
      console.log('images: '+Images[i].path+""+Images[i].file);
      arrayPromise.push($photoFactory.readAsDataURL(Images[i].path, Images[i].file));
      i++;
    }

    $q.all(arrayPromise).then(
      function(dataSuccess){
        var i = 0;
        while (i < dataSuccess.length){
          convertedBase64.push(dataSuccess[i]);
          i++;
        }
        var OAUTHID = $authenticationFactory.getUserEmailReport();

        specieObservation = {
          "properties": {
            "LSID": LSID,
            "ICCID": ICCID,
            "OAUTHID": OAUTHID,
            "Abundance": Abundance,
            "Precision": Precision,
            "Comment": Comment,
            "Image": convertedBase64,
            "Status": "Submitted",
            "Anonymous": Anonymous
          },
          "geometry" : {
            "coordinates": coordinates,
            "type": geometryType
          },
          "type": "Feature"
        };

        $easinFactoryREST.save(specieObservation, function(){ 
          //$q.all(promiseDeletePhoto); //remove pictures
          var i = 0;
          while (i < dataSuccess.length){
            $photoFactory.removePhoto(Images[i].path, Images[i].file); // remove pictures from tmp folder to empty space
            i++;
          }
           def.resolve("Data sent to the server"); 
        }, function(error){
        console.error(error); 
        //console.error(error);
        //console.error(angular.toJson(specieObservation));
          def.reject("Error sending data to the server"); 
        })

      },
      function(error){
        def.reject(error[i]);
      }
    );

    return def.promise; 
  };

  return obj;
}])

/** $easinFactoryLocal
* Utils functions to manage easin data in local
*/
.factory('$easinFactoryLocal', ['$q', '$cordovaSQLite', '$dataBaseFactory', '$photoFactory', function($q, $cordovaSQLite, $dataBaseFactory, $photoFactory){
  var obj = {};

  obj.saveObservation = function(specie, images, coordinates, date, abundance, habitat, comment, status){
    var def = $q.defer();

    //change position of the pictures
    var arrayPromise = [];
    var i = 0;
    while (i < images.length){
      //console.log('images: '+images[i].path+""+images[i].file);
      var newFile = $photoFactory.generateName()+".jpg";
      arrayPromise.push($photoFactory.movePhoto(images[i].path, images[i].file, cordova.file.dataDirectory, newFile));
      images[i].path = cordova.file.dataDirectory;
      images[i].file = newFile;
      i++;
    }

    $q.all(arrayPromise).then(
      function(success){
        var query = "INSERT INTO reports (specie, images, coordinates, date, abundance, habitat, comment, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $cordovaSQLite.execute($dataBaseFactory.get(), query, [angular.toJson(specie), angular.toJson(images), angular.toJson(coordinates), date, angular.toJson(abundance), habitat, comment, status]).then(
          function(success){
            def.resolve("Entry saved in the database");
          },
          function(error){
            def.reject("Error saving observation in the database");
          }
        );
      },
      function(error){
        def.reject(error);
      }
    );
    return def.promise;
  };

  obj.updateObservation = function(specie, images, coordinates, date, abundance, habitat, comment, status, id){
    var def = $q.defer();
    var query = "UPDATE reports SET specie = ?, images = ?, coordinates = ?, date = ?, abundance = ?, habitat = ?, comment = ?, status = ? WHERE id = '"+id+"'";

    $cordovaSQLite.execute($dataBaseFactory.get(), query, [angular.toJson(specie), angular.toJson(images), angular.toJson(coordinates), date, angular.toJson(abundance), habitat, comment, status]).then(function(res) {
        def.resolve("Report updated");
    }, function (err) {
        console.error(err);
        def.reject("Update report error : "+ err);
    });
    return def.promise;
  };

  obj.updateObservationStatus = function(id, status){
    var def = $q.defer();
    var query = "UPDATE reports SET status = ? WHERE id = '"+id+"'";

    $cordovaSQLite.execute($dataBaseFactory.get(), query, [status]).then(function(res) {
        def.resolve("Report updated");
    }, function (err) {
        console.error(err);
        def.reject("Update report error : "+ err);
    });
    return def.promise;
  };

  obj.getObservationByID = function(id){
    var def = $q.defer();
    var query = "SELECT * FROM reports WHERE id='"+id+"'";
    
    $cordovaSQLite.execute($dataBaseFactory.get(), query, []).then(function(res) {
        if(res.rows.length > 0) {
          var report = {};
            for(var i = 0; i < res.rows.length; i++) {
                report = {id: res.rows.item(i).id, specie: res.rows.item(i).specie, images: res.rows.item(i).images, coordinates: res.rows.item(i).coordinates, date: res.rows.item(i).date, abundance: res.rows.item(i).abundance, habitat: res.rows.item(i).habitat, comment: res.rows.item(i).comment, status: res.rows.item(i).status};
            }
            def.resolve(report);
        } else {
            console.log("No result found");
            def.reject("No result");
        }
    }, function (err) {
        console.error(err);
        def.reject("Request error : "+ err);
    });
    return def.promise;
  };

  obj.getObservationByIDStatus = function(id, status){
    var def = $q.defer();
    var query = "SELECT * FROM reports WHERE id='"+id+"' AND status='"+status+"'";
    
    $cordovaSQLite.execute($dataBaseFactory.get(), query, []).then(function(res) {
        if(res.rows.length > 0) {
          var report = {};
            for(var i = 0; i < res.rows.length; i++) {
                report = {id: res.rows.item(i).id, sob: res.rows.item(i).sob, status: res.rows.item(i).status};
            }
            def.resolve(report);
        } else {
            console.log("No result found");
            def.reject("No result");
        }
    }, function (err) {
        console.error(err);
        def.reject("Request error : "+ err);
    });
    return def.promise;
  };

  obj.getAllObservation = function(){
    var def = $q.defer();
    var query = "SELECT * FROM reports";
    var arrayObservation = [];
    
    $cordovaSQLite.execute($dataBaseFactory.get(), query, []).then(function(res) {
        if(res.rows.length > 0) {
            for(var i = 0; i < res.rows.length; i++) {
                arrayObservation.push(res.rows.item(i));
            }
            def.resolve(arrayObservation);
        } else {
            console.log("No result found");
            def.reject("No result");
        }
    }, function (err) {
        console.error(err);
        def.reject("Request error : "+ err);
    });
    return def.promise;
  };

  obj.getAllObservationByStatus = function(status){
    var def = $q.defer();
    var query = "SELECT * FROM reports WHERE status = '"+status+"'";
    var arrayObservation = [];
    
    $cordovaSQLite.execute($dataBaseFactory.get(), query, []).then(function(res) {
        if(res.rows.length > 0) {
            for(var i = 0; i < res.rows.length; i++) {
                arrayObservation.push(res.rows.item(i));
            }
            def.resolve(arrayObservation);
        } else {
            console.log("No result found");
            def.reject("No result");
        }
    }, function (err) {
        console.error(err);
        def.reject("Request error : "+ err);
    });
    return def.promise;
  };

  obj.deleteObservation = function(id){
    var def = $q.defer();
    obj.getObservationByID(id).then(
      function(entryToDelete){
        var images = angular.fromJson(entryToDelete.images);
        var query = "DELETE FROM reports WHERE id='"+id+"'";

        $cordovaSQLite.execute($dataBaseFactory.get(), query, []).then(function(res) {
          //Entry removed, next photo to delete :
          var arrayPromise = [];
          var i = 0;
          while(i < images.length){
            arrayPromise.push($photoFactory.removePhoto(images[i].path, images[i].file));
            i++;
          }
          if (arrayPromise.length > 0){
            $q.all(arrayPromise).then(
              function(success){
                console.log("entry + photo removed");
                def.resolve("Entry deleted");
              },
              function(err){
                console.log("entry removed , error photo removed");
                def.resolve("Entry deleted");
              }
            );
          }else{
             console.log("Entry deleted no photo");
            def.resolve("Entry deleted");
          }
          
        }, function (err) {
            console.error(err);
            def.reject("Delete entry error : "+ err);
        });
      },
      function(error){

      }
    );
    
    return def.promise;
  };

  return obj;
}])

/** $dataBaseFactory
* Utils functions to manage data in local db
*/
.factory('$dataBaseFactory', ['$q', '$cordovaSQLite', function($q, $cordovaSQLite){
  var obj = {};

  var db;

  obj.get = function(){
    return db;
  };

  obj.set = function(database){
    db = database;
  };

  return obj;
}])


/* $geolocationFactory
* Get device coordinates or by default center of EU
*/
.factory('$geolocationFactory', ['$cordovaGeolocation', '$q', function($cordovaGeolocation, $q){
	var obj = {};

	//timeout	Number	Maximum length of time (milliseconds) that is allowed to pass
  //maximumAge	Number	Accept a cached position whose age is no greater than the specified time in milliseconds
  //enableHighAccuracy	Boolean	Provides a hint that the application needs the best possible results
	var posOptions = {timeout: 5000, maximumAge: 300000, enableHighAccuracy: false};
	var defaultCoordinate = {longitude: 9.254419, latitude: 50.102223} //GeoHack - Geographical Centre of EU in Westerngrund (28 members including Mayotte since 10 May 2014)

	obj.get = function(){
		var def = $q.defer();
		ionic.Platform.ready(function() {
			$cordovaGeolocation.getCurrentPosition(posOptions).then(
				function(success){
					var coordinates = {longitude: success.coords.longitude, latitude: success.coords.latitude};
					def.resolve(coordinates);
				},
				function(error){
					def.reject(defaultCoordinate);
				}
			);
		});

		return def.promise;
	};

	return obj;
}])

/* $dateFactory
* Device DatePicker
*/
.factory('$dateFactory', ['$q', '$cordovaDatePicker', function($q, $cordovaDatePicker){
	var obj = {};

	//var minDate = ionic.Platform.isIOS() ? new Date() : (new Date()).valueOf();
	var dateOption = {
      date: new Date(),
      mode: 'date', // or 'time'
      //minDate: minDate,
      allowOldDates: true,
      allowFutureDates: false,
      doneButtonLabel: 'OK',
      doneButtonColor: '#000000',
      cancelButtonLabel: 'CANCEL',
      cancelButtonColor: '#000000'
    };

    obj.datePicker = function(){
		var def = $q.defer();
      	ionic.Platform.ready(function() {
        	$cordovaDatePicker.show(dateOption).then(function(date){
        		dateOption.date = date || new Date(); //restart plugin to avoid string conversation the second time, who provok a bug on android
          		def.resolve(date);
       		}, function(error){
       			def.reject(new Date());
       		});
     	});
     	return def.promise;
    };

  return obj;

}])


/* $networkFactory
* Network states
*/
.factory('$networkFactory', ['$cordovaNetwork', function($cordovaNetwork){
  var obj = {};

  var online;

  obj.getNetworkState = function(){
    return online;
  };

  obj.setNetworkState = function(state){
    online = state;
  };

  return obj;

}])

.factory('$authenticationFactory', ['$q', '$http', '$localstorage', 'CONFIG', function($q, $http, $localstorage, CONFIG){
  var obj = {};

  // Public key should be generate into a pem file format, externally of the application, for more performance.
  // Generate public key from modulus and exponent
  obj.public_key = "";

  obj.getPublicKey = function(){
    if (obj.public_key === "" || obj.public_key === undefined){
      var crypt = new JSEncrypt();
      var publicKey = "-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAqZZI99xwooITwDRP/8BE\nvJ+nWIZj/h9a/HXTQAXSJ3k3GTzPQZWydcVjCs02QfoScMKVTojEvnMhDaEk7QBt\nw6l6pk7A2RQtePjF003zm0RKIHV9TYRgkq07v0ZFw5pBK0aa1oN5iFXnIlrkXmOk\nYea/QuZPKM2deKev+bdksTDsmVJIw4J5+J66AYCPY8/Lfocn/rvL/oCd+1xFx76u\nT0s9mK3K2izRsPpH+CFnVHYhqNyYPwtzX6ipOIDAAx3xsRisCcdpidp2teIGcaQN\nTg8RDBlffFxxJcv9ksPN6tK3xvfMyb0a/tihzle/abTKcKfQYu3HPCUfvbV1pZGu\n5gQKibInU61l0xu+Wpke5R8MNvOaa394YmVFZua2m7vrZm3Q9m6AA2OEmitivjvb\nZCAadivwFdN0feUuRdaD+kpuMfd/eqHD+fb1qJoTMqcRhFucSrW9ejB+Jvg4PdXu\n5GrDNEIVXrGeM3/CMYyMkPxOwT74cmPtHEdWRDa7IDB0Brq8Sy3nd40sjG6JuwNc\n4njRWDys5J7CUN+R0dcVUbC04IKuXJU2ODBLragBQRVyHA8TlC63JtwfPwTloiUF\n+B+w/Tl544poNgHTYDnA1L3+eZhs82JT1wf6jL6kW8i+K016+QOaNC8VJqOGOa5e\nhvRUTXhtiapvep3RsQrBpzMCAwEAAQ==\n-----END PUBLIC KEY-----";
      crypt.setKey(publicKey);
      obj.public_key = crypt;
    }
    return obj.public_key;
  };

  obj.encryptData = function(jsonData){
    var encrypt = obj.getPublicKey();
    var encrypted = encrypt.encrypt(jsonData);
    
    return encrypted;
  };

  obj.getSession = function(){
    if ($localstorage.get('sessionToken') === undefined || $localstorage.get('sessionToken') === 'undefined'){
      var session = {
        sessionToken: "",
        timestamp: 0,
        logged: false
      };
      obj.setSession(session);
    }
    return $localstorage.getObject('sessionToken');
  };

  obj.setSession = function(sessionToken){
    $localstorage.setObject('sessionToken', sessionToken);
    /*{
      sessionToken:
      timestamp:

    }*/
  };

  obj.updateSession = function(sessionToken, timestamp, logged){
    var session = {
      sessionToken: sessionToken,
      timestamp: timestamp, //maybe manually setup the timestamp wen logout
      logged: logged
    };
    obj.setSession(session);
    return session;
  };

  obj.setUser = function(user){
    $localstorage.setObject('user', user);
  };

  obj.getUser = function(){
    if ($localstorage.get('user') === undefined || $localstorage.get('user') === 'undefined'){
      var user = {
        username: "",
        firstname: "",
        lastname: "",
        email: ""
      };
      obj.setUser(user);
    }
    return $localstorage.getObject('user');
  };

  obj.updateUser = function(user){
    // var session = {
    //   sessionToken: sessionToken,
    //   timestamp: new Date().getTime(),
    //   logged: logged
    // };
    obj.setUser(user);
    return user;
  };

  obj.expiredTimestamp = function(sessionTimestamp){
    if ((new Date().getTime() -sessionTimestamp) < CONFIG.sessionExpirationTime){
      return false;
    }else{
      return true;
    }
  };

  obj.checkSessionLocal = function(){
    var session = obj.getSession();
    //console.log("obj.getSession() : "+obj.getSession());
    //console.log(obj.getSession());
    if (session.logged === false || obj.expiredTimestamp(session.timestamp) === true){
      console.log("expired : "+session.timestamp);
      obj.updateSession('', 0, false);
      return false;
    }else{
      //TODO checkSession API call?
      return true;
    }
  };

  /* User's mail to send in the report, as of now it will be managed in the controller, this will be change when we will use/manage the user */
  obj.getUserEmailReport = function(){
    if ($localstorage.get('userEmailReport') === undefined || $localstorage.get('userEmailReport') === 'undefined'){
      obj.setUserEmailReport('');
    }
    return $localstorage.get('userEmailReport');
  };

  obj.setUserEmailReport = function(userEmail){
    $localstorage.set('userEmailReport', userEmail);
  };

  /* GetNonce
   * Nonce is the random number to exchange before each other call */
  obj.getNonce = function(){
    var def = $q.defer();
    var timestamp = new Date().getTime();
    var appSecret = "EASIN::MOBILE::APP::SECRET"; //find a secure way

    var postData = {
      TimeStamp:  timestamp,
      AppSecret: appSecret
    };
    //console.log(postData);

    var config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };


    //def.resolve(obj.encryptData(angular.toJson(postData)));
    $http.post(CONFIG.authenticationBaseURL+"/mobile/GenNonce", "\""+obj.encryptData(angular.toJson(postData))+"\"", config).then(
      function(success){
        def.resolve(success.data);
      },
      function(error){
        def.reject(error);
      }
    );
    return def.promise;
  };

  /* Registration
   * -- */
  obj.registration = function(email, username, name, surname, password, confirmPassword){
    var def = $q.defer();
    var appSecret = "EASIN::MOBILE::APP::SECRET"; //find a secure way

    var config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    obj.getNonce().then(
      function(success){
        var postData = {
          Email: email,
          UserName: username,
          Name: name,
          Surname: surname,
          Password: password,
          ConfirmPassword: confirmPassword,
          AppSecret: appSecret,
          GotNonce: success.NonceNumber
        };
        //nonce = success.NonceNumber;
        //console.log(postData);
        $http.post(CONFIG.authenticationBaseURL+"/mobile/register", "\""+obj.encryptData(angular.toJson(postData))+"\"", config).then(
          function(success){
            //session token
            console.log("registration OK");
            //console.log(success);
            def.resolve(success.data);
          },
          function(error){
            console.error('error registration');
            //console.error(error);
            def.reject(error);
          }
        );
      },
      function(error){
        def.reject();
      }
    );
    return def.promise;
  };

  /* Login
   * -- */
  obj.login = function(email, password){
    var def = $q.defer();
    var appSecret = "EASIN::MOBILE::APP::SECRET"; //find a secure way

    var config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    obj.getNonce().then(
      function(success){
        var postData = {
          Email: email,
          Password: password,
          AppSecret: appSecret,
          GotNonce: success.NonceNumber
        };
        $http.post(CONFIG.authenticationBaseURL+"/mobile/login", "\""+obj.encryptData(angular.toJson(postData))+"\"", config).then(
          function(success){
            //session token
            def.resolve(success.data);
          },
          function(error){
            def.reject(error);
          }
        );
      },
      function(error){
        def.reject();
      }
    );
    return def.promise;
  };

  /* Check Session
   * -- */
  obj.checkSession = function(token){
    var def = $q.defer();
    var config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    $http.post(CONFIG.authenticationBaseURL+"/mobile/checksession", "\""+token+"\"", config).then(
      function(success){
        //session token
        def.resolve(success.data);
      },
      function(error){
        def.reject(error);
      }
    );

    return def.promise;
  };

  /* Change Password
   * -- */
  obj.changePassword = function(email, oldPassword, newPassword, confirmPassword){
    var def = $q.defer();
    var appSecret = "EASIN::MOBILE::APP::SECRET";

    var config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    obj.getNonce().then(
      function(success){
        var postData = {       
          Email: email,
          AppSecret: appSecret,
          GotNonce: success.NonceNumber,
          OldPassword: oldPassword,
          NewPassword: newPassword,
          ConfirmPassword: confirmPassword
        };
        $http.post(CONFIG.authenticationBaseURL+"/mobile/changepwd", "\""+obj.encryptData(angular.toJson(postData))+"\"", config).then(
          function(success){
            console.log("success service changePWD");
            //console.log(success);
            def.resolve(success.data);
          },
          function(error){
            def.reject(error);
          }
        );
      },
      function(error){
        def.reject();
      }
    );
    return def.promise;
  };

  /* Forgot Password
   * -- */
  obj.forgotPassword = function(email){
    var def = $q.defer();
    var appSecret = "EASIN::MOBILE::APP::SECRET";

    var config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    obj.getNonce().then(
      function(success){
        var postData = {       
          Email: email,
          AppSecret: appSecret,
          GotNonce: success.NonceNumber
        };
        //encryptPostData
        $http.post(CONFIG.authenticationBaseURL+"/mobile/forgotpwd", "\""+obj.encryptData(angular.toJson(postData))+"\"", config).then(
          function(success){
            //console.log(success);
            def.resolve(success.data);
          },
          function(error){
            def.reject(error);
          }
        );
      },
      function(error){
        def.reject(error);
      }
    );
    return def.promise;
  };

  /* Rest Password
   * -- */
  obj.resetPassword = function(email, newPassword, confirmPassword, resetToken){
    var def = $q.defer();
    var appSecret = "EASIN::MOBILE::APP::SECRET";

    var config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    var postData = {       
      Email: email,
      AppSecret: appSecret,
      NewPassword: newPassword,
      ConfirmPassword: confirmPassword,
      ResetToken: resetToken
    };

    //console.log(postData);

    $http.post(CONFIG.authenticationBaseURL+"/mobile/resetpwd", "\""+obj.encryptData(angular.toJson(postData))+"\"", config).then(
      function(success){
        //console.log(success);
        def.resolve(success.data);
      },
      function(error){
        def.reject(error);
      }
    );
      
    return def.promise;
  };


  /* Logout
   * -- */
  obj.logout = function(token){
    var def = $q.defer();
    var config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    $http.post(CONFIG.authenticationBaseURL+"/mobile/logout", "\""+token+"\"", config).then(
      function(success){
        //console.log(success);
        def.resolve(success.data);
      },
      function(error){
        def.reject(error);
      }
    );
    return def.promise;
  };

  return obj;
}])


/** $localstorage
 * Store Data in LocalStorage
 */
.factory('$localstorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  }
}])


;


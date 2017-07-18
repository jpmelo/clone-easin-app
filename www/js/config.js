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

/** Config js file
* Declare all constants here
**/

angular.module('MYGEOSS.constants', [])

.constant('CONFIG', {
	serverApiUrl: 'http://inspireaq.jrc.ec.europa.eu:5432/',
	//serverApiUrl: 'http://10.228.0.30:8080/',
	authenticationBaseURL: 'http://alien.jrc.ec.europa.eu/api.auth/',
	contactMail : 'mygeoss@jrc.ec.europa.eu',
	sessionExpirationTime: '3600000' //1hour
})

.constant('TEXT', {
	errorNoLogged_label: 'You have to be logged in',
	errorNoLogged_content: 'Please log in before sending data',
	errorNoLogged_okText: 'Save draft and log in',
	errorLogin_label: 'Login error',
	errorLogin_content: '',//Message returned by the server
	errorRegistration_label: 'Registration error',
	errorRegistration_content: '',//Message returned by the server
	successForgotPassword_label: 'Success',
	successForgotPassword_content: "A reset token was sent to : <+forgotPwdForm.email+>. <br/> Copy the code in the 'Reset Token' field to set up a new password for your account.",
	errorAddPhoto_label: 'Maximum photos',
	errorAddPhoto_content: "You can't upload more than 3 photos. Please delete one and try again",

});

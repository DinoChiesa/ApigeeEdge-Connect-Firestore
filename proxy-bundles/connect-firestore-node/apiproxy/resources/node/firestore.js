(function (){
  'use strict';

  var httpRequest = require('./slimNodeHttpClient.js');
  var app = require('express')();
  var urljoin = require('url-join');
  var apigee = require('apigee-access');
  var jwt = require('jsonwebtoken');
  var util = require('util');
  var fs = require('fs');
  var querystring = require('querystring');
  var serviceAccount;
  var gVersion = '20180322-0831';
  var gAccessToken = null;
  var defaultFirebaseScope = 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/datastore';
  var baseEndpoint = 'https://firestore.googleapis.com/v1beta1';

  function logWrite() {
    var time = (new Date()).toString(),
        tstr = '[' + time.substr(11, 4) + '-' +
      time.substr(4, 3) + '-' +
      time.substr(8, 2) + ' ' +
      time.substr(16, 8) + '] ';
    console.log(tstr + util.format.apply(null, arguments));
  }

  function getServiceAccount() {
    if ( ! serviceAccount){
      var keyfilenameRegex = new RegExp('[^/ ]+\\.json$');
      var files = fs.readdirSync('./keys');
      var keyFile = files.find( function(filename) { return filename.match(keyfilenameRegex) } );
      logWrite('found keyFile: ' + keyFile);
      serviceAccount = require('./keys/' + keyFile);
    }
    return serviceAccount;
  }

  function getToken(scope, cb) {
    logWrite('getting token...');
    var nowInSeconds = Math.floor(Date.now() / 1000);
    // var examplePayload = {
    //   iss:"service-account-1@project-name-here.iam.gserviceaccount.com",
    //   scope:"https://www.googleapis.com/auth/logging.write",
    //   aud:"https://www.googleapis.com/oauth2/v4/token",
    //   exp:1328554385,
    //   iat:1328550785
    //     };

    var payload = {
          iss : getServiceAccount().client_email,
          scope : scope || defaultFirebaseScope,
          aud: getServiceAccount().token_uri, // "https://www.googleapis.com/oauth2/v4/token"
          iat: nowInSeconds,
          exp: nowInSeconds + (3 * 60)
        };

    //console.log('JWT payload: ' + JSON.stringify(payload, null, 2));
    // sign with RSA SHA256
    var token = jwt.sign(payload, getServiceAccount().private_key, { algorithm: 'RS256'});

    var requestOptions = {
          url: getServiceAccount().token_uri,
          method: 'post',
          body : querystring.stringify({
            grant_type : 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: token
          }),
          headers : {
            'content-type': 'application/x-www-form-urlencoded'
          }
        };

    httpRequest(requestOptions, function(error, httpResponse, body){
      if (error) {
        logWrite('Error: ' + error);
        if (cb){
          cb(error);
        }
        else {
          throw error;
        }
      }
      body = JSON.parse(body);
      scheduleTokenRefresh(body);
      if (cb) {
        cb(null, body);
      }
    });
  }

  function scheduleTokenRefresh(tokenResponse) {
    logWrite('assigning access token: ' + tokenResponse.access_token);
    gAccessToken = tokenResponse.access_token;
    var sleepTime = (tokenResponse.expires_in - 2 * 60) * 1000;
    setTimeout(getToken, sleepTime);
  }

  function xform(obj) {
    if (obj.documents) {
      obj.documents = obj.documents.map(xform);
    }
    else if (obj.fields) {
      var newFields = {};
      Object.keys(obj.fields).forEach(function(name){
        if (obj.fields[name].hasOwnProperty('stringValue')) {
          newFields[name] = obj.fields[name].stringValue;
        }
        else if (obj.fields[name].hasOwnProperty('integerValue')) {
          newFields[name] = parseInt(obj.fields[name].integerValue, 10);
        }
      });
      obj.fields = newFields;
    }
    return obj;
  }

  function getOneOrMore(request, response) {
    var dbPath = 'databases/(default)/documents/users';
    var endpoint = request.params.name ?
      urljoin(baseEndpoint, 'projects', getServiceAccount().project_id, dbPath, request.params.name) :
      urljoin(baseEndpoint, 'projects', getServiceAccount().project_id, dbPath );
    var requestOptions = {
          url: endpoint,
          method: 'get',
          headers : {
            authorization: 'Bearer ' + gAccessToken,
            accept: 'application/json'
          }
        };
    logWrite('GET %s', request.url);
    httpRequest(requestOptions, function(error, httpResponse, body){
      if (error) {
        response.status(500).send(body);
        return;
      }
      response.status(200)
        .send(JSON.stringify(xform(JSON.parse(body)), null, 2));
    });
  }

  app.get('/hello', function(request, response) {
    logWrite('%s %s', request.method, request.url);
    response.header('Content-Type', 'application/json')
      .status(200)
      .send('{ "message" : "hello" }\n');
  });

  app.get('/:name', getOneOrMore);
  app.get('/', getOneOrMore);

  // default behavior
  app.all(/^\/.*/, function(request, response) {
    logWrite('%s %s', request.method, request.url);
    response.header('Content-Type', 'application/json')
      .status(404)
      .send('{ "message" : "This is not the server you\'re looking for." }\n');
  });


  getToken(null, function(e, tokenResponse) {
    if (e) {
      logWrite('while getting token: ' + e);
      process.exit(1);
    }
    var port = process.env.PORT || 5950;
    app.listen(port, function() {
      console.log("firestore client (version " + gVersion + ") listening");
    });
  });


}());

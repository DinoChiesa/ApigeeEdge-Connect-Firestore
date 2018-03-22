// dataLoader.js
//
// Copyright 2018 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// created: Thursday, 22 March 2018, 07:20
// last saved: <2018-March-22 07:43:37>

(function (){
  'use strict';
  const Getopt = require('node-getopt');
  const version = '20180322-0743';
  const getopt = new Getopt([
    ['K' , 'jsonkeyfile=ARG', 'Required. the file containing the JSON Key downloaded from google.'],
    ['C' , 'create', 'Optional. Tells the script to create some random records.'],
    ['R' , 'read', 'Optional. Tells the script to read all the records.'],
    ['h' , 'help', 'Displays this message.']
  ]).bindHelp();

  const firebase = require('firebase-admin');
  const dataGenerator = require('./lib/randomizer.js');
  var opt, usersCollection;

  function initializeFirestoreClient (collectionName) {
    var serviceAccount = require(opt.options.jsonkeyfile);
    firebase.initializeApp({
      credential: firebase.credential.cert(serviceAccount)
    });
    var db = firebase.firestore();
    return db.collection(collectionName);
  }

  function getUsersCollection() {
    if ( ! usersCollection) {
      usersCollection = initializeFirestoreClient('users');
    }
    return usersCollection;
  }

  function readOne(name) {
    getUsersCollection().doc(name)
      .get()
      .then((snapshot) => {
        if (snapshot.exists) {
          console.log(snapshot.id, '=>', snapshot.data());
        }
      })
      .catch((err) => {
        console.log('Error getting document', err);
      });
  }

  function readAll() {
    getUsersCollection().get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          console.log(doc.id, '=>', doc.data());
        });
      })
      .catch((err) => {
        console.log('Error getting documents', err);
      });
  }

  function docnameFromUser(user) {
    return (user.first.charAt(0) + user.last).toLowerCase();
  }

  function createOne() {
    var user = dataGenerator.generateRandomUserRegistration();
    var docname = docnameFromUser(user);
    return getUsersCollection().doc(docname)
      .set(user);
  }

  function createSomeAndReadAll(numToCreate) {
    numToCreate = numToCreate || 12;
    var p = Promise.resolve();
    for (var i = 0; i < numToCreate; i++) {
      p = p.then(createOne);
    }
    p.then(readAll);
  }

  console.log(
    'Apigee Edge Firestore demo data loader tool, version: ' + version + '\n' +
      'Node.js ' + process.version + '\n');

  opt = getopt.parse(process.argv.slice(2));

  if ( !opt.options.jsonkeyfile ) {
    console.log('You must specify a JSON key file');
    getopt.showHelp();
    process.exit(1);
  }

  if ( !opt.options.create && !opt.options.read ) {
    console.log('You must specify --create or --read');
    getopt.showHelp();
    process.exit(1);
  }

  if ( opt.options.create ) {
    createSomeAndReadAll();
  }
  else /* opt.options.read */ {
    readAll();
  }

})();

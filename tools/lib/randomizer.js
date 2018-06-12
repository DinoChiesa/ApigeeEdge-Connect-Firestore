// randomizer.js
// ------------------------------------------------------------------
//
// Copyright 2018 Google LLC.
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

(function (){
  'use strict';

  var expectedMeanValue = 1966,
      birthdateGaussian = new Gaussian(expectedMeanValue, 28),
      firstnames = ['Adam', 'Alex', 'Anna', 'Anush', 'Audie',
                    'Audrey', 'Baba', 'Barry', 'Bernie', 'Betta',
                    'Beverly', 'Butch', 'Carlos', 'Charlene', 'Chris',
                    'Conrad', 'Corey', 'Darlene', 'Dutch', 'Ethel',
                    'Frannie', 'Gina', 'Gregor', 'Harry', 'Hassan',
                    'Heather', 'Henry', 'Humphrey', 'Ian', 'James',
                    'Janet', 'Janice', 'Jordan', 'Jose', 'Josef',
                    'Judith', 'Julia', 'Katharine', 'Li', 'Linda',
                    'Mabel', 'Margi', 'Marvin', 'Meena', 'Nancy',
                    'Nina', 'Olive', 'Penelope', 'Philip', 'Quinn',
                    'Rosalind', 'Ruth', 'Sheila', 'Shirley', 'Spencer',
                    'Stella', 'Sunshine', 'Teresa', 'Uma', 'Vidya',
                    'Vivian', 'Wanda', 'Willard', 'Willem', 'Xavier',
                    'Yin', 'Zub'],

      lastnames = ['Aziridad', 'Berenson', 'Black', 'Bober', 'Cerruti',
                   'Cranston', 'Crosby', 'Deutsch', 'Doolittle', 'Evans',
                   'Flanders', 'Fletcher', 'Franchesi', 'George', 'Griffey',
                   'Harley', 'Hassan', 'Javitz', 'Jessup', 'Johnson',
                   'Lamar', 'Lupo', 'Marquez', 'Merman', 'Mitchell',
                   'Murphy', 'Roosevelt', 'Santana', 'Smith', 'Smith',
                   'Somers', 'Spruance', 'Truman', 'Wagner', 'Walters',
                   'White'];

  /*
    Function Gaussian

    Generator of pseudo-random number according to a normal distribution
    with given mean and variance.
    Normalizes the outcome of function normal.
  */
  function Gaussian(mean, stddev) {
    /*
      Function normal.

      Generator of pseudo-random number according to a normal distribution
      with mean=0 and variance=1.
      Use the Box-Mulder (trigonometric) method, and discards one of the
      two generated random numbers.
    */
    var normal = function() {
          var u1 = 0, u2 = 0;
          while (u1 * u2 === 0) {
            u1 = Math.random();
            u2 = Math.random();
          }
          return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        };

    this.mean = mean;
    this.stddev = stddev || mean * 0.1;
    this.next = function() {
      return this.stddev * normal() + 1 * mean;
    };
  }

  function getRandomBirthYear() {
    do {
      var y = birthdateGaussian.next();
      if (y <= 2001 && y > 1920) { return Math.floor(y); }
    } while (true);
  }

  function selectRandomValue (a) {
    var L1 = a.length,
        n = Math.floor(Math.random() * L1);
    return a[n];
  }

  function generateRandomString() {
    var c = function() {
          var m = Math.floor(Math.random() * 26),
              a = (Math.floor(Math.random() * 2) * 32);
          return String.fromCharCode(65 + m + a);
        },
        L = Math.floor(Math.random() * 7) + 8,
        i,
        pw = '';
    for (i=0; i<L; i++) {
      pw += c();
    }
    return pw;
  }

  function generateRandomUserRegistration() {
    return {
      first: selectRandomValue(firstnames),
      last: selectRandomValue(lastnames),
      born: getRandomBirthYear()
    };
  }

  function demo() {
    for (var i=0, L=6; i<L; i++) {
      console.log(JSON.stringify(generateRandomUserRegistration(), null, 2) + '\n');
    }
  }

  module.exports = {
    generateRandomUserRegistration : generateRandomUserRegistration,
    generateRandomString : generateRandomString,
    getRandomBirthYear : getRandomBirthYear
  };

  // generateRandomUserRegistration : function() {
  //   var fname = randomizer.getRandomValue(randomizer.firstnames),
  //       lname = randomizer.getRandomValue(randomizer.lastnames),
  //       m = (new Date()).valueOf();
  //   return {
  //     name: fname + ' ' + lname + '.' + m,
  //     username: fname + '-' + m,
  //     password: randomizer.generateRandomString(),
  //     email: fname.toLowerCase() + '.' + lname.toLowerCase() + '.' + m + '@example.com'
  //   };
  // }

  var invokedDirectly = (require.main === module);
  if (invokedDirectly) {
    demo();
  }

}());

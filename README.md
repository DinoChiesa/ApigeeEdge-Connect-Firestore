# Connecting to Firestore

This code shows how to connect to a Firestore DB from within Apigee Edge.

There are two versions of basically (but not exactly) the same code here.

One running in trireme, one in ["hosted targets"](https://community.apigee.com/articles/56200/using-nodejs-with-apigee-you-should-check-out-host.html). For the latter to
work, your org must support Hosted Targets.

Both connect to Firebase/Firestore.


## Setup

To set up, you need a Firestore DB, and you need some sample data in it.

Then you need to copy your key into the API Proxy bundles directories, and then import and deploy the
proxy bundles.

The following will guide you in more detail:


### 1. Create a Firestore Database

1. go to firebase.google.com
2. sign in
3. add a project, name it

4. on the left-hand-side navigator, click "Database"

5. In the Database section, click "Cloud Firestore Beta."
   This also creates a service account and enables the API in the Cloud API Manager.

6. Start in locked mode

7. in a new tab, go to the [GCP Console](https://pantheon.corp.google.com/)

8. select the Firebase project you just created

9. Use the left-hand-side navigator to click to "IAM & admin"... Service Accounts

10. You will see "App Engine Service Account"...
   It will say that there are no keys for this account.
   Far to the right, click the three dots, and click "Create key"

11. JSON

12. Create

13. The JSON key is downloaded automatically to your computer.


The contents of the JSON key file will look like this:

```
{
  "type": "service_account",
  "project_id": "YOUR-PROJECT-NAME",
  "private_key_id": "bdb91206c515893e1f6815e6b80bff113f92a1a0",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADAN.......FRPE=\n-----END PRIVATE KEY-----\n",
  "client_email": "YOUR-PROJECT-NAME@appspot.gserviceaccount.com",
  "client_id": "10ee87dh4855500679513",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/blah-blah-blah@gserviceaccount.com"
}
```

For more information on provisioning a Cloud Firestore DB, see [the quickstart](https://firebase.google.com/docs/firestore/quickstart).

### 2. Initialize the Tools

You need to have node and npm already installed on your workstation to
use the command-line tools included in this repo. If you don't have
them, install them now. Get a recent version, probably the most recent
version. On MacOS, if you have homebrew (recommended), this may be as
simple as:

```
brew update
brew install node
brew install npm
```

After you have node and npm, continue here to install the pre-requisite NPM modules for the tools:

```
cd tools
npm install
cd ..
```

### 3. Load some sample Data into the Firestore Database

Use the command-line tool to load some random data into your new Firestore database.

```
JSON_KEY_FILE=PATH_TO_YOUR_JSON_KEY_FILE
node ./tools/dataLoader.js -K ${JSON_KEY_FILE} -C
```

If successful, the output of the command will be like this:
```
Apigee Edge Firestore demo data loader tool, version: 20180322-0743
Node.js v7.7.1

ablack => { last: 'Black', first: 'Adam', born: 1921 }
afletcher => { last: 'Fletcher', first: 'Audrey', born: 1987 }
bcrosby => { last: 'Crosby', first: 'Baba', born: 1985 }
bsmith => { last: 'Smith', first: 'Barry', born: 1982 }
cflanders => { first: 'Charlene', born: 1954, last: 'Flanders' }
hblack => { last: 'Black', first: 'Harry', born: 1963 }
hcerruti => { last: 'Cerruti', first: 'Humphrey', born: 1989 }
jflanders => { last: 'Flanders', first: 'Julia', born: 1997 }
jroosevelt => { last: 'Roosevelt', first: 'Jose', born: 1939 }
jsmith => { first: 'Jose', born: 1936, last: 'Smith' }
pspruance => { first: 'Penelope', born: 1976, last: 'Spruance' }
slamar => { last: 'Lamar', first: 'Spencer', born: 1977 }

```

If you run the command repeatedly with the -C option, it will create more records.
You can also confirm the data you've got by reading all the records in the toy database, like this:
```
node ./tools/dataLoader.js -K ${JSON_KEY_FILE} -R
```

The output will list all of the records in the sample database. Something like this:

```
Apigee Edge Firestore demo data loader tool, version: 20180322-0743
Node.js v7.7.1

abober => { last: 'Bober', first: 'Adam', born: 1938 }
alovelace => { last: 'Lovelace', first: 'Ada', born: 1815 }
alupo => { last: 'Lupo', first: 'Audrey', born: 1961 }
aturing => { last: 'Turing', first: 'Alan', born: 1912, middle: 'Mathison' }
bbober => { last: 'Bober', first: 'Butch', born: 1977 }
ccrosby => { last: 'Crosby', first: 'Conrad', born: 1924 }
ddoolittle => { last: 'Doolittle', first: 'Darlene', born: 1926 }
dfletcher => { last: 'Fletcher', first: 'Darlene', born: 1991 }
...
```


### 4. Copy your JSON key file

Copy the key to both API Proxy bundles.  NB: This is a security
bug. Don't do this for a production system. This is done only to keep
provisioning of this example, very simple. For a production system,
these keys should be provisioned into the Encrypted KVM.

```
mkdir ./proxy-bundles/connect-firestore-ht/apiproxy/resources/hosted/keys
mkdir ./proxy-bundles/connect-firestore-node/apiproxy/resources/node/keys
cp ${JSON_KEY_FILE} ./proxy-bundles/connect-firestore-ht/apiproxy/resources/hosted/keys
cp ${JSON_KEY_FILE} ./proxy-bundles/connect-firestore-node/apiproxy/resources/node/keys
```

Make sure there is exactly one JSON file in each of those directories.


### 4. Import and Deploy the Bundles

You don't need to deploy *both* bundles. Deploy one or both depending on what uou're interested in testing or demonstrating.

```
ORG=YOUR_ORG_NAME
ENV=YOUR_ENV_NAME
APIGEEUSER=YOUR_APIGEE_ADMIN_USER_NAME

# deploy the version of the proxy that uses hosted targets
node ./tools/importAndDeploy.js -v -u ${APIGEEUSER} -o ${ORG} -e ${ENV} -d ./proxy-bundles/connect-firestore-ht

# deploy the version of the proxy that uses a nodejs target and trireme
node ./tools/importAndDeploy.js -v -u ${APIGEEUSER} -o ${ORG} -e ${ENV} -d ./proxy-bundles/connect-firestore-node
```

The script will prompt you for your password.

Deployment of the Hosted Functions example takes a few moments.

> NB: It may be necessary to undeploy and redeploy the HT proxy. HT is in beta release at this time.


## Invoking the Proxy

1. Invoke the proxy. If you are using the hosted targets proxy:

   ```
   curl -i https://${ORG}-${ENV}.apigee.net/connect-firestore-ht
   ```

   If you are using the nodejs/trireme version":"
   ```
   curl -i https://${ORG}-${ENV}.apigee.net/connect-firestore-node
   ```
   Either command will retrieve a page of records from the database.


2. If you want to retrieve a particular user record:

   For HT:
   ```
   curl -i https://${ORG}-${ENV}.apigee.net/connect-firestore-ht/alovelace
   ```

   For nodejs/trireme:
   ```
   curl -i https://${ORG}-${ENV}.apigee.net/connect-firestore-node/alovelace
   ```

   (Make sure to use a username that really exists, in place of  `alovelace` .)

   In either case, you should see something like this:
   ```
   HTTP/1.1 200 OK
   Date: Thu, 22 Mar 2018 15:37:40 GMT
   Content-Type: text/html; charset=utf-8
   Content-Length: 264
   Connection: keep-alive
   X-Powered-By: Express
   ETag: W/"108-ACdv5NTQalu14NhuPoqV7TwuOQk"

   {
     "name": "projects/YOUR-PROJECT-ID/databases/(default)/documents/users/alovelace",
     "fields": {
       "last": "Lovelace",
       "born": 1815,
       "first": "Ada"
     },
     "createTime": "2017-10-23T20:26:58.838185Z",
     "updateTime": "2017-10-23T20:26:58.838185Z"
   }
   ```

3. Loopback (healthcheck) request:
   For HT:
   ```
   curl -i https://${ORG}-${ENV}.apigee.net/connect-firestore-ht/hello
   ```
   
   For nodejs/trireme:
   ```
   curl -i https://${ORG}-${ENV}.apigee.net/connect-firestore-node/hello
   ```
   You should see a happy message in reply.


## How it Works

There are two versions of the API Proxy here. Both use JavaScript / Node code to connect into Firestore.

One relies on the legacy "Trireme" node runtime, and the other relies on Hosted Targets.

In both cases, authentication to firestore is done via OAuth Bearer
token, and the node logic obtains the token via a RFC7523 grant. This
means: The client (the node code running inside Apigee Edge) generates a
self-signed JWT and sends that to googleapis.com to request an access
token.  Googleapis.com responds with an access token and then the reads
from the Firestore database just pass that token as a regular OAuth
Bearer token in the Authorization header.

That access token expires, so there's a setTimeout() loop in the node
code to refresh the access token periodically.

The requests sent to Cloud Firestore just use the Firestore REST API.  The reads look like this:

```
 curl -i -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  https://firestore.googleapis.com/v1beta1/projects/${FIRESTORE_PROJECT}/databases/\(default\)/documents/users/pwhite
```

## License

This material is Copyright 2018 Google LLC.
and is licensed under the [Apache 2.0 License](LICENSE).


## Disclaimer

The code in this repo is not an official Google product, nor is it part of an
official Google product. It's a demonstration utilizing Apigee
Edge and Firestore.

The demonstration code here is provided without warranty of any kind.


## Bugs

* The private keys are stored in flat files. They should be stored in an encrypted KVM.

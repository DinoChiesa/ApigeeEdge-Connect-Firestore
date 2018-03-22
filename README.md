# Connecting to Firestore

This code shows how to connect to a Firestore DB from within Apigee Edge.

There are two versions of basically the same code here.
one running in trireme, one in "hosted functions".  (Your org must suport Hosted Functions, for this to work.)

Both connect to Firebase/Firestore.


## Setup

To set up, you need a Firestore DB, and you need some sample data in it.

Then you need to copy your key into the API Proxy bundles directories, and then import and deploy the
proxy bundles.


### 1. Create a Firestore Database

1. go to firebase.google.com
2. signin
3. create new project

4. go to pantheon (https://pantheon.corp.google.com/)

5. select the firebase project
6. select "Service Accounts" on the Left hand side

7. There's an existing service account
8. Create new key
9. JSON
10. download the JSON key file. Remember the location.

The JSON key file will look like this:

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


### 2. Initialize the Tools

You need to have node and npm already installed on your workstation to use the command-line tools included in this repo. If you don't have them, go get them now.

```
cd tools
npm install
cd ..
```

### 3. Load some sample Data into the Firestore Database

```
JSON_KEY_FILE=PATH_TO_YOUR_JSON_KEY_FILE
node ./tools/dataLoader.js -K ${JSON_KEY_FILE} -C
```

You can confirm that you've got data by reading all the records in this toy database:
```
JSON_KEY_FILE=PATH_TO_YOUR_JSON_KEY_FILE
node ./tools/dataLoader.js -K ${JSON_KEY_FILE} -R
```

The output will list all of the records in the sample database.

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

Copy the key to both API Proxy bundles.
NB: This is a bug. These keys should ideally be provisioned into the Encrypted KVM.

```
mkdir ./proxy-bundles/connect-firestore-hf/apiproxy/resources/hosted/keys
mkdir ./proxy-bundles/connect-firestore-node/apiproxy/resources/node/keys
cp ${JSON_KEY_FILE} ./proxy-bundles/connect-firestore-hf/apiproxy/resources/hosted/keys
cp ${JSON_KEY_FILE} ./proxy-bundles/connect-firestore-node/apiproxy/resources/node/keys
```

Make sure there is exactly one JSON file in each of those directories.


### 4. Import and Deploy the Bundles

```
ORG=YOUR_ORG_NAME
ENV=YOUR_ENV_NAME
APIGEEUSER=YOUR_APIGEE_ADMIN_USER_NAME
node ./tools/importAndDeploy.js -v -o ${ORG} -e ${ENV} -d ./proxy-bundles/connect-firestore-hf
node ./tools/importAndDeploy.js -v -o ${ORG} -e ${ENV} -d ./proxy-bundles/connect-firestore-node
```

The script will prompt you for your password.

Deployment of the Hosted Functions example takes a few moments.

> It may be necessary to undeploy and redeploy the HF proxy. HF is in beta release at this time.


## Invoking the Proxy

1. Invoke the proxy with:

   ```
   curl -i https://${ORG}-${ENV}.apigee.net/connect-firestore-hf

   curl -i https://${ORG}-${ENV}.apigee.net/connect-firestore-node
   ```
   This will retrieve a page of records from the database.


2. If you want to retrieve a particular user record:

   ```
   curl -i https://${ORG}-${ENV}.apigee.net/connect-firestore-hf/alovelace

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
   ```
   curl -i https://${ORG}-${ENV}.apigee.net/connect-firestore-hf/hello

   curl -i https://${ORG}-${ENV}.apigee.net/connect-firestore-node/hello
   ```
   You should see a happy message in reply.


## How it works

There are two versions of the API Proxy here. Both use JavaScript / Node code to connect into Firestore.

One relies on the legacy "Trireme" node runtime, and the other relies on Hosted Functions.

In both cases, authentication to firestore is done with a RFC7523 grant
- basically the client (the node code running inside Apigee Edge)
generates a self-signed JWT and sends that to googleapis.com to request
an access token.  Googleapis.com responds with an access token and then
the reads from the Firestore database just pass that token as a regular
OAuth Bearer token in the Authorization header.

That access token expires, so there's a setTimeout() loop in the node
code to refresh the access token periodically.


## License

This material is Copyright 2018 Google Inc.
and is licensed under the [Apache 2.0 License](LICENSE).


## Disclaimer

The code in this repo is not an official Google product, nor is it part of an
official Google product. It's a demonstration utilizing Apigee
Edge and Firestore.

The demonstration code here is provided without warranty of any kind.


## Bugs

* The private keys are stored in flat files. They should be stored in an encrypted KVM.

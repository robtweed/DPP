# DPP: Deep Persistent Proxy Objects for JavaScript
 
Rob Tweed <rtweed@mgateway.com>
19 May 2023, MGateway Ltd [https://www.mgateway.com](https://www.mgateway.com)

Twitter: @rtweed

Google Group for discussions, support, advice etc: [http://groups.google.co.uk/group/enterprise-web-developer-community](http://groups.google.co.uk/group/enterprise-web-developer-community)

Thanks to [@mpen](https://stackoverflow.com/users/65387/mpen) for his original deep proxy logic on
which this module depends.

## What is DPP?

Deep Persistent Proxy (DPP) is a JavaScript module that allows you to create and maintain JavaScript objects/JSON that
will persist automatically between browser sessions.

Next time you start a browser session, any persistent objects you define will be restored to their previous state
automatically.


## How does DPP Manage to Persist JavaScript Objects?

DPP uses the browser's built-in *indexedDB* database to maintain a persistent image of your JavaScript object(s).

DPP also makes use of JavaScript Proxy Objects, allowing changes to your object(s) to be trapped and recorded
to *indexedDB*.

Because *indexedDB*'s APIs are asynchronous, a key challenge was how to keep the database copy of the object in synchronisation with the local proxy object, particularly if rapid sequences of sets and deletes occur. 

The solution is provided by the unique characteristics of our queue-based [QOper8](https://github.com/robtweed/QOper8) WebWorker management module.

DPP establishes a single *QOper8* worker process, and any changes to the local object are added by DPP to the *Qoper8* queue.  By using a single persistent *QOper8* WebWorker process, the corresponding changes to the *indexedDB* copy of the object can be guaranteed to be handled in strict chronological sequence within the WebWorker.

In summary, DPP decouples your local object from the *indexedDB* copy.  The *indexedDB* copy is only used by the WebWorker. All you have to do is manipulate your local object and let DPP do the rest!


## Do you need to understand the *indexedDB* API or WebWorkers in order to use DPP?

No.  DPP implements all the necessary *indexedDB*, *Qoper8* and WebWorker mechanics for you behind the scenes.  

You just use a couple of simple DPP APIs to specify a persistent object, and DPP looks after everything else for you automatically.

When using a DPP-defined Persistent Object, you are accessing its Proxy Object and not the *indexedDB* database.
The *indexedDB* database image of it is maintained automatically behind the scenes for you within its own WebWorker process.

The only time the *indexedDB* version is directly used by DPP is to automatically restore the contents of your Persistent Object(s) whenever you start a new browser session.

## Will DPP Work on All Browsers?

DPP should work on all modern browsers, but not on older ones.  It is usable on any browser that supports all the following:

- indexedDB
- Proxy Objects
- async/await
- ES6 Modules
- WebWorkers

## Try It Out

Try out this [live example](https://robtweed.github.io/DPP/examples/), running directly
from the code you'll find in the */examples* folder of this repo.

The first time you run it, the Proxy Object in the example (named *a*) will be empty.  Type in any valid JSON
into the textarea box and click the update button to add some content, eg:

      {
        "hello": "world"
      }

Note that when using this example, you must enter properly-formatted JSON, so string keys or values must be double-quoted.  This is because the text you enter into the textarea window has to be parsed as JSON before being applied to the Proxy object.

Now try reloading the page in the browser.  Provided your browser is compatible (see above),
you should see that the Proxy Object (*a*) is restored with its previous contents.

Try using the browser's Developer Tools to examine the contents of the *indexedDB* database (eg
in Chrome, use the *Application* tab to find *indexedDB*).

Note that you can manually clear down the *indexedDB* database from the browser's Developer Tools.


## Installing

DPP is designed so that it can be used whether you build your front-end code manually, or build it using Node.js and WebPack.  The way you install and use DPP varies depending on which approach you use.

### Using a CDN Copy

You can use DPP directly from the Github CDN linked to this repository.  In your main browser application module, load it using:

      const {createDPP} = await import('https://cdn.jsdelivr.net/gh/robtweed/DPP/src/dpp_browser.min.js');

### Using a Local Copy

Alternatively, clone or copy the folder [*/src*](./src) to an appropriate directory on your web server (eg */var/www/dpp*).

You should now have the following files in your web server folder:

        - dpp.js
        - dpp.min.js
        - dpp_browser.js
        - dpp_browser.min.js
        - dpp_node.js
        - idb_handlers
          - delete.js
          - instantiate.js
          - put.js
          - restore.js


You can now load DPP directly from your Web Server, eg:

      const {createDPP} = await import('/dpp/dpp_browser.min.js');

Note that if you're going to use local copies of both DPP and its dependent QOper8 modules, you can bypass this step and just use the DPP class modules itself:

      const {DPP} = await import('/dpp/dpp.min.js');

See below on how to use this latter approach.

### From NPM

DPP is available on NPM:

        npm install dpp-db

You can now load DPP using:

        import {createDPP} from "dpp-db/node";


## Starting DPP

### Using the CDN Version

You need to decide on a store name: this is the name of the store that will be used by indexedDB to maintain your object.  The name is entirely for you to decide, eg

        let storeName = 'myObjCopy';

Optionally you can specify an *indexedDB* database name.  By default, DPP will apply a database name of "DPP".  Otherwise we can do the following:

        let idb_name = 'MY-DB';

Now create an instance of DPP using these as inputs:

        const {createDPP} = await import('https://cdn.jsdelivr.net/gh/robtweed/DPP/src/dpp_browser.min.js');

        let dpp = await createDPP({
          storeName: storeName,
          idb_name: idb_name
        });

You can now start DPP and attach your local object to its *indexedDB* copy:

        let myObj = await dpp.start();

You're ready to start using your object!

Note that this approach will use CDN versions of *QOper8*'s resources.



### Using a Local Copy of DPP, but a CDN Copy of QOper8

You can use DPP with your own local copy of DPP, but allow it to use a CDN copy of QOper8 behind the scenes.

Installing a local copy of *DPP* is described earlier above.

You need to decide on a store name: this is the name of the store that will be used by indexedDB to maintain your object.  The name is entirely for you to decide, eg:

        let storeName = 'myObjCopy';

Optionally you can specify an *indexedDB* database name.  By default, DPP will apply a database name of "DPP".  Otherwise we can do the following:

        let idb_name = 'MY-DB';

Now create an instance of DPP using these as inputs:

        const {createDPP} = await import('/dpp/dpp_browser.min.js');
        const {DPP} = await import('/dpp/dpp.min.js');

        let dpp = await createDPP({
          storeName: storeName,
          idb_name: idb_name,
          DPP: DPP
        });

You can now start DPP and attach your local object to its *indexedDB* copy:

        let myObj = await dpp.start();

You're ready to start using your object!


### Using a Local Copies of DPP and QOper8

if you're using a local copy of DPP, it's probably most sensible to also use a local copy of QOper8.

Installing a local copy of *DPP* is described earlier above.

Installing a local copy of *Qoper8* is very similar: copy/clone it from its Github repository to your own web server.  For example, let's say you installed it in the folder */var/www/qoper8* on your Web Server.

You need to decide on a store name: this is the name of the store that will be used by indexedDB to maintain your object.  The name is entirely for you to decide, eg:

        let storeName = 'myObjCopy';

Optionally you can specify an *indexedDB* database name.  By default, DPP will apply a database name of "DPP".  Otherwise we can do the following:

        let idb_name = 'MY-DB';

You can now just use the DPP module itself and create an instance of DPP using its constructor directly:

        const {DPP} = await import('/dpp/dpp.min.js');
        const {QOper8} = await import('/qoper8/QOper8.min.js');

        let dpp = new DPP({
          storeName: storeName,
          idb_name: idb_name,
          QOper8: QOper8
        });

You can now start DPP and attach your local object to its *indexedDB* copy:

        let myObj = await dpp.start();

You're ready to start using your object!


### Using DPP Installed Using NPM

If you're using a bundler such as WebPack to create your front-end code, you'll need to use the NPM/Node.js-based approach described below.

If you installed DPP using NPM (see above), you use it as follows:

You need to decide on a store name: this is the name of the store that will be used by indexedDB to maintain your object.  The name is entirely for you to decide, eg:

        let storeName = 'myObjCopy';

Optionally you can specify an *indexedDB* database name.  By default, DPP will apply a database name of "DPP".  Otherwise we can do the following:

        let idb_name = 'MY-DB';

Now import the *createDPP* function and use it to create an instance of DPP.  Then link the local object of your choice (eg *myObj*) to its corresponding copy in *indexedDB*:

        import {createDPP} from "dpp-db/node";

        let dpp = createDPP({
          storeName: storeName,
          idb_name: idb_name
        });

        let myObj = await dpp.start();

You're ready to start using your object!

----

## Using Your Object

You can now add properties to your local object, and subsequently change any content within those properties: as far as you're concerned, you just use your object as normal.  Every change you make to your object will automatically be mirrored in the decoupled *indexedDB* copy.

if you restart your script in your browser, you'll find that the previous contents of your object are recovered automatically!


## Worked Example

This simple example creates and populates a Persistent Object named *a*.  It will use the CDN versions of everything:

Here's the module file:

### app.js

      (async () => {

        // load/import the DPP module from its source directory (change the path as appropriate)

        const {createDPP} = await import('https://cdn.jsdelivr.net/gh/robtweed/DPP/src/dpp_browser.min.js');
        let dpp = await createDPP({storeName: 'po_a'});
        let a = await dpp.start();

        // Now you can create and maintain properties for your Proxy Object, eg:

        a.test = {
          foo: 'bar',
          foo2: {
            a: 123,
            b: 323
          }
        };
        a.arr = [100, 200, 300];

        console.log('a: ' + JSON.stringify(a, null, 2));

      })();


Load and run this module in your browser with a web page such as this:


### index.html

      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>DPP Demo</title>
        </head>
        <body>
          <script type="module" src="/app.js"></script>
        </body>
      </html>


When you load it into you browser, take a look at the console log in your browser's development tools panel.

You'll be able to see its persisted image in the *indexedDB* database by using the *Application* tab in your
browser's development tools panel.  Remember that you don't normally need to access the *indexedDB* database
yourself, but it's interesting to inspect its contents.


So now modify the *app.js* file, removing the lines that created the content in your Persistent Object (a):


      (async () => {
        const {createDPP} = await import('https://cdn.jsdelivr.net/gh/robtweed/DPP/src/dpp_browser.min.js');
        let dpp = await createDPP({storeName: 'po_a'});
        let a = await dpp.start();
        console.log('a: ' + JSON.stringify(a, null, 2));
      })();


Reload the *index.html* page in your browser, and you should see that the Proxy Object (a) has been
restored to its previous state.  You can now continue to use and modify it!


Finally, see what happens if you modify the *app.js* file again as follows:


      (async () => {
        const {createDPP} = await import('https://cdn.jsdelivr.net/gh/robtweed/DPP/src/dpp_browser.min.js');
        let dpp = await createDPP({storeName: 'po_a'});

        let a = await dpp.start('new'); // <== add the 'new' argument

        console.log('a: ' + JSON.stringify(a, null, 2));
      })();

This time you'll find that the *indexedDB* Object Store (po_a) is cleared down and your Proxy Object (a) is empty.


## DPP APIs

- Loading the DPP Creation Module into your browser:

      const {createDPP} = await import(/path/to/dpp_browser.js);

or, if building using local copies of DPP and QOper8, load the DPP module itself:

      const {DPP} = await import(/path/to/dpp.min.js);

or, if building using Node.js/NPM

      import {createDPP} from 'dpp-db/node';


- Starting DPP:

  - Using DPP and QOper8 from CDN

        let dpp = await createDPP({
          storeName: storeName,
          idb_name: idbName,           // optional, 'DPP' used if omitted
        });


  - Using a local copy of DPP (but CDN copy of QOper8):

        const {DPP} = await import('/path/to/dpp.min.js');

        let dpp = await createDPP({
          storeName: storeName,
          idb_name: idbName, 
          DPP: DPP
        });

  - Using local copies of both DPP and QOper8:

        const {DPP} = await import('/path/to/dpp.min.js');
        const {QOper8} = await import('path/to/qoper8.min.js');

        let dpp = new DPP({
          storeName: storeName,
          idb_name: idbName,
          DPP: DPP,
          QOper8: QOper8
        });


- creating a local object and attaching it to its DPP-managed copy in *indexedDB*:

      let local_object = await dpp.start(mode);


  - If *mode* is not specified, the Proxy Object specified by *local_object* will be restored with any existing data from
the specified *indexedDB* ObjectStore

  - If you specify a value of *new* for *mode*, then the specified *indexedDB* ObjectStore is cleared down and
the Proxy Object will be empty.  For example:

      let local_object = await dpp.start('new');


## Limitations to DPP

- Your Persistent Object(s) are Proxy Objects (actually deep proxies, with Proxies at every key level).

- A DPP Proxy Object can be as deeply-nested as you want, and can contain any mixture of:

  - simple key/value pairs
  - objects
  - arrays

- A DPP Proxy Object cannot contain:

  - methods
  - functions
  - classes

- You must not create circular references within your Proxy Object.

- Note that the base Proxy Object variable cannot be used as a simple variable, ie the following will not be
persisted, because you'll overwrite the Proxy Object:


        let a = await createDPP({
          storeName: 'a-copy',
          mode: 'new'
        });

        a = 'hello world';

  Instead, you must define at least one property of the Proxy Object.  ie the following **will** be persisted:

      a.value = 'hello world';

      a.arr = [1, 2, 3];

      a.obj = {hello: 'world};    


- Although *indexedDB* is capable of storing very large volumes of data, you need to be aware that the first thing that happens when you re-load a DPP script is that the entire contents of the *indexedDB* store that holds the copy of your local object must be traversed in order to be retrieved.  Whilst this occurs very quickly for small or reasonably-sized objects, clearly the larger your object, the more time DPP will take to recover your object from *indexedDB*.

  We therefore recommend that DPP is used for small persistent objects.  You should probably run some benchmark tests to confirm the speed of retrieval of typical instances of the objects you wish to use with DPP.

- You need to be aware that different browsers have different policies for the retention times of data held in *indexedDB*.  [This document from the authors of the Dexie *indexedDB* wrapper](https://dexie.org/docs/StorageManager) is quite helpful, and applies equally to data you store in *indexedDB* using DPP.


## Secure/Encrypted Persistent Storage

### Background

You've probably realised that by default, DPP stores its keys and data into *indexedDB* as clear text.  This will often be quite satisfactory for many needs.

In terms of data security, you need to also understand that like all local storage within a browser, *indexedDB* is completely accessible by the user of the browser: it can be inspected using the browser's Developer Tools and can also be deleted using the Developer Tools.

The APIs for accessing and maintaining each *indexedDB* database and the stores within it are only accessible to scripts that run in the same origin.  In other words, an *indexedDB* database created in your browser when accessing one web application at one endpoint will not be accessible to scripts running in another session on your browser that accesses and uses a different web application and endpoint.

However, if your front-end code is using third-party JavaScript scripts, you need to be aware that those scripts potentially have full and unfettered access to any *indexedDB* databases, even if you loaded those scripts from a different origin.  This means that a rogue third-party script could potentially access, use and even modify all the data in your *indexedDB* database at that origin!

### DPP's Optional Encryption

As a means of helping to mitigate at least the latter risk, DPP includes a mechanism for encrypting the data (though not the keys) for records held in *indexedDB*.

To use DPP in this way, you need to supply two secret credentials to DPP's *start()* API.  These are ostensibly known as *username* and *password*, but are really just two pieces of secret information that you supply when starting DPP, eg:

        let my_local_object = await dpp.start({
          auth: {
            username: secret_1,
            password: secret_2
          }
        });

Of course you don't want these secret credentials to be available to any third-party scripts, so you should invoke this authenticated startup of DPP within a closure.  You'd also not want to hard-code the values of the credentials into your code, but ask for them from the user or acquire them in some other secure way that was also unavailable to a third-party script.  If you hard code the secret values into a script used in your front-end code, then they will be visible to the user simply by viewing the script code.

When started with authentication, DPP has privileged access to these credentials, but does not expose them outside of its own internal closures (both within the main DPP process and its QOper8 Worker process).  

You'll discover that that *indexedDB* datastore you use for mirroring your local object will now have a record stored with a key of *['signature']*.  This is an HMAC-SHA256 hash value derived from the username and password secrets and is used only to denote ownership to DPP of the database.  It is **NOT** used as an encryption/decryption key.  

The actual encryption/decryption key is known only to DPP and the DPP QOper8 Worker handler method, and is derived from the specified authentication credentials.  The *indexedDB* database does not, therefore, hold any information that can be used as a clue for decrytping its contents.

Once started in this way, the data values of any records you create in your local object are AES-GCM encrypted before they are stored in *indexedDB*.

When you invoke the *start()* API with authentication, any data stored in the *indexedDB* store will be decrypted before retrieval, so your local object will be in plain text.  Once again, the key to protection from a rogue third-party script will be to maintain your local object from within a closure to which any third-party scripts do not have access.


### Notices and Limitations

#### Notices

**M/Gateway Developments Ltd does not provide any warranty with respect to the security provisions implemented in DPP.  You use its authenticated access entirely at your own risk, and it is your responsibility to conduct your own security audit of its operations to confirm its fitness for purpose in your applications.  Your use of DPP is subject to the terms and conditions of its Apache 2.0 License (see below).**

With respect to any audit you conduct, you should note that all of the source code used by DPP and QOper8 is provided in full within their respective Github repositories, and you should also note that neither DPP nor QOper8 use or rely upon any third-party code.  They only rely upon the native capabilities provided by the browser's JavaScript run-time environment.

#### Limitations

You need to be aware of a number of limitations to the security provided by DPP.

- if you allow your local object or the security credentials to be accessible to any third-party scripts, then they will potentially have full access to its data.  Make use of JavaScript closures to prevent this.  If you do not know how to use JavaScript closures, please seek advice before attempting to use DPP in a secure way.

- The user of the browser will still be able to delete the *indexedDB* store via its Developer Tools.  They will not, however, be able to see anything other than the encrypted data values within the store and should not be able to decrypt its contents.

- DPP only encrypts the **data values** stored for each key in your local object.  If you create indices from any data values and store them as keys in your local object, those values will be **visible** in the *indexedDB* store.

- OWnership of, and therefore access by DPP to, an authenticated/encrypted store is determined by the two secret values supplied when it was first started (ie *username* and *password*).  You cannot change either the username or password: if you do so, you will lose access via DPP to the store.

- If you started DPP without authentication, the specified *indexedDB* store can only be re-accessed without authentication and DPP will store its data in *indexedDB* in the clear.

- Conversely, if you started DPP with authentication, the specified *indexedDB* store will be encrypted, and cannot be re-accessed without providing the correct authentication credentials.


## The JSON Database

With DPP, you now, in effect, have a JSON database at your disposal within your browser!

With DPP, JavaScript Objects are no longer an ephemeral, in-memory data structure.  DPP will persist them in the *indexedDB* database for you, but, as far as you're concerned, you're just using plain old standard JavaScript Objects/JSON.

Their hierarchical nature means that you can, in effect, model any other kind of database using it.  By way of example, you'll find [included in this repository's */db* folder](./db) pre-built examples of two such NoSQL database models using DPP:

- [Key/Value Store](./db/key-value-store)
- [Redis-like List](./db/list-store)

You can read more about these NoSQL stores that you can use within a browser here:

- [Key/Value Store](./KV.md)
- [Redis-like List](./LIST.md)

Of course, these are just two simple examples.  There's nothing to stop people using DPP to design other, more complex database models on top of plain old JavaScript Objects/JSON, eg a Graph database or even a Relational one.

**Enjoy DPP!**.


## License

 Copyright (c) 2023 MGateway Ltd,                           
 Banstead, Surrey UK.                                                      
 All rights reserved.                                                     
                                                                           
  https://www.mgateway.com                                                  
  Email: rtweed@mgateway.com                                               
                                                                           
                                                                           
  Licensed under the Apache License, Version 2.0 (the "License");          
  you may not use this file except in compliance with the License.         
  You may obtain a copy of the License at                                  
                                                                           
      http://www.apache.org/licenses/LICENSE-2.0                           
                                                                           
  Unless required by applicable law or agreed to in writing, software      
  distributed under the License is distributed on an "AS IS" BASIS,        
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
  See the License for the specific language governing permissions and      
   limitations under the License.      

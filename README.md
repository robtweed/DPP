# DPP: Deep Persistent Proxy Objects for JavaScript
 
Rob Tweed <rtweed@mgateway.com>  
20 June 2022, M/Gateway Developments Ltd [http://www.mgateway.com](http://www.mgateway.com)  

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

### Using a CDN Copy

You can use DPP directly from the Github CDN linked to this repository.  In your main module, load it using:

      const {DPP} = await import('https://cdn.jsdelivr.net/gh/robtweed/DPP/src/dpp.min.js');

### Using a Local Copy

Alternatively, clone or copy the folder [*/src*](./src) to an appropriate directory on your web server (eg */var/www/dpp*).

You should now have the following files in your web server folder:

        - dpp.js
        - dpp.min.js
        - idb_handlers
          - delete.js
          - delete.min.js
          - instantiate.js
          - instantiate.min.js
          - put.js
          - put.min.js
          - restore.js
          - restore.min.js


You can now load DPP directly from your Web Server, eg:


      const {DPP} = await import('/dpp/dpp.min.js');

### From NPM

DPP is available on NPM:

        npm install dpp-db


## Starting DPP

### Using the CDN Version

You need to decide on a store name: this is the name of the store that will be used by indexedDB to maintain your object.  The name is entirely for you to decide, eg

        let storeName = 'myObjCopy';

Optionally you can specify an *indexedDB* database name.  By default, DPP will apply a database name of "DPP".  Otherwise we can do the following:

        let idb_name = 'MY-DB';

Now instantiate an instance of DPP for your object:

        const {DPP} = await import('/dpp/dpp.min.js');

        let dpp = await DPP.create({
          storeName: storeName,
          idb_name: idb_name
        });

As noted above, if you didn't provide an *idb_name* property, DPP would use an *indexedDB* database name of *DPP*.


Then start your DPP instance, which will also attach your local object to its corresponding copy in *indexedDB*:

        let myObj = await dpp.start();

You're ready to start using your object!

Note that this approach will use CDN versions of *QOper8*'s resources and also CDN versions of DPP's *QOper8* WebWorker handler modules.


### Using a Local Copy of DPP

By default, DPP will use a copy of *QOper8* from its Github repository.  That's what happens behind the scenes if you use this method of instantiation (and it's why you must await its completion):

        let dpp = await DPP.create({
          storeName: storeName
        });

You can, however, use your own local copy of *QOper8* if you've copied it from the Github repository to your own web server.  For example, let's say you installed it in the folder */var/www/qoper8* on your Web Server.

You can instantiate DPP as follows:

        const {DPP} = await import('/dpp/dpp.min.js');
        const {QOper8} = await import('/qoper8/QOper8.min.js');

        let storeName = 'myObjCopy';
        let idb_name = 'MY-DB';  // optional

        let dpp = new DPP({
          storeName: storeName,
          idb_name: idb_name,    // optional, 'DPP' is the default
          QOper8: QOper8
        });

However, if started in this way, QOper8 will still load its Worker Loader Script from the *QOper8* CDN on Github, and also load the DPP WebWorker handler modules from the DPP CDN on Github.

If you want to load everything using local copies, you need to do the following:

        const {DPP} = await import('/dpp/dpp.min.js');
        const {QOper8} = await import('/qoper8/QOper8.min.js');

        let storeName = 'myObjCopy';
        let idb_name = 'MY-DB';

        let dpp = new DPP({
          storeName: storeName,
          idb_name: idb_name,
          QOper8: QOper8,
          qOptions: {
            workerLoaderPath: '/qoper8/',
            handlerPath: '/dpp/idb_handlers/'
          }
        });


You can now start DPP and attach your local object to its *indexedDB* copy:

        let myObj = await dpp.start();

You're ready to start using your object!


## Using Your Object

You can now add properties to your local object, and subsequently change any content within those properties: as far as you're concerned, you just use your object as normal.  Every change you make to your object will automatically be mirrored in the decoupled *indexedDB* copy.

if you restart your script in your browser, you'll find that the previous contents of your object are recovered automatically!


## Worked Example

This simple example creates and populates a Persistent Object named *a*.  It will use the CDN versions of everything:

Here's the module file:

### app.js

      (async () => {

        // load/import the DPP module from its source directory (change the path as appropriate)

         const {DPP} = await import('https://cdn.jsdelivr.net/gh/robtweed/DPP/src/dpp.min.js');

        // We'll use an indexedDB storename named "po_a"
        // and create an instance of the DPP class

        let dpp = await DPP.create({storeName: 'po_a'});

        // start the indexedDB database and attach a local object to the indexDB store:

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
         const {DPP} = await import('https://cdn.jsdelivr.net/gh/robtweed/DPP/src/dpp.min.js');
        let dpp = await DPP.create({storeName: 'po_a'});
        let a = await dpp.start();
        console.log('a: ' + JSON.stringify(a, null, 2));
      })();


Reload the *index.html* page in your browser, and you should see that the Proxy Object (a) has been
restored to its previous state.  You can now continue to use and modify it!


Finally, see what happens if you modify the *app.js* file again as follows:


      (async () => {
         const {DPP} = await import('https://cdn.jsdelivr.net/gh/robtweed/DPP/src/dpp.min.js');
        let dpp = await DPP.create({storeName: 'po_a'});
        let a = await dpp.start('new');                   // <== add the 'new' argument
        console.log('a: ' + JSON.stringify(a, null, 2));
      })();

This time you'll find that the *indexedDB* Object Store (po_a) is cleared down and your Proxy Object (a) is empty.


## DPP APIs

- Loading the DPP Module into your browser:

      const {DPP} = await import(/path/to/dpp.js)

- Creating an instance of the DPP Class

  - Using QOper8 from CDN

        let dpp = await DPP.create({
          storeName: storeName,
          idb_name: idbName           // optional, 'DPP' used if omitted
        });

  - Using a local copy of QOper8:

        const {QOper8} = await import('/qoper8/QOper8.min.js');

        let dpp = new DPP({
          storeName: storeName,
          idb_name: idb_name,
          QOper8: QOper8,
          qOptions: {
            workerLoaderPath: '/qoper8/',
            handlerPath: '/dpp/idb_handlers/'
          }
        });

- Open/Start DPP and connect a local object to the *indexedDB* Database store

      let local_object = await dpp.start(mode)

  - If *mode* is not specified, the Proxy Object specified by *obj_name* will be restored with any existing data from
the specified *indexedDB* ObjectStore

  - If you specify a value of *new* for *mode*, then the specified *indexedDB* ObjectStore is cleared down and
the Proxy Object will be empty.


## Limitations to DPP

- Your Persistent Object(s) are Proxy Objects (actually deep proxies, with Proxies at every key level).

- If you assign them to another variable, changes made to that variable will not be persisted in the *indexedDB* copy.

- A DPP Proxy Object can be as deeply-nested as you want, and can contain any mixture of:

  - simple key/value pairs
  - objects
  - arrays

- A DPP Proxy Object cannot contain:

  - methods
  - functions
  - classes

- Note that the base Proxy Object variable cannot be used as a simple variable, ie the following will not be
persisted:


      let a = await dpp.start('new');
      a = 'hello world';

  Instead, you must define at least one property of the Proxy Object.  ie the following **will** be persisted:

      a.value = 'hello world';

      a.arr = [1, 2, 3];

      a.obj = {hello: 'world};    


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

 Copyright (c) 2022 M/Gateway Developments Ltd,                           
 Redhill, Surrey UK.                                                      
 All rights reserved.                                                     
                                                                           
  http://www.mgateway.com                                                  
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

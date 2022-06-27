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

## Do you need to understand the *indexedDB* API in order to use DPP?

No.  DPP implements all the necessary *indexedDB* mechanics for you behind the scenes.  You just use a couple of
simple DPP APIs to specify a persistent object, and DPP looks after everything else for you automatically.

When using a DPP-defined Persistent Object, you are accessing its Proxy Object and not the *indexedDB* database.
The *indexedDB* database image of it is maintained asynchronously and automatically behind the scenes for you.

The only time the *indexedDB* version is directly used by DPP is to automatically restore the contents of your Persistent Object(s) whenever you start a new browser session.

## Will DPP Work on All Browsers?

DPP should work on all modern browsers, but not on older ones.  It is usable on any browser that supports all the following:

- indexedDB
- Proxy Objects
- async/await
- ES6 Modules

## Installing

You can use DPP directly from the Github CDN linked to this repository.  In your main module, load it using:

```javascript
const {DPP} = await import('https://cdn.jsdelivr.net/gh/robtweed/DPP/src/dpp.min.js');
```

Alternatively, clone or copy the file [*/src/dpp.min.js*](/src/dpp.min.js)
to an appropriate directory on your web server and load it directly from there, eg:

```javascript
const {DPP} = await import('/path/to/dpp.min.js');
```


## Try It Out

Try out this [live example](https://robtweed.github.io/DPP/examples/), running directly
from the code you'll find in the */examples* folder of this repo.

The first time you run it, the Proxy Object in the example (named *a*) will be empty.  Type in any valid JSON
into the textarea box and click the update button to add some content, eg:

```javascript
{
  "hello": "world"
}
```

Note that you must enter properly-formatted JSON, so string keys or values must be double-quoted.

Now try reloading the page in the browser.  Provided your browser is compatible (see above),
you should see that the Proxy Object (*a*) is restored with its previous contents.

Try using the browser's Developer Tools to examine the contents of the *indexedDB* database (eg
in Chrome, use the *Application* tab to find *indexedDB*).

Note that you can manually clear down the *indexedDB* database from the browser's Developer Tools.


## Worked Example

This simple example creates and populates a Persistent Object named *a*.

Here's the module file:

### app.js

```javascript
(async () => {

  // load/import the DPP module from its source directory (change the path as appropriate)

  const {DPP} = await import('../js/dpp.min.js');

  // create an instance of the DPP class

  let dpp = new DPP();

  // start the indexedDB database with an object store (po_a) for our Persistent Object

  await dpp.start(['po_a']);

  // instantiate our Persistent Proxy Object (a), mapped to the indexedDB database store (po_a)

  let a = await new dpp.persistAs('po_a').proxy();

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
```

Load and run this module in your browser with a web page such as this:


### index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>DPP Demo</title>
  </head>
  <body>
    <script type="module" src="/dpp/js/app.js"></script>
  </body>
</html>
```


When you load it into you browser, take a look at the console log in your browser's development tools panel.

You'll be able to see its persisted image in the *indexedDB* database by using the *Application* tab in your
browser's development tools panel.  Remember that you don't normally need to access the *indexedDB* database
yourself.


So now modify the *app.js* file, removing the lines that created the content in your Persistent Object (a):


```javascript
(async () => {
  const {DPP} = await import('../js/dpp.min.js');
  let dpp = new DPP();
  await dpp.start(['po_a']);
  let a = await new dpp.persistAs('po_a').proxy();
  console.log('a: ' + JSON.stringify(a, null, 2));
})();
```


Reload the *index.html* page in your browser, and you should see that the Proxy Object (a) has been
restored to its previous state.  You can now continue to use and modify it!


Finally, see what happens if you modify the *app.js* file again as follows:


```javascript
(async () => {
  const {DPP} = await import('../js/dpp.min.js');
  let dpp = new DPP();
  await dpp.start(['po_a']);
  let a = await new dpp.persistAs('po_a').proxy('new');  // <== add the 'new' argument
  console.log('a: ' + JSON.stringify(a, null, 2));
})();
```

This time you'll find that the *indexedDB* Object Store (po_a) is cleared down and your Proxy Object (a) is empty.


## DPP APIs

- Loading the DPP Module into your browser:

      const {DPP} = await import(/path/to/dpp.js)

- Creating an instance of the DPP Class

        let dpp = new DPP(optional_database_name);

  If you do not specify an *indexedDB* database name, *DPP* will be used as the default database name.

  Note: Instantiating the DPP Class does not open your *indexedDB* database

- Open/Start the *indexedDB* Database

      await dpp.start(array_of_objectStore_names)


  You must specify the names of all the *indexedDB* objectStores that you want to use for your Persistent Object(s).

  Each of your Persistent Objects should be assigned to its own uniquely-named *indexedDB* ObjectStore.

  DPP automatically looks after any *indexedDB* versioning issues if/when you specify (and therefore add) new ObjectStores


- Specify/Define a Persistent Object

      let obj_name = await new dpp.persistAs(objectStore_name).proxy(mode);

  - *obj_name* can be any valid JavaScript object name identifier

  - *objectStore_name* **MUST** match a member of the array of ObjectStore names that you used to start *indexedDB* in
the previous API above.

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

```javascript
let a = await new dpp.persistAs('po_a').proxy('new');
a = 'hello world';
```

  Instead, you must define at least one property of the Proxy Object.  ie the following **will** be persisted:

```javascript
a.value = 'hello world';

a.arr = [1, 2, 3];

a.obj = {hello: 'world};
```


## The JSON Database

With DPP, you now, in effect, have a JSON database at your disposal within your browser!

The hierarchical nature of JSON means that you can, in effect, model any other kind of database using it.

With DPP, JSON is no longer an ephemeral, in-memory data structure.  It's persisted in the *indexedDB* database
for you, but, as far as you're concerned, you're just using standard JSON.

Now let your imagination run wild!

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

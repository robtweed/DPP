# A Key/Value Store Implemented Using DPP

An example of a Key/Value store (actually, a Key/Object store) is [included in the DPP repository](./db/key-value/store).

You can either use it "right out of the box", or use it as the starting point for your own experimentation with DPP.

# Using the Key/Value Store

You'll find a [worked example in the repository](./db/key-value-store/example),
 but let's go through the process step by step:

To demonstrate its use, let's first create a simple HTML page:

## kv.html

      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>DPP Demo</title>
        </head>
        <body>
          <script type="module" src="/kv.js"></script>
        </body>
      </html>


## kv.js

Next, we'll create the *kv.js* module that the page above will load.  For simplicity we'll load the DPP Key/Value Store module directly from its Github repository, but you can modify the code below to load your own local copy:


        (async () => {
        
          console.log('Key/Value Store Using DPP');
        
          const {KV} = await import('https://robtweed.github.io/DPP/db/key-value-store/dpp-kv.min.js');
        
          let tel = await KV.start({
            storeName: 'telephone'
          });

        })();


Not much will appear to happen if you load and run this example in your browser.  All that will have happened is that you've created an empty Key/value store in a local JavaScript object named *tel*, mapped to an *indexedDB* store named *telephone*.

We can now begin modifying the *kv.js* logic to create some records.

Use the *set()* API to add key/value records to the store:

- set(key, value)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

For example:

        (async () => {
          console.log('Key/Value Store Using DPP');
          const {KV} = await import('https://robtweed.github.io/DPP/db/key-value-store/dpp-kv.min.js');
          let tel = await KV.start({
            storeName: 'telephone'
          });

          tel.set('617-555-1414', 'Tweed, Rob');
          tel.set('617-555-9999', 'Munt, Chris');

          console.log(JSON.stringify(tel.store, null, 2));

        })();


If you reload/re-run this in your browser and take a look in *indexedDB* using your browser's developer tools, you'll see what it's created.  You can, of course, also look at the local JavaScript Object named *tel*, which is what you'll see in the console as a result of this line in your example above:

          console.log(JSON.stringify(tel.store, null, 2));


Notice that the DPP-managed persistent data store part of the *tel* object is actually *tel.store*.  Having run the example above, it will look like this:

        {
          "data": {
            "617-555-1414": "Tweed, Rob",
            "617-555-9999": "Munt, Chris"
          }
        }

Notice also that the *set()* API is synchronous: it's directly modifying the local *tel.store* Object, but behind the scenes, DPP will update the *indexedDB* copy via its decoupled *QOper8* WebWorker.


## Handling Repeated Running of Your Application

Now, of course, if we rerun the example, it should first recover the saved Key/Value store records, so we don't want to re-create them using those *set()* APIs.  So we can amend the example to first check to see whether the *tel* Key/Value store is empty, in which case it will add the records.  If it's already got records in it, then we'll just display the local store version:

        (async () => {
          console.log('Key/Value Store Using DPP');
          const {KV} = await import('https://robtweed.github.io/DPP/db/key-value-store/dpp-kv.min.js');
          let tel = await KV.start({
            storeName: 'telephone'
          });

          if (tel.isEmpty) {
            tel.set('617-555-1414', 'Tweed, Rob');
            tel.set('617-555-9999', 'Munt, Chris');
          }

          console.log(JSON.stringify(tel.store, null, 2));

        })();

You can now repeatedly load/run the example in the browser, and you'll see the previously saved records reappear.

# Basic Key/Value Store APIs

At this stage, let's take a look at the basic APIs that are provided for you:

- isEmpty: returns true if the key/value store is empty, otherwise it returns false

- hasKeys: returns false if the key/value store is empty, otherwise it returns true

- set(key, value): saves a record into the key/value store.  Note that the value can be a simple scalar value or an object.

- get(key): returns the value for the specified key.  The returned value will be an object if it was originally set() with an object value

- delete(key): deletes the record for the specified key

- has(key): returns true if a record exists for the specified key, otherwise it returns false

- clear(): deletes all records in the key/value store


# Example

        (async () => {
          console.log('Key/Value Store Using DPP');
          const {KV} = await import('https://robtweed.github.io/DPP/db/key-value-store/dpp-kv.min.js');
          let tel = await KV.start({
            storeName: 'telephone'
          });

          if (tel.isEmpty) {
            tel.set('617-555-1414', 'Tweed, Rob');
            tel.set('617-555-9999', 'Munt, Chris');
          }

          let key = '123-456-7890';
          if (!tel.has(key)) {
            tel.set(key, {
              firstName: 'John',
              lastName: 'Smith'
            });
          }

          console.log(key + ' belongs to ' + tel.get(key).lastName);

          tel.delete('617-555-9999');

          console.log(JSON.stringify(tel.store, null, 2));

        })();


Try running this version and see how it works!


# Indexing

The value of a Key/Value store is significantly enhanced if it is possible to search it for matching values.  This is achieved by indexing.  The DPP Key/Value store provides very good indexing capabilities.

## Simple Key/Value Indexing

If you are only going to store records with scalar (ie non-object) values, then you can enable indexing by adding the *index* property when you instantiate the Key/Value store, eg:

          let tel = await KV.start({
            storeName: 'telephone',
            index: true
          });

Note that if you've changed the indexing since the last time, then the Key/Value store will be automatically re-indexed using the new criteria.  If you subsequently remove the *index* property when instantiating the Key/Value store, any existing indices will be deleted.

Index records are stored in *yourObject.store.index*.

For simple scalar records, the index records are structured as follows:

        {
          {{value}}: {
            {{key}}: true
          }
        }

For example:

        {
          "Tweed, Rob": {
            "617-555-1414": true
          },
          "Munt, Chris": {
            "617-555-9999": true
          }
        }


By default, indexing is not applied to records with an object value.

## Indexing Records with Object Values

If you want to index records that have object values, you specify the property or properties within the first level of the object that you want indexed.  This is then specified using the *props* key of the *index* property when instantiating the Key/Value store.

For example, we added the following record earlier:

             tel.set(key, {
              firstName: 'John',
              lastName: 'Smith'
            });

Suppose we want to add lots of similar values, and index the *lastName* property.  To do so, instantiate the Key/Value store as follows:

          let tel = await KV.start({
            storeName: 'telephone',
            index: {
              props: 'lastName'
            }
          });

If you wanted to also index the firstName values:

          let tel = await KV.start({
            storeName: 'telephone',
            index: {
              props: ['firstName', 'lastName']
            }
          });


## Index Transforms

It's often a good idea to apply transforms to the values that are indexed to normalise them for searching.  Typical transforms that you may want to apply will include conversion to lower case and perhaps removal of any punctuation (apart from single spaces).  

This means that you can search for values for *Rob* using *Rob* or *rob* or any combination of upper and lower case letters.

The Key/Value store provides a number of such commonly used transforms that you can specify in your index instantiation.  Simply add the *transforms* key to the *index* property, eg:

          let tel = await KV.start({
            storeName: 'telephone',
            index: {
              transforms: 'toLowerCase'
            }
          });

or to apply multiple transforms:

          let tel = await KV.start({
            storeName: 'telephone',
            index: {
              transforms: ['toLowerCase', 'removePunctuation']
            }
          });


Possible transforms that you may apply are:

- toLowerCase
- toString
- toInteger
- removePunctuation

As before, if you change the transforms, the Key/Value store will automatically re-index using the new criteria when loading the values from the *indexedDB* database.


# Searching

Provided you have applied indexing to your Key/Value store, then you can search for matching values within it.

You have two APIs available:

- getByIndex(value, returnData): this will look for exact value matches and return the key(s) of any matching records.  if *returnData* is specified as *true*, then both the key and value of any matching records will be returned.  The response is an array, eg:

  - if *returnData* is *false*: [key1, key2, key3, etc...]

  - if *returnData* is *true*:  [{key: key1, data: value1}, {key: key2, data: value2}, etc...]


- search(string, returnData): this will look for all records whose value *includes* the specified string.  Matching records are returned as an array in the same way as described above for the *getByIndex()* API.


For example:

        let matches = tel.getByIndex('smith');
        console.log('keys matching smith: ' + JSON.stringify(matches));
      
        matches = tel.search('tweed', true);
        console.log('search for tweed: ' + JSON.stringify(matches));


# Advanced Instantiation of the Key/Value Store

The example shown above used a copy of the DPP Key/Value Store module from this Github repository.  It will have also used copies from Github for *QOper8* and *DPP*.

The example also used the default *indexedDB* database store name of "DPP".

If you want to use local copies for the Key/Value store, QOper8 and DPP Modules, use the same options as documented for instantiating DPP itself, eg:


          const {KV} = await import('./dpp/dpp-kv.js');
          const {DPP} = await import('./dpp/dpp.js');
          const {QOper8} = await import('./qoper8/qoper8.js');

          let tel = await KV.start({
            storeName: 'telephone',
            index: {
              transforms: ['toLowerCase', 'removePunctuation']
            },

            DPP: DPP,
            QOper8: QOper8,
            qOptions: {
              handlerPath: './dpp/idb_handlers/',
              workerLoaderPath: './qoper8/'
            }

          });

To specify a different *indexedDB* database store name, use the *idb_name* property, eg:

          let tel = await KV.start({
            storeName: 'telephone',
            index: {
              transforms: ['toLowerCase', 'removePunctuation']
            },

            idb_name: 'myIDBStore'

          });



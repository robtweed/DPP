# A Redis-like List Store Implemented Using DPP

An example of a Redis-like List store is [included in the DPP repository](./db/liststore).

You can either use it "right out of the box", or use it as the starting point for your own experimentation with DPP.

# Using the List Store

You'll find a [worked example in the repository](./db/list-store/example),
 but let's go through the process step by step:

To demonstrate its use, let's first create a simple HTML page:

## list.html

      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>DPP Demo</title>
        </head>
        <body>
          <script type="module" src="/list.js"></script>
        </body>
      </html>


## list.js

Next, we'll create the *list.js* module that the page above will load.  For simplicity we'll load the DPP List Store module directly from its Github repository, but you can modify the code below to load your own local copy:


        (async () => {
        
          console.log('Redis-like List Store Using DPP');

          const {createLIST} = await import('https://robtweed.github.io/DPP/db/list-store/dpp-list_browser.js');
        
          let myList = await createLIST({
            storeName: 'demo-list'
          });

        })();


Not much will appear to happen if you load and run this example in your browser.  All that will have happened is that you've created an empty List store in a local JavaScript object named *myList*, mapped to an *indexedDB* store named *demo-list*.

We can now begin modifying the list.js* logic to create our persistent List.


## List APIs

The DPP-based List store APIs are a subset of, and broadly based on the ones implemented by 
[Redis in their List store](https://redis.io/docs/manual/data-types/#lists).

The following methods and properties can be applied to your DPP Persistent Object (eg *myList* in the example shown above).  Note that *obj* denotes either a scalar value or an object (containing any mixture of values, arrays or objects): 

- *rpush(obj)*: Appends the specified value or object to the end of the List

- *lpush(obj)*: Prepends the specified value or object to the start of the List

- *insertBefore(obj, member_no)*: Inserts the specified value or object before the specified List member.

  Note that List member numbers are zero based (ie the first List member is number 0)

  If the specified member number is beyond the current end of the list, the specified value or object is appended to the end of the List.

  If no member number is specified, the value or object is prepended to the start of the List.

- *rpop*: Removes the last List member from the List and return its contents

- *lpop*: Removes the first List member from the List and return its contents

- *clear()*: Deletes all List members. No values are returned.

- *length*: Returns the number of members currently in the List

- *isEmpty*: Returns *true* if the List has no members, otherwise returns *false*.

- *lrange(from_member_no, to_member_no)*: Retrieves an array containing the contents of the members of the List within the specified position range.  The returned array members are in the order found in the List.

  Note that the member number is zero based: ie the first member of the List is number 0.

  Unlike *rpop* and *lpop*, *lrange()* does not delete the retrieved members from the List

  If the second (*to_member_no*) argument is not specified, it will default to the *from_member_no* value, and only the specified List member is retrieved.

  If the second (*to_member_no*) argument is specified as -1, all members from the *from_member_no* to the end of the List are retrieved.

  If no arguments are provided, the entire list is retrieved.

  If the second (*to_member_no*) argument is beyond the length of the List,  all members from the *from_member_no* to the end of the List are retrieved.

- *ltrim(from_member_no, to_member_no)*: Removes from the List:

  - all List members before the specified *from_member_no* position; and/or
  - all List members after the specified *to_member_no* position;

  *ie* All List members other than those within the specified position range are deleted.

  Note that the member number is zero based: ie the first member of the List is number 0.

  *ltrim()* does not return the values of the deleted List items.

  If the second (*to_member_no*) argument is not specified, it will default to the *from_member_no* value, and only the specified List member is left in the List: all other List members are deleted.

  If the second (*to_member_no*) argument is specified as -1, all List members after the *from_member_no* position are left intact.

  If the second (*to_member_no*) argument is beyond the length of the List, all List members after the *from_member_no* position are left intact.

  If no arguments are provided, the List is left intact.


- *dump()*: Returns (in prettified JSON.stringify format) the entire raw contents of your DPP List object.


# Example

In the example below, I'm using a simple function to generate the contents of each List member, so that they are each different but so they can be easily identified if you inspect the List DPP object or its representation in *indexedDB*:

        (async () => {
        
          console.log('Redis-like List Store Using DPP');
        
          const {createLIST} = await import('https://robtweed.github.io/DPP/db/list-store/dpp-list_browser.js');
        
          let myList = await createLIST({
            storeName: 'demo-list'
          });

          let no = 0
          function createObj() {
            no++;
            let obj = {
              no: no,
              foo: 'bar',
              date: Date.now()
            };
            return obj;
          }

          // Populate the list on the first run only

          if (myList.isEmpty) {

            // Add to end of List

            myList.rpush(createObj());
            myList.rpush(createObj());
            myList.rpush(createObj());
            myList.rpush(createObj());


            // Add to start of List

            myList.lpush(createObj());
            myList.lpush(createObj());
            myList.lpush(createObj());

            // Insert before List member 3

            myList.insertBefore(createObj(), 3);

          }

          // Various demonstrations of lrange()

          let results = myList.lrange(2, 4);
          console.log('results (2-4) =  ' + JSON.stringify(results, null, 2));

          results = myList.lrange(0, 2);
          console.log('results (0-2) =  ' + JSON.stringify(results, null, 2));

          results = myList.lrange(2);
          console.log('results (2) =  ' + JSON.stringify(results, null, 2));

          results = myList.lrange(2, -1);
          console.log('results (2, -1) =  ' + JSON.stringify(results, null, 2));

          results = myList.lrange();
          console.log('results () =  ' + JSON.stringify(results, null, 2));

          console.log('*********************************');
          console.log(myList.dump());
          console.log(' ');
          console.log('No of list members: ' + myList.length);
          console.log('*********************************');

          let content = myList.rpop;

          console.log('Removed last List item: ' + JSON.stringify(content, null, 2));

        })();


Try repeatedly running this.  You'll see that each time you run it, the List is retrieved again for you from *indexedDB* by DPP, but the last List member is removed on each run.  Eventually it will be emptied, in which case, the next time you run it, it will re-populate again.


# Advanced Instantiation of the List Store

The example shown above used a copy of the DPP LIST Store creation module from this Github repository.  Behind the scenes, it will have also used copies from Github for the actual *LIST* class module, as well as *QOper8* and *DPP*.

The example also used the default *indexedDB* database store name of "DPP".

## Using Local Copies of the Resources Used by the List Store

If you want to use local copies for the List store, QOper8 and DPP Modules, use the same options as documented for instantiating DPP itself, but use the *LIST* module's *start* method:


          const {LIST} = await import('/path/to/dpp-kv.js');
          const {DPP} = await import('/path/to/dpp.js');
          const {QOper8} = await import('/path/to/qoper8.js');

          let myList = await LIST.start({
            storeName: 'demo-list',
            DPP: DPP,
            QOper8: QOper8

          });

To specify a different *indexedDB* database store name, use the *idb_name* property, eg:

          let myList = await LIST.start({
            storeName: 'demo-list',

            idb_name: 'myIDBStore'

          });

or, if using the *createLIST* module:

          let myList = await createLIST({
            storeName: 'demo-list',
            idb_name: 'myIDBStore'
          });


## Using the List Store with Node.js and NPM

If you're building your front-end application using Node.js and WebPack (or equivalent), you need to use a slightly different approach.

First, make sure that you've installed DPP:

        npm install dpp-db


Then use the following:

        import {createLIST} from 'dbb-db/createLIST';

          let myList = await createLIST({
            storeName: 'demo-list',
            idb_name: 'myIDBStore'
          });

        ...etc


Behind the scenes, the *createLIST* module will import the *LIST*, *DPP* and *QOper8* modules from your *node_modules* folder.

# Using DPP's Authenticated Access With the List Store

You can apply DPP's optional authenticated access when using the List store.

Simply add the appropriate authentication credentials when accessing/re-accessing the List Store, eg:

        let myList = await createLIST({
          storeName: 'demo-list',
          auth: {
            username: secret_1,
            password: secret_2
          }
        });

The data values for all the keys of your local object will be encrypted into the *indexedDB* copy.



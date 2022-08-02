        (async () => {
        
          console.log('Redis-like List Store Using DPP');
        
          const {LIST} = await import('https://robtweed.github.io/DPP/db/key-value-store/dpp-list.min.js');

          let myList = await LIST.start({
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
(async () => {

  console.log('LIST Store Using DPP');

  
  //const {QOper8} = await import('./QOper8.min.js');
  //const {DPP} = await import('./dpp.min.js');
  //const {LIST} = await import('./dpp-list.js');
  

  const {LIST} = await import('https://robtweed.github.io/DPP/db/list-store/dpp-list.min.js');

  let myList = await LIST.start({
    storeName: 'myList',
    //logging: true,
    //DPP: DPP,
    //QOper8: QOper8,
    //qOptions: {
    //  handlerPath: '/dpp/js/idb_handlers',
    //  workerLoaderPath: '/dpp/js/'
    //  logging: true
    //},
  });

  let cnt = 0
  function getObj() {
    cnt++;
    let obj = {
      no: cnt,
      hello: 'world ' + cnt,
      foo: 'bar',
      date: Date.now()
    };
    return obj;
  }

  if (myList.isEmpty) {

    myList.rpush(getObj());
    myList.rpush(getObj());
    myList.rpush(getObj());
    myList.rpush(getObj());
    myList.rpush(getObj());
    myList.rpush(getObj());
    myList.rpush(getObj());
  }

  let results = myList.lrange(2, 4);
  console.log('results =  ' + JSON.stringify(results, null, 2));

  //myList.ltrim(2,4);

  let content = myList.lpop;
  console.log('content: ' + JSON.stringify(content, null, 2));

  console.log('*********************************');
  console.log(myList.dump());
  console.log(' ');
  console.log('No of nodes in list: ' + myList.length);
  console.log('*********************************');


})();
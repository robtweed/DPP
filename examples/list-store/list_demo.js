(async () => {

  console.log('LIST Store Using DPP');

  const {LIST} = await import('https://robtweed.github.io/DPP/db/list-store/dpp-list.min.js');

  // If you want to use local copies, do something like this:

  //const {QOper8} = await import('./QOper8.js');
  //const {DPP} = await import('./dpp.js');
  //const {LIST} = await import('./dpp-list.js');

  let myList = await LIST.start({
    storeName: 'myList',
    index: {
      props: ['foo', 'hello'],
      transforms: ['toLowerCase', 'removePunctuation']
    },
    //QOper8: QOper8,  <= if you use a local copy of QOper8
    //DPP: DPP,        <= if you use a local copy of DPP
    //logging: true,
    //qOptions: {
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
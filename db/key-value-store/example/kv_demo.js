(async () => {

  console.log('Key/Value Store Using DPP');


  //const {QOper8} = await import('./QOper8.min.js');
  //const {DPP} = await import('./dpp.min.js');
  //const {KV} = await import('./dpp-kv.js');

  const {KV} = await import('https://robtweed.github.io/DPP/db/key-value-store/dpp-kv.min.js');

  let tel = await KV.start({
    storeName: 'telephone',
    index: {
      props: ['foo', 'hello'],
      transforms: ['toLowerCase', 'removePunctuation']
    },
    //logging: true,
    //DPP: DPP,
    //QOper8: QOper8,
    //qOptions: {
    //  handlerPath: '/dpp/js/idb_handlers',
    //  workerLoaderPath: '/dpp/js/'
    //  logging: true
    //},
  });

  console.log(tel.dump());

  if (tel.isEmpty) {
    console.log('Create new values for empty telephone store');
    let obj = {
      hello: 'bar',
      foo: 'bar2'
    };


    tel.set('123-456-7890', obj);

    obj = {
      hello: 'bar2',
      foo: 'bar3'
    };

    tel.set('123-456-9999', obj);
    
    tel.set('211-555-9012', 'James, George'),
    tel.set('617-555-1414', 'Tweed, Rob'),
    tel.set('617-555-9999', 'Munt, Chris'),
    tel.set('612-123-7777', 'Robinson, Chris')
  }

  // tel.delete('123-456-7890');



  let val = tel.get('123-456-7890');
  console.log('val for 123-456-7890: ' + JSON.stringify(val));


  console.log('has 11111?: ' + tel.has('11111'));

  console.log('has 211-555-9012?: ' + tel.has('211-555-9012'));

  console.log('owner of 617-555-1414: ' + tel.get('617-555-1414'));

  console.log('Robs tel no: ' + JSON.stringify(tel.getByIndex('tweed Rob', true)));

  console.log('Matching Rob: ' + JSON.stringify(tel.search('rob', true)));


/*

  tel.delete('211-555-9012');

  setTimeout(async function() {
    tel.clear();
    console.log('all deleted');

    tel.set('123-456-7890', 'Tweed, Simon');

  }, 3000);
*/

})();
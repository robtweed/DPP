(async () => {

  const {DPP} = await import('../src/dpp.min.js');
  const {QOper8} = await import('https://robtweed.github.io/QOper8/src/QOper8.min.js');

  let storeName = 'po_a';

  let dpp = new DPP({
    storeName: storeName,
    QOper8: QOper8,
    qOptions: {
      workerLoaderUrl: 'https://robtweed.github.io/QOper8/src//QOper8Worker.min.js'
    }
  });
  dpp.start(storeName);
  let a = await new dpp.persistAs(storeName).proxy();
  document.getElementById('content').innerText = JSON.stringify(a, null, 2);

  document.getElementById('updateBtn').addEventListener("click", function() {
    try {
      let json = JSON.parse(document.getElementById('newstuff').value);

      for (let name in json) {
        a[name] = json[name];
      }

     document.getElementById('content').innerText = JSON.stringify(a, null, 2);
    }
    catch(err) {
      alert('Invalid JSON');
    }
  });


})();

(async () => {

  const {DPP} = await import('../src/dpp.min.js');
  let storeName = 'po_a';

  let dpp = await DPP.create({storeName: storeName});
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

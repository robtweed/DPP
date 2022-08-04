(async () => {

  const {createDPP} = await import('../src/dpp_browser.js');

  let dpp = await createDPP({
    storeName: 'po_a',
    logging: true,
    qOptions: {
      logging: true
    }
  });

  let a = await dpp.start();

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

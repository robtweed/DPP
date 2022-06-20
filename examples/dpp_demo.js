(async () => {

  const {DPP} = await import('../src/dpp.min.js');

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


  let dpp = new DPP();
  await dpp.start(['po_a']);
  let a = await new dpp.persistAs('po_a').proxy();
  document.getElementById('content').innerText = JSON.stringify(a, null, 2);


})();

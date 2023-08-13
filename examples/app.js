(async () => {

  const {createDPP} = await import('../src/dpp_browser.min.js');
  let dpp = await createDPP({storeName: 'demo'});

  let myObj = await dpp.start();

  if (!myObj.counter) myObj.counter = 0;
  if (!myObj.arr) myObj.arr = [];

  myObj.counter++;

  myObj.arr.push({
    time: Date.now()
  });

  document.getElementById('content').textContent = JSON.stringify(myObj, null, 2);

  document.getElementById('cleardown').addEventListener("click", async () => {

    let count = 0;
    dpp.on('committed', () => {
      count++;
      if (count > 1) document.location.reload();
    });

    myObj.arr = [];
    myObj.counter = 0;

  });


})();

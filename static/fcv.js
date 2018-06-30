const API_BASE = "https://free.currencyconverterapi.com/api/v5/";

/**
 * Install the service worker
 */
async function installServiceWorkerAsync() {
  if ('serviceWorker' in navigator) {
    try {
      let serviceWorker = await navigator.serviceWorker.register('./static/sw.js')
      console.log(`Service worker registered ${serviceWorker}`)
    } catch (err) {
      console.error(`Failed to register service worker: ${err}`)
    }
  }
}

/**
 * loadCurrencies from the internet and place it on a target element
 */
fetch(API_BASE + 'currencies', {
  method: 'get'
}).then(function (response) {

  return response.json();
}).then(function (results) {

  var messages = Object.values(results);

  let restResult = messages[0];



  const dbPromise = idb.open('currency', 1, function (upgradeDb) {
    let keyValStore = upgradeDb.createObjectStore('keyval', {
      keyPath: 'id'
    });
  });


  dbPromise.then(db => {
    let tx = db.transaction('keyval', 'readwrite');
    let keyValStore = tx.objectStore('keyval');

    Object.keys(restResult).forEach(key => {
      let obj = restResult[key];
      keyValStore.put(obj);
    });

  });

  // read "hello" in "keyval"
  dbPromise.then(db => {
    let tx = db.transaction('keyval');
    let keyValStore = tx.objectStore('keyval');
    return keyValStore.getAllKeys();
  }).then(function (val) {

    for (const id of val) {

      let node = document.createElement("option");
      let textnode = document.createTextNode(`${id}`);
      node.appendChild(textnode);
      document.getElementById("fromCurrency").appendChild(node);

    }

    for (const id of val) {

      let node = document.createElement("option");
      let textnode = document.createTextNode(`${id}`);
      node.appendChild(textnode);
      document.getElementById("toCurrency").appendChild(node);

    }

  });

}).catch(function (err) {

});

// Convertion

document.getElementById("convert").onclick = function () {

  let elementFromCurrency = document.getElementById("fromCurrency");
  let selectedFromCurrency = elementFromCurrency[elementFromCurrency.selectedIndex].text;

  let elementToCurrency = document.getElementById("toCurrency");
  let selectedToCurrency = elementToCurrency[elementToCurrency.selectedIndex].text;

  const query = selectedFromCurrency + '_' + selectedToCurrency;


  let amount = document.getElementById("amount").value;


  fetch(API_BASE + 'convert?q=' + query + '&compact=ultra', {
    method: 'get'
  }).then(function (response) {

    return response.json();
  }).then(function (results) {

    const dbPromise = idb.open('conversions', 1, upgradeDB => {
      upgradeDB.createObjectStore('keyval');
    });

    const idbKeyval = {
      get(key) {
        return dbPromise.then(db => {
          return db.transaction('keyval')
            .objectStore('keyval').get(key);
        });
      },
      set(key, val) {
        return dbPromise.then(db => {
          const tx = db.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').put(val, key);
          return tx.complete;
        });
      },
      delete(key) {
        return dbPromise.then(db => {
          const tx = db.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').delete(key);
          return tx.complete;
        });
      },
      clear() {
        return dbPromise.then(db => {
          const tx = db.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').clear();
          return tx.complete;
        });
      },
      keys() {
        return dbPromise.then(db => {
          const tx = db.transaction('keyval');
          const keys = [];
          const store = tx.objectStore('keyval');

          // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
          // openKeyCursor isn't supported by Safari, so we fall back
          (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
            if (!cursor) return;
            keys.push(cursor.key);
            cursor.continue();
          });

          return tx.complete.then(() => keys);
        });
      }
    };


    Object.keys(results).forEach(key => {
      let obj = results[key];
      idbKeyval.set(key, obj);
    });

    idbKeyval.get(query).then(val => {

      let convertedTo = val * amount;

      document.getElementById("convertedTo").value = convertedTo;

    });

  }).catch(function (err) {

  });

};

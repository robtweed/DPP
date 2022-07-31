/*
 ----------------------------------------------------------------------------
 | DPP: Deep Persistent Proxy Objects for JavaScript                         |
 |                                                                           |
 | Copyright (c) 2022 M/Gateway Developments Ltd,                            |
 | Redhill, Surrey UK.                                                       |
 | All rights reserved.                                                      |
 |                                                                           |
 | http://www.mgateway.com                                                   |
 | Email: rtweed@mgateway.com                                                |
 |                                                                           |
 |                                                                           |
 | Licensed under the Apache License, Version 2.0 (the "License");           |
 | you may not use this file except in compliance with the License.          |
 | You may obtain a copy of the License at                                   |
 |                                                                           |
 |     http://www.apache.org/licenses/LICENSE-2.0                            |
 |                                                                           |
 | Unless required by applicable law or agreed to in writing, software       |
 | distributed under the License is distributed on an "AS IS" BASIS,         |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  |
 | See the License for the specific language governing permissions and       |
 |  limitations under the License.                                           |
 ----------------------------------------------------------------------------

QOper8 WebWorker for DPP: Instantiate/Load the IndexDB Database

31 July 2022

 */

export async function handler(obj, finished) {

  let worker = this;

  const objectStore = class {
    constructor(name) {
      this.name = name;
    }

    getObjectStore(mode) {
      let transaction = worker.idb.db.transaction(this.name, mode);
      return transaction.objectStore(this.name);
    }


    iterate_db(matchKey, callback, xit) {
      if (!callback && typeof matchKey === 'function') {
        callback = matchKey;
        matchKey = null;
      }
      let keyRange;
      let matchString = '';
      if (matchKey) {
        keyRange = IDBKeyRange.lowerBound(matchKey)
        matchString = matchKey.toString() + ',';
      }
      let objectStore = this.getObjectStore();
      let request = objectStore.openCursor(keyRange);
      request.onsuccess = function(evt) {
        let cursor = evt.target.result;
        if (cursor) {
          let value = cursor.value;
          if (!matchKey) {
            if (callback) callback(value.id, value.value);
            cursor.continue();
          }
          else {
            let keyString = value.id.toString() + ',';
            if (matchString !== '' && keyString.startsWith(matchString)) {
              if (callback) callback(value.id, value.value);
              cursor.continue();
            }
            else {
              if (xit && typeof xit === 'function') xit();
            }
          }
        }
        else {
          if (xit && typeof xit === 'function') xit();
        }
      };
    }

    iterate(matchKey, callback) {
      if (!callback && typeof matchKey === 'function') {
        callback = matchKey;
        matchKey = null;
      }
      let _this = this;
      return new Promise((resolve) => {
        _this.iterate_db(matchKey, callback, function() {
          resolve();
        });
      });
    }

    async clearByKey(key) {
      let _this = this;
      await this.iterate(key, async function(id) {
        await _this.delete(id);
      });
    }

    clear_db(callback) {
      if (!_worker.idb.db) {
      return callback({error: 'clear() Error: Database has not been opened'});
      }
      let objectStore = this.getObjectStore('readwrite');
      let request = objectStore.clear();
       request.onsuccess = function() {
         callback({ok: true});
       };

       request.onerror = function() {
         callback({error: request.error});
       };
    }

    clear() {
      let _this = this;
      return new Promise((resolve) => {
        _this.clear_db(function(obj) {
          resolve(obj);
        });
      });
    }

    put_item(key, value, callback) {
      if (!worker.idb.db) {
        return callback({error: 'addItem Error: Database has not been opened'});
      }
      if (!callback) {
        callback = value;
        value = key;
        key = null;
      }
      let objectStore = this.getObjectStore('readwrite');
      let request = objectStore.put(value);
      request.onsuccess = function() {
        worker.emit('putCommitted', value);
        callback({key: request.result});
      };

      request.onerror = function() {
        callback({error: request.error});
      };
    }

    put(key, value) {
      if (!value) {
        value = key;
        key = null;
      }
      let _this = this;
      return new Promise((resolve) => {
        _this.put_item(key, value, function(obj) {
          resolve(obj);
        });
      });
    }

    delete_item(key, callback) {
      if (!worker.idb.db) {
        return callback({error: 'delete_item Error: Database has not been opened'});
      }
      let objectStore = this.getObjectStore('readwrite');
      let request = objectStore.delete(key);
       request.onsuccess = function() {
         worker.emit('deleteCommitted', key);
         callback({ok: true});
       };

       request.onerror = function() {
         callback({error: request.error});
       };
    }

    delete(key) {
      let _this = this;
      return new Promise((resolve) => {
        _this.delete_item(key, function(obj) {
          resolve(obj);
        });
      });
    }

  };

  function createObjectStores() {
    // create any newly-defined object stores
    if (worker.idb) {
      for (const [key, value] of worker.idb.objectStores.entries()) {
        if (!worker.idb.db.objectStoreNames.contains(key)) {
          worker.idb.db.createObjectStore(key, value);
          if (!worker.idb.stores[key]) worker.idb.stores[key] = new objectStore(key);
        }
      }
    }
  }

  function useObjectStore(name, keyPath) {
    let props = {};
    if (keyPath) {
      props.keyPath = keyPath;
    }
    else {
      props.autoIncrement = true;
    }
    worker.idb.objectStores.set(name, props);
  }

  function open_database(version, callback) {
    if (!worker.idb.store) {
      return callback({error: 'Open Database Error: Store Name not defined'});
    }
    if (!callback) {
      callback = version;
      version = null;
    }
    let openRequest = indexedDB.open(worker.idb.store, version);
    openRequest.onsuccess = function (evt) {
      worker.idb.db = evt.target.result;
      worker.emit('databaseOpen', worker.idb.db);
      callback({db: worker.idb.db});
    };
    openRequest.onerror = function (evt) {
      callback({error: evt.target.errorCode});
    };
    openRequest.onupgradeneeded = function (evt) {
      worker.idb.db = evt.target.result;
      createObjectStores();
    };
  }

  async function open(version) {
    return new Promise((resolve) => {
      open_database(version, function(obj) {
        resolve(obj);
      });
    });
  }


  if (!worker.idb) {
    this.idb = {
      objectStores: new Map(),
      stores: {},
      store: obj.storeName
    }
  }

  let objectStores = obj.objectStores || [];

  for (const name of objectStores) {
    useObjectStore(name, 'id');
  }

  await open();
  let upgradeNeeded = false;

  for (const name of worker.idb.objectStores.keys()) {
    if (!worker.idb.db.objectStoreNames.contains(name)) upgradeNeeded = true;
    worker.idb.stores[name] = new objectStore(name);
  }

  if (upgradeNeeded) {
    // re-open database as new version and add the new object stores
    let newVersion = worker.idb.db.version + 1;
    worker.idb.db.close();
    await open(newVersion);
    worker.emit('databaseReady');
    finished({
      db_ready: true
    });

  }
  else {
    this.emit('databaseReady');
    finished({
      db_ready: true
    });
  }

};
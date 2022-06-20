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

 20 June 2022

 */

let DPP = class {
  constructor(storeName) {
    storeName = storeName || 'DPP';
    this.name = 'DPP';
    this.build = '0.1';
    this.store = storeName;
    this.objectStores = new Map();
    this.idb = false;
    this.stores = {};
    this.listeners = new Map();
    this.logging = false;
    this.target = {};
    this.started = false;

    let _this = this;

    this.deepProxy = class {
      constructor(target, handler) {
        this._preproxy = new WeakMap();
        this._handler = handler;
        return this.proxify(target, []);
      }

      makeHandler(path) {
        let dp = this;
        return {
          set(target, key, value, receiver) {
            if (typeof value === 'object') {
              value = dp.proxify(value, [...path, key]);
            }
            target[key] = value;

            if (dp._handler.set) {
              dp._handler.set(target, [...path, key], value, receiver);
            }
            return true;
          },

          deleteProperty(target, key) {
            if (Reflect.has(target, key)) {
              dp.unproxy(target, key);
              let deleted = Reflect.deleteProperty(target, key);
              if (deleted && dp._handler.deleteProperty) {
                dp._handler.deleteProperty(target, [...path, key]);
              }
              return deleted;
            }
            return false;
          }
        }
      }

      unproxy(obj, key) {
        if (this._preproxy.has(obj[key])) {
          obj[key] = this._preproxy.get(obj[key]);
          this._preproxy.delete(obj[key]);
        }

        for (let k of Object.keys(obj[key])) {
          if (typeof obj[key][k] === 'object') {
            this.unproxy(obj[key], k);
          }
        }

      }

      proxify(obj, path) {
        for (let key of Object.keys(obj)) {
          if (typeof obj[key] === 'object') {
            obj[key] = this.proxify(obj[key], [...path, key]);
          }
        }
        let p = new Proxy(obj, this.makeHandler(path));
        this._preproxy.set(p, obj);
        return p;
      }
    }

    this.objectStore = class {
      constructor(name) {
        this.name = name;
      }

      getObjectStore(mode) {
        let transaction = _this.idb.transaction(this.name, mode);
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
          keyRange = IDBKeyRange.lowerBound(matchKey);
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
        if (!_this.idb) {
          return callback({error: 'clear() Error: Database has not been opened'});
        }
        let objectStore = this.getObjectStore('readwrite');
        _this.logMessage('*** cleardown database');
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
        if (!_this.idb) {
          return callback({error: 'addItem Error: Database has not been opened'});
        }
        if (!callback) {
          callback = value;
          value = key;
          key = null;
        }
        let objectStore = this.getObjectStore('readwrite');
        _this.logMessage('*** put: key = ' + key);
        //let request = objectStore.put(value, key);
        let request = objectStore.put(value);
         request.onsuccess = function() {
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
        if (!_this.idb) {
          return callback({error: 'delete_item Error: Database has not been opened'});
        }
        let objectStore = this.getObjectStore('readwrite');
        _this.logMessage('*** delete: key = ' + key);
        let request = objectStore.delete(key);
         request.onsuccess = function() {
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

    this.persistAs = class {
      constructor(storeName) {

        _this.target[storeName] = {};
        this.storeName = storeName;
        this.store = _this.stores[storeName];
        this.persist = true;

      }

      async proxy(mode) {

        let self = this;
        let storeName = this.storeName;
        let store = this.store;
        let p = new _this.deepProxy(_this.target[storeName], {

          async set(target, prop, value, receiver) {

            if (!self.persist) return;

            _this.logMessage('proxy set called with prop = ' + JSON.stringify(prop));
            //console.log(target);
            //console.log(value);
            //console.log(receiver);
            //console.log('-----');

            let o = self.receiver;
            let isArr = false;
            prop.forEach(function(p, index) {
              o = o[p];
              if (isArr) prop[index] = [p];
              isArr = Array.isArray(o);
            });

            async function save(key, value) {
              _this.logMessage('save called with key ' + JSON.stringify(key) + ' = ' + value);

              // first clear down any existing indexeddb records with matching keys
              // in case any lower-level records exist

              await store.clearByKey(key);

              if (key.length === 1) target[prop] = value;

              let data = {
                id: key,
                value: value
              };
              await store.put(data);      
            }

            async function getProps(parentProp, obj) {

                _this.logMessage('getProps called for ' + JSON.stringify(parentProp));
                _this.logMessage('obj=' + JSON.stringify(obj));

              // clear down any existing indexeddb records that might exist with this set of keys
              await store.clearByKey(parentProp);

              let isArr = Array.isArray(obj);
              
              Object.entries(obj).forEach(async (entry, index) => {
                let [key, value] = entry;
                if (isArr) key = [key];
                let opath = parentProp.slice();
                opath.push(key);
                if (typeof value !== 'object') {
                  await save(opath, value);
                }
                else {
                  getProps(opath, value);
                }
              });

            }

            if (typeof value === 'object') {
              getProps(prop, value);
            }
            if (typeof value === 'string' || typeof value === 'number') {
              save(prop, value);
            }      

            return true;
          },


          deleteProperty(target, path) {
            let o = self.receiver;
            let isArr = false;
            path.forEach(function(p, index) {
              o = o[p];
              if (isArr) path[index] = [p];
              isArr = Array.isArray(o);
            });

            store.clearByKey(path);
            
          }

        });
        this.receiver = p;

        if (mode !== 'new') {
          await this.restore();
        }
        else {
          await this.clear();
        }

        return p;

      }

      async clear() {
        await this.store.clear();
      }

      async restore() {
        var ref = {};
        await this.store.iterate(function(key, value) {
          var o = ref;
          let key1;
          key.forEach(function(prop, index) {
            let isArr = false;
            if (Array.isArray(prop)) {
              isArr = true;
              prop = +prop[0];
            }
            if (index === 0) {
              key1 = prop;
            }
            if (index === (key.length - 1)) {
              o[prop] = value;
            }
            else {
              let nextKey = key[index + 1];
              if (Array.isArray(nextKey)) {
                if (typeof o[prop] === 'undefined') o[prop] = [];
              }
              else {
                if (typeof o[prop] === 'undefined') o[prop] = {};
              }
              o = o[prop];
            }
          });
        });

        // avoid writing back to database during restore of proxy object
        this.persist = false;
        for (let prop in ref) {
          //obj[prop] = ref[prop];
          this.receiver[prop] = ref[prop];
        }
        this.persist = true;
      }
    };

  }

  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, callback);
    }
  }

  off(type) {
    if (this.listeners.has(type)) {
      this.listeners.delete(type);
    }
  }
  emit(type, data) {
    if (this.listeners.has(type)) {
      let handler =  this.listeners.get(type);
      handler.call(this, data);
    }
  }

  logMessage(message) {
    if (this.logging) {
      console.log(Date.now() + ': ' + message);
    }
  }

  async start_idb(objectStores, callback) {
    // the hook will have defined any objectStores being used
    // if there are any new ones, need to add them in a version upgrade

    if (this.store) {

      objectStores = objectStores || [];

      let _this = this;

      objectStores.forEach(function(name) {
        _this.useObjectStore(name, 'id');
      });

      await this.open();
      let upgradeNeeded = false;

      for (const name of this.objectStores.keys()) {
        if (!this.idb.objectStoreNames.contains(name)) upgradeNeeded = true;
        this.stores[name] = new this.objectStore(name);
      }
      this.logMessage('upgradeNeeded: ' + upgradeNeeded);
      if (upgradeNeeded) {
        // re-open database as new version and add the new object stores
        let newVersion = this.idb.version + 1;
        this.idb.close();
        await this.open(newVersion);
        this.emit('databaseReady');
        callback();
      }
      else {
        this.emit('databaseReady');
        callback();
      }
    }
  }

  start(objectStores) {
    objectStores = objectStores || [];
    let _this = this;
    return new Promise((resolve) => {
      this.start_idb(objectStores, function() {
        resolve(true);
      });
    });
  }

  useObjectStore(name, keyPath) {
    let props = {};
    if (keyPath) {
      props.keyPath = keyPath;
    }
    else {
      props.autoIncrement = true;
    }
    this.objectStores.set(name, props);
  }

  deleteObjectStore(name) {
    this.objectStores.delete(name);
  }

  createObjectStores() {
    // create any newly-defined object stores
    if (this.idb) {
      for (const [key, value] of this.objectStores.entries()) {
        if (!this.idb.objectStoreNames.contains(key)) {
          this.logMessage('object store created: ' + key);
          this.idb.createObjectStore(key, value);
          if (!this.stores[key]) this.stores[key] = new this.objectStore(key);
        }
      }
    }
  }

  open_database(version, callback) {
    if (!this.store) {
      return callback({error: 'Open Database Error: Store Name not defined'});
    }
    if (!callback) {
      callback = version;
      version = null;
    }
    let openRequest = indexedDB.open(this.store, version);
    let _this = this;
    openRequest.onsuccess = function (evt) {
      _this.idb = evt.target.result;
      _this.emit('databaseOpen', _this.idb);
      callback({db: _this.idb});
    };
    openRequest.onerror = function (evt) {
      callback({error: evt.target.errorCode});
    };
    openRequest.onupgradeneeded = function (evt) {
      _this.idb = evt.target.result;
      _this.createObjectStores();
    };
  }

  open(version) {
    let _this = this;
    return new Promise((resolve) => {
      this.open_database(version, function(obj) {
        resolve(obj);
      });
    });
  }

};

export {DPP};

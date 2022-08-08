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

7 August 2022 

 */

self.handler = async function(obj, finished) {

  //export async function handler(obj, finished) {

  let worker = this;
  let token;

  const objectStore = class {
    constructor(name, authMethods) {
      this.name = name;

      let authenticated = false;
      let auth;

      let isReady = false;

      if (authMethods) {
        auth = authMethods;
        authenticated = true;
      }
      else {
        isReady = true;
      }

      let os = this;

      this.isAuthenticated = function() {
        return authenticated;
      }

      this.setSignature = async function(token_input) {
        if (authenticated) {
          let obj = {
            id: ['signature'],
            value: auth.getHash(token)
          }
          await os.put(obj, undefined, token_input);
        }
      };

      this.isValidSignature = function(signature) {
        return signature === auth.getHash(token);
      };

      this.setReady = function(token_input) {
        if (token_input === token) {
          isReady = true;
        }
      };

      this.isReady = function(token_input) {
        if (token_input === token) {
          return isReady;
        }
        return false;
      };

      this.retrieve = async function(token_input) {
        if (token_input !== token) return {};
        let rawContents = [];
        await os.iterate(function(key, value) {
          rawContents.push({
            key: key,
            value: value
          });
        });

        let contents = [];
        if (authenticated && isReady) {
          for (let i = 0; i < rawContents.length; i++) {
            let record = rawContents[i];
            let value = record.value;
            if (record.key[0] !== 'signature') {
              value = await auth.decrypt(value);
              contents.push({
                key: record.key,
                value: value
              });
            }   
          }
        }
        else {
          contents = rawContents;
        }

        // now convert to object structure from flat indexedDB structure

        let ref = {};
        contents.forEach(function(record) {
          let key = record.key;
          let value = record.value;
          var o = ref;
          key.forEach(function(prop, index) {
            if (Array.isArray(prop)) {
              prop = +prop[0];
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
        return ref;
      };

      this.put_item = async function(key, value, callback) {

        // encrypt value.value if necessary

        if (authenticated && isReady) {
          value.value = await auth.encrypt(value.value);
        }

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
      };

    }

    getObjectStore(mode) {
      let transaction = worker.idb.db.transaction(this.name, mode);
      return transaction.objectStore(this.name);
    }

    isValidToken(token_input) {
      return token_input === token;
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
      let _this = this;
      request.onsuccess = function(evt) {
        let cursor = evt.target.result;
        if (cursor) {
          let value = cursor.value;
          let id = value.id;
          let val = value.value;

          if (!matchKey) {
            if (callback) callback(id, val);
            cursor.continue();
          }
          else {
            let keyString = id.toString() + ',';
            if (matchString !== '' && keyString.startsWith(matchString)) {
              if (callback) callback(id, val);
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

    async clearByKey(key, token_input) {
      if (token_input !== token) {
        return false;
      }
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

    count_items(callback) {
      if (!worker.idb.db) {
        return callback({error: 'count Error: Database has not been opened'});
      }
      let objectStore = this.getObjectStore('readonly');
      let request = objectStore.count();
      request.onsuccess = function() {
        callback(request.result);
      };

      request.onerror = function() {
        callback({error: request.error});
      };
    }

    count() {
      let _this = this;
      return new Promise((resolve) => {
        _this.count_items(function(obj) {
          resolve(obj);
        });
      });
    }

    put(key, value, token_input) {
      if (token_input !== token) {
        return false;
      }
      if (!value) {
        value = key;
        key = null;
      }
      let _this = this;
      return new Promise(async (resolve) => {
        await _this.put_item(key, value, function(obj) {
          resolve(obj);
        });
      });
    }

    get_item(key, callback) {
      if (!worker.idb.db) {
        return callback({error: 'get_item Error: Database has not been opened'});
      }
      let objectStore = this.getObjectStore('readonly');
      let request = objectStore.get(key);
       request.onsuccess = function() {
         callback(request.result);
       };
       request.onerror = function() {
         callback({error: request.error});
       };
    }

    get(key) {
      let _this = this;
      return new Promise((resolve) => {
        _this.get_item(key, function(obj) {
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

  // crypto functions

  async function hmac_sha256(string, secret) {
    const getUtf8Bytes = str =>
      new Uint8Array(
      [...unescape(encodeURIComponent(str))].map(c => c.charCodeAt(0))
    );

    const keyBytes = getUtf8Bytes(secret);
    const messageBytes = getUtf8Bytes(string);

    const cryptoKey = await crypto.subtle.importKey(
      'raw', 
      keyBytes, 
      { name: 'HMAC', hash: 'SHA-256' },
      true, 
      ['sign']
    );

    const sig = await crypto.subtle.sign('HMAC', cryptoKey, messageBytes);
    return btoa(String.fromCharCode(...new Uint8Array(sig)));
  }

  function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  async function sha256(value) {
    return await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(value)
    );
  }


  function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  function base64ToArrayBuffer(base64) {
    let binary_string =  atob(base64);
    let len = binary_string.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++)        {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async function getCryptoKey(value) {
    let hash = await sha256(value);
    return await crypto.subtle.importKey(
      'raw',
      hash,
      {name: 'AES-GCM'},
      false,
      ['encrypt', 'decrypt']
    )
  }

  async function encrypt(value, key, iv) {
    const encrypted = await crypto.subtle.encrypt(
      {
        iv,
        name: 'AES-GCM'
      },
      key,
      new TextEncoder().encode(value)
    );
    let b64 = arrayBufferToBase64(encrypted);
    return b64;
  }

  async function decrypt(input, key, iv) {
    let buffer = base64ToArrayBuffer(input);
    let decrypted = await crypto.subtle.decrypt(
      {
        iv,
        name: 'AES-GCM'
      },
      key,
      buffer
    );
    decrypted = new TextDecoder().decode(decrypted);
    return decrypted;
  }

  // end of crypto functions

  function createObjectStores(authMethods) {
    // create any newly-defined object stores
    if (worker.idb) {
      for (const [key, value] of worker.idb.objectStores.entries()) {
        if (!worker.idb.db.objectStoreNames.contains(key)) {
          worker.idb.db.createObjectStore(key, value);
          if (!worker.idb.stores[key]) worker.idb.stores[key] = new objectStore(key, authMethods);
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

  function open_database(version, authMethods, callback) {
    if (!worker.idb.store) {
      return callback({error: 'Open Database Error: Store Name not defined'});
    }
    if (!callback) {
      callback = version;
      version = null;
    }
    let openRequest = indexedDB.open(worker.idb.store, version);
    //let openRequest = indexedDB.open(worker.idb.store);
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
      createObjectStores(authMethods);
    };
  }

  async function open(version, authMethods) {
    return new Promise((resolve) => {
      open_database(version, authMethods, function(obj) {
        resolve(obj);
      });
    });
  }

  // end of functions *****

  if (!worker.idb) {
    worker.idb = {
      objectStores: new Map(),
      stores: {},
      store: obj.idb_name
    }
  }

  let authMethods;
  token = uuidv4();

  if (obj.qoper8 && obj.qoper8.auth) {
    let auth = obj.qoper8.auth;
    if (!auth.username || auth.username === '') {
      return finished({
        error: 'Authentication credentials are missing'
      });
    }
    if (!auth.password || auth.password === '') {
      return finished({
        error: 'Authentication credentials are missing'
      });
    }
    let hash = await hmac_sha256(auth.username, auth.password);
    let pw_key = await getCryptoKey(auth.username + ':' + auth.password);

    authMethods = {
      getHash: function(token_input) {
        if (token_input === token) return hash;
        return false;
      },
      encrypt: async function(input) {
        let iv = crypto.getRandomValues(new Uint8Array(12));
        let encrypted = await encrypt(input, pw_key, iv);
        return {
          encrypt: encrypted,
          iv: iv
        };
      },
      decrypt: async function(encrypted) {
        return await decrypt(encrypted.encrypt, pw_key, encrypted.iv);
      }
    };

  }

  let objectStores = obj.objectStores || [];

  for (const name of objectStores) {
    useObjectStore(name, 'id');
  }

  await open(undefined, authMethods);
  let upgradeNeeded = false;

  for (const name of worker.idb.objectStores.keys()) {
    if (!worker.idb.db.objectStoreNames.contains(name)) upgradeNeeded = true;
    worker.idb.stores[name] = new objectStore(name, authMethods);
  }

  if (upgradeNeeded) {
    // re-open database as new version and add the new object stores
    let newVersion = worker.idb.db.version + 1;
    worker.idb.db.close();
    await open(newVersion, authMethods);
    worker.emit('databaseReady');
    finished({
      db_ready: true,
      qoper8: {
        token: token
      }
    });

  }
  else {
    this.emit('databaseReady');

    finished({
      db_ready: true,
      qoper8: {
        token: token
      }
    });
  }

};

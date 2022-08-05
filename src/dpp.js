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

5 August 2022 

 */

  // For source of these handler scripts, see the /idb_handlers folder

let handlerCode = new Map([
  ['instantiate', `
self.handler=async function(e,t){let r=this;const o=class{constructor(e){this.name=e}getObjectStore(e){return r.idb.db.transaction(this.name,e).objectStore(this.name)}iterate_db(e,t,r){let o;t||"function"!=typeof e||(t=e,e=null);let n="";e&&(o=IDBKeyRange.lowerBound(e),n=e.toString()+","),this.getObjectStore().openCursor(o).onsuccess=function(o){let i=o.target.result;if(i){let o=i.value;if(e){let e=o.id.toString()+",";""!==n&&e.startsWith(n)?(t&&t(o.id,o.value),i.continue()):r&&"function"==typeof r&&r()}else t&&t(o.id,o.value),i.continue()}else r&&"function"==typeof r&&r()}}iterate(e,t){t||"function"!=typeof e||(t=e,e=null);let r=this;return new Promise(o=>{r.iterate_db(e,t,function(){o()})})}async clearByKey(e){let t=this;await this.iterate(e,async function(e){await t.delete(e)})}clear_db(e){if(!_worker.idb.db)return e({error:"clear() Error: Database has not been opened"});let t=this.getObjectStore("readwrite").clear();t.onsuccess=function(){e({ok:!0})},t.onerror=function(){e({error:t.error})}}clear(){let e=this;return new Promise(t=>{e.clear_db(function(e){t(e)})})}put_item(e,t,o){if(!r.idb.db)return o({error:"addItem Error: Database has not been opened"});o||(o=t,t=e,e=null);let n=this.getObjectStore("readwrite").put(t);n.onsuccess=function(){r.emit("putCommitted",t),o({key:n.result})},n.onerror=function(){o({error:n.error})}}put(e,t){t||(t=e,e=null);let r=this;return new Promise(o=>{r.put_item(e,t,function(e){o(e)})})}delete_item(e,t){if(!r.idb.db)return t({error:"delete_item Error: Database has not been opened"});let o=this.getObjectStore("readwrite").delete(e);o.onsuccess=function(){r.emit("deleteCommitted",e),t({ok:!0})},o.onerror=function(){t({error:o.error})}}delete(e){let t=this;return new Promise(r=>{t.delete_item(e,function(e){r(e)})})}};function n(e,t){let o={};t?o.keyPath=t:o.autoIncrement=!0,r.idb.objectStores.set(e,o)}function i(e,t){if(!r.idb.store)return t({error:"Open Database Error: Store Name not defined"});t||(t=e,e=null);let n=indexedDB.open(r.idb.store,e);n.onsuccess=function(e){r.idb.db=e.target.result,r.emit("databaseOpen",r.idb.db),t({db:r.idb.db})},n.onerror=function(e){t({error:e.target.errorCode})},n.onupgradeneeded=function(e){r.idb.db=e.target.result,function(){if(r.idb)for(const[e,t]of r.idb.objectStores.entries())r.idb.db.objectStoreNames.contains(e)||(r.idb.db.createObjectStore(e,t),r.idb.stores[e]||(r.idb.stores[e]=new o(e)))}()}}async function s(e){return new Promise(t=>{i(e,function(e){t(e)})})}r.idb||(this.idb={objectStores:new Map,stores:{},store:e.idb_name});let d=e.objectStores||[];for(const e of d)n(e,"id");await s();let a=!1;for(const e of r.idb.objectStores.keys())r.idb.db.objectStoreNames.contains(e)||(a=!0),r.idb.stores[e]=new o(e);if(a){let e=r.idb.db.version+1;r.idb.db.close(),await s(e),r.emit("databaseReady"),t({db_ready:!0})}else this.emit("databaseReady"),t({db_ready:!0})};
  `],
  ['restore', `
self.handler=async function(e,t){let a={},i=this;if(i.idb&&i.idb.db){let r=e.storeName;i.idb.storeName=e.storeName,e.clear?await i.idb.stores[r].iterate(async function(e,t){console.log("deleting "+e),await i.idb.stores[r].clearByKey(e)}):await i.idb.stores[r].iterate(function(e,t){var i=a;let r;e.forEach(function(a,s){let o=!1;if(Array.isArray(a)&&(o=!0,a=+a[0]),0===s&&(r=a),s===e.length-1)i[a]=t;else{let t=e[s+1];Array.isArray(t)?void 0===i[a]&&(i[a]=[]):void 0===i[a]&&(i[a]={}),i=i[a]}})}),t({obj:a})}else t({error:"Database not instantiated"})};
  `],
  ['put', `
self.handler=async function(e,a){let t=this;if(t.idb&&t.idb.db){let i=e.key,l=e.value,s=t.idb.stores[t.idb.storeName];await s.clearByKey(i);let d={id:i,value:l};await s.put(d),a({ok:!0})}else a({error:"Database not instantiated"})};
  `],
  ['delete', `
self.handler=async function(e,t){let a=this;if(a.idb&&a.idb.db){let i=e.key,s=a.idb.stores[a.idb.storeName];await s.clearByKey(i),t({ok:!0})}else t({error:"Database not instantiated"})};
  `]
]);


let DPP = class {
  constructor(options) {
    let logging = options.logging || false;
    let QOper8 = options.QOper8;
    let qOptions = options.qOptions || {};
    let idb_name = options.idb_name || 'DPP';
    let storeName = options.storeName || 'DPP_Store';

    this.name = 'DPP-Q';
    this.build = '2.4';
    this.buildDate = '5 August 2022';
    this.listeners = new Map();
    this.logging = logging || false;
    this.storeName = storeName;
    this.idb_name = idb_name;

    this.QOper8 = new QOper8({
      poolSize: 1,
      logging: qOptions.logging,
      workerInactivityCheckInterval: qOptions.workerInactivityCheckInterval || 60,
      workerInactivityLimit: qOptions.workerInactivityLimit || 60
    });

    let handlersByMessageType = new Map();
    for (const [key, value] of handlerCode) {
      handlersByMessageType.set(key, this.QOper8.createUrl(value));
    }
    this.QOper8.handlersByMessageType = handlersByMessageType;
    let dpp = this;

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
            //return false;
            return true;
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
    };

    this.persistAs = class {
      constructor() {
        this.storeName = dpp.storeName;
        this.persist = true;
      }

      async proxy(mode) {

        let self = this;
        let storeName = this.storeName;
        let p = new dpp.deepProxy({}, {

          async set(target, prop, value, receiver) {

            if (!self.persist) return;
            dpp.logMessage('proxy set called with prop = ' + JSON.stringify(prop));

            let o = self.receiver;
            let isArr = false;
            prop.forEach(function(p, index) {
              o = o[p];
              if (isArr) prop[index] = [p];
              isArr = Array.isArray(o);
            });

            function save(key, value) {

              if (key.length === 1) target[prop] = value;
              dpp.emit('save', value);
              let obj = {
                type: 'put',
                key: key,
                value: value
              };
              dpp.QOper8.message(obj);
            }

            async function getProps(parentProp, obj) {

              dpp.logMessage('getProps called for ' + JSON.stringify(parentProp));
              dpp.logMessage('obj=' + JSON.stringify(obj));

              // clear down any existing indexeddb records that might exist with this set of keys

              let msg = {
                type: 'delete',
                key: parentProp
              }
              dpp.QOper8.message(msg);

              let isArr = Array.isArray(obj);
              for (let [key, value] of Object.entries(obj)) {
                if (isArr) key = [key];
                let opath = parentProp.slice();
                opath.push(key);
                if (typeof value !== 'object') {
                  save(opath, value);
                }
                else {
                  getProps(opath, value);
                }
              }
            }

            if (typeof value === 'object') {
              getProps(prop, value);
            }
            if (['string', 'number', 'boolean', 'symbol', 'bigint'].includes(typeof value)) {
              save(prop, value);
            }      

            dpp.emit('proxy_set_completed', prop);
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
            dpp.emit('delete', path);
            let msg = {
              type: 'delete',
              key: path
            }
            dpp.QOper8.message(msg);
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
        let msg = {
          type: 'restore',
          storeName: this.storeName,
          clear: true
        };
        dpp.QOper8.message(msg);
      }

      async restore() {
        let obj = {
          type: 'restore',
          storeName: this.storeName
        };
        let ref = await dpp.QOper8.send(obj);

        // avoid writing back to database during restore of proxy object
        this.persist = false;
        for (let prop in ref.obj) {
          this.receiver[prop] = ref.obj[prop];
        }
        this.persist = true;
      
      }
    };
  }

  async start(mode) {
    if (typeof mode === 'object') {
      if (mode.storeName) this.storeName = mode.storeName;
      if (mode.idb_name) this.idb_name = mode.idb_name;
      mode = mode.mode;
    }
    let msg = {
      type: 'instantiate',
      idb_name: this.idb_name,
      objectStores: [this.storeName]
    };
    this.QOper8.message(msg);
    return await new this.persistAs().proxy(mode);
  }

  isEmpty(obj) {
    for (const name in obj) {
      return false;
    }
    return true;
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


};

export {DPP};
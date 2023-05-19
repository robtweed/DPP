/*
 ----------------------------------------------------------------------------
 | DPP: Deep Persistent Proxy Objects for JavaScript                         |
 |                                                                           |
 | Copyright (c) 2023 MGateway Ltd,                                          |
 | Banstead, Surrey UK.                                                      |
 | All rights reserved.                                                      |
 |                                                                           |
 | https://www.mgateway.com                                                  |
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

24 August 2022 

 */

  // For source of these handler scripts, see the /idb_handlers folder

let handlerCode = new Map([

  ['instantiate', `self.handler=async function(e,t){let r,n=this;const o=class{constructor(e,t){this.name=e;let o,i=!1,s=!1;t?(o=t,i=!0):s=!0;let a=this;this.isAuthenticated=function(){return i},this.setSignature=async function(e){if(i){let t={id:["signature"],value:o.getHash(r)};await a.put(t,void 0,e)}},this.isValidSignature=function(e){return e===o.getHash(r)},this.setReady=function(e){e===r&&(s=!0)},this.isReady=function(e){return e===r&&s},this.retrieve=async function(e){if(e!==r)return{};let t=[];await a.iterate(function(e,r){t.push({key:e,value:r})});let n=[];if(i&&s)for(let e=0;e<t.length;e++){let r=t[e],i=r.value;"signature"!==r.key[0]&&(i=await o.decrypt(i),n.push({key:r.key,value:i}))}else n=t;let c={};return n.forEach(function(e){let t=e.key,r=e.value;var n=c;t.forEach(function(e,o){if(Array.isArray(e)&&(e=+e[0]),o===t.length-1)n[e]=r;else{let r=t[o+1];Array.isArray(r)?void 0===n[e]&&(n[e]=[]):void 0===n[e]&&(n[e]={}),n=n[e]}})}),c},this.put_item=async function(e,t,r){if(i&&s&&(t.value=await o.encrypt(t.value)),!self.idb.db)return r({error:"addItem Error: Database has not been opened"});r||(r=t,t=e,e=null);let a=this.getObjectStore("readwrite").put(t);a.onsuccess=function(){n.emit("putCommitted",t),r({key:a.result})},a.onerror=function(){r({error:a.error})}}}getObjectStore(e){return self.idb.db.transaction(this.name,e).objectStore(this.name)}isValidToken(e){return e===r}iterate_db(e,t,r){let n;t||"function"!=typeof e||(t=e,e=null);let o="";e&&(n=IDBKeyRange.lowerBound(e),o=e.toString()+",");this.getObjectStore().openCursor(n).onsuccess=function(n){let i=n.target.result;if(i){let n=i.value,s=n.id,a=n.value;if(e){let e=s.toString()+",";""!==o&&e.startsWith(o)?(t&&t(s,a),i.continue()):r&&"function"==typeof r&&r()}else t&&t(s,a),i.continue()}else r&&"function"==typeof r&&r()}}iterate(e,t){t||"function"!=typeof e||(t=e,e=null);let r=this;return new Promise(n=>{r.iterate_db(e,t,function(){n()})})}async clearByKey(e,t){if(t!==r)return!1;let n=this;await this.iterate(e,async function(e){await n.delete(e)})}clear_db(e){if(!self.idb.db)return e({error:"clear() Error: Database has not been opened"});let t=this.getObjectStore("readwrite").clear();t.onsuccess=function(){e({ok:!0})},t.onerror=function(){e({error:t.error})}}clear(){let e=this;return new Promise(t=>{e.clear_db(function(e){t(e)})})}count_items(e){if(!self.idb.db)return e({error:"count Error: Database has not been opened"});let t=this.getObjectStore("readonly").count();t.onsuccess=function(){e(t.result)},t.onerror=function(){e({error:t.error})}}count(){let e=this;return new Promise(t=>{e.count_items(function(e){t(e)})})}put(e,t,n){if(n!==r)return!1;t||(t=e,e=null);let o=this;return new Promise(async r=>{await o.put_item(e,t,function(e){r(e)})})}get_item(e,t){if(!self.idb.db)return t({error:"get_item Error: Database has not been opened"});let r=this.getObjectStore("readonly").get(e);r.onsuccess=function(){t(r.result)},r.onerror=function(){t({error:r.error})}}get(e){let t=this;return new Promise(r=>{t.get_item(e,function(e){r(e)})})}delete_item(e,t){if(!self.idb.db)return t({error:"delete_item Error: Database has not been opened"});let r=this.getObjectStore("readwrite").delete(e);r.onsuccess=function(){n.emit("deleteCommitted",e),t({ok:!0})},r.onerror=function(){t({error:r.error})}}delete(e){let t=this;return new Promise(r=>{t.delete_item(e,function(e){r(e)})})}};async function i(e,t,r){const n=await crypto.subtle.encrypt({iv:r,name:"AES-GCM"},t,(new TextEncoder).encode(e));var o;return o=n,btoa(String.fromCharCode(...new Uint8Array(o)))}async function s(e,t,r){let n=function(e){let t=atob(e),r=t.length,n=new Uint8Array(r);for(let e=0;e<r;e++)n[e]=t.charCodeAt(e);return n.buffer}(e),o=await crypto.subtle.decrypt({iv:r,name:"AES-GCM"},t,n);return o=(new TextDecoder).decode(o)}function a(e,t){let r={};t?r.keyPath=t:r.autoIncrement=!0,self.idb.objectStores.set(e,r)}function c(e,t,r){if(!self.idb.store)return r({error:"Open Database Error: Store Name not defined"});r||(r=e,e=null);let i=indexedDB.open(self.idb.store,e);i.onsuccess=function(e){self.idb.db=e.target.result,n.emit("databaseOpen",self.idb.db),r({db:self.idb.db})},i.onerror=function(e){r({error:e.target.errorCode})},i.onupgradeneeded=function(e){self.idb.db=e.target.result,function(e){if(self.idb)for(const[t,r]of self.idb.objectStores.entries())self.idb.db.objectStoreNames.contains(t)||(self.idb.db.createObjectStore(t,r),self.idb.stores[t]||(self.idb.stores[t]=new o(t,e)))}(t)}}async function u(e,t){return new Promise(r=>{c(e,t,function(e){r(e)})})}let l;if(self.idb||(self.idb={objectStores:new Map,stores:{},store:e.idb_name}),r=([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,e=>(e^crypto.getRandomValues(new Uint8Array(1))[0]&15>>e/4).toString(16)),e.qoper8&&e.qoper8.auth){let n=e.qoper8.auth;if(!n.username||""===n.username)return t({error:"Authentication credentials are missing"});if(!n.password||""===n.password)return t({error:"Authentication credentials are missing"});let o=await async function(e,t){const r=e=>new Uint8Array([...unescape(encodeURIComponent(e))].map(e=>e.charCodeAt(0))),n=r(t),o=r(e),i=await crypto.subtle.importKey("raw",n,{name:"HMAC",hash:"SHA-256"},!0,["sign"]),s=await crypto.subtle.sign("HMAC",i,o);return btoa(String.fromCharCode(...new Uint8Array(s)))}(n.username,n.password),a=await async function(e){let t=await async function(e){return await crypto.subtle.digest("SHA-256",(new TextEncoder).encode(e))}(e);return await crypto.subtle.importKey("raw",t,{name:"AES-GCM"},!1,["encrypt","decrypt"])}(n.username+":"+n.password);l={getHash:function(e){return e===r&&o},encrypt:async function(e){let t=crypto.getRandomValues(new Uint8Array(12));return{encrypt:await i(e,a,t),iv:t}},decrypt:async function(e){return await s(e.encrypt,a,e.iv)}}}let d=e.objectStores||[];for(const e of d)a(e,"id");await u(void 0,l);let f=!1;for(const e of self.idb.objectStores.keys())self.idb.db.objectStoreNames.contains(e)||(f=!0),self.idb.stores[e]=new o(e,l);if(f){let e=self.idb.db.version+1;self.idb.db.close(),await u(e,l),n.emit("databaseReady"),t({db_ready:!0,qoper8:{token:r}})}else this.emit("databaseReady"),t({db_ready:!0,qoper8:{token:r}})};`],

  ['restore', `self.handler=async function(e,t){let a="";e.qoper8&&e.qoper8.token&&(a=e.qoper8.token);if(self.idb&&self.idb.db){let i=e.storeName;self.idb.storeName=e.storeName;let r=self.idb.stores[i];if(!r.isValidToken(a))return t({error:"Invalid access attempt"});let s={};if(e.clear)await r.iterate(async function(e,t){await r.clearByKey(e,a)});else{if(0===await r.count()&&r.isAuthenticated())await r.setSignature(a),r.setReady(a);else{if(r.isAuthenticated()){let e=await r.get(["signature"]);if(!e)return t({error:"The requested store is not encrypted, but you have supplied authentication credentials"});if(!r.isValidSignature(e.value))return t({error:"Invalid authentication credentials for specified store"});r.setReady(a)}delete(s=await r.retrieve(a)).signature}}t({obj:s})}else t({error:"Database not instantiated"})};`],

  ['put', `self.handler=async function(e,a){let t="";e.qoper8&&e.qoper8.token&&(t=e.qoper8.token);if(self.idb&&self.idb.db){let i=e.key,r=e.value,s=self.idb.stores[self.idb.storeName];if(!s.isValidToken(t))return a({error:"Invalid access attempt"});if(!s.isReady(t))return a({error:"Database not initialised for access"});await s.clearByKey(i,t);let o={id:i,value:r};await s.put(o,void 0,t),a({ok:!0})}else a({error:"Database not instantiated"})};`],

  ['delete', `self.handler=async function(e,t){let a="";e.qoper8&&e.qoper8.token&&(a=e.qoper8.token);if(self.idb&&self.idb.db){let r=e.key,s=self.idb.stores[self.idb.storeName];if(!s.isValidToken(a))return t({error:"Invalid access attempt"});await s.clearByKey(r,a),t({ok:!0})}else t({error:"Database not instantiated"})};`]

]);

// ********************* DPP ******************


let DPP = class {
  constructor(options) {
    let logging = options.logging || false;
    let QOper8 = options.QOper8;
    let qOptions = options.qOptions || {};
    let idb_name = options.idb_name || 'DPP';
    let storeName = options.storeName || 'DPP_Store';

    this.name = 'DPP-DB';
    this.build = '2.6';
    this.buildDate = '24 August 2022';
    this.listeners = new Map();
    this.logging = logging || false;

    let sendMessage = function() {return false;};

    let qoper8 = new QOper8({
      poolSize: 1,
      logging: qOptions.logging,
      workerInactivityCheckInterval: qOptions.workerInactivityCheckInterval || 60,
      workerInactivityLimit: qOptions.workerInactivityLimit || 60
    });

    let handlersByMessageType = new Map();
    for (const [key, value] of handlerCode) {
      handlersByMessageType.set(key, qoper8.createUrl(value));
    }
    qoper8.handlersByMessageType = handlersByMessageType;
    let dpp = this;

    this.start = async function(mode) {
      let auth;
      if (typeof mode === 'object') {
        if (mode.storeName) dpp.storeName = mode.storeName;
        if (mode.idb_name) dpp.idb_name = mode.idb_name;
        if (mode.auth) auth = mode.auth;
        mode = mode.mode;
      }

      if (auth && typeof crypto.subtle === 'undefined') {
        let err = 'Error: authenticated database access requires https:'
        dpp.logMessage(err);
        return {
          error: err
        };
      }

      let msg = {
        type: 'instantiate',
        idb_name: idb_name,
        objectStores: [storeName],
        qoper8: {
          auth: auth
        }
      };

      let res = await qoper8.send(msg);
      sendMessage = function(msg, callback) {
        if (!msg.qoper8) msg.qoper8 = {};
        msg.qoper8.token = res.qoper8.token;
        qoper8.message(msg, callback);
      };

      return await new dpp.persistAs().proxy(mode);
    }


    let deepProxy = class {
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
        this.storeName = storeName;
        this.persist = true;
      }

      async proxy(mode) {

        let self = this;
        let storeName = this.storeName;
        let p = new deepProxy({}, {

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
              sendMessage(obj);
            }

            async function getProps(parentProp, obj) {

              dpp.logMessage('getProps called for ' + JSON.stringify(parentProp));
              dpp.logMessage('obj=' + JSON.stringify(obj));

              // clear down any existing indexeddb records that might exist with this set of keys

              let msg = {
                type: 'delete',
                key: parentProp
              }
              sendMessage(msg);

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
            sendMessage(msg);
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
        sendMessage(msg);
      }

      async restore() {

        function send(msg) {
          return new Promise((resolve) => {
            sendMessage(msg, function(res) {
              resolve(res);
            });
          });
        }

        let obj = {
          type: 'restore',
          storeName: this.storeName
        };
        let ref = await send(obj);

        if (ref.error) {
          this.persist = false;
          this.receiver.error = ref.error;
          this.persist = true;
          return;
        }

        // avoid writing back to database during restore of proxy object
        this.persist = false;
        for (let prop in ref.obj) {
          this.receiver[prop] = ref.obj[prop];
        }
        this.persist = true;
      
      }
    };
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
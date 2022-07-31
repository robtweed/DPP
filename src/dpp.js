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

31 July 2022

 */

let DPP = class {
  constructor(options) {
    let logging = options.logging || false;
    let QOper8 = options.QOper8;
    let qOptions = options.qOptions || {};
    let idb_name = options.idb_name || 'DPP';
    let storeName = options.storeName || 'DPP_Store';

    this.name = 'DPP-Q';
    this.build = '2.1';
    this.buildDate = '31 July 2022';
    this.listeners = new Map();
    this.logging = logging || false;
    this.storeName = storeName;
    this.idb_name = idb_name;

    let qHandlerPath = qOptions.handlerPath || 'https://robtweed.github.io/DPP/src/idb_handlers/';
    if (qHandlerPath.charAt(qHandlerPath.length - 1) !== '/') qHandlerPath = qHandlerPath + '/';
    let qWorkerPath = qOptions.workerLoaderPath || 'https://robtweed.github.io/QOper8/src/';
    if (qWorkerPath.charAt(qWorkerPath.length - 1) !== '/') qWorkerPath = qWorkerPath + '/';

    this.QOper8 = new QOper8({
      poolSize: 1,
      workerLoaderUrl: qWorkerPath + 'QOper8Worker.min.js',
      logging: qOptions.logging,
      handlersByMessageType: new Map([
        ['instantiate', qHandlerPath + 'instantiate.min.js'],
        ['restore', qHandlerPath + 'restore.min.js'],
        ['put', qHandlerPath + 'put.min.js'],
        ['delete', qHandlerPath + 'delete.min.js']
      ]),
      workerInactivityCheckInterval: qOptions.workerInactivityCheckInterval || 60,
      workerInactivityLimit: qOptions.workerInactivityLimit || 60
    });

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
        await this.store.clear();
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

  static async create(options) {
    if (!options.QOper8) {
      let {QOper8} = await import('https://robtweed.github.io/QOper8/src/QOper8.min.js');
      options.QOper8 = QOper8;
    }
    let dpp = new DPP(options);
    return dpp;
  }

  async start(mode) {
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
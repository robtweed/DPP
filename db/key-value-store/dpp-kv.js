/*
 ----------------------------------------------------------------------------
 | DPP KV: Key/Value Store Implemented using DPP                             |
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

1 August 2022

 */

let KV = class {
  constructor() {
    this.listeners = new Map();
    this.transforms = {
      toLowerCase: function(input) {
        return input.toLowerCase();
      },
      toString: function(input) {
        return input.toString();
      },
      toInteger: function(input) {
        return parseInt(input);
      },
      removePunctuation: function(str) {
        return str.replace(/[^\w\s\']|_/g, "").replace(/\s+/g, " ");
      }
    };
  }

  static async start(options) {

    let index = options.index;
    let logging = options.logging || false;
    let idb_name = options.idb_name;
    let storeName = options.storeName;
    let QOper8 = options.QOper8;
    let qOptions = options.qOptions;

    if (index && !index.transforms && !index.props) index = false;

    if (index) {
      if (index.transforms) {
        if (!Array.isArray(index.transforms)) index.transforms = [index.transforms];
      }
      if (index.props) {
        if (!Array.isArray(index.props)) index.props = [index.props];
      }
    }

    if (!options.DPP) {
      let {DPP} = await import('https://robtweed.github.io/DPP/src/dpp.min.js');
      options.DPP = DPP;
    }

    const obj = new KV();
    let dpp = await options.DPP.create({
      idb_name: idb_name,
      storeName: storeName,
      logging: logging,
      QOper8: QOper8,
      qOptions: qOptions
    });

    obj.DPP = dpp;
    obj.store = await dpp.start();

    // initialisation logic if this is a new persistent object

    if (!obj.store.data) {
      obj.store.data = {};
      if (index) {
        obj.store.indexing = index;
      }
    }
    else {
      // if indexing has changed since the last time, re-index the key/value store
      let newIndexing = JSON.stringify(index) || "false";
      let oldIndexing = JSON.stringify(obj.store.indexing) || "false";
      if (newIndexing !== oldIndexing) {
        if (!index) {
          delete obj.store.index;
          delete obj.store.indexing;
        }
        else {
          obj.store.indexing = index;
          if (!index) delete obj.store.indexing;
          obj.reIndex();
        }
      }
    }

    obj.storeName = storeName;
    return obj;
  }

  getIndexKey(value) {
    if (this.store.indexing) {
      if (typeof value === 'object') {
        if (this.store.indexing.props) {
          let results = [];
          for (const name in value) {
            if (this.store.indexing.props.includes(name)) {
              let val = this.getIndexKey(value[name]);
              if (val) {
                results.push({
                  prop: name,
                  value: val
                });
              }
            }
          }
          if (results.length === 0) return false;
          return results;
        }
        return false;
      }
      else {
        if (this.store.indexing.transforms) {
          for (const name of this.store.indexing.transforms) {
            if (this.transforms[name]) {
              value = this.transforms[name](value);
            }
          }
        }
      }
      return value;
    }
    return false;
  }

  addIndex(indexKey, key, propName, callback) {

    if (!this.store.index) this.store.index = {};

    if (typeof this.store.index[indexKey] === 'undefined') {
      this.store.index[indexKey] = {};
    }
    if (propName) {
      let obj = {};
      obj[propName] = true;
      this.store.index[indexKey][key] = obj;
    }
    else {
      this.store.index[indexKey][key] = true;
    }
  }

  set(key, value, callback) {

    this.store.data[key] = value;

    let indexKey = this.getIndexKey(value);
    if (indexKey) {
      if (Array.isArray(indexKey)) {
        for (const obj of indexKey) {
         this.addIndex(obj.value, key, obj.prop);
        }
      }
      else {
        this.addIndex(indexKey, key, null);
      }
    }
  }

  get(key) {
    return this.store.data[key];
  }
  getByIndex(value, returnData) {
    let results = [];
    let indexKey = this.getIndexKey(value);
    if (indexKey) {
      for (const key in this.store.index[indexKey]) {
        if (returnData) {
          let obj = {
            key: key,
            data: this.get(key)
          }
          results.push(obj);
        }
        else {
          results.push(key);
        }
      }
    }
    return results;
  }

  search(value, returnData) {
    let results = [];
    let searchKey = this.getIndexKey(value);
    if (searchKey) {
      for (const indexKey in this.store.index) {
        if (indexKey.includes(searchKey)) {
          let res = this.getByIndex(indexKey, returnData);
          results = results.concat(res);
        }
      }
    }
    return results;
  }

  has(key) {
    return typeof this.store.data[key] !== 'undefined';
  }


  deleteIndex(indexKey, key, propName, callback) {
    if (propName) {
      delete this.store.index[indexKey][key][propName];
      if (this.DPP.isEmpty(this.store.index[indexKey][key])) {
        delete this.store.index[indexKey][key];
      }
    }
    else {
      delete this.store.index[indexKey][key];
    }
    if (this.DPP.isEmpty(this.store.index[indexKey])) {
      delete this.store.index[indexKey];
    }
  }

  delete(key, callback) {
    if (this.has(key)) {
      let indexKey = this.getIndexKey(this.get(key));
      if (indexKey) {
        if (Array.isArray(indexKey)) {
          for (const obj of indexKey) {
            this.deleteIndex(obj.value, key, obj.prop);
          }
        }
        else {
          this.deleteIndex(indexKey, key, null);
        }
      }
      delete this.store.data[key];
    }
  }

  reIndex() {
    delete this.store.index;
    for (const key in this.store.data) {
      let value = this.get(key);
       this.set(key, value);
    }
  }

  get hasKeys() {
    for (const key in this.store.data) {
      return true;
    }
    return false;
  }

  get isEmpty() {
    return !this.hasKeys;
  }

  clear() {
    for (const key in this.store.data) {
      this.delete(key);
    }
  }

  dump() {
    return JSON.stringify(this.store, null, 2);
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
}
export {KV};
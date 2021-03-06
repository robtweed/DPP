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

31 July 2022

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
    let DPP = options.DPP;
    let idb_name = options.idb_name || 'DPP';
    let storeName = options.storeName;
    let QOper8 = options.QOper8;
    let qOptions = options.qOptions;

    if (index && index.transforms) {
      if (!Array.isArray(index.transforms)) index.transforms = [index.transforms];
    }

    const obj = new KV();
    let dpp = new DPP({
      storeName: storeName,
      logging: logging,
      QOper8: QOper8,
      qOptions: qOptions
    });

    obj.DPP = dpp;
    dpp.start(storeName);
    obj.store = await new dpp.persistAs(storeName).proxy();

    // initialisation logic if this is a new persistent object

    if (!obj.store.data) {
      obj.store.data = {};
      if (index) {
        obj.store.indexing = index;
        obj.store.index = {};
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
              results.push({
                prop: name,
                value: val
              });
            }
          }
          return results;
        }
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
  }

  addIndex(indexKey, key, propName, callback) {

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
    }
    else {
      delete this.store.index[indexKey][key];
    }
  }

  async delete(key, callback) {
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
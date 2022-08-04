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

QOper8 WebWorker for DPP: Restore the object from IndexDB, if it exists

3 August 2022

 */

self.handler = async function (obj, finished) {

  let ref = {};
  let worker = this;

  if (worker.idb && worker.idb.db) {

    let storeName = obj.storeName;
    worker.idb.storeName = obj.storeName;

    if (obj.clear) {
      await worker.idb.stores[storeName].iterate(async function(key, value) {
        await worker.idb.stores[storeName].clearByKey(key);
      });
    }
    else {
      await worker.idb.stores[storeName].iterate(function(key, value) {
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
    }
    finished({
      obj: ref
    });
  }
  else {
    finished({
     error: 'Database not instantiated'
    });
  }

};
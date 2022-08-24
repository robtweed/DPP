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

24 August 2022

 */

self.handler = async function (obj, finished) {

  let token_input = '';
  if (obj.qoper8 && obj.qoper8.token) token_input = obj.qoper8.token;

  function isEmpty(obj) {
    for (const name in obj) {
      return false;
    }
    return true;
  }

  let worker = this;

  if (self.idb && self.idb.db) {

    let storeName = obj.storeName;
    self.idb.storeName = obj.storeName;
    let store = self.idb.stores[storeName];

    if (!store.isValidToken(token_input)) {
      return finished({
        error: 'Invalid access attempt'
      });
    }

    let ref = {};

    if (obj.clear) {
      await store.iterate(async function(key, value) {
        await store.clearByKey(key, token_input);
      });
    }
    else {
      let count = await store.count();
      if (count === 0 && store.isAuthenticated()) {
        await store.setSignature(token_input);
        store.setReady(token_input);
      }
      else {

        // existing database - if we're coming in authenticated,
        // see if we can get the authenticatedOwner record
        //  if not, or if its value is different, return an error!
        if (store.isAuthenticated()) {
          let signature = await store.get(['signature']);
          if (!signature) {
            return finished({
              error: 'The requested store is not encrypted, but you have supplied authentication credentials'
            });
          }
          if (!store.isValidSignature(signature.value)) {
            return finished({
              error: 'Invalid authentication credentials for specified store'
            });
          }
          store.setReady(token_input);
        }
        ref = await store.retrieve(token_input);
        delete ref.signature;
      }
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

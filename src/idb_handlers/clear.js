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
QOper8 WebWorker for DPP: Clear down IndexDB Database store

7 November 2023

 */

self.handler = async function(obj, finished) {

  let token_input = '';
  if (obj.qoper8 && obj.qoper8.token) token_input = obj.qoper8.token;

  let ref = {};
  let worker = this;

  if (self.idb && self.idb.db) {
    let key = obj.key;
    let store = self.idb.stores[self.idb.storeName]

    if (!store.isValidToken(token_input)) {
      return finished({
        error: 'Invalid access attempt'
      });
    }

    await store.clear();      

    finished({
     ok: true
    });
  }
  else {
    finished({
     error: 'Database not instantiated'
    });
  }

};

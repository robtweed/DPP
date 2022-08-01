/*
 ----------------------------------------------------------------------------
 | DPP List: Redis-Like List Store Implemented using DPP                     |
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

let LIST = class {
  constructor() {
    this.listeners = new Map();
  }

  static async start(options) {
    let logging = options.logging || false;
    let idb_name = options.idb_name;
    let storeName = options.storeName;
    let QOper8 = options.QOper8;
    let qOptions = options.qOptions;

    if (!options.DPP) {
      let {DPP} = await import('https://robtweed.github.io/DPP/src/dpp.min.js');
      options.DPP = DPP;
    }

    const obj = new LIST();
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

    if (dpp.isEmpty(obj.store)) {
      obj.store.nextNodeNo = 0;
      obj.store.count = 0;
      obj.store.node = {};
    }

    obj.storeName = storeName;
    return obj;
  }

  rpush(obj) {
    let list = this.store;
    let isNew = (list.count === 0);
    let ix = list.nextNodeNo + 1;
    list.nextNodeNo = ix;
    list.count++;
    if (!list.node) list.node = {};
    list.node[ix] = {};
    list.node[ix].content = obj;

    if (isNew) {
      list.firstNode = ix;
      list.lastNode = ix;
    }
    else {
      let previousLast = list.lastNode;
      list.lastNode = ix;
      list.node[ix].previousNode = previousLast;
      list.node[previousLast].nextNode = ix;
    }
    return ix;
  }

  lpush(obj) {
    let list = this.store;
    let isNew = (list.count === 0);
    let ix = list.nextNodeNo + 1;
    list.nextNodeNo = ix;
    list.count++;
    if (!list.node) this.store.node = {};
    list.node[ix] = {};
    list.node[ix].content = obj;

    if (isNew) {
      list.firstNode = ix;
      list.lastNode = ix;
    }
    else {
      let previousFirst = list.firstNode;
      list.firstNode = ix;
      list.node[ix].nextNode = previousFirst;
      list.node[previousFirst].previousNode = ix;
    }
    return ix;
  }

  get rpop() {
    let list = this.store;
    if (this.DPP.isEmpty(list)) {
      return {};
    }
    if (list.count === 0) return {};

    let ix = list.lastNode;
    if (!list.node[ix]) return {};
    let content = list.node[ix].content;
    let count = list.count;
    if (count === 1) {
      list.count = 0;
      list.nextNodeNo = 0;
      delete list.node;
      delete list.firstNode;
      delete list.lastNode;
    }
    else {
      let prevNode = list.node[ix].previousNode;
      list.lastNode = prevNode;
      delete list.node[prevNode].nextNode;
      delete list.node[ix];
      list.count = count - 1;
    }
    return content;
  }

  get lpop() {
    let list = this.store;

    if (this.DPP.isEmpty(list)) {
      return {};
    }
    if (list.count === 0) return {};

    let ix = list.firstNode;
    if (!list.node[ix]) return {};
    let content = list.node[ix].content;
    let count = list.count;
    if (count === 1) {
      list.count = 0;
      list.nextNodeNo = 0;
      delete list.node;
      delete list.firstNode;
      delete list.lastNode;
    }
    else {
      let nextNode = list.node[ix].nextNode;
      list.firstNode = nextNode;
      delete list.node[nextNode].previousNode;
      delete list.node[ix];
      list.count = count - 1;
    }
    return content;
  }

  lrange(from, to) {

    let list = this.store;
    let results = [];

    if (this.DPP.isEmpty(list)) {
      return results;
    }
    if (list.count === 0) return results;

    if (typeof from !== 'undefined' && typeof to === 'undefined') {
      to = from;
    }
    if (typeof from === 'undefined') {
      from = 0;
    }
    if (typeof to === 'undefined') {
      to = -1;
    }
    let count = -1; // zero-based counter

    function getNextNode(ix) {
      count++;
      if (count >= from) {
        results.push(list.node[ix].content);
      }
      if (to === count || ix === list.lastNode) {
        return false;
      }
      return list.node[ix].nextNode;
    }

    let ix = list.firstNode;
    while (ix) {
      ix = getNextNode(ix);
    }
    return results;
  }

  ltrim(from, to) {

    // delete the nodes before the from and after the to positions

    let list = this.store;

    if (this.DPP.isEmpty(list)) {
      return false;
    }
    if (list.count === 0) return false;

    if (typeof from !== 'undefined' && typeof to === 'undefined') {
      to = from;
    }
    if (typeof from === 'undefined') {
      from = 0;
    }
    if (typeof to === 'undefined') {
      to = -1;
    }
    let count = -1; // zero-based counter

    function deleteNode(ix) {
      let previx = list.node[ix].previousNode;
      let nextix = list.node[ix].nextNode;
      delete list.node[ix];
      list.count = list.count - 1;

      if (previx && nextix) {
        // deleted node was in the middle - link previous and next nodes
        list.node[previx].nextNode = nextix;
        list.node[nextix].previousNode = previx;
        return;
      }
      if (!previx && !nextix) {
        // deleted node was the only member
        delete list.firstNode;
        delete list.lastNode
        return;
      }
      if (!previx) {
        // deleting first member - make next node the first one
        list.firstNode = nextix;
        delete list.node[nextix].previousNode;
        return;
      }
      // must be the last member that was deleted
      // make the previous one the last
      list.lastNode = previx;
      delete list.node[previx].nextNode;
      return;
    }

    function getNextNode(ix) {
      count++;
      let nextix = list.node[ix].nextNode;
      if (count < from) {
        deleteNode(ix);
        if (list.count === 0) {
          // all nodes have been deleted
          return false;
        }
        return nextix;
      }
      if (to !== -1 && count > to) {
        deleteNode(ix);
        if (list.count === 0) {
          // all nodes have been deleted
          return false;
        }
        return nextix;
      }
      if (ix === list.lastNode) {
        // reached the to node or reached the end of the list
        return false;
      }
      return nextix;
    }

    let ix = list.firstNode;
    while (ix) {
      ix = getNextNode(ix);
    }
    return true;
  }

  count() {
    return this.store.count;
  }

  get length() {
    return this.store.count;
  }

  get isEmpty() {
    return (this.length === 0);
  }

  insertBefore(obj, memberNo) {
    let list = this.store;

    if (this.DPP.isEmpty(list)) {
      return false;
    }
    let beforeIx = this.getMemberId(memberNo);
    if (!beforeIx) return false;

    let ix = list.nextNodeNo + 1;
    list.nextNodeNo = ix;
    list.count = list.count + 1;
    if (!list.node) this.store.node = {};
    list.node[ix] = {};
    list.node[ix].content = obj;
    list.node[ix].nextNode = beforeIx;

    let prevIx = list.node[beforeIx].previousNode;
    if (prevIx) {
      list.node[beforeIx].previousNode = ix;
      list.node[ix].previousNode = prevIx;
      list.node[prevIx].nextNode = ix;
    }
    else {
      list.firstNode = ix;
    }
    return ix;
  }

  getMemberId(memberNo) {

    let list = this.store;

    if (this.DPP.isEmpty(list)) {
      return false;
    }
    if (list.count === 0) return false;
    if (list.count < memberNo) return false;

    let count = -1;
    let foundId = false;

    function getNextNode(nodeId) {
      count++;
      if (memberNo === count) {
        foundId = nodeId;
        return '';
      }
      if (nodeId === list.lastNode) {
        return '';
      }
      return list.node[nodeId].nextNode;
    }

    let nodeId = list.firstNode;
    while (nodeId !== '') {
      nodeId = getNextNode(nodeId);
    }
    return foundId;
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
export {LIST};
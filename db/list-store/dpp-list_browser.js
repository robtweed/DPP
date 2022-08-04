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

4 August 2022 

 */

let createLIST = async function(options) {

  if (!options.LIST) {
    let {LIST} = await import('https://robtweed.github.io/DPP/db/list-store/dpp-list.min.js');
    options.LIST = LIST;
  }

  if (!options.DPP) {
    let {DPP} = await import('https://robtweed.github.io/DPP/src/dpp.min.js');
    options.DPP = DPP;
  }
  if (!options.QOper8)  {
    let {QOper8} = await import('https://robtweed.github.io/QOper8/src/QOper8.min.js');
    options.QOper8 = QOper8;
  }

  return await options.LIST.start(options);
};

export {createLIST};
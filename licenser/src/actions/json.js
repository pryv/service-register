const fs = require('fs');
const _ = require('lodash');
const sortPackageJson = require('sort-package-json');

async function action (fullPath, spec) {
  // load .json file
  let pkg = require(fullPath);
  if (spec.force) {
    pkg = _.merge(pkg, spec.force);
  }
  if (spec.defaults) {
    pkg = _.mergeWith(pkg, spec.defaults, function (src, dest) {
      if (typeof src === 'undefined') return dest;
      return src;
    });
  }
  if (spec.sortPackage) {
    pkg = sortPackageJson(pkg);
  }
  fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2));
}

/**
 * Eventually prepare fileSpecs (can be called multiple times)
 * @param {Object} actionItem
 * @param {String} license - content of the license
 * @return {Function} the action to apply;
 */
async function prepare (actionItem, license) {
  actionItem.actionMethod = async function (fullPath) {
    console.log('JSON Handler >> ' + fullPath);
    await action(fullPath, actionItem);
  };
}

module.exports = {
  prepare,
  key: 'json'
};

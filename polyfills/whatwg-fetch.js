// shim to ensure Metro resolves 'whatwg-fetch' to this side-effecting module
require('../node_modules/whatwg-fetch/fetch.js');
module.exports = undefined;

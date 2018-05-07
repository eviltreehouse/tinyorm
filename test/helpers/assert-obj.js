'use strict';

/** Fast way to assert something is a defined object. */
module.exports = function(o, msg) {
    if (o && (typeof o === 'object')) return;
    else throw new Error(msg ? msg : "Not a defined object");
};
'use strict';
const sqlite3 = require('sqlite3');

var _db = null;

/**
 * Create a RAM-only database -- fast and ephemeral, perfect
 * for testing.
 */
module.exports = function() {
    if (_db) return _db;
    else {
        _db = new sqlite3.Database(":memory:");
        return _db;
    }
};

module.exports.release = function() {
    _db = null;
};
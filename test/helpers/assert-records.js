'use strict';

/**
 * Check if the records received are the ones
 * we are expecting.
 * @param {Array.<string, any>} in_records 
 * @param {string} val_key 
 * @param {string[]} exp_keys 
 * @return {void}
 * @throws Error
 */
function AssertRecords(in_records, val_key, exp_keys) {
    var succ = true;
    
    if (! in_records || !val_key || !exp_keys) succ = false;
    if (succ && (in_records.length != exp_keys.length)) succ = false;
    if (succ) {
        var row = 0;
        for (var exp of exp_keys) {
            if (in_records[row].val(val_key) !== exp) succ = false;
            if (! succ) break;
            row++;
        }
    }

    if (succ) return;
    throw new Error("Records not as expected");
}

module.exports = AssertRecords;
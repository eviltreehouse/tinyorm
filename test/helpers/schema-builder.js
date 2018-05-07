'use strict';
const Database = require('sqlite3').Database;

/**
 * Run an SQL file with a DB context to generate
 * the database.
 * @param {string} src 
 * @param {Database} db 
 * @return {Promise<true>}
 */
function SchemaBuilder(src, db) {
    var p = new Promise((resolve, reject) => {

        src = stripComments(src);
        db.exec(src, (err) => {
            if (err) reject(err);
            else {
                setTimeout(() => {
                    resolve(true);
                }, 100);
            }
        });
    });

    return p;
};

function stripComments(src) {
    return src.split(/\n/)
        .filter((v) => { return v.match(/^\s*--/) ? false : true; }
        )
    .join("\n");
}

module.exports = SchemaBuilder;
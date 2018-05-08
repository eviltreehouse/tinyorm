'use strict';

/**
 * TinyORM: micro ORM layer for sqlite3-powered micro-apps
 */
class TinyORM {
    /**
     * Creates a new instance of a model, initializes its column values
     * with those provided in `in_v`, and links it against the model scope
     * provided.
     * @param {Object.<string, any>} [in_v]
     * @param {Function} scope 
     */
    constructor(in_v, scope) {
        var dbh = scope.Db();

        this._db = dbh;
        this._model = this.constructor;
        this._table = this._model.Table();
        this.id  = null;
        this.v   = {};

        if (in_v && typeof in_v == 'object') {
            // pre-populate
            this.v = Object.assign({}, in_v);
            this.id = this.v.id || null;
        }
    }

    /**
     * Retrieve a column value
     * @param {string} col 
     * @param {any} [dv] 
     * @return {any}
     */
    val(col, dv) {
        if (typeof this.v[col] == 'undefined') return dv ? dv : null;
        else return this.v[col];
    }

    /**
     * Sets a column value, will return self.
     * @param {string} col 
     * @param {any} v 
     * @return {TinyORM}
     */
    setVal(col, v) {
        this.v[col] = v;
        return this;
    }

    /**
     * Perform strict equal check for column value against provided value
     * @param {string} col 
     * @param {any} cv 
     * @return {boolean}
     */
    isVal(col, cv) {
        return this.v[col] === cv;
    }

    /**
     * Create a `Date` object from an epoch time column value
     * @param {string} col 
     * @return {Date|null}
     */
    dateFromVal(col) {
        var epoch = this.val(col, null);
        
        // Since we can't use NULLs in keys, we also look for -1
        if (epoch == null || epoch == -1) return null;
        
        return new Date(epoch*1000);
    }

    /**
     * Sets the epoch time of a Date object into `col`. Returns the
     * epoch time.
     * @param {string} col
     * @param {Date} date 
     * @return {number}
     */
    dateToVal(col, date) {
        var epoch = null;
        if (date instanceof Date) epoch = Math.floor(date.getTime() / 1000);
        this.setVal(col, epoch);
        
        return epoch;
    }

    /**
     * Performs an UPDATE on the model with the values provided
     * in `v` object prior.
     * @param {Object.<string, any>} v
     * @return {Promise<TinyORM>}
     */
    update(v) {
        if (! this._db) return Promise.reject('no_db');
        if (! this._table) return Promise.reject('no_tbl');
        var table = this._table;

        if (! this.id) return Promise.reject('no_id');

        var cols = []; var val_string = ""; var binds = { '$id': this.id };
        for (var k in v) {
            if (k == 'id') continue;

            cols.push(`${k}=$${k}`);
            binds[`$${k}`] = v[k];
        }

        val_string = cols.join(", ");

        var query = `UPDATE ${table} SET ${val_string} WHERE id=$id`;
        // console.log('UPDATE', query, binds);

        var self = this;
        return new Promise((resolve, reject) => {
            this._db.run(query, binds, function(err) {
                if (err) reject(err);
                else {
                    // locally update fields for remainder of req
                    for (var k in v) self.v[k] = v[k];
                }
                
                resolve(self);
            });
        });
    }

    /**
     * Performs an INSERT on the model; optionally setting values provided
     * in `v` object prior.
     * @param {Object.<string, any>} [v] 
     * @return {Promise<TinyORM>}
     */    
    insert(v) {
        if (! this._db) return Promise.reject('no_db');
        if (! this._table) return Promise.reject('no_tbl');
        var table = this._table;

        if (this.id) return Promise.reject('has_id');

        if (typeof v === 'object') for (var k in v) this.setVal(k, v[k]);

        var cols = []; var col_string = ""; var val_string = ""; var binds = {};
        for (var k in this.v) {
            if (k == 'id') continue;
            cols.push(k);

            binds[`$${k}`] = this.v[k];
        }

        col_string = cols.join(", ");
        val_string = cols.map((v) => { return '$'+v; }).join(", ");

        var query = `INSERT INTO ${table} (${col_string}) VALUES(${val_string})`;

        // console.log('[INSERT]', query, binds);

        var self = this;
        return new Promise((resolve, reject) => {
            this._db.run(query, binds, function(err) {
                if (err) return reject(err);
                if (this.lastID) self.id = self.v.id = this.lastID;
                
                resolve(self);
            });
        });
    }

    /**
     * Performs a DELETE on the model
     * @return {Promise<TinyORM>}
     */    
    delete() {
        if (! this._db) return Promise.reject('no_db');
        if (! this._table) return Promise.reject('no_tbl');
        var table = this._table;

        if (! this.id) return Promise.reject('no_id');
        
        var query = `DELETE FROM ${table} WHERE id=$id`;

        return new Promise((resolve, reject) => {
            var self = this;

            this._db.run(query, { $id: this.id }, function(err) {
                if (err) reject(err);
                if (this.changes == 0) reject(err);

                self.id = null;

                resolve(self);
            });
        });
    }
}

/**
 * Get the database handle, or update the current
 * one with a new one, in which case the return
 * value will be the "old" handle in case you want
 * to restore it.
 * @param {Database} [db] 
 * @return {Database}
 */
TinyORM.Db = function(db) {
    if (! db) return this._db;
    else {
        var old_db = this._db;
        this._db = db;
        return old_db;
    }
};

/**
 * Override to return string ID of table for model.
 * @override
 * @return {string}
 */
TinyORM.Table = function() { return null; }

/**
 * Searches model table using the PRIMARY KEY field.
 * @param {number} id 
 * @return {Promise<TinyORM>}
 */
TinyORM.Find  = function(id) {
    if (! this._db) return Promise.reject('no_db');

    var _db = this._db;

    var table = this.Table();

    var query = `SELECT * FROM ${table} WHERE id=$id`;
    var binds = { $id: id };

    return new Promise((resolve, reject) => {
        _db.get(query, binds, (err, row) => {
            if (err) return reject(err);
            else if (! row) return resolve(null);
            else {
                var m = new this(row);
                resolve(m);
            }
        });
    });
}

/**
 * Performs a SELECT against the provided `criteria`, with the optional query `opts`
 * @param {Object.<string, any>} [criteria] 
 * @param {Object.<string, any>} [opts] 
 * @return {Promise<TinyORM[]>}
 */
TinyORM.Where = function(criteria, opts) {
    if (! this._db) return Promise.reject('no_db');
    if (! this.Table()) return Promise.reject('no_tbl');
    if (! criteria) criteria = {};
    if (! opts) opts = {};

    // infer limit if we only care about the 1st record.
    if (opts.first) opts.limit = 1;

    var _db = this._db;
    var table = this.Table();

    var binds = {};
    var query = `SELECT * FROM ${table}`;
    if (Object.keys(criteria).length > 0) {
        var crit_string = [];
        for (var k in criteria) {
            if (criteria[k] === null) {
                crit_string.push( `${k} IS NULL` );
            } else if (typeof criteria[k] === 'object') {
                // raw injection (use with care!)
                crit_string.push(criteria[k][0]);
                if (criteria[k][1]) {
                    for (var rk in criteria[k][1]) binds[ `${rk}`] = criteria[k][1][rk];
                }
            } else {
                crit_string.push( [k, `$${k}`].join("=") );
                binds[ `$${k}` ] = criteria[k];
            }
        }
        
        query += " WHERE " + crit_string.join(" AND ");
    }

    if (typeof opts.order_by == 'string') {
        query += ` ORDER BY ${opts.order_by}`;
    }

    if (typeof opts.limit != 'undefined') {
        query += ` LIMIT ${opts.limit}`;
    }

    //console.log(query, binds);

    return new Promise((resolve, reject) => {
        _db.all(query, binds, (err, rows) => {
            if (err) return reject(err);
            if (! rows) return resolve([]);

            var results = [];
            for (var i in rows) {
                var row = rows[i];
                var m = new this(row);
                results.push(m);
            }

            if (opts.first) {
                if (results.length > 0) resolve(results[0]);
                else resolve(null);
                return;
            }

            return resolve(results);
        });
    });    
}

/**
 * Registers or recalls a model for this Scope
 * @param {string|function} model
 * @return {Object}
 */
TinyORM.Model = function(model) {
    if (typeof model == 'function') {
        // copy static methods over to model class
        model.Find  = this.Find;
        model.Where = this.Where;
        //model.Db    = this.Db;

        // add a back-link to the class so we can resolve it later
        this._models[ model.name ] = model;
        
    } else if (typeof model == 'string') {
        // resolve model name
        return this._models[ model ];
    }
};

/**
 * Initializes a class into a model "scope". Returns a reference to `scope`
 * @param {Function} scope 
 * @return {Function}
 */
TinyORM.Scope = function(scope) {
    // scope.Model = scope.model = __model;
    scope._db = null;
    scope._models = {};
    return scope;
};

module.exports = TinyORM;
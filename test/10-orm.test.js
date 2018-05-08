'use strict';
const assert = require('simple-assert');
const assert_obj = require('./helpers/assert-obj');
const assert_records = require('./helpers/assert-records');
const SchemaBuilder = require('./helpers/schema-builder');
const NewDb = require('./helpers/ram-db');
const fs = require('fs');
const path = require('path');

const TinyORM = require('../model');

describe("ORM Testing", () => {
    var db = null;
    beforeEach((done) => {
        db = NewDb();
        buildDemoSchema(db).then(() => {

            // do schema check
            db.all("select name from sqlite_master where type='table'", (err, rows) => {
                if (err) done(err);
                else if (rows.length != 1) done("Table count mismatch: " + JSON.stringify(rows));
                else if (rows[0].name !== 'demo') done("No `demo` table found");
                else done();
            });
        }, done);
    });

    afterEach(() => {
        db = null;
    });

    context("Scope/Model Definition", () => {
        var scope;
        it("Scope CREATE", () => {
            scope = require('./fixtures/demo-scope');
            assert(typeof scope == 'function');

            assert(db ? true : false);
            scope.Db(db);

            var _db = scope.Db();
            assert_obj(_db);
        });

        it("Model CREATE", () => {
            var model = require('./fixtures/demo-model');
            assert(typeof model == 'function');
            assert(model.Table() == 'demo');
        });

        it("Scope -> ref Model", () => {
            var demo = scope.Model('Demo');
            assert(typeof demo == 'function');

            var nonexist = scope.Model("D3m0");
            assert(!nonexist);
        });
    });

    context("Basic ORM Tests", () => {
        var Scope;

        /** @type {TinyORM} */
        var Demo;

        beforeEach(() => {
            Scope = require('./fixtures/demo-scope');
            Demo = require('./fixtures/demo-model');
            Scope.Db(db);
            Scope.Model(Demo);
        });

        afterEach(() => {
            Demo = Scope = null;
        });

        it("INSERT", (done) => {
            var now = Math.floor(Date.now() / 1000);
            var demo = new Demo({ 'tag': 'u1', 'pct_done': 80.6, 'inserted_dt': now });
            assert_obj(demo);
            demo.insert().then((_demo) => {
                try {
                    assert_obj(_demo);
                    assert(typeof _demo.id == 'number');
                    assert(_demo.id > 0);

                    done();
                } catch(e) {
                    done(e);
                }
            }, done);
        });

        it("SELECT: Find", (done) => {
            Demo.Find(1).then((demo) => {
                try {
                    assert_obj(demo);
                    assert(demo.id == 1, 'ID is ' + demo.id);
                    assert(demo.val('tag') == 'sel1');

                    done();
                } catch(e) {
                    done(e);
                }
            }, done);
        });

        it("SELECT: Where basic", (done) => {
            Demo.Where({'tag': 'sel1'}).then((recs) => {
                try {
                    assert_records(recs, 'tag', ['sel1']);
                    done();
                } catch(e) {
                    done(e);
                }
            }, done);
        });

        it("SELECT: Where basic 2", (done) => {
            Demo.Where({'completed_dt': null}, { 'order_by': 'pct_done' }).then((recs) => {
                try {
                    assert_records(recs, 'tag', ['sel1', 'sel2', 'del1']);
                    done();
                } catch(e) {
                    done(e);
                }
            }, done);
        });        

        it("SELECT: Where basic 3", (done) => {
            Demo.Where({}, { 'first': true, 'order_by': 'tag' }).then((rec) => {
                try {
                    assert(rec.val('tag') == 'del1');
                    done();
                } catch(e) {
                    done(e);
                }
            }, done);
        });        
        

        it("SELECT: Where complex", (done) => {
            Demo.Where({'completed_dt': [ 'completed_dt IS NOT NULL'] }, {'order_by': 'tag'}).then((recs) => {
                try {
                    assert_records(recs, 'tag', ['selz']);
                    done();
                } catch(e) {
                    done(e);
                }
            }, done);            
        });

        it("SELECT: Where complex 2", (done) => {
            Demo.Where({'completed_dt': [ 'completed_dt >= :min_comp AND completed_dt < :max_comp', 
                { ':min_comp': 0, ':max_comp': 999999999999999 }] 
            }, {'order_by': 'tag'}).then((recs) => {
                try {
                    assert_records(recs, 'tag', ['selz']);
                    done();
                } catch(e) {
                    done(e);
                }
            }, done);            
        });        

        it("UPDATE", (done) => {
            Demo.Where({'tag': 'sel1'}, { 'first': true }).then((rec) => {
                try {
                    assert(rec);
                    var upd = { 'pct_done': 100, 'completed_dt': Math.floor(Date.now() / 1000) };
                    rec.update(upd).then((urec) => {
                        try {
                            Demo.Where({'tag': 'sel1'}, { 'first': true }).then((rec) => {
                                try {
                                    assert(rec);

                                    assert(rec.val('pct_done') == 100);
                                    assert(rec.val('completed_dt') > 0);

                                    done();
                                } catch(e) {
                                    done(e);
                                }    
                            });
                        } catch(e) {
                            done(e);
                        }
                    });
                } catch(e) {
                    done(e);
                }
            }, done);            
        });

        it("DELETE", (done) => {
            Demo.Where({ 'tag': 'del1' }).then((rows) => {
                try {
                    assert(rows.length == 1);
                    var del_me = rows[0];

                    del_me.delete().then((self) => {
                        try {
                            assert(self.val('tag') == 'del1');
                            assert(!self.id);

                            done();
                        } catch(e) {
                            done(e);
                        }
                    });
                } catch(e) {
                    done(e);
                }
            });
        });
    });
});


function buildDemoSchema(in_db) {
    var src = fs.readFileSync(
        path.resolve(__dirname, 'fixtures', 'demo-schema.sql')
    , 'utf8');

    if (! src) return Promise.reject("couldnt load source!");
    
    return SchemaBuilder(src, in_db);
}
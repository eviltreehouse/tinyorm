'use strict';

var Base = require('./example_scope');

class Thing extends Base {
    constructor(in_thing) {
        super(in_thing, Base);
    }
};

Base.model(Thing);

Thing.Table = function() { return "things"; }

module.exports = Thing;

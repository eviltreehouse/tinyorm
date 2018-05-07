'use strict';
const Base = require('./demo-scope');

class Demo extends Base {
    constructor(in_demo) {
        super(in_demo, Base);
    }
}

Base.Model(Demo);

Demo.Table = function() { return "demo"; };

module.exports = Demo;
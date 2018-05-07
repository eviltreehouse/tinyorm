'use strict';
const Base = require('../../model');

class DemoScope extends Base {};

Base.Scope(DemoScope);
module.exports = DemoScope;
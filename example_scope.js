'use strict';
const Model = require('./model');

class MyAppModel extends Model {}

module.exports = Model.Scope(MyAppModel);

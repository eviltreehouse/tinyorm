'use strict';
const assert = require('simple-assert');

describe("Baseline Sanity Tests", () => {
	context("Model", () => {
		it("Instantiates okay", () => {
			var model = require('../model');
			assert(typeof model === 'function');
		});
	});
});
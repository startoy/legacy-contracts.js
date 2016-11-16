'use strict'

const assert = require('assert')
const Promise = require('bluebird')
const test = require('../../lib/test')

const source = `
  contract Test{
  	string _withSpace = "  Pieter";
  	string _withoutSpace = "Pieter";

  	function getWithSpaceConstant() constant returns (string) {
  		return _withSpace;
  	}

  	function getWithoutSpaceConstant () constant returns (string) {
  		return _withoutSpace;
  	}
  }
`

it('#47', function () {
  this.timeout(60 * 1000)

  return test.newContractManager('blockchain', {protocol: 'http:'})
    .then((manager) =>
      test.compile(manager, source, 'Test').then((contract) =>
        Promise.all([
          Promise.fromCallback((callback) =>
            contract.getWithSpaceConstant(callback)
          ),
          Promise.fromCallback((callback) =>
            contract.getWithoutSpaceConstant(callback)
          )
        ]).then(([withSpace, withoutSpace]) => {
          assert.equal(withSpace, '  Pieter')
          assert.equal(withoutSpace, 'Pieter')
        })
      )
    )
})

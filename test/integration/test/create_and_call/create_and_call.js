/* This file is for testing a contract create + call.
 */
var asrt = require('assert')
var createDb = require('../../createDb')
var edbModule = require('eris-db')
var eris = require('../../../..')

var abi = [
  {
    'constant': true,
    'inputs': [
      {
        'name': 'a',
        'type': 'int256'
      },
      {
        'name': 'b',
        'type': 'int256'
      }
    ],
    'name': 'add',
    'outputs': [
      {
        'name': 'sum',
        'type': 'int256'
      }
    ],
    'type': 'function'
  },
  {
    'inputs': [],
    'type': 'constructor'
  }
]

var code = '60606040525b33600060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908302179055505b60d38061003f6000396000f30060606040523615603a576000357c010000000000000000000000000000000000000000000000000000000090048063a5f3c23b14609757603a565b606b5b6000600060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690506068565b90565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b60ac60048035906020018035906020015060c2565b6040518082815260200191505060405180910390f35b6000818301905060cd565b9291505056'

var contracts
var contract

describe('TestCreateAndCall', function () {
  before(function (done) {
    this.timeout(25000)

    createDb().spread(function (url, validator) {
      var edb = edbModule.createInstance(url)
      var pipe = new eris.pipes.DevPipe(edb, validator.priv_key[1])
      contracts = eris.newContractManager(pipe)
      console.log('Creating. This should take about 15 seconds.')
      var contractFactory = contracts.newContractFactory(abi)
      contractFactory.new({data: code}, function (error, data) {
        if (error) {
          throw error
        }
        contract = data
        done()
      })
    })
  })

  describe('add', function () {
    it('should add 5 and 25', function (done) {
      contract.add(5, 25, function (error, data) {
        asrt.ifError(error)
        var res = data.toString()
        asrt.equal(res, '30')
        done()
      })
    })

    it('should add 256 and 33', function (done) {
      contract.add(256, 33, function (error, data) {
        asrt.ifError(error)
        var res = data.toString()
        asrt.equal(res, '289')
        done()
      })
    })

    it('should add 15 and -3', function (done) {
      contract.add(15, -3, function (error, data) {
        asrt.ifError(error)
        var res = data.toString()
        asrt.ok(res, '12')
        done()
      })
    })

    it('should add -15 and 3', function (done) {
      contract.add(-15, 3, function (error, data) {
        asrt.ifError(error)
        var res = data.toString()
        asrt.equal(res, '-12')
        done()
      })
    })
  })
})

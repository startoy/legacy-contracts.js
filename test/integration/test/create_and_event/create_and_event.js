/* This file is for testing a contract create + call + get event.
 */
var createDb = require('../../createDb')
var asrt = require('assert')
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
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'a',
        'type': 'int256'
      },
      {
        'indexed': true,
        'name': 'b',
        'type': 'int256'
      },
      {
        'indexed': true,
        'name': 'sum',
        'type': 'int256'
      },
      {
        'indexed': false,
        'name': 'body',
        'type': 'bytes32'
      }
    ],
    'name': 'Added',
    'type': 'event'
  }
]

var code = '60606040525b33600060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908302179055505b610137806100406000396000f3006060604052361561003d576000357c010000000000000000000000000000000000000000000000000000000090048063a5f3c23b1461009c5761003d565b6100705b6000600060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905061006d565b90565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100b36004803590602001803590602001506100c9565b6040518082815260200191505060405180910390f35b6000818301905080508082847f0fc28fce5e54ac6458756fc24dc51a931ca7ad21440cfca44933ae774ed5f70c7f41646465642074776f206e756d626572730000000000000000000000000000006040518082815260200191505060405180910390a4610131565b9291505056'

var contracts
var contract

describe('TestCreateAndEvent', function () {
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
    this.timeout(25000)
    it('should add 5 and 25', function (done) {
      contract.Added.once(function (error, event) {
        asrt.ifError(error)
        asrt.equal(event.event, 'Added')
        asrt.equal(event.address.slice(24), contract.address)
        var sum = event.args.sum.toString()
        asrt.equal(sum, '30')
        done()
      })
      contract.add(5, 25, function (error, data) {
        asrt.ifError(error)
      })
    })
  })
})

/* This file is for testing a contract create + call.
 */
var asrt = require('assert')
var createDb = require('../../createDb')
var edbModule = require('eris-db')
var eris = require('../../../..')

var abi = [
  {
    'constant': true,
    'inputs': [],
    'name': 'uintVal',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'type': 'function'
  },
  {
    'inputs': [
      {
        'name': 'input',
        'type': 'uint256'
      }
    ],
    'type': 'constructor'
  }
]

var code = '606060405260405160208060948339016040526060805190602001505b806000600050819055505b50605f8060356000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900480639a0283ed146037576035565b005b60406004506056565b6040518082815260200191505060405180910390f35b6000600050548156'

var contracts
var contractFactory
var contract

describe('TestCreateWithParams', function () {
  before(function (done) {
    this.timeout(10 * 1000)

    createDb().spread(function (url, validator) {
      var edb = edbModule.createInstance(url)
      var pipe = new eris.pipes.DevPipe(edb, validator.priv_key[1])
      contracts = eris.newContractManager(pipe)
      contractFactory = contracts.newContractFactory(abi)
      done()
    })
  })

  describe('ConstructorWithParams', function () {
    this.timeout(8000)
    it('should set uintVal to 55 via constructor param.', function (done) {
      contractFactory.new(55, {data: code}, function (error, data) {
        if (error) {
          throw error
        }
        contract = data
        contract.uintVal(function (error, data) {
          asrt.ifError(error)
          var res = data.toString()
          console.log(res)
          asrt.equal(res, '55')
          done()
        })
      })
    })
  })
})

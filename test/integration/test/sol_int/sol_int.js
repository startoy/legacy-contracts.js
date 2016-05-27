/* This file is for testing a contract create + call.
 */
var BigNumber = require('bignumber.js')
var createDb = require('../../createDb')
var asrt = require('assert')
var edbModule = require('eris-db')
var eris = require('../../../..')

var abi = [
  {
    'constant': true,
    'inputs': [],
    'name': 'getStruct',
    'outputs': [
      {
        'name': 'boolVal',
        'type': 'bool'
      },
      {
        'name': 'bytesVal',
        'type': 'bytes32'
      }
    ],
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [],
    'name': 'getBytes32',
    'outputs': [
      {
        'name': 'bytesOut',
        'type': 'bytes32'
      }
    ],
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [],
    'name': 'getUints',
    'outputs': [
      {
        'name': 'a',
        'type': 'uint256'
      },
      {
        'name': 'b',
        'type': 'uint256'
      }
    ],
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [],
    'name': 'getInts',
    'outputs': [
      {
        'name': 'a',
        'type': 'int256'
      },
      {
        'name': 'b',
        'type': 'int256'
      }
    ],
    'type': 'function'
  }
]

var code = '60606040526101ea806100136000396000f30060606040526000357c01000000000000000000000000000000000000000000000000000000009004806309b1b3f21461005a5780631f9030371461008257806384356261146100a3578063c6ee701e146100cb57610058565b005b610065600450610177565b604051808381526020018281526020019250505060405180910390f35b61008d600450610163565b6040518082815260200191505060405180910390f35b6100ae60045061014a565b604051808381526020018281526020019250505060405180910390f35b6100d66004506100f3565b604051808381526020018281526020019250505060405180910390f35b600060007ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6915081507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffce90508050610146565b9091565b60006000600a9150815060329050805061015f565b9091565b600061121360010290508050610174565b90565b60006000604060405190810160405280600081526020016000815260200150604060405190810160405280600181526020017f546573742d627974657320696e207374727563742e000000000000000000000081526020015090508060000151925082508060200151915081505b50909156'

var expecteds = [
  [true, '546573742D627974657320696E207374727563742E0000000000000000000000'],
  '0000000000000000000000000000000000000000000000000000000000001213',
  [new BigNumber(10), new BigNumber(50)],
  [new BigNumber(-10), new BigNumber(-50)]
]

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
    it('should call getStruct and get return values', function (done) {
      contract.getStruct(function (error, data) {
        asrt.ifError(error)
        asrt.deepEqual(data, expecteds[0], 'getStruct output not matching expected')
        done()
      })
    })

    it('should call getBytes32 and get return values', function (done) {
      contract.getBytes32(function (error, data) {
        asrt.ifError(error)
        asrt.deepEqual(data, expecteds[1], 'getBytes32 output not matching expected')
        done()
      })
    })

    it('should call getUints and get return values', function (done) {
      contract.getUints(function (error, data) {
        asrt.ifError(error)
        asrt.deepEqual(data, expecteds[2], 'getUints output not matching expected')
        done()
      })
    })

    it('should call getInts and get return values', function (done) {
      contract.getInts(function (error, data) {
        asrt.ifError(error)
        asrt.deepEqual(data, expecteds[3], 'getInts output not matching expected')
        done()
      })
    })
  })
})

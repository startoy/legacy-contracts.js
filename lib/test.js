'use strict'

const contractsModule = require('./contractManager')
const DevPipe = require('./pipes/dev_pipe')
const erisContracts = require('..')
const I = require('iteray')
const Promise = require('bluebird')
const R = require('ramda')
const Solidity = require('solc')
const stream = require('stream')
const test = require('eris-db/lib/test')

const compile = (contractManager, source, name) => {
  const compiled = Solidity.compile(source, 1).contracts[name]
  const abi = JSON.parse(compiled.interface)
  const contractFactory = contractManager.newContractFactory(abi)

  return Promise.fromCallback((callback) =>
    contractFactory.new({data: compiled.bytecode}, callback)
  )
}

const Vector = () => {
  let manager
  const vector = test.Vector()

  return Object.assign(Object.create(vector), {
    before: (dirname, options, callback) =>
      vector.before(dirname, options, function ({db, validator}) {
        const accounts = {
          address: validator.address,
          pubKey: validator.pub_key,
          privKey: validator.priv_key
        }

        manager = contractsModule.newContractManager(new DevPipe(db, accounts))

        if (callback) {
          return callback.call(this, manager)
        }
      }),

    it: (callback) =>
      vector.it(
        function () {
          return callback.call(this, manager)
        }
      )
  })
}

module.exports = {
  compile,
  Vector
}

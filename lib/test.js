'use strict'

const erisContracts = require('..')
const Promise = require('bluebird')
const Solidity = require('solc')
const test = require('eris-db/lib/test')

const newContractManager = (name, options) =>
  Promise.all([
    test.newBlockchain(name, options),
    test.privateValidator()
  ]).spread((url, validator) =>
    erisContracts.newContractManagerDev(url, {
      address: validator.address,
      pubKey: validator.pub_key,
      privKey: validator.priv_key
    })
  )

const compile = (contractManager, source, name) => {
  const compiled = Solidity.compile(source, 1).contracts[name]
  const abi = JSON.parse(compiled.interface)
  const contractFactory = contractManager.newContractFactory(abi)

  return Promise.fromCallback((callback) =>
    contractFactory.new({data: compiled.bytecode}, callback)
  )
}

module.exports = {
  newContractManager,
  compile
}

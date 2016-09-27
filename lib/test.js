'use strict'

const erisContracts = require('..')
const Promise = require('bluebird')
const Solidity = require('solc')
const test = require('eris-db/lib/test')

const compile = source =>
  Solidity.compile(source, 1).contracts

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

module.exports = {
  compile,
  newContractManager
}

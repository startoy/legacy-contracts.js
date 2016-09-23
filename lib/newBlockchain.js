'use strict'

const childProcess = require('mz/child_process')
const erisContracts = require('..')
const fs = require('mz/fs')
const httpRequest = require('request-promise')
const I = require('iteray')
const Promise = require('bluebird')
const R = require('ramda')
const untildify = require('untildify')
const url = require('url')
const WebSocket = require('ws')

const exec = R.composeP(R.trim, R.head, childProcess.exec)

const intervalAsyncIterable = (delay) => {
  let lastOutput = Date.now()

  return I.toAsyncIterable((callback) =>
    () =>
      setTimeout(() => {
        lastOutput = Date.now()

        callback(null, {
          done: false,
          value: lastOutput
        })
      }, delay - (Date.now() - lastOutput))
  )
}

const poll = R.curry((action, interval) => {
  const asyncIterator = I.toIterator(R.pipe(
    I.map(() => Promise.try(action)),
    I.pullSerially
  )(interval))

  const next = () =>
    asyncIterator.next().catch(next)

  return next().then(R.prop('value'))
})

const privateValidator = () =>
  fs.readFile(untildify('~/.eris/chains/default/priv_validator.json'))
    .then(JSON.parse)

const dockerMachineIp = () =>
  exec('docker-machine ip').catch(() => 'localhost')

const blockchainUrl = (protocol, name) => {
  const portPromise = exec(`
    id=$(eris chains inspect ${name} Id)
    docker inspect --format='{{(index (index .NetworkSettings.Ports "1337` +
      `/tcp") 0).HostPort}}' $id
  `)

  return Promise.all([dockerMachineIp(), portPromise])
    .spread((hostname, port) => url.format({
      protocol,
      slashes: true,
      hostname,
      port,
      pathname: protocol === 'ws:' ? '/socketrpc' : '/rpc'
    })
  )
}

const webSocketIsAvailable = (url) =>
  poll(() =>
    new Promise((resolve, reject) => {
      const socket = new WebSocket(url)

      socket.once('open', () => {
        socket.close()
        resolve()
      })

      socket.once('error', reject)
    }),
    intervalAsyncIterable(100)
  ).then(() => url)

const httpIsAvailable = (url) =>
  poll(() => httpRequest(url).catch((reason) => {
    if (reason.name === 'RequestError') {
      throw reason
    }
  }), intervalAsyncIterable(100)
  ).then(R.always(url))

module.exports = (name, options) => {
  const protocol = (options || {}).protocol || 'ws:'

  const urlPromise = exec(`
    eris chains rm --data --dir --file --force ${name}
    eris chains new --publish ${name}
  `, {env: R.assoc('ERIS_PULL_APPROVE', true, process.env)})
    .then(() => blockchainUrl(protocol, name))
    .then(protocol === 'ws:' ? webSocketIsAvailable : httpIsAvailable)

  return Promise.all([urlPromise, privateValidator()])
    .spread((url, validator) =>
      Promise.fromCallback((callback) =>
        erisContracts.newContractManagerDev(url, {
          address: validator.address,
          pubKey: validator.pub_key,
          privKey: validator.priv_key
        }, callback)
      )
  )
}

'use strict';

var
  child_process = require('child_process'),
  fs = require('fs'),
  Promise = require('bluebird'),
  untildify = require('untildify');

Promise.promisifyAll(child_process);
Promise.promisifyAll(fs);

function exec(command) {
  return child_process.execAsync(command, {encoding: 'utf8'})
    .then(function (stdout) {
      return stdout.trim();
    });
}

// Create a fresh Eris DB server for each integration test.  Return its
// hostname, port, and validator.
module.exports = function () {
  var
    hostname, createDb, port, validator;

  hostname = exec('docker-machine ip').catchReturn('localhost');

  createDb = exec('\
    eris chains rm --data --force blockchain; \
    \
    [ -d ~/.eris/chains/blockchain ] || (eris services start keys \
      && eris chains make blockchain --chain-type=simplechain) \
    \
    && eris chains new --dir=blockchain --api --publish blockchain \
    && eris chains start blockchain');

  port = createDb.delay(3000).then(function () {
    return exec('eris chains inspect blockchain NetworkSettings.Ports')
      .then(function (stdout) {
        try {
          return /1337\/tcp:\[{0.0.0.0 (\d+)}\]/.exec(stdout)[1];
        } catch (exception) {
          console.error("Unable to retrieve IP address of test Eris DB server.  \
    Perhaps it's stopped; check its logs.");

          process.exit(1);
        }
      });
  });

  validator = createDb.delay(3000).then(function () {
    return fs.readFileAsync(untildify(
      '~/.eris/chains/blockchain/priv_validator.json'
    ), 'utf8').then(JSON.parse);
  });

  return [hostname, port, validator];
};

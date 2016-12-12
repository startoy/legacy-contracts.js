'use strict'

const assert = require('assert')
const test = require('../../lib/test')

const source = `
  contract Contract {
      event Event(
          address from
      );

      function emit() {
          Event(msg.sender);
      }
  }
`

it('listens to an event from a contract', function (done) {
  this.timeout(60 * 1000)

  test.newContractManager('blockchain', {protocol: 'http:'}).then((manager) =>
    test.compile(manager, source, 'Contract').then((contract) => {
      let count = 0
      let subscription

      contract.Event(
        (error, subscriptionObject) => {
          if (error) {
            done(error)
          } else {
            subscription = subscriptionObject
          }
        },
        (error, event) => {
          if (error) {
            done(error)
          } else {
            console.log('Received event', JSON.stringify(event, null, 2))

            try {
              assert.equal(event.args.from.length, 40)
            } catch (exception) {
              subscription.stop()
              done(exception)
            }

            count++

            if (count === 2) {
              subscription.stop()
              done()
            }
          }
        })

      contract.emit()
      contract.emit()
    })
    .catch(done)
  )
})

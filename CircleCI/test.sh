#!/bin/sh
set -o errexit
set -o xtrace

# Test against mock Eris DB.
npm test

if [ $CIRCLE_BRANCH = 'master' ]; then
  # Test Eris DB against our expectations of it.
  npm run make
  eval $(docker-machine env default); TEST=contract npm test
fi

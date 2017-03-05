#!/bin/sh
set -o errexit
set -o xtrace

# Test against mock Eris DB.
npm test

if [ "$CIRCLE_BRANCH" = "master" ]; then
  # Install Docker Machine because CircleCI's Docker support is hobbled.
  curl -L https://github.com/docker/machine/releases/download/$DOCKER_MACH\
  INE_VERSION/docker-machine-`uname -s`-`uname -m` > $HOME/bin/docker-machi\
  ne && chmod +x $HOME/bin/docker-machine

  docker-machine create --driver digitalocean default
  eval $(docker-machine env default)

  # Install Eris CLI.
  sudo add-apt-repository https://apt.monax.io
  curl -L https://apt.monax.io/APT-GPG-KEY | sudo apt-key add -
  sudo apt-get --quiet update
  sudo apt-get install --assume-yes --quiet eris
  eris init

  # Make a blockchain for testing.
  npm run make

  # Test Eris DB against our expectations of it.
  TEST=server npm test
fi

#!/bin/sh

# Publish documentation to the Monax website.

name=contracts.js
repository=monax.io
repo=$PWD
version=$(jq --raw-output .version package.json)

# Build
npm run doc
cd $HOME
git clone git@github.com:eris-ltd/$repository.git
cd $repository/content/docs/documentation
mkdir --parents $name
cd $name
mv $repo/doc $version
ln --symbolic $version latest

# Commit and push if there are changes.
if [ -n "$(git status --porcelain)" ]; then
  git config --global user.email "billings@erisindustries.com"
  git config --global user.name "Billings the Bot"
  git add -A :/ &&
  git commit --message "$name build number $CIRCLE_BUILD_NUM doc generation" &&
  git push origin staging
fi

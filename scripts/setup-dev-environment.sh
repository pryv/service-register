#!/bin/sh

# This script sets up the REC.la registration server development environment on a 64-bit OSX system
#   - Note that only the Redis installation is OS-specific
# Original inspiration: activity-server script (thank you Simon)

# IMPORTANT: the script assumes it's run from the repository's root folder or the `scripts` folder

if [ "${PWD##*/}" == "scripts" ]
then
  cd ..
fi

# check for well known prereqs that might be missing
hash git 2>&- || { echo >&2 "I require 'git'."; exit 1; }
hash make 2>&- || { echo >&2 "I require 'make'."; exit 1; }

# Install Redis if necessary
redisName=redis-2.4.8
echo "
Checking for Redis ($redisName)..."
if [ ! -d ../$redisName ]
then
  echo "Not found, installing...
"
  curl -o "../$redisName" http://redis.googlecode.com/files/$redisName.tar.gz
  tar xzf ../$redisName.tar.gz
  ../$redisName/make
  rm ../$redisName.tar.gz
else
  echo "OK"
fi

echo "
Checking for NVM..."
if [ ! -d ~/.nvm ]
then
  echo "Not found, installing...
"
  git clone git://github.com/creationix/nvm.git ~/.nvm
else
  echo "OK"
fi

echo "
Syncing NVM...
"
. ~/.nvm/nvm.sh # this line should be added to your .bash_profile as well
nvm sync

nodeVersion=v0.8.2
echo "
Installing Node $nodeVersion if necessary...
"
nvm install $nodeVersion
nvm use $nodeVersion # the equivalent line should be added to your .bash_profile as well

echo "
Installing Node modules from 'source/package.json' if necessary...
"
cd source
npm install
cd ..

# Install node debugger interface
npm install -g node-inspector

# Display notes
echo ""
echo "To run Redis:"
echo "    ./db/start-redis.sh"
echo ""

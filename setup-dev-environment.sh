#!/bin/sh

# Setup the REC.la registration server development environment on a 64-bit OSX system
#   - Note that only the Redis installation is OS-specific
# Inspiration from setup-dev-environment from server (thank you Simon)

# This script must be run in the root API development folder containing the
# 'source' folder (in which NPM dependencies are declared in package.json)

# Check for well known prereqs that might be missing
hash git 2>&- || { echo >&2 "I require 'git'."; exit 1; }
hash make 2>&- || { echo >&2 "I require 'make'."; exit 1; }

# Install Redis if necessary
redisName=redis-2.4.8
if [ ! -d $redisName ]
 then
  curl -O http://redis.googlecode.com/files/$redisName.tar.gz
   tar xzf $redisName.tar.gz
   cd $redisName
   make
   cd ..
   rm $redisName.tar.gz
fi

# Install NVM if necessary
if [ ! -d ~/.nvm ]
then
  git clone git://github.com/creationix/nvm.git ~/.nvm
fi

. ~/.nvm/nvm.sh # This line should be added to your .bash_profile as well
nvm sync

# Install Node
nvm install v0.8.2
nvm use v0.8.2 # This line should be added to your .bash_profile as well

# Install Node modules (relies on source/package.json to declare dependencies)
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

#!/bin/sh

# Setup the wActiv Register development environment on a 64-bit OSX system
#   - Note that only the Redis installation is OS-specific
# Inspiration from set-dev-environment from server (thank you Simon)

# This script must be run in the root API development folder containing the
# 'source' folder (in which NPM dependencies are declared in package.json)

# Check for well known prereqs that might be missing
hash git 2>&- || { echo >&2 "I require 'git'."; exit 1; }
hash make 2>&- || { echo >&2 "I require 'make'."; exit 1; }

Install Redis if necessary
if [ ! -d redis-2.4.8 ]
 then
  curl -O http://redis.googlecode.com/files/redis-2.4.8.tar.gz
   tar xzf redis-2.4.8.tar.gz
   cd redis-2.4.8
   make
   cd ..
   rm redis-2.4.8.tar.gz
fi

# Install MongoDB if necessary
# mongoName=mongodb-osx-x86_64-2.0.2
# if [ ! -d $mongoName ]
# then
#  curl -C - -O http://downloads.mongodb.org/osx/$mongoName.tgz
#  tar -xzf $mongoName.tgz
#  rm $mongoName.tgz
#fi

# Install NVM if necessary
if [ ! -d ~/.nvm ]
then
  git clone git://github.com/creationix/nvm.git ~/.nvm
fi

. ~/.nvm/nvm.sh # This line should be added to your .bash_profile as well
nvm sync

# Install Node
nvm install v0.6.11
nvm use v0.6.11 # This line should be added to your .bash_profile as well

# Install Node modules (relies on source/package.json to declare dependencies)
cd source
npm install
cd ..

# Install node debugger interface
npm install -g node-inspector

# Display notes
echo ""
echo "To create the MongoDB data folder if necessary (not created automatically):"
echo "    sudo mkdir -p <data folder path>"
echo "    sudo chown `id -u` <data folder path>"
echo ""
echo "To run MongoDB (--dbpath defaults to /data/db if not specified):"
echo "    ./$mongoName/bin/mongod --dbpath <data folder path>"
echo ""

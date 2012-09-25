#!/bin/bash
. ~/.profile

# This script sets up Redis (engine and data) for the REC.la registration server
# Meant to be called from 'setup-environment-<target>.sh' scripts

# working dir fix
scriptsFolder=$(cd $(dirname "$0"); pwd)
cd $scriptsFolder/
. ./env-config.sh


targetFolder=$1

if [ -z "$targetFolder" ]
then
  echo "
Expected argument: <target folder path>
from the script directory \"../../\" is good :)
"
  exit 1
elif [ ! -d $targetFolder ]
then
  echo "
Invalid target folder path: '$targetFolder' does not exist.
"
  exit 1
fi

echo "
Checking for Redis ($targetFolder/$redisName)..."
if [ ! -d $targetFolder/$redisName ]
then
  echo "Not found, installing...
"
  cd $targetFolder
 
  curl -o "$redisName.tar.gz" http://redis.googlecode.com/files/$redisName.tar.gz
  tar -xzf $redisName.tar.gz
  cd $redisName
  make
  cd ..
  rm $redisName.tar.gz
else
  cd $targetFolder
  echo "OK"
fi

redisData=redis-data
echo "
Checking for DB data folder ($targetFolder/$redisData)..."
if [ ! -d $redisData ]
then
  echo "Not found, installing...
"
  mkdir -p $redisData
  chown `id -u` $redisData
else
  echo "OK"
fi

echo "


If no errors were listed above, the database setup is complete.

To run Redis:
    $targetFolder/$redisName/src/redis-server [<configuration file>]
"

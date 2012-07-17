#!/bin/sh

# This script sets up Redis (engine and data) for the REC.la registration server
# Meant to be called from 'setup-environment-<target>.sh' scripts

targetFolder=$1

if [ -z "$targetFolder" ]
then
  echo "
Expected argument: <target folder path>
"
  exit 1
elif [ ! -d $targetFolder ]
then
  echo "
Invalid target folder path: '$targetFolder' does not exist.
"
  exit 1
fi

redisName=redis-2.4.8
echo "
Checking for Redis ($targetFolder/$redisName)..."
if [ ! -d $targetFolder/$redisName ]
then
  echo "Not found, installing...
"
  curl -o "$targetFolder/$redisName" http://redis.googlecode.com/files/$redisName.tar.gz
  tar xzf $targetFolder/$redisName.tar.gz
  $targetFolder/$redisName/make
  rm $targetFolder/$redisName.tar.gz
else
  echo "OK"
fi

redisData=redis-data
echo "
Checking for DB data folder ($targetFolder/$redisData)..."
if [ ! -d $targetFolder/$redisData ]
then
  echo "Not found, installing...
"
  mkdir -p $targetFolder/$redisData
  chown `id -u` $targetFolder/$redisData
else
  echo "OK"
fi

echo "


If no errors were listed above, the database setup is complete.

To run Redis:
    $targetFolder/$redisName/src/redis-server [<configuration file>]
"

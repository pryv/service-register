#!/bin/bash
. ~/.profile

# working dir fix
scriptsFolder=$(cd $(dirname "$0"); pwd)
cd $scriptsFolder/
. ./env-config.sh

cd $scriptsFolder/..

droneId=$1
confFile=./db/$2.conf

[ -z "$droneId" ] && echo "Expected argument: <fleet drone id> <database conf file>" && exit 1
if [ -r $confFile ]  
then
   echo "Spawning database on $droneId with $confFile"
else
   echo "Expected argument: <fleet drone id> <database conf file (master)>" 
   exit 1
fi

fleet spawn --drone=$droneId --repo=registration-server -- \
$dbFolder/$redisName/src/redis-server $confFile

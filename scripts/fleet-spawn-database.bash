#!/bin/bash
. ~/.profile

# working dir fix
scriptsFolder=$(cd $(dirname "$0"); pwd)
cd $scriptsFolder/
. ./env-config.sh

droneId=$1

[ -z "$droneId" ] && echo "Expected argument: <fleet drone id>" && exit 1

fleet spawn --drone=$droneId --repo=registration-server -- \
/$redisName/src/redis-server ./db/master.conf

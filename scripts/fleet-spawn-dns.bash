#!/bin/bash

. ~/.profile


# working dir fix
scriptsFolder=$(cd $(dirname "$0"); pwd)
cd $scriptsFolder/
. ./env-config.sh

cd $scriptsFolder/..

droneId=$1

[ -z "$droneId" ] && echo "Expected argument: <fleet drone id>" && exit 1


fleet spawn --drone=$droneId --repo=registration-server -- \
"node source/app-dns.js --config $2"

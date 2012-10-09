#!/bin/bash


. ~/.profile

## config File path should be in destination path 
## /home/register/reg-gandi-fr-01.pryv.net.json

droneId=$1
configFile=$2

[ -z "$configFile" ] && echo "Expected argument: <fleet drone id> <config file>" && exit 1

fleet spawn --drone=$droneId --repo=registration-server -- \
"node source/app.js --config $2"

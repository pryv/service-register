#!/bin/bash


. ~/.profile

## config File path should be in destination path 
## /home/register/reg-gandi-fr-01.pryv.net.json

droneId=$1
tokill=$2
configFile=$3

[ -z "$configFile" ] && echo "Expected argument: <fleet drone id> <id to stop> <config file>" && exit 1

fleet deploy --drone=$droneId
./fleet-setup.bash $droneId
fleet stop $tokill --drone=$droneId
./fleet-spawn-register.bash $droneId $configFile

fleet ps

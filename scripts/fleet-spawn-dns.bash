#!/bin/bash

. ~/.profile

droneId=$1

[ -z "$droneId" ] && echo "Expected argument: <fleet drone id>" && exit 1


fleet spawn --drone=$droneId --repo=registration-server -- \
"node source/app_dns.js --config $2"

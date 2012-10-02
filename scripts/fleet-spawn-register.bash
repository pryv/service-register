#!/bin/sh

droneId=$1

[ -z "$droneId" ] && echo "Expected argument: <fleet drone id>" && exit 1

fleet spawn --drone=$droneId --repo=registration-server -- \
"node source/app.js --config $2"

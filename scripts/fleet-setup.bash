#!/bin/bash

. ~/.profile

droneId=$1

[ -z "$droneId" ] && echo "Expected argument: <fleet drone id>" && exit 1

fleet exec --drone=$droneId --repo=registration-server -- ./scripts/setup-environment.sh

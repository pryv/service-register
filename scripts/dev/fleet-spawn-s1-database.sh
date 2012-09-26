#!/bin/sh

droneId=$1

[ -z "$droneId" ] && echo "Expected argument: <fleet drone id>" && exit 1

fleet spawn --drone=$droneId --repo=registration-server -- \
/home/wactiv/redis-2.4.8/src/redis-server ./db/s1.conf

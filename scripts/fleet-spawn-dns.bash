#!/bin/sh

droneId=$1

[ -z "$droneId" ] && echo "Expected argument: <fleet drone id>" && exit 1

fleet spawn --drone=$droneId --repo=registration-server -- \
"authbind node source/app_dns.js --dns.ip 91.121.41.94 --dns.hostname ns2.wactiv.com >> /home/wactiv/logs/dns.log 2>&1"

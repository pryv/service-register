#!/bin/sh

droneId=$1

[ -z "$droneId" ] && echo "Expected argument: <fleet drone id>" && exit 1

fleet spawn --drone=$droneId --repo=registration-server -- \
"authbind node source/app.js --http.register.ip 91.121.41.240 --dns.ip 91.121.41.240 --http.static.name d2p322ssjiukh3.cloudfront.net >> /home/wactiv/logs/registration-server.log 2>&1"

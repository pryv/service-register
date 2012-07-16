#!/bin/sh

if [ "${PWD##*/}" == "scripts" ]
then
  cd ..
fi

cd source
authbind node app_dns.js --dns.ip 91.121.41.94 --dns.hostname ns2.wactiv.com

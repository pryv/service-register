#!/bin/sh


# working dir fix
scriptsFolder=$(cd $(dirname "$0"); pwd)
cd $scriptsFolder/
cd ../../

fleet spawn  --remote=staging --drone=s1.simpledata.ch --repo=registration-server -- \
"authbind node source/app-dns.js --config /home/wactiv/registration-server/scripts/dev/staging-config-dns2.json >> /home/wactiv/logs/dns.log 2>&1"

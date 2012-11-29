#!/bin/sh


# working dir fix
scriptsFolder=$(cd $(dirname "$0"); pwd)
cd $scriptsFolder/
cd ../../


fleet spawn  --remote=staging --drone=s1.simpledata.ch --repo=registration-server -- \
"authbind node source/app.js --config /home/wactiv/registration-server/scripts/dev/staging-config-reg.json >> /home/wactiv/logs/registration-server.log 2>&1"

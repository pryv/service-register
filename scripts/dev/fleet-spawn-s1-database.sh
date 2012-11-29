#!/bin/sh

# working dir fix
scriptsFolder=$(cd $(dirname "$0"); pwd)
cd $scriptsFolder/
cd ../../

fleet spawn --remote=staging --drone=s1.simpledata.ch --repo=registration-server -- \
/home/wactiv/redis-2.4.8/src/redis-server ./db/s1.conf

#!/bin/sh


# working dir fix
scriptsFolder=$(cd $(dirname "$0"); pwd)
cd $scriptsFolder/
cd ../../

fleet exec --remote=staging --drone=s1.simpledata.ch --repo=registration-server -- ./scripts/staging/setup-environment-s1.sh


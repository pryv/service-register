#!/bin/bash
. ~/.profile

# working dir fix
scriptsFolder=$(cd $(dirname "$0"); pwd)
cd $scriptsFolder/
. ./env-config.sh

# This script sets up the REC.la registration server app
# Meant to be called from 'setup-environment-<target>.sh' scripts

nodeEnv=$1 # development or production

if [ -z "$nodeEnv" ]
then
  echo "
Expected argument: <Node environment: development or production>
"
  exit 1
fi

cd $scriptsFolder/..


echo "
Installing Node $nodeVersion if necessary...
"
nvm install $nodeVersion
nvm use $nodeVersion # the equivalent line should be added to your .bash_profile as well
NODE_ENV=$nodeEnv # the equivalent line should be added to your .bash_profile as well

echo "
Installing Node modules from 'source/package.json' if necessary...
"
cd source
npm install --$nodeEnv
cd ..

echo "


If no errors were listed above, the app setup is complete.

To start the app (example - check the code for the list of config options):
    node source/app.js --database.name <name> --http.httpPort <port>
"

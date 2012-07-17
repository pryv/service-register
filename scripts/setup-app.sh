#!/bin/sh

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

# working dir fix
scriptsFolder=$(cd $(dirname "$0"); pwd)
cd $scriptsFolder/..

echo "
Checking for NVM..."
if [ ! -d ~/.nvm ]
then
  echo "Not found, installing...
"
  git clone git://github.com/creationix/nvm.git ~/.nvm
else
  echo "OK"
fi

echo "
Syncing NVM...
"
. ~/.nvm/nvm.sh # this line should be added to your .bash_profile as well
nvm sync

nodeVersion=v0.8.2
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

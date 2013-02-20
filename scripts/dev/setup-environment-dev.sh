#!/bin/sh

# This script sets up the Pryv registration server development environment on a 64-bit OSX system
# Original inspiration: api-server script (thank you Simon)

# working dir fix
scriptsFolder=$(cd $(dirname "$0"); pwd)
cd $scriptsFolder/..

# check for well known prereqs that might be missing
hash git 2>&- || { echo >&2 "I require 'git'."; exit 1; }
hash make 2>&- || { echo >&2 "I require 'make'."; exit 1; }

$scriptsFolder/setup-database.sh ..

$scriptsFolder/setup-app.sh development

echo "
Installing node-inspector for debugging (global) if necessary...
"
npm install -g node-inspector

echo "
Installing fleet for deployment (global) if necessary...
"
npm install -g fleet

echo "


If no errors were listed above, the setup is complete.
"

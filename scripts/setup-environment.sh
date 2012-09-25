#!/bin/sh

# This script sets up the Pryv registration server development environment on a 64-bit Linux system

# working dir fix
scriptsFolder=$(cd $(dirname "$0"); pwd)
cd $scriptsFolder/..

# check for well known prereqs that might be missing
hash git 2>&- || { echo >&2 "I require 'git'."; exit 1; }

$scriptsFolder/setup-database.bash ~/

$scriptsFolder/setup-app.bash production

echo "


If no errors were listed above, the setup is complete.
"

#!/bin/sh

# working dir fix
scriptsFolder=$(cd $(dirname "$0"); pwd)
cd $scriptsFolder/../..

../redis-2.4.8/src/redis-cli -a MyRecordedLife

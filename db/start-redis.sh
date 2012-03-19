#!/bin/sh
DIR=$(cd $(dirname "$0"); pwd) 
cd $DIR
redis-server ./redis.conf

#!/bin/bash

APP=$1

cd /var/pryv;

rm -rf $APP;
mv /tmp/$APP.tar.gz .; tar xfz $APP.tar.gz;
bash $APP.setup.bash;

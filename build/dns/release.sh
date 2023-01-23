#!/bin/bash
set -e
source /pd_build/buildconfig

target_dir="/app/bin"
log_dir="/app/log"
conf_dir="/app/conf"

header "Install application from release.tar"

run mkdir -p $target_dir
run chown app $target_dir

# Unpack the application and run yarn install.
cd $target_dir
run run tar -x --owner app -f \
  /pd_build/release.tar .

PYTHON=$(which python2.7) run yarn install

# Perform a release build of the source code. (-> lib)
run yarn release
rm -r src && mv lib src

# Copy the config file
run mkdir -p $conf_dir && \
  cp /pd_build/config/dns.json $conf_dir/dns.json

# Create the log dir
run mkdir -p $log_dir && \
  touch $log_dir/dns.log && chown -R app:app $log_dir

# Install the script that runs the register service
run mkdir /etc/service/dns
run cp /pd_build/runit/dns /etc/service/dns/run

# Enable CRON for nightly job
run rm /etc/service/cron/down

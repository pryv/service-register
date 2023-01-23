#!/bin/bash
set -e
source /pd_build/buildconfig

target_dir="/app/bin"
log_dir="/app/log"
conf_dir="/app/conf"

header "Install application from release.tar"

run mkdir -p $target_dir
run chown app $target_dir

# Unpack the application
cd $target_dir
run run tar --owner app -xf /pd_build/release.tar .

# Skip install: already done in the GitHub workflow
# npm install

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

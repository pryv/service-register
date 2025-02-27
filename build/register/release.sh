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

# Copy the config file
run mkdir -p $conf_dir && \
  cp /pd_build/config/register.json $conf_dir/register.json

# Create the log dir
run mkdir -p $log_dir && \
  touch $log_dir/register.log && chown -R app:app $log_dir

# Install the script that runs the register service
run mkdir /etc/service/register
run cp /pd_build/runit/register /etc/service/register/run

# Enable CRON for nightly job
run rm /etc/service/cron/down

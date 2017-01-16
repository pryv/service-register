#!/bin/bash
set -e
source /pd_build/buildconfig

header "Install application environment"

# Install python 2.7 for node-gyp:
run minimal_apt_get_install python2.7


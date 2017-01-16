#!/bin/bash
set -e
source /pd_build/buildconfig

# Setup. Please also see the setup of pryv/base - most of the recurring things
# should be done there. 
run /pd_build/enable_repos.sh

# Installs prerequisites for the application.
run /pd_build/prerequisites.sh
run /pd_build/redis.sh

# Install the service-register application.
run /pd_build/release.sh

# Clean up after ourselves.
run /pd_build/finalize.sh

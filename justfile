# add node bin script path for recipes
export PATH := "./node_modules/.bin:" + env_var('PATH')

# Default: display available recipes
_help:
    @just --list

# –––––––––––––----------------------------------------------------------------
# Setup
# –––––––––––––----------------------------------------------------------------

# Set up the dev environment on a MacOS or GNU/Linux system
setup-dev-env:
    #!/usr/bin/env bash
    set -e

    # install Redis
    export REDIS_NAME=redis-6.0.17
    export REDIS_BASE_FOLDER=$(pwd)
    export REDIS_DATA_FOLDER=${REDIS_BASE_FOLDER}/redis-data
    scripts/setup-db
    EXIT_CODE=$?
    if [[ ${EXIT_CODE} -ne 0 ]]; then
    echo ""
    echo "Error setting up database; setup aborted"
    echo ""
    exit ${EXIT_CODE}
    fi

    # setup git pre-commit hook if appropriate ($CI is "true" in GitHub workflows)
    PRE_COMMIT="scripts/pre-commit"
    if [[ -d .git && "$CI" != "true" ]]; then
        cp $PRE_COMMIT .git/hooks/
        echo "✓ Git pre-commit hook setup from '$PRE_COMMIT'"
    fi

# Install node modules afresh
install *params: clean
    npm install {{params}}

# Clean up node modules
clean:
    rm -rf node_modules

# Install node modules strictly as specified (typically for CI)
install-stable:
    npm ci

# –––––––––––––----------------------------------------------------------------
# Run
# –––––––––––––----------------------------------------------------------------

# Start the server
start:
    NODE_ENV=development node bin/server

# Start Redis (daemon)
start-db:
    ./redis-6.0.17/src/redis-server ./db/dev.conf

# Start Redis client
start-db-client:
    ./redis-6.0.17/src/redis-cli

# –––––––––––––----------------------------------------------------------------
# Test & related
# –––––––––––––----------------------------------------------------------------

# Run code linting
lint *options:
    eslint {{options}} .

# Run tests with optional extra parameters
test *params:
    NODE_ENV=test mocha {{params}}

# Run tests with detailed output
test-detailed *params:
    NODE_ENV=test mocha --reporter=spec {{params}}

# Run tests with detailed output for debugging
test-debug *params:
    NODE_ENV=test mocha --timeout 3600000 --reporter=spec --inspect-brk=40000 {{params}}

# Run tests and generate HTML coverage report
test-cover component *params:
    NODE_ENV=test nyc --reporter=html --report-dir=./coverage mocha {{params}}

# –––––––––––––----------------------------------------------------------------
# Misc. utils
# –––––––––––––----------------------------------------------------------------

# Run source licensing tool (see 'licensing' folder for details)
license:
    source-licenser --config-file .licenser.yml ./

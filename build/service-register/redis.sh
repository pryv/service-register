#!/bin/bash
set -e
source /pd_build/buildconfig

header "Installing Redis"

# Inspired by https://github.com/docker-library/redis.

# What redis is installed?
redis_version="2.4.16"
redis_file="redis-$redis_version.tar.gz"
redis_release_sha256="d35cc89d73aa1ff05af5f1380a4411c828979b3b446f5caf8b5720225b38e15b"

# NOTE This would be correct for newer versions of redis (> 2.6), but redis
#   doesn't  offer 2.4.16 for dl anymore.
# redis_url="http://download.redis.io/releases/$redis_file"

redis_url="https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/redis/$redis_file"

# Redis user and group
run groupadd -r redis 
run useradd -r -g redis redis

# Download and unpack, make, make install - then clean up
pushd /var/spool/
run curl -O $redis_url
echo "$redis_release_sha256 $redis_file" | sha256sum -c -

mkdir redis-src
pushd redis-src
run tar --strip-components=1 -xzf ../$redis_file
run make && make install
popd 

run rm $redis_file
run rm -r redis-src
popd


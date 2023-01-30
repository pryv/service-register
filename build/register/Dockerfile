FROM eu.gcr.io/pryvio/base:1.8.1
MAINTAINER "Tech@Pryv" <tech@pryv.com>

ADD . /pd_build
RUN /pd_build/install.sh

# Redis is installed to keep state here:
VOLUME /data

# Ports:
#   9000        register api server
#
EXPOSE 9000

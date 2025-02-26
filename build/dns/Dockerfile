FROM docker.io/pryvio/base:1.8.1
MAINTAINER "Tech@Pryv" <tech@pryv.com>

ADD . /pd_build
RUN /pd_build/install.sh

# Redis is installed to keep state here:
VOLUME /data

# Ports:
#   5353/udp    dns interface for service-register
#
EXPOSE 5353/udp

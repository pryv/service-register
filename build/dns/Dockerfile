FROM pryv/base:1.3.37
MAINTAINER "Tech@Pryv" <tech@pryv.com>

ADD . /pd_build
RUN /pd_build/install.sh

# Redis is installed to keep state here:
VOLUME /data

# Ports:
#   5353/udp    dns interface for service-register
#
EXPOSE 5353/udp


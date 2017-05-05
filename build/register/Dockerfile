FROM pryv/base:1.2.1
MAINTAINER "Tech@Pryv" <tech@pryv.com>

ADD . /pd_build
RUN /pd_build/install.sh

# Redis is installed to keep state here:
VOLUME /data

# Ports:
#   9000        register api server
#
EXPOSE 9000


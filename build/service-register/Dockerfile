FROM pryv/base:1.0.0
MAINTAINER "Tech@Pryv" <tech@pryv.com>

ADD . /pd_build
RUN /pd_build/install.sh

# Redis is installed to keep state here:
VOLUME /data

# API exposes this port:
EXPOSE 9000


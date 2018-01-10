################################################################################
# Base image
################################################################################

FROM registry.access.redhat.com/rhscl/nodejs-6-rhel7

################################################################################
# Build instructions
################################################################################
USER root
RUN yum install -y \
    ImageMagick \
    perl-App-cpanminus

RUN cpanm Image::ExifTool
COPY start.sh /start.sh
RUN chmod 755 /start.sh
USER default
RUN scl enable rh-nodejs6 "npm install converjon"
EXPOSE 8000
ENV USE_CONFIG_DIR=false

CMD ["/bin/bash", "/start.sh"]

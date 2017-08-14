################################################################################
# Base image
################################################################################

FROM node:boron

################################################################################
# Build instructions
################################################################################

RUN apt-get update && apt-get install -y \
    imagemagick \
    libimage-exiftool-perl

RUN npm install -g converjon
EXPOSE 8000
CMD [ "converjon", "--config /etc/converjon/config.yml" ]

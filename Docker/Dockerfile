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
ENV USE_CONFIG_DIR=false
COPY start.sh /start.sh
RUN chmod 755 /start.sh
CMD ["/bin/bash", "/start.sh"]

FROM node:18
ENV XDG_CONFIG_HOME /github/workspace
ENV WRANGLER_HOME /github/workspace

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
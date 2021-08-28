FROM bitnami/node:15-prod

LABEL org.opencontainers.image.source=https://github.com/ibm/open-microfrontends

# optimize memory management to use only available memory
# https://docs.cloudfoundry.org/buildpacks/node/node-tips.html
ENV OPTIMIZE_MEMORY=true

# install client
COPY client /app-client
WORKDIR /app-client

# install all node modules including dev dependecies in order to build the application
RUN yarn install --frozen-lockfile
RUN yarn build
# remove node modules as we don't need them for the client anymore
RUN rm -rf /app-client/node_modules

# install server
COPY server /app
WORKDIR /app

# install all node modules including dev dependecies in order to build the application
RUN yarn install --frozen-lockfile
RUN yarn build
# remove node modules from testing and building by using prod
RUN yarn install --frozen-lockfile --prod

CMD node dist/index.js
# Browser test runner, used by the e2e service of docker-compose.test.yml.
FROM mcr.microsoft.com/playwright:v1.64.1-noble
# Dependencies baked into the image, in /node_modules: Node finds them by walking up from /e2e.
COPY package.json package-lock.json /
RUN cd / && npm ci --silent
COPY entrypoint.sh /entrypoint.sh
WORKDIR /e2e
ENTRYPOINT ["sh", "/entrypoint.sh"]

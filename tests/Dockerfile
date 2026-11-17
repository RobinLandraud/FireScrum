# Test runner (Playwright: api and e2e projects), used by the tests service of docker-compose.test.yml.
FROM mcr.microsoft.com/playwright:v1.64.1-noble
# Dependencies baked into the image, in /node_modules: Node finds them by walking up from /tests.
COPY package.json package-lock.json /
RUN cd / && npm ci --silent
COPY entrypoint.sh /entrypoint.sh
WORKDIR /tests
ENTRYPOINT ["sh", "/entrypoint.sh"]

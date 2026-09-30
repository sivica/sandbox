FROM caddy:2-alpine
WORKDIR /srv
COPY Caddyfile /etc/caddy/Caddyfile
COPY index.html app.js styles.css HANDOFF.md README.md VERIFICATION.md ACCEPTANCE.md DEPLOYMENT.md ./
COPY evidence/ ./evidence/
ENV PORT=8080
EXPOSE 8080
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

FROM node:22-alpine AS dependencies
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY frontend/ ./
ARG NEXT_PUBLIC_SITE_URL=https://signal-rate.com
ARG NEXT_PUBLIC_API_URL=https://signal-rate.com
ARG NEXT_PUBLIC_CONTACT_EMAIL=
ARG NEXT_PUBLIC_ADSENSE_ENABLED=false
ARG NEXT_PUBLIC_ADSENSE_CLIENT=
ARG NEXT_PUBLIC_ANALYTICS_ENABLED=false
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL \
    NEXT_PUBLIC_ADSENSE_ENABLED=$NEXT_PUBLIC_ADSENSE_ENABLED \
    NEXT_PUBLIC_ADSENSE_CLIENT=$NEXT_PUBLIC_ADSENSE_CLIENT \
    NEXT_PUBLIC_ANALYTICS_ENABLED=$NEXT_PUBLIC_ANALYTICS_ENABLED
RUN npm run build
FROM node:22-alpine AS runtime
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
WORKDIR /app
RUN addgroup -S signalrate && adduser -S signalrate -G signalrate
COPY --from=build --chown=signalrate:signalrate /app/.next/standalone ./
COPY --from=build --chown=signalrate:signalrate /app/.next/static ./.next/static
COPY --from=build --chown=signalrate:signalrate /app/public ./public
USER signalrate
EXPOSE 3000
CMD ["node","server.js"]

FROM node:20-alpine
WORKDIR /app
COPY package.json yarn.lock ./
COPY backend/package.json ./backend/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn workspace @hammerai/backend build
EXPOSE 4000
CMD ["yarn", "workspace", "@hammerai/backend", "start"]

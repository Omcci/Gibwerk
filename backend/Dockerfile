FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache git

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# Initialize a Git repository for testing
RUN git init && \
    git config --global user.email "test@example.com" && \
    git config --global user.name "Test User" && \
    touch README.md && \
    git add README.md && \
    git commit -m "Initial commit"

EXPOSE 3000
CMD ["npm", "run", "start:prod"] 
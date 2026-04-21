FROM oven/bun:1-alpine

# Install dependencies
RUN apk add --no-cache tzdata \
  && cp /usr/share/zoneinfo/Asia/Almaty /etc/localtime \
  && echo "Asia/Almaty" > /etc/timezone
RUN apk update

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies (including dev dependencies)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Set timezone
RUN export TZ="Asia/Almaty" \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone

ARG VERSION_TAG
ENV VERSION_TAG=$VERSION_TAG

# Run the service
CMD bun ./dist/services/$SERVICE_NAME/index.cjs

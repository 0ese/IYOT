# Stage 1: Build with Node.js and .NET
FROM mcr.microsoft.com/dotnet/sdk:8.0-bookworm as build

# Install Node.js
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Verify installations
RUN dotnet --version && node --version && npm --version

# Stage 2: Final image
FROM mcr.microsoft.com/dotnet/runtime:8.0-bookworm-slim

# Copy Node.js from build stage
COPY --from=build /usr/lib /usr/lib
COPY --from=build /usr/local /usr/local
COPY --from=build /usr/bin/node* /usr/bin/
COPY --from=build /usr/bin/npm /usr/bin/

# Verify Node.js installation in runtime image
RUN node --version && npm --version

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install Node dependencies
RUN npm install --omit=dev

# Copy application code
COPY server/ ./server/
COPY attached_assets/ ./attached_assets/

# Create temp directory
RUN mkdir -p /app/temp

# Start bot
CMD ["npm", "start"]

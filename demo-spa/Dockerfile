FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the preview server (need vite from devDependencies)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]

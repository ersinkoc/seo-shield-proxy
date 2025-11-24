FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start the development server with proper host binding
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3001"]

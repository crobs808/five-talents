# Use official Node.js image
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy Prisma schema and migrations
COPY prisma ./prisma/

# Copy source code
COPY src ./src
COPY public ./public
COPY tsconfig.json next.config.js postcss.config.js tailwind.config.ts ./

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

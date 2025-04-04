# Build stage
FROM node:20-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_EVOLUTIONAPI_URL
ARG VITE_EVOLUTIONAPI_TOKEN

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_EVOLUTIONAPI_URL=$VITE_EVOLUTIONAPI_URL
ENV VITE_EVOLUTIONAPI_TOKEN=$VITE_EVOLUTIONAPI_TOKEN

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built assets from build stage
COPY --from=build /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start server
CMD ["serve", "-s", "dist", "-l", "3000"]
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --only=production && npm install typescript @types/node @types/express @types/cors @types/multer @types/jsonwebtoken @types/nodemailer

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create uploads directory
RUN mkdir -p /app/uploads/documents

# Make startup script executable
RUN chmod +x /app/scripts/start.sh

# Run as non-root user (node user already exists in node:20-alpine)
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 4000

# Use startup script (generates demo PDFs in demo mode, then starts server)
CMD ["/bin/sh", "/app/scripts/start.sh"]

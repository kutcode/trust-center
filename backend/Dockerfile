FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm install typescript @types/node @types/express @types/cors @types/multer @types/jsonwebtoken @types/nodemailer

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 4000

# Start production server
CMD ["node", "dist/server.js"]

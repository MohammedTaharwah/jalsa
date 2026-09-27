FROM node:20-alpine

WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy remaining frontend source code
COPY . .

# Expose Vite default dev server port
EXPOSE 5173

# Start Vite dev server binding to 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

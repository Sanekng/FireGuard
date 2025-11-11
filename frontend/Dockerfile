# Use full Node image (not Alpine)
FROM node:20

# Set working directory
WORKDIR /app

# Copy only package files first (for build caching)
COPY package*.json ./

# Install ALL dependencies (including dev dependencies)
RUN npm cache clean --force && npm install

# Copy the rest of the frontend code
COPY . .

# Expose the default Vite dev port
EXPOSE 5173

# Start Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
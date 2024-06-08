# Use the official Node.js image as a base
FROM node:18

# Create and set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Ensure the directories for uploads and videos exist
RUN mkdir -p uploads videos

# Expose the port the app runs on
EXPOSE 3000

# Run the app
CMD ["node", "src/server.js"]

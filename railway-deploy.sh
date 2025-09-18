#!/bin/bash

# Railway deployment script to ensure persistent file storage

echo "Starting Railway deployment setup..."

# Create persistent data directory if it doesn't exist
mkdir -p data/uploads

# If uploads directory exists (from previous deployments), move files to persistent storage
if [ -d "uploads" ] && [ "$(ls -A uploads)" ]; then
    echo "Found existing uploads directory, moving files to persistent storage..."
    cp -r uploads/* data/uploads/ 2>/dev/null || true
    echo "Files moved to data/uploads/"
fi

# Set proper permissions
chmod -R 755 data/

echo "Persistent storage setup complete"
echo "Files will be stored in: $(pwd)/data/uploads"

# Continue with normal build process
npm ci
npm run build

echo "Railway deployment setup finished"
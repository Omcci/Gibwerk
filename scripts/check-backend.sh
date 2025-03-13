#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BACKEND_URL="http://localhost:3001"
HEALTH_ENDPOINT="/health"

echo "Checking if backend is running at ${BACKEND_URL}..."

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo -e "${RED}curl is not installed. Please install it first.${NC}"
    exit 1
fi

# Try to connect to the backend
if curl -s --head --request GET "${BACKEND_URL}${HEALTH_ENDPOINT}" | grep "200 OK" > /dev/null; then
    echo -e "${GREEN}Backend is running and accessible.${NC}"
    exit 0
else
    echo -e "${RED}Backend is not running or not accessible.${NC}"
    echo "Possible issues:"
    echo "1. Backend server is not running"
    echo "2. Backend server is running but not responding to requests"
    echo "3. There might be a network issue"
    echo ""
    echo "Try running the backend separately with:"
    echo "make backend"
    exit 1
fi 
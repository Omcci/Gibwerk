#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Checking if PostgreSQL is running locally..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL is not installed. Please install it first.${NC}"
    echo "On macOS, you can use: brew install postgresql@15"
    echo "Then start it with: brew services start postgresql@15"
    exit 1
fi

# Check if PostgreSQL service is running
if ! pg_isready -h localhost > /dev/null 2>&1; then
    echo -e "${RED}PostgreSQL is not running. Please start it.${NC}"
    echo "On macOS, you can use: brew services start postgresql@15"
    exit 1
fi

echo -e "${GREEN}PostgreSQL is running.${NC}"

# Check if the database exists
DB_EXISTS=$(psql -h localhost -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='git_calendar'" 2>/dev/null)

if [ "$DB_EXISTS" != "1" ]; then
    echo "Creating git_calendar database..."
    psql -h localhost -U postgres -c "CREATE DATABASE git_calendar;" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Database git_calendar created successfully.${NC}"
    else
        echo -e "${RED}Failed to create database. You may need to create it manually:${NC}"
        echo "psql -h localhost -U postgres -c \"CREATE DATABASE git_calendar;\""
    fi
else
    echo -e "${GREEN}Database git_calendar already exists.${NC}"
fi

echo -e "${GREEN}PostgreSQL setup complete.${NC}"
exit 0 
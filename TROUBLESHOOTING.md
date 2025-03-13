# Troubleshooting Guide

This guide helps you solve common issues with the development environment.

## Database Connection Issues

### Error: `getaddrinfo ENOTFOUND postgres`

This error occurs when the backend can't connect to the PostgreSQL database.

**Solution 1: Use the local development environment**

If you're developing locally without Docker:

```bash
make dev-local
```

This will start the frontend and backend without requiring Docker for the database.

**Solution 2: Ensure Docker is running**

If you want to use Docker:

1. Make sure Docker is running on your machine
2. Run the following commands:

```bash
make purge  # Clean up all Docker resources
make dev    # Start the development environment
```

### Error: `net::ERR_CONNECTION_REFUSED` when accessing API endpoints

This happens when the frontend can't connect to the backend API.

**Solutions:**

1. Check if the backend is running:
   - Look for NestJS logs in the terminal
   - Ensure there are no errors in the logs

2. Try running the backend separately to see any errors:
   ```bash
   make backend
   ```

3. Verify the API URL:
   - Check that `NEXT_PUBLIC_API_URL` in `frontend/.env.local` is set to `http://localhost:3001`

4. Try running frontend and backend in separate terminals:
   ```bash
   # In terminal 1
   make frontend
   
   # In terminal 2
   make backend
   ```

## PostgreSQL Issues

### Local PostgreSQL Setup

If you're using a local PostgreSQL installation:

1. Install PostgreSQL:
   ```bash
   brew install postgresql@15
   ```

2. Start the PostgreSQL service:
   ```bash
   brew services start postgresql@15
   ```

3. Create the database:
   ```bash
   psql -h localhost -U postgres -c "CREATE DATABASE git_calendar;"
   ```

### Docker PostgreSQL Issues

If you're using Docker for PostgreSQL:

1. Check if the container is running:
   ```bash
   docker ps | grep postgres
   ```

2. Check the logs:
   ```bash
   docker logs $(docker ps -q --filter name=postgres)
   ```

## General Troubleshooting

1. Clear all Docker resources:
   ```bash
   make purge
   ```

2. Reinstall dependencies:
   ```bash
   make install
   ```

3. Check environment variables:
   - Ensure `.env` file exists in the root directory
   - Ensure `.env.local` exists in the frontend directory
   - Ensure `.env` exists in the backend directory

4. Run services separately for better debugging:
   ```bash
   # Run just the frontend
   make frontend
   
   # Run just the backend
   make backend
   
   # Run backend in debug mode
   make backend-debug
   ``` 
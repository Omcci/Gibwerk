#!/bin/bash

# Backup directory
BACKUP_DIR="/Users/omci/Documents/Perso/Gibwerk/database-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/git_calendar_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Run backup
echo "Creating backup at $BACKUP_FILE"
docker exec gibwerk-postgres-1 pg_dump -U postgres git_calendar > $BACKUP_FILE

# Compress the backup
gzip $BACKUP_FILE
echo "Backup completed and compressed: ${BACKUP_FILE}.gz"

# Remove backups older than 7 days
find $BACKUP_DIR -name "git_calendar_*.sql.gz" -type f -mtime +7 -delete
echo "Old backups cleaned up" 
# Persistent Data Storage

This directory contains persistent data files for the Mirage Tenders Tracking System.

## Files:
- `persistent-storage.json` - Main data storage file containing all leads, users, and settings
- `*.backup` - Backup files for data recovery

## Important:
- This directory MUST be persistent on Railway to prevent data loss
- Do NOT delete files in this directory unless absolutely necessary
- Files are automatically backed up before writes
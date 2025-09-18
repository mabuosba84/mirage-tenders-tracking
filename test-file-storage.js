#!/usr/bin/env node

// Test script to verify file storage functionality

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing File Storage System...\n');

// Check if data/uploads directory exists
const dataUploadsDir = path.join(process.cwd(), 'data', 'uploads');
const oldUploadsDir = path.join(process.cwd(), 'uploads');

console.log('📁 Directory Check:');
console.log(`data/uploads exists: ${fs.existsSync(dataUploadsDir)}`);
console.log(`old uploads exists: ${fs.existsSync(oldUploadsDir)}`);

if (fs.existsSync(dataUploadsDir)) {
    const files = fs.readdirSync(dataUploadsDir);
    const metaFiles = files.filter(f => f.endsWith('.meta'));
    const dataFiles = files.filter(f => !f.endsWith('.meta'));
    
    console.log(`\n📊 File Count in data/uploads:`);
    console.log(`Metadata files: ${metaFiles.length}`);
    console.log(`Data files: ${dataFiles.length}`);
    
    // Read first few metadata files to check document types
    console.log('\n📄 Document Types Found:');
    const documentTypes = new Set();
    
    metaFiles.slice(0, 5).forEach(metaFile => {
        try {
            const metaPath = path.join(dataUploadsDir, metaFile);
            const metaContent = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
            documentTypes.add(metaContent.fileType);
            console.log(`${metaFile}: ${metaContent.fileType} (${metaContent.filename})`);
        } catch (error) {
            console.log(`${metaFile}: Error reading metadata`);
        }
    });
    
    console.log('\n📋 Document Type Summary:');
    Array.from(documentTypes).forEach(type => {
        console.log(`- ${type}`);
    });
}

console.log('\n✅ File storage test complete!');
console.log('\n💡 Files should now be accessible via:');
console.log('http://localhost:3000/api/files/[file-id]');
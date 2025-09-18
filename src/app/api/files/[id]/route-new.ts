import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Local file storage for production builds
const getLocalStoragePath = () => {
  return path.join(process.cwd(), 'uploads');
};

const ensureUploadsDir = () => {
  const uploadsDir = getLocalStoragePath();
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

const isLocalEnvironment = () => {
  // Use file system for Railway persistent storage, local production, but not Vercel
  return (
    process.env.NODE_ENV === 'production' && 
    !process.env.VERCEL && 
    !process.env.NETLIFY
  ) || process.env.RAILWAY_ENVIRONMENT;
};

// Vercel-compatible file upload using base64 storage
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('type') as string
    const tenderId = formData.get('tenderId') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Check file size (limit to 5MB for Vercel)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }
    
    // Generate unique file ID
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Convert file to buffer and base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Data = buffer.toString('base64')
    
    // Create file metadata
    const fileMetadata = {
      filename: file.name,
      mimetype: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      fileType: fileType,
      tenderId: tenderId
    };

    // Store in local file system if in Railway/local production
    if (isLocalEnvironment()) {
      try {
        const uploadsDir = ensureUploadsDir();
        const filePath = path.join(uploadsDir, fileId);
        const metaPath = path.join(uploadsDir, `${fileId}.meta`);
        
        fs.writeFileSync(filePath, buffer);
        fs.writeFileSync(metaPath, JSON.stringify(fileMetadata, null, 2));
        
        console.log('File saved to local storage:', fileId);
      } catch (error) {
        console.error('Error saving to local storage:', error);
      }
    }
    
    console.log(`File processed for storage: ${file.name} (${fileId})`)
    
    // Return file info (without data to reduce response size)
    return NextResponse.json({
      id: fileId,
      name: file.name,
      type: fileType,
      url: `/api/files/${fileId}`,
      uploadedAt: fileMetadata.uploadedAt,
      size: file.size,
      crossDomainCompatible: true
    })
    
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

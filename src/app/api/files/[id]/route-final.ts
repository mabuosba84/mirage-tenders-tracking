import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Always use filesystem storage for Railway - simple and reliable
const getUploadsDir = () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const fileId = resolvedParams.id
    
    console.log('🔍 File request for:', fileId);
    
    const uploadsDir = getUploadsDir();
    const filePath = path.join(uploadsDir, fileId);
    const metaPath = path.join(uploadsDir, `${fileId}.meta`);
    
    // Check if file exists
    if (!fs.existsSync(filePath) || !fs.existsSync(metaPath)) {
      console.log('❌ File not found:', fileId);
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Read file and metadata
    const fileBuffer = fs.readFileSync(filePath);
    const metaContent = fs.readFileSync(metaPath, 'utf-8');
    const fileMeta = JSON.parse(metaContent);
    
    console.log('✅ File found and served:', fileId, 'Type:', fileMeta.mimetype);
    
    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': fileMeta.mimetype || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${fileMeta.filename || fileId}"`,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': fileMeta.size.toString(),
      }
    });
    
  } catch (error) {
    console.error('❌ File serving error:', error);
    return new NextResponse('Server error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate unique file ID
    const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const fileMetadata = {
      filename: file.name,
      mimetype: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString()
    };

    // Ensure uploads directory exists
    const uploadsDir = getUploadsDir();
    const filePath = path.join(uploadsDir, fileId);
    const metaPath = path.join(uploadsDir, `${fileId}.meta`);
    
    // Save file and metadata
    fs.writeFileSync(filePath, buffer);
    fs.writeFileSync(metaPath, JSON.stringify(fileMetadata, null, 2));
    
    console.log('✅ File uploaded successfully:', fileId, 'Name:', file.name, 'Size:', file.size);
    
    return NextResponse.json({ 
      fileId, 
      filename: file.name, 
      size: file.size,
      id: fileId,
      name: file.name,
      url: `/api/files/${fileId}`
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
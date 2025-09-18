import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const fileId = resolvedParams.id
    
    // Simple file serving from persistent data/uploads directory
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    const filePath = path.join(uploadsDir, fileId);
    const metaPath = path.join(uploadsDir, `${fileId}.meta`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('File not found:', fileId);
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Get file metadata if available
    let contentType = 'application/octet-stream';
    let filename = fileId;
    
    if (fs.existsSync(metaPath)) {
      try {
        const metaContent = fs.readFileSync(metaPath, 'utf-8');
        const fileMeta = JSON.parse(metaContent);
        contentType = fileMeta.mimetype || contentType;
        filename = fileMeta.filename || filename;
      } catch (error) {
        console.log('Could not read metadata for:', fileId);
      }
    }
    
    // Read and return file
    const fileBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400'
      }
    });
    
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal server error', { status: 500 });
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
    
    // Prepare metadata
    const fileMetadata = {
      filename: file.name,
      mimetype: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString()
    };

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Save file and metadata
    const filePath = path.join(uploadsDir, fileId);
    const metaPath = path.join(uploadsDir, `${fileId}.meta`);
    
    fs.writeFileSync(filePath, buffer);
    fs.writeFileSync(metaPath, JSON.stringify(fileMetadata, null, 2));
    
    console.log('File uploaded:', fileId, file.name, file.size, 'bytes');
    
    return NextResponse.json({ 
      fileId, 
      filename: file.name, 
      size: file.size 
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

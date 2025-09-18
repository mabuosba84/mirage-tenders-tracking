import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let resolvedParams: { id: string } | null = null;
  
  try {
    resolvedParams = await params
    const fileId = resolvedParams.id
    
    console.log('=== FILE REQUEST DEBUG ===');
    console.log('File ID:', fileId);
    console.log('Working directory:', process.cwd());
    
    // Simple file serving from uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, fileId);
    const metaPath = path.join(uploadsDir, `${fileId}.meta`);
    
    console.log('Upload dir:', uploadsDir);
    console.log('File path:', filePath);
    console.log('Meta path:', metaPath);
    
    // Check uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      console.log('Uploads directory does not exist, creating...');
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // List files in uploads directory for debugging
    try {
      const files = fs.readdirSync(uploadsDir);
      console.log('Files in uploads directory:', files);
    } catch (error) {
      console.log('Could not read uploads directory:', error);
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('File not found:', fileId);
      
      // Return helpful debug info instead of just "File not found"
      const debugInfo = {
        fileId,
        uploadsDir,
        filePath,
        workingDir: process.cwd(),
        uploadsDirExists: fs.existsSync(uploadsDir),
        filesInUploads: fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : []
      };
      
      return new NextResponse(
        `File not found. Debug info: ${JSON.stringify(debugInfo, null, 2)}`, 
        { 
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        }
      );
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
    console.error('=== FILE SERVING ERROR ===');
    console.error('Error details:', error);
    console.error('File ID:', resolvedParams?.id);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new NextResponse(
      `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      }
    );
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

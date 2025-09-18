import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const fileId = params.id;
    
    // Direct file serving for view (same as main file endpoint)
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, fileId);
    const metaPath = path.join(uploadsDir, `${fileId}.meta`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Get file metadata
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
    
    // Read and return file with inline disposition for viewing
    const fileBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400'
      }
    });
    
  } catch (error) {
    console.error('Error serving file for view:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
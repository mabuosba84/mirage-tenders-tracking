import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { globalStorage } from '../../../../utils/globalStorage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const fileId = resolvedParams.id
    
    console.log('GET file request for:', fileId);
    
    // For Railway deployment, prioritize persistent file storage
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, fileId);
    const metaPath = path.join(uploadsDir, `${fileId}.meta`);
    
    // First try file system storage (Railway persistent)
    if (fs.existsSync(filePath) && fs.existsSync(metaPath)) {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const metaContent = fs.readFileSync(metaPath, 'utf-8');
        const fileMeta = JSON.parse(metaContent);
        
        console.log('File found in persistent storage:', fileId, 'Size:', fileMeta.size);
        
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': fileMeta.mimetype || 'application/octet-stream',
            'Content-Disposition': `inline; filename="${fileMeta.filename || fileId}"`,
            'Cache-Control': 'public, max-age=3600'
          }
        });
      } catch (error) {
        console.error('Error reading from persistent storage:', error);
      }
    }
    
    // Fallback to global storage (memory) for development/Vercel
    console.log('Available files in global storage:', globalStorage.files.map(f => f.id));
    const storedFile = globalStorage.files.find(f => f.id === fileId);
    if (storedFile) {
      const fileBuffer = Buffer.from(storedFile.data, 'base64');
      console.log('File found in global storage:', fileId, 'Size:', storedFile.meta.size);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': storedFile.meta.mimetype || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${storedFile.meta.filename || fileId}"`,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
    
    console.log('File not found anywhere:', fileId);
    return new NextResponse('File not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    
  } catch (error) {
    console.error('Error accessing file:', error)
    return new NextResponse('Server error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const fileMetadata = {
      filename: file.name,
      mimetype: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString()
    };

    // Always store in persistent file system for Railway
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, fileId);
    const metaPath = path.join(uploadsDir, `${fileId}.meta`);
    
    try {
      fs.writeFileSync(filePath, buffer);
      fs.writeFileSync(metaPath, JSON.stringify(fileMetadata, null, 2));
      console.log('File saved to persistent storage:', fileId, 'Size:', file.size);
    } catch (error) {
      console.error('Error saving to persistent storage:', error);
      return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
    }

    // Also store in global storage as backup (for development)
    globalStorage.files.push({
      id: fileId,
      data: buffer.toString('base64'),
      meta: fileMetadata
    });
    globalStorage.lastUpdated = new Date().toISOString();

    console.log('File uploaded with ID:', fileId, 'Total files in persistent storage');
    
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

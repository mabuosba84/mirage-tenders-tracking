import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { globalStorage } from '../../../../utils/globalStorage'

const ensureUploadsDir = () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

const isRailwayOrProduction = () => {
  // Railway and other platforms with persistent filesystem
  return process.env.RAILWAY_ENVIRONMENT || 
         (process.env.NODE_ENV === 'production' && !process.env.VERCEL);
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const fileId = resolvedParams.id
    
    console.log('GET file request for:', fileId);
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY: !!process.env.RAILWAY_ENVIRONMENT,
      VERCEL: !!process.env.VERCEL
    });
    
    // Try filesystem first (Railway, local production)
    if (isRailwayOrProduction()) {
      try {
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const filePath = path.join(uploadsDir, fileId);
        const metaPath = path.join(uploadsDir, `${fileId}.meta`);
        
        if (fs.existsSync(filePath) && fs.existsSync(metaPath)) {
          const fileBuffer = fs.readFileSync(filePath);
          const metaContent = fs.readFileSync(metaPath, 'utf-8');
          const fileMeta = JSON.parse(metaContent);
          
          console.log('File found in filesystem storage:', fileId);
          
          return new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': fileMeta.mimetype || 'application/octet-stream',
              'Content-Disposition': `inline; filename="${fileMeta.filename || fileId}"`,
              'Cache-Control': 'public, max-age=3600'
            }
          });
        }
      } catch (error) {
        console.error('Error reading from filesystem storage:', error);
      }
    }

    // Fallback to global storage (for Vercel and development)
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
    console.log('Available files in global storage:', globalStorage.files.map(f => f.id));
    
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

    console.log('Uploading file:', fileId, 'Environment check:', {
      isRailwayOrProduction: isRailwayOrProduction(),
      RAILWAY_ENVIRONMENT: !!process.env.RAILWAY_ENVIRONMENT,
      NODE_ENV: process.env.NODE_ENV
    });

    // Store in filesystem (Railway, local production)
    if (isRailwayOrProduction()) {
      try {
        const uploadsDir = ensureUploadsDir();
        const filePath = path.join(uploadsDir, fileId);
        const metaPath = path.join(uploadsDir, `${fileId}.meta`);
        
        fs.writeFileSync(filePath, buffer);
        fs.writeFileSync(metaPath, JSON.stringify(fileMetadata, null, 2));
        
        console.log('File saved to filesystem storage:', fileId);
      } catch (error) {
        console.error('Error saving to filesystem storage:', error);
      }
    }

    // Also store in global storage (backup for Vercel, immediate access)
    globalStorage.files.push({
      id: fileId,
      data: buffer.toString('base64'),
      meta: fileMetadata
    });
    globalStorage.lastUpdated = new Date().toISOString();

    console.log('File uploaded with ID:', fileId, 'Total files in storage:', globalStorage.files.length);
    
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
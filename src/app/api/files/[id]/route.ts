import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { globalStorage } from '../../../../utils/globalStorage'

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
  // Only use file system for local production builds, not on Vercel
  return process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.RAILWAY && !process.env.NETLIFY;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const fileId = resolvedParams.id
    
    console.log('GET file request for:', fileId);
    
    let fileData;
    let fileMeta;
    
    // Try local file system first (for local production)
    if (isLocalEnvironment()) {
      try {
        const uploadsDir = getLocalStoragePath();
        const filePath = path.join(uploadsDir, fileId);
        const metaPath = path.join(uploadsDir, `${fileId}.meta`);
        
        if (fs.existsSync(filePath) && fs.existsSync(metaPath)) {
          const fileBuffer = fs.readFileSync(filePath);
          const metaContent = fs.readFileSync(metaPath, 'utf-8');
          fileMeta = JSON.parse(metaContent);
          fileData = { data: fileBuffer, meta: fileMeta };
          console.log('File found in local storage:', fileId);
        }
      } catch (error) {
        console.error('Error reading from local storage:', error);
      }
    }
    
    // Fallback to global storage (for Vercel)
    if (!fileData) {
      const storedFile = globalStorage.files.find(f => f.id === fileId);
      if (storedFile) {
        fileData = {
          data: Buffer.from(storedFile.data, 'base64'),
          meta: storedFile.meta
        };
        console.log('File found in global storage:', fileId);
      }
    }
    
    if (!fileData) {
      console.log('File not found in any storage:', fileId);
      
      // Return a clean placeholder for missing files
      const placeholderContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Document</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body { height: 100%; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f8f9fa;
                color: #495057;
              }
              .placeholder { 
                text-align: center;
                padding: 40px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                max-width: 400px;
              }
              .icon { font-size: 64px; margin-bottom: 20px; opacity: 0.6; }
              h2 { margin-bottom: 8px; font-weight: 500; }
              p { margin: 8px 0; opacity: 0.8; }
              .file-id { 
                font-family: monospace; 
                background: #f8f9fa; 
                padding: 4px 8px; 
                border-radius: 4px; 
                font-size: 12px;
                margin: 16px 0;
              }
            </style>
          </head>
          <body>
            <div class="placeholder">
              <div class="icon">�</div>
              <h2>Document</h2>
              <p>File not found in current session</p>
              <div class="file-id">${fileId}</div>
              <p><small>Files are stored temporarily in serverless environment</small></p>
            </div>
          </body>
        </html>
      `;
      
      return new NextResponse(placeholderContent, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    // Return the actual file data
    return new NextResponse(new Uint8Array(fileData.data), {
      headers: {
        'Content-Type': fileData.meta.mimetype || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${fileData.meta.filename || fileId}"`,
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('Error accessing file:', error)
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>File Error</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
            .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ File Error</h2>
            <p>Unable to load file: ${error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </body>
      </html>
    `;
    
    return new NextResponse(errorHtml, {
      headers: { 'Content-Type': 'text/html' },
      status: 500
    });
  }
}

// Handle file uploads in POST
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

    // Store in local file system if in local production
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
    
    // Also store in global storage (for Vercel)
    globalStorage.files.push({
      id: fileId,
      data: buffer.toString('base64'),
      meta: fileMetadata
    });
    globalStorage.lastUpdated = new Date().toISOString();

    console.log('File stored with ID:', fileId);    return NextResponse.json({ 
      fileId, 
      filename: file.name, 
      size: file.size 
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

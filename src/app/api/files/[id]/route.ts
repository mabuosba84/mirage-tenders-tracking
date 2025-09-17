import { NextRequest, NextResponse } from 'next/server'

// In-memory file storage for Vercel serverless
const fileStorage = new Map<string, { data: Buffer; meta: any }>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const fileId = resolvedParams.id
    
    console.log('GET file request for:', fileId);
    
    // Check if file exists in memory storage
    const fileData = fileStorage.get(fileId);
    
    if (!fileData) {
      console.log('File not found in memory storage:', fileId);
      
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
    
    // Store in memory
    fileStorage.set(fileId, {
      data: buffer,
      meta: {
        filename: file.name,
        mimetype: file.type,
        size: file.size
      }
    });
    
    console.log('File stored with ID:', fileId);
    
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

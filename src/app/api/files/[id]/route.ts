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
      
      // Return a placeholder image/document for demo purposes
      const placeholderContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>File: ${fileId}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f8f9fa; }
              .placeholder { background: white; padding: 60px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .file-icon { font-size: 64px; margin-bottom: 20px; }
              h2 { color: #343a40; margin-bottom: 10px; }
              p { color: #6c757d; margin: 10px 0; }
              .download-btn { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; display: inline-block; }
              .download-btn:hover { background: #0056b3; }
            </style>
          </head>
          <body>
            <div class="placeholder">
              <div class="file-icon">📎</div>
              <h2>File: ${fileId}</h2>
              <p>This is a placeholder for the uploaded file.</p>
              <p><strong>Note:</strong> In Vercel's serverless environment, uploaded files are stored temporarily.</p>
              <p>File ID: <code>${fileId}</code></p>
              <a href="#" class="download-btn" onclick="alert('File download would start here in a production environment')">Download Original File</a>
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

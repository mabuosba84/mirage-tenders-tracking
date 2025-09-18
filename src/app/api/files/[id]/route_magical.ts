import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// 🪄 MAGICAL FILE VIEWER - Enhanced for Railway Production 🪄

const getLocalStoragePath = () => {
  return path.join(process.cwd(), 'uploads');
};

const isRailwayEnvironment = () => {
  return process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_ENVIRONMENT;
};

// Enhanced MIME type detection
const getMimeType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const fileId = resolvedParams.id
    const url = new URL(request.url)
    const download = url.searchParams.get('download') === 'true'
    
    console.log('🪄 Magical file viewer request for:', fileId);
    console.log('🚂 Railway Environment:', isRailwayEnvironment());
    console.log('📥 Download mode:', download);
    
    // Railway persistent storage path
    const uploadsDir = getLocalStoragePath();
    const filePath = path.join(uploadsDir, fileId);
    const metaPath = path.join(uploadsDir, `${fileId}.meta`);
    
    console.log('📁 Checking file path:', filePath);
    console.log('📋 Checking meta path:', metaPath);
    
    // Check if files exist
    const fileExists = fs.existsSync(filePath);
    const metaExists = fs.existsSync(metaPath);
    
    console.log('📄 File exists:', fileExists);
    console.log('📋 Meta exists:', metaExists);
    
    if (!fileExists) {
      console.log('❌ File not found, returning error page');
      
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>File Not Found - Mirage Lead Tracking</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 40px 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .container {
                background: white;
                border-radius: 16px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 500px;
                width: 100%;
              }
              .icon {
                font-size: 80px;
                margin-bottom: 24px;
                color: #e74c3c;
              }
              h1 {
                color: #2c3e50;
                margin-bottom: 16px;
                font-size: 24px;
                font-weight: 600;
              }
              p {
                color: #7f8c8d;
                margin-bottom: 16px;
                line-height: 1.6;
              }
              .file-id {
                background: #f8f9fa;
                padding: 12px;
                border-radius: 8px;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 14px;
                color: #495057;
                margin: 20px 0;
                word-break: break-all;
              }
              .btn {
                background: #3498db;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                text-decoration: none;
                display: inline-block;
                font-weight: 500;
                transition: background 0.3s;
              }
              .btn:hover {
                background: #2980b9;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">🚫</div>
              <h1>File Not Found</h1>
              <p>The requested file could not be located on the server.</p>
              <div class="file-id">File ID: ${fileId}</div>
              <p><small>This might be a temporary file that has been cleaned up, or the file ID is incorrect.</small></p>
              <a href="/" class="btn">Return to Dashboard</a>
            </div>
          </body>
        </html>
      `;
      
      return new NextResponse(errorHtml, {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    // Read file and metadata
    let metadata = { filename: fileId, mimetype: 'application/octet-stream' };
    
    if (metaExists) {
      try {
        const metaContent = fs.readFileSync(metaPath, 'utf-8');
        metadata = JSON.parse(metaContent);
        console.log('📋 Loaded metadata:', metadata);
      } catch (metaError) {
        console.warn('⚠️ Failed to parse metadata:', metaError);
      }
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    console.log('📄 File loaded, size:', fileBuffer.length, 'bytes');
    
    // Enhanced MIME type detection
    const detectedMimeType = getMimeType(metadata.filename || fileId);
    const finalMimeType = metadata.mimetype || detectedMimeType;
    
    console.log('🎯 Final MIME type:', finalMimeType);
    
    // If download is requested, force download
    if (download) {
      console.log('📥 Forcing download');
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${metadata.filename || fileId}"`,
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    // For viewable files, return them directly
    if (finalMimeType.startsWith('image/') || 
        finalMimeType === 'application/pdf' || 
        finalMimeType.startsWith('text/')) {
      
      console.log('👀 Returning viewable file directly');
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': finalMimeType,
          'Content-Disposition': `inline; filename="${metadata.filename || fileId}"`,
          'Cache-Control': 'public, max-age=31536000',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // For other files, create a preview page
    console.log('📋 Creating preview page for non-viewable file');
    
    const previewHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${metadata.filename || fileId} - Mirage Lead Tracking</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
              padding: 40px 20px;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              border-radius: 16px;
              padding: 40px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 500px;
              width: 100%;
            }
            .icon {
              font-size: 80px;
              margin-bottom: 24px;
              color: #3498db;
            }
            h1 {
              color: #2c3e50;
              margin-bottom: 16px;
              font-size: 24px;
              font-weight: 600;
            }
            .file-info {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 12px;
              margin: 24px 0;
              text-align: left;
            }
            .file-info h3 {
              margin: 0 0 12px 0;
              color: #2c3e50;
              font-size: 16px;
            }
            .file-info p {
              margin: 8px 0;
              color: #495057;
              font-size: 14px;
            }
            .btn {
              background: #27ae60;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              text-decoration: none;
              display: inline-block;
              font-weight: 500;
              margin: 8px;
              transition: background 0.3s;
            }
            .btn:hover {
              background: #219a52;
            }
            .btn-secondary {
              background: #95a5a6;
            }
            .btn-secondary:hover {
              background: #7f8c8d;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📄</div>
            <h1>File Preview</h1>
            
            <div class="file-info">
              <h3>File Information</h3>
              <p><strong>Name:</strong> ${metadata.filename || 'Unknown'}</p>
              <p><strong>Type:</strong> ${finalMimeType}</p>
              <p><strong>Size:</strong> ${(fileBuffer.length / 1024).toFixed(2)} KB</p>
              <p><strong>ID:</strong> ${fileId}</p>
            </div>
            
            <a href="/api/files/${fileId}?download=true" class="btn">
              📥 Download File
            </a>
            <a href="/" class="btn btn-secondary">
              🏠 Return to Dashboard
            </a>
          </div>
        </body>
      </html>
    `;
    
    return new NextResponse(previewHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('💥 Magical file viewer error:', error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Server Error - Mirage Lead Tracking</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
              margin: 0;
              padding: 40px 20px;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
            }
            .container {
              background: rgba(255,255,255,0.1);
              backdrop-filter: blur(10px);
              border-radius: 16px;
              padding: 40px;
              text-align: center;
              max-width: 500px;
              width: 100%;
              border: 1px solid rgba(255,255,255,0.2);
            }
            .icon {
              font-size: 80px;
              margin-bottom: 24px;
            }
            h1 {
              margin-bottom: 16px;
              font-size: 24px;
              font-weight: 600;
            }
            p {
              margin-bottom: 16px;
              line-height: 1.6;
              opacity: 0.9;
            }
            .btn {
              background: rgba(255,255,255,0.2);
              color: white;
              padding: 12px 24px;
              border: 1px solid rgba(255,255,255,0.3);
              border-radius: 8px;
              text-decoration: none;
              display: inline-block;
              font-weight: 500;
              transition: all 0.3s;
            }
            .btn:hover {
              background: rgba(255,255,255,0.3);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">⚡</div>
            <h1>Server Error</h1>
            <p>An unexpected error occurred while processing your request.</p>
            <p><small>Error: ${error instanceof Error ? error.message : 'Unknown error'}</small></p>
            <a href="/" class="btn">Return to Dashboard</a>
          </div>
        </body>
      </html>
    `;
    
    return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

// Handle file upload
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Magical file upload started');
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const uploadsDir = getLocalStoragePath()
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    
    const filePath = path.join(uploadsDir, fileId)
    const metaPath = path.join(uploadsDir, `${fileId}.meta`)
    
    // Save file data
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync(filePath, buffer)
    
    // Save metadata
    const metadata = {
      filename: file.name,
      mimetype: file.type || getMimeType(file.name),
      size: file.size,
      uploadedAt: new Date().toISOString()
    }
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2))
    
    console.log('✅ File saved successfully:', fileId);
    console.log('📋 Metadata:', metadata);
    
    return NextResponse.json({
      id: fileId,
      filename: file.name,
      size: file.size,
      mimetype: metadata.mimetype
    })
  } catch (error) {
    console.error('💥 File upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
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
    
    console.log('🪄 File request for:', fileId);
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, fileId);
    const metaPath = path.join(uploadsDir, fileId + '.meta');
    
    if (fs.existsSync(filePath) && fs.existsSync(metaPath)) {
      const fileBuffer = fs.readFileSync(filePath);
      const metaContent = fs.readFileSync(metaPath, 'utf-8');
      const fileMeta = JSON.parse(metaContent);
      
      console.log('✅ File found:', fileId);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': fileMeta.mimetype || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${fileMeta.filename || fileId}"`,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
    
    console.log('❌ File not found:', fileId);
    
    // Return a nice 404 page
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
            <p><small>This file may have been cleaned up, or the file ID is incorrect.</small></p>
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
    
  } catch (error) {
    console.error('💥 File viewer error:', error);
    
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

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 File upload started');
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const uploadsDir = path.join(process.cwd(), 'uploads')
    
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
      mimetype: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2))
    
    console.log('✅ File saved successfully:', fileId);
    
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
    const resolvedParams = await params
    const fileId = resolvedParams.id
    
    console.log('🪄 Magical file viewer request for:', fileId);
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
      if (storedFile) {
        fileData = {
          data: Buffer.from(storedFile.data, 'base64'),
          meta: storedFile.meta
        };
        console.log('File found in global storage:', fileId);
      }
    // File not found - return 404 with nice error page
    console.log('❌ File not found:', fileId);
    
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
            <p><small>This file may have been cleaned up, or the file ID is incorrect.</small></p>
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
    
  } catch (error) {
    console.error('💥 File viewer error:', error);
    
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
    console.log('🚀 File upload started');
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const uploadsDir = path.join(process.cwd(), 'uploads')
    
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
      mimetype: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2))
    
    console.log('✅ File saved successfully:', fileId);
    
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

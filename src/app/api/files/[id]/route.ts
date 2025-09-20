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
    
    console.log('🔍 File request for ID:', fileId)
    
    // Simple file serving from persistent data/uploads directory
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    const filePath = path.join(uploadsDir, fileId);
    const metaPath = path.join(uploadsDir, `${fileId}.meta`);
    
    console.log('📁 Checking paths:')
    console.log('  - Main path:', filePath)
    console.log('  - Meta path:', metaPath)
    console.log('  - Uploads dir exists:', fs.existsSync(uploadsDir))
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found:', fileId, 'at path:', filePath);
      
      // List available files for debugging
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        console.log('📂 Available files in uploads dir:', files.slice(0, 10)); // First 10 files
      }
      
      // Try alternative paths for backwards compatibility
      const altPath1 = path.join(process.cwd(), 'uploads', fileId);
      const altPath2 = path.join(process.cwd(), 'data', fileId);
      
      console.log('🔄 Trying alternative paths:')
      console.log('  - Alt path 1:', altPath1, '- exists:', fs.existsSync(altPath1))
      console.log('  - Alt path 2:', altPath2, '- exists:', fs.existsSync(altPath2))
      
      if (fs.existsSync(altPath1)) {
        console.log('✅ Found file in alternative location:', altPath1);
        const fileBuffer = fs.readFileSync(altPath1);
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `inline; filename="${fileId}"`,
            'Cache-Control': 'public, max-age=86400'
          }
        });
      } else if (fs.existsSync(altPath2)) {
        console.log('✅ Found file in alternative location:', altPath2);
        const fileBuffer = fs.readFileSync(altPath2);
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `inline; filename="${fileId}"`,
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }
      
      console.log('❌ File not found in any location:', fileId)
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Get file metadata if available
    let contentType = 'application/octet-stream';
    let filename = fileId;
    
    console.log('📋 Reading metadata from:', metaPath)
    
    if (fs.existsSync(metaPath)) {
      try {
        const metaContent = fs.readFileSync(metaPath, 'utf-8');
        const fileMeta = JSON.parse(metaContent);
        contentType = fileMeta.mimetype || contentType;
        filename = fileMeta.filename || filename;
        console.log('✅ Metadata loaded:', { contentType, filename, fileType: fileMeta.fileType });
      } catch (error) {
        console.log('⚠️ Could not read metadata for:', fileId, 'Error:', error);
      }
    } else {
      console.log('⚠️ No metadata file found for:', fileId)
    }
    
    console.log('📖 Reading file buffer from:', filePath)
    
    // Read and return file
    const fileBuffer = fs.readFileSync(filePath);
    
    console.log('✅ File served successfully:', fileId, 'Size:', fileBuffer.length, 'bytes')
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400'
      }
    });
    
  } catch (error) {
    const resolvedParams = await params
    const fileId = resolvedParams.id
    
    console.error('❌ Error serving file:', fileId, 'Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('📊 Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return new NextResponse(`Internal server error: ${errorMessage}`, { status: 500 });
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
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
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

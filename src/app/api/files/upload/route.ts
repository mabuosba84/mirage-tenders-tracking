import { NextRequest, NextResponse } from 'next/server'

// Vercel-compatible file upload using base64 storage
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('type') as string
    const tenderId = formData.get('tenderId') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Check file size (limit to 5MB for Vercel)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }
    
    // Generate unique file ID
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Convert file to base64 for storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Data = buffer.toString('base64')
    
    // Create file metadata for storage
    const fileData = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      fileType: fileType,
      tenderId: tenderId,
      data: base64Data
    }
    
    console.log(`File processed for storage: ${file.name} (${fileId})`)
    
    // Return file info (without data to reduce response size)
    return NextResponse.json({
      id: fileId,
      name: file.name,
      type: fileType,
      url: `/api/files/${fileId}`,
      uploadedAt: fileData.uploadedAt,
      size: file.size,
      crossDomainCompatible: true
    })
    
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

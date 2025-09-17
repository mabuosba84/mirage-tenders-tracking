import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const UPLOADS_DIR = path.join(process.cwd(), 'uploads')
const STORAGE_FILE = path.join(process.cwd(), 'network-storage.json')

interface FileInfo {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  fileType: string
  tenderId: string
  checksum: string
  url: string
}

// GET: List all files and their metadata
export async function GET(request: NextRequest) {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true })
    }

    const files: FileInfo[] = []
    const fileNames = fs.readdirSync(UPLOADS_DIR)

    for (const fileName of fileNames) {
      // Skip metadata files
      if (fileName.endsWith('.meta')) continue

      const filePath = path.join(UPLOADS_DIR, fileName)
      const metaPath = path.join(UPLOADS_DIR, `${fileName}.meta`)
      
      if (fs.existsSync(metaPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
          const stats = fs.statSync(filePath)
          
          // Calculate checksum for file integrity
          const fileBuffer = fs.readFileSync(filePath)
          const checksum = crypto.createHash('md5').update(fileBuffer).digest('hex')
          
          files.push({
            id: metadata.id || fileName,
            name: metadata.name || fileName,
            type: metadata.type || 'application/octet-stream',
            size: stats.size,
            uploadedAt: metadata.uploadedAt || stats.birthtime.toISOString(),
            fileType: metadata.fileType || 'unknown',
            tenderId: metadata.tenderId || 'unknown',
            checksum: checksum,
            url: `/api/files/${metadata.id || fileName}`
          })
        } catch (error) {
          console.warn(`Failed to read metadata for ${fileName}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      files: files,
      count: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0)
    })

  } catch (error) {
    console.error('File sync GET error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to list files',
      files: []
    }, { status: 500 })
  }
}

// POST: Sync file from remote source
export async function POST(request: NextRequest) {
  try {
    const { fileId, source, action } = await request.json()

    if (action === 'download') {
      // Download file from remote source
      if (!source) {
        return NextResponse.json({
          success: false,
          error: 'Source URL required for download'
        }, { status: 400 })
      }

      const response = await fetch(`${source}/api/files/${fileId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`)
      }

      const fileBuffer = await response.arrayBuffer()
      const filePath = path.join(UPLOADS_DIR, fileId)
      
      // Save file
      fs.writeFileSync(filePath, Buffer.from(fileBuffer))

      // Fetch and save metadata
      try {
        const metaResponse = await fetch(`${source}/api/files/${fileId}/meta`)
        if (metaResponse.ok) {
          const metadata = await metaResponse.json()
          const metaPath = path.join(UPLOADS_DIR, `${fileId}.meta`)
          fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2))
        }
      } catch (metaError) {
        console.warn('Failed to fetch metadata:', metaError)
      }

      return NextResponse.json({
        success: true,
        message: 'File downloaded successfully',
        fileId: fileId
      })
    }

    if (action === 'upload') {
      // Upload file to remote destination
      if (!source) {
        return NextResponse.json({
          success: false,
          error: 'Destination URL required for upload'
        }, { status: 400 })
      }

      const filePath = path.join(UPLOADS_DIR, fileId)
      const metaPath = path.join(UPLOADS_DIR, `${fileId}.meta`)

      if (!fs.existsSync(filePath)) {
        return NextResponse.json({
          success: false,
          error: 'File not found'
        }, { status: 404 })
      }

      // Read file and metadata
      const fileBuffer = fs.readFileSync(filePath)
      let metadata = {}
      if (fs.existsSync(metaPath)) {
        metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
      }

      // Create form data for upload
      const formData = new FormData()
      const blob = new Blob([fileBuffer])
      formData.append('file', blob, (metadata as any).name || fileId)
      formData.append('fileId', fileId)
      formData.append('metadata', JSON.stringify(metadata))

      // Upload to destination
      const uploadResponse = await fetch(`${source}/api/files/upload`, {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`)
      }

      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully',
        fileId: fileId
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "download" or "upload"'
    }, { status: 400 })

  } catch (error) {
    console.error('File sync POST error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'File sync failed'
    }, { status: 500 })
  }
}

// PUT: Batch sync files between domains
export async function PUT(request: NextRequest) {
  try {
    const { source, direction, fileIds } = await request.json()

    if (!source) {
      return NextResponse.json({
        success: false,
        error: 'Source URL required'
      }, { status: 400 })
    }

    const results = []

    if (direction === 'pull' || direction === 'both') {
      // Pull files from source
      const sourceFilesResponse = await fetch(`${source}/api/files/sync`)
      if (sourceFilesResponse.ok) {
        const sourceData = await sourceFilesResponse.json()
        
        for (const file of sourceData.files) {
          if (!fileIds || fileIds.includes(file.id)) {
            try {
              // Check if we have this file locally
              const localPath = path.join(UPLOADS_DIR, file.id)
              let shouldDownload = false

              if (!fs.existsSync(localPath)) {
                shouldDownload = true
              } else {
                // Check if remote file is newer or different
                const localBuffer = fs.readFileSync(localPath)
                const localChecksum = crypto.createHash('md5').update(localBuffer).digest('hex')
                if (localChecksum !== file.checksum) {
                  shouldDownload = true
                }
              }

              if (shouldDownload) {
                const downloadResult = await fetch(`${request.url}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    fileId: file.id,
                    source: source,
                    action: 'download'
                  })
                })

                if (downloadResult.ok) {
                  results.push({ fileId: file.id, action: 'downloaded', success: true })
                } else {
                  results.push({ fileId: file.id, action: 'download_failed', success: false })
                }
              } else {
                results.push({ fileId: file.id, action: 'skipped_unchanged', success: true })
              }
            } catch (error) {
              results.push({ fileId: file.id, action: 'download_error', success: false, error: error instanceof Error ? error.message : 'Unknown error' })
            }
          }
        }
      }
    }

    if (direction === 'push' || direction === 'both') {
      // Push files to source
      const localFiles = fs.readdirSync(UPLOADS_DIR).filter(f => !f.endsWith('.meta'))
      
      for (const fileName of localFiles) {
        if (!fileIds || fileIds.includes(fileName)) {
          try {
            const uploadResult = await fetch(`${request.url}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileId: fileName,
                source: source,
                action: 'upload'
              })
            })

            if (uploadResult.ok) {
              results.push({ fileId: fileName, action: 'uploaded', success: true })
            } else {
              results.push({ fileId: fileName, action: 'upload_failed', success: false })
            }
          } catch (error) {
            results.push({ fileId: fileName, action: 'upload_error', success: false, error: error instanceof Error ? error.message : 'Unknown error' })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Batch file sync completed',
      results: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })

  } catch (error) {
    console.error('File sync PUT error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch sync failed'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const fileId = params.id;
    
    // Direct file serving for view (same as main file endpoint)
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, fileId);
    const metaPath = path.join(uploadsDir, `${fileId}.meta`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Get file metadata
    let contentType = 'application/octet-stream';
    let filename = fileId;
    
    if (fs.existsSync(metaPath)) {
      try {
        const metaContent = fs.readFileSync(metaPath, 'utf-8');
        const fileMeta = JSON.parse(metaContent);
        contentType = fileMeta.mimetype || contentType;
        filename = fileMeta.filename || filename;
      } catch (error) {
        console.log('Could not read metadata for:', fileId);
      }
    }
    
    // Read and return file with inline disposition for viewing
    const fileBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400'
      }
    });
    
  } catch (error) {
    console.error('Error serving file for view:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 
              background: #007bff; 
              color: white; 
              padding: 8px 16px; 
              text-decoration: none; 
              border-radius: 4px; 
              font-size: 12px;
              font-weight: 500;
              border: none;
              cursor: pointer;
            }
            .download-btn:hover { 
              background: #0056b3; 
            }
            .loading {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              text-align: center;
              color: #666;
            }
            .error-fallback {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              text-align: center;
              background: #f8f9fa;
              padding: 40px;
              border-radius: 8px;
              border: 1px solid #dee2e6;
              max-width: 400px;
            }
            .error-fallback .icon { font-size: 48px; margin-bottom: 16px; color: #6c757d; }
            .error-fallback h3 { margin-bottom: 8px; color: #495057; }
            .error-fallback p { margin-bottom: 16px; color: #6c757d; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="viewer-container">
            <div class="toolbar">
              <a href="${downloadUrl}" class="download-btn" download>📥 Download</a>
            </div>
            
            <div class="loading" id="loading">
              <div style="font-size: 24px; margin-bottom: 16px;">📄</div>
              <div>Loading document...</div>
            </div>
            
            <iframe 
              src="${downloadUrl}" 
              class="document-frame"
              id="documentFrame"
              onload="handleLoad()"
              onerror="handleError()">
            </iframe>
            
            <div class="error-fallback" id="errorFallback" style="display: none;">
              <div class="icon">📎</div>
              <h3>Document Preview</h3>
              <p>File ID: ${fileId}</p>
              <p>This document type may not support inline preview.</p>
              <a href="${downloadUrl}" class="download-btn" download>📥 Download File</a>
            </div>
          </div>
          
          <script>
            let loadTimeout;
            
            function handleLoad() {
              clearTimeout(loadTimeout);
              document.getElementById('loading').style.display = 'none';
              
              // Check if iframe loaded properly
              setTimeout(() => {
                try {
                  const iframe = document.getElementById('documentFrame');
                  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                  
                  // If we can access the document and it contains error indicators
                  if (iframeDoc && iframeDoc.body) {
                    const content = iframeDoc.body.innerHTML.toLowerCase();
                    if (content.includes('placeholder') || content.includes('file retrieval should be handled') || content.includes('error')) {
                      handleError();
                    }
                  }
                } catch (e) {
                  // Cross-origin restrictions mean the file is probably loading correctly
                  console.log('Document loaded (cross-origin restrictions normal)');
                }
              }, 500);
            }
            
            function handleError() {
              clearTimeout(loadTimeout);
              document.getElementById('loading').style.display = 'none';
              document.getElementById('documentFrame').style.display = 'none';
              document.getElementById('errorFallback').style.display = 'block';
            }
            
            // Set timeout for loading
            loadTimeout = setTimeout(() => {
              const loading = document.getElementById('loading');
              if (loading.style.display !== 'none') {
                handleError();
              }
            }, 5000);
          </script>
        </body>
      </html>
    `;
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('File viewer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const fileId = params.id;
    
    // Since we're in a serverless environment, we'll create a viewer that uses the download endpoint
    const baseUrl = request.nextUrl.origin;
    const downloadUrl = `${baseUrl}/api/files/${fileId}`;
    
    // Create a clean HTML viewer for documents
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document Viewer</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { height: 100%; overflow: hidden; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #ffffff;
            }
            .viewer-container { 
              width: 100vw; 
              height: 100vh; 
              position: relative;
            }
            .document-frame { 
              width: 100%; 
              height: 100%; 
              border: none;
              display: block;
            }
            .toolbar {
              position: absolute;
              top: 10px;
              right: 10px;
              z-index: 1000;
              background: rgba(0,0,0,0.7);
              border-radius: 6px;
              padding: 8px;
            }
            .download-btn { 
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
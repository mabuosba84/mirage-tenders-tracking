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
    
    // Create an HTML viewer that attempts to display the file
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>File Viewer - ${fileId}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 1200px; 
              margin: 0 auto; 
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header { 
              background: #007bff; 
              color: white; 
              padding: 20px; 
              text-align: center;
            }
            .content { 
              padding: 20px; 
              text-align: center; 
            }
            .viewer-frame { 
              width: 100%; 
              height: 600px; 
              border: 1px solid #ddd; 
              border-radius: 4px;
              background: white;
            }
            .download-btn { 
              background: #28a745; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 10px;
              display: inline-block;
              font-weight: bold;
            }
            .download-btn:hover { 
              background: #218838; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📄 File Viewer</h2>
              <p>File ID: ${fileId}</p>
            </div>
            <div class="content">
              <a href="${downloadUrl}" class="download-btn" download>⬇️ Download File</a>
              <div style="margin: 20px 0;">
                <iframe 
                  src="${downloadUrl}" 
                  class="viewer-frame"
                  frameborder="0">
                </iframe>
              </div>
              <p><small>💡 If the file doesn't display above, click the download button to get the file.</small></p>
            </div>
          </div>
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
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // For Vercel deployment, we'll return a simple viewer
    // Since file system access is limited, we'll redirect to the download route
    const baseUrl = request.nextUrl.origin;
    const downloadUrl = `${baseUrl}/api/files/${params.id}`;
    
    // Return HTML viewer that loads the file
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>File Viewer - ${params.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .content { text-align: center; }
            iframe { width: 100%; height: 600px; border: 1px solid #ddd; }
            .download-btn { 
              background: #007bff; color: white; padding: 10px 20px; 
              text-decoration: none; border-radius: 5px; margin: 10px; 
            }
            .download-btn:hover { background: #0056b3; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>File Viewer</h2>
              <p>File ID: ${params.id}</p>
              <a href="${downloadUrl}" class="download-btn" download>Download File</a>
            </div>
            <div class="content">
              <iframe src="${downloadUrl}" frameborder="0"></iframe>
              <p><small>If the file doesn't display above, <a href="${downloadUrl}">click here to download</a></small></p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
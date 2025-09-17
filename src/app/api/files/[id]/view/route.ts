import { NextRequest, NextResponse } from 'next/server'import { NextRequest, NextResponse } from 'next/server'



interface FileMetadata {// Vercel-compatible document viewer

  id: stringexport async function GET(

  originalName: string  request: NextRequest,

  size: number  { params }: { params: Promise<{ id: string }> }

  type: string) {

  uploadDate: string  try {

  content: string    const resolvedParams = await params

}    const fileId = resolvedParams.id

    

export async function GET(    // In Vercel deployment, return a viewer that uses client-side file retrieval

  request: NextRequest,    const html = `

  { params }: { params: { id: string } }<!DOCTYPE html>

) {<html lang="en">

  try {<head>

    const fileId = params.id    <meta charset="UTF-8">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    // Get all stored files    <title>Document Viewer - Mirage Tenders</title>

    const storedFiles = globalThis.uploadedFiles || new Map()    <style>

    const fileData = storedFiles.get(fileId) as FileMetadata        * {

            margin: 0;

    if (!fileData) {            padding: 0;

      return NextResponse.json({ error: 'File not found' }, { status: 404 })            box-sizing: border-box;

    }        }

        

    // For text files, create a simple HTML viewer        body {

    if (fileData.type.startsWith('text/') || fileData.type === 'application/json') {            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

      const html = `            background: #f5f5f5;

        <!DOCTYPE html>            color: #333;

        <html lang="en">            line-height: 1.6;

        <head>        }

          <meta charset="UTF-8">        

          <meta name="viewport" content="width=device-width, initial-scale=1.0">        .header {

          <title>${fileData.originalName} - File Viewer</title>            background: #1f2937;

          <style>            color: white;

            body {            padding: 1rem;

              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;            box-shadow: 0 2px 4px rgba(0,0,0,0.1);

              margin: 0;        }

              padding: 20px;        

              background-color: #f5f5f5;        .header h1 {

              line-height: 1.6;            font-size: 1.5rem;

            }            margin-bottom: 0.5rem;

            .container {        }

              max-width: 1200px;        

              margin: 0 auto;        .container {

              background: white;            max-width: 1200px;

              border-radius: 8px;            margin: 0 auto;

              box-shadow: 0 2px 10px rgba(0,0,0,0.1);            padding: 2rem;

              overflow: hidden;        }

            }        

            .header {        .viewer {

              background: #2563eb;            background: white;

              color: white;            border-radius: 8px;

              padding: 20px;            box-shadow: 0 2px 10px rgba(0,0,0,0.1);

              border-bottom: 1px solid #e5e7eb;            padding: 2rem;

            }            text-align: center;

            .header h1 {            min-height: 400px;

              margin: 0;            display: flex;

              font-size: 1.5rem;            flex-direction: column;

            }            justify-content: center;

            .file-info {            align-items: center;

              background: #f8fafc;        }

              padding: 15px 20px;        

              border-bottom: 1px solid #e5e7eb;        .message {

              font-size: 0.9rem;            font-size: 1.2rem;

              color: #64748b;            margin-bottom: 1rem;

            }            color: #6b7280;

            .content {        }

              padding: 20px;        

              font-family: 'Courier New', monospace;        .button {

              white-space: pre-wrap;            background: #3b82f6;

              word-wrap: break-word;            color: white;

              background: #fafafa;            padding: 0.75rem 1.5rem;

              border: 1px solid #e5e7eb;            border: none;

              margin: 20px;            border-radius: 6px;

              border-radius: 4px;            cursor: pointer;

              max-height: 70vh;            font-size: 1rem;

              overflow-y: auto;            text-decoration: none;

            }            display: inline-block;

            .actions {            margin: 0.5rem;

              padding: 20px;            transition: background-color 0.2s;

              background: #f8fafc;        }

              border-top: 1px solid #e5e7eb;        

              text-align: center;        .button:hover {

            }            background: #2563eb;

            .btn {        }

              display: inline-block;        

              padding: 10px 20px;        .button.secondary {

              margin: 0 10px;            background: #6b7280;

              background: #2563eb;        }

              color: white;        

              text-decoration: none;        .button.secondary:hover {

              border-radius: 4px;            background: #4b5563;

              border: none;        }

              cursor: pointer;    </style>

              font-size: 0.9rem;</head>

            }<body>

            .btn:hover {    <div class="header">

              background: #1d4ed8;        <h1>📄 Document Viewer</h1>

            }        <p>Mirage Tenders Tracking System</p>

            .btn-secondary {    </div>

              background: #64748b;    

            }    <div class="container">

            .btn-secondary:hover {        <div class="viewer">

              background: #475569;            <div class="message">

            }                File ID: ${fileId}

          </style>            </div>

        </head>            <div class="message">

        <body>                This file is stored client-side in your browser's storage.

          <div class="container">            </div>

            <div class="header">            <a href="/" class="button">← Back to Dashboard</a>

              <h1>📄 ${fileData.originalName}</h1>            <a href="/api/files/${fileId}?download=true" class="button secondary">Download File</a>

            </div>        </div>

            <div class="file-info">    </div>

              <strong>File Type:</strong> ${fileData.type} |     

              <strong>Size:</strong> ${(fileData.size / 1024).toFixed(2)} KB |     <script>

              <strong>Uploaded:</strong> ${new Date(fileData.uploadDate).toLocaleString()}        // Client-side file handling for Vercel deployment

            </div>        console.log('Vercel-compatible file viewer loaded for file:', '${fileId}');

            <div class="content">${fileData.content}</div>        

            <div class="actions">        // You can add JavaScript here to handle file retrieval from localStorage

              <button class="btn" onclick="downloadFile()">📥 Download</button>        // and display the file content if needed

              <button class="btn btn-secondary" onclick="window.close()">❌ Close</button>    </script>

            </div></body>

          </div></html>

              `

          <script>    

            function downloadFile() {    return new NextResponse(html, {

              const content = \`${fileData.content}\`;      headers: {

              const blob = new Blob([content], { type: '${fileData.type}' });        'Content-Type': 'text/html',

              const url = URL.createObjectURL(blob);      },

              const a = document.createElement('a');    })

              a.href = url;    

              a.download = '${fileData.originalName}';  } catch (error) {

              document.body.appendChild(a);    console.error('Error creating document viewer:', error)

              a.click();    return NextResponse.json({ error: 'Viewer creation failed' }, { status: 500 })

              document.body.removeChild(a);  }

              URL.revokeObjectURL(url);}

            }    

          </script>    // Create different viewers based on file type

        </body>    let viewerContent = ''

        </html>    

      `    if (isPDF) {

      viewerContent = `

      return new NextResponse(html, {        <div class="loading" id="loading">Loading PDF...</div>

        status: 200,        <iframe id="pdfViewer" class="pdf-viewer" style="display: none;" title="PDF Viewer"></iframe>

        headers: {        <div class="error-message" id="errorMessage">

          'Content-Type': 'text/html',            <p>Unable to display PDF in this browser.</p>

          'Cache-Control': 'no-cache',            <a href="/api/files/${fileId}?download=true" class="download-btn">📥 Download PDF</a>

        },        </div>

      })      `

    }    } else if (isWordDoc) {

      viewerContent = `

    // For images, create an image viewer        <div class="doc-viewer">

    if (fileData.type.startsWith('image/')) {            <div class="doc-preview">

      const html = `                <h3>📝 ${metadata.name}</h3>

        <!DOCTYPE html>                <p>This is a Word document. Click below to download and open it in Microsoft Word or a compatible application.</p>

        <html lang="en">                <div class="doc-actions">

        <head>                    <a href="/api/files/${fileId}?download=true" class="download-btn primary">📥 Download Document</a>

          <meta charset="UTF-8">                    <p class="doc-info">File Type: ${metadata.type}<br>Size: ${metadata.size ? (metadata.size / 1024).toFixed(1) + ' KB' : 'Unknown'}</p>

          <meta name="viewport" content="width=device-width, initial-scale=1.0">                </div>

          <title>${fileData.originalName} - Image Viewer</title>            </div>

          <style>        </div>

            body {      `

              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;    } else {

              margin: 0;      viewerContent = `

              padding: 20px;        <div class="doc-viewer">

              background-color: #1f2937;            <div class="doc-preview">

              color: white;                <h3>📁 ${metadata.name}</h3>

              text-align: center;                <p>This file cannot be previewed in the browser. Click below to download it.</p>

            }                <div class="doc-actions">

            .container {                    <a href="/api/files/${fileId}?download=true" class="download-btn primary">📥 Download File</a>

              max-width: 90vw;                    <p class="doc-info">File Type: ${metadata.type}<br>Size: ${metadata.size ? (metadata.size / 1024).toFixed(1) + ' KB' : 'Unknown'}</p>

              margin: 0 auto;                </div>

            }            </div>

            .header {        </div>

              margin-bottom: 20px;      `

            }    }

            .header h1 {    

              margin: 0 0 10px 0;    // Create an HTML page that handles different file types

              font-size: 1.5rem;    const html = `

            }<!DOCTYPE html>

            .file-info {<html lang="en">

              font-size: 0.9rem;<head>

              color: #9ca3af;    <meta charset="UTF-8">

              margin-bottom: 20px;    <meta name="viewport" content="width=device-width, initial-scale=1.0">

            }    <title>Document Viewer - ${metadata.name}</title>

            .image-container {    <style>

              background: white;        body {

              border-radius: 8px;            margin: 0;

              padding: 20px;            padding: 0;

              margin-bottom: 20px;            font-family: Arial, sans-serif;

              box-shadow: 0 4px 20px rgba(0,0,0,0.3);            background: #f5f5f5;

            }        }

            .image {        .header {

              max-width: 100%;            background: #fff;

              max-height: 70vh;            padding: 10px 20px;

              border-radius: 4px;            border-bottom: 1px solid #ddd;

              box-shadow: 0 2px 10px rgba(0,0,0,0.2);            display: flex;

            }            justify-content: space-between;

            .actions {            align-items: center;

              margin-top: 20px;            box-shadow: 0 2px 4px rgba(0,0,0,0.1);

            }        }

            .btn {        .viewer-container {

              display: inline-block;            width: 100%;

              padding: 12px 24px;            height: calc(100vh - 60px);

              margin: 0 10px;            position: relative;

              background: #2563eb;            background: #fff;

              color: white;        }

              text-decoration: none;        .pdf-viewer {

              border-radius: 6px;            width: 100%;

              border: none;            height: 100%;

              cursor: pointer;            border: none;

              font-size: 1rem;        }

            }        .doc-viewer {

            .btn:hover {            display: flex;

              background: #1d4ed8;            align-items: center;

            }            justify-content: center;

            .btn-secondary {            height: 100%;

              background: #64748b;            padding: 40px;

            }        }

            .btn-secondary:hover {        .doc-preview {

              background: #475569;            text-align: center;

            }            max-width: 600px;

          </style>            background: white;

        </head>            padding: 40px;

        <body>            border-radius: 8px;

          <div class="container">            box-shadow: 0 4px 6px rgba(0,0,0,0.1);

            <div class="header">        }

              <h1>🖼️ ${fileData.originalName}</h1>        .doc-preview h3 {

              <div class="file-info">            color: #333;

                <strong>Type:</strong> ${fileData.type} |             margin-bottom: 20px;

                <strong>Size:</strong> ${(fileData.size / 1024).toFixed(2)} KB |             font-size: 24px;

                <strong>Uploaded:</strong> ${new Date(fileData.uploadDate).toLocaleString()}        }

              </div>        .doc-preview p {

            </div>            color: #666;

            <div class="image-container">            margin-bottom: 30px;

              <img src="data:${fileData.type};base64,${fileData.content}" alt="${fileData.originalName}" class="image" />            line-height: 1.6;

            </div>        }

            <div class="actions">        .doc-actions {

              <button class="btn" onclick="downloadFile()">📥 Download</button>            margin-top: 30px;

              <button class="btn btn-secondary" onclick="window.close()">❌ Close</button>        }

            </div>        .doc-info {

          </div>            margin-top: 20px;

                      font-size: 14px;

          <script>            color: #888;

            function downloadFile() {        }

              const a = document.createElement('a');        .download-btn {

              a.href = "data:${fileData.type};base64,${fileData.content}";            background: #007bff;

              a.download = '${fileData.originalName}';            color: white;

              document.body.appendChild(a);            border: none;

              a.click();            padding: 12px 24px;

              document.body.removeChild(a);            border-radius: 4px;

            }            cursor: pointer;

          </script>            text-decoration: none;

        </body>            display: inline-block;

        </html>            font-size: 16px;

      `            transition: background 0.3s;

        }

      return new NextResponse(html, {        .download-btn:hover {

        status: 200,            background: #0056b3;

        headers: {        }

          'Content-Type': 'text/html',        .download-btn.primary {

          'Cache-Control': 'no-cache',            background: #28a745;

        },            padding: 15px 30px;

      })            font-size: 18px;

    }        }

        .download-btn.primary:hover {

    // For other file types, show a generic viewer with download option            background: #218838;

    const html = `        }

      <!DOCTYPE html>        .error-message {

      <html lang="en">            text-align: center;

      <head>            padding: 40px;

        <meta charset="UTF-8">            color: #666;

        <meta name="viewport" content="width=device-width, initial-scale=1.0">            display: none;

        <title>${fileData.originalName} - File Viewer</title>        }

        <style>        .loading {

          body {            text-align: center;

            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;            padding: 40px;

            margin: 0;            color: #666;

            padding: 40px;        }

            background-color: #f8fafc;    </style>

            text-align: center;</head>

          }<body>

          .container {    <div class="header">

            max-width: 600px;        <h3>📄 Document Viewer - ${metadata.name}</h3>

            margin: 0 auto;        <a href="/api/files/${fileId}?download=true" class="download-btn">📥 Download</a>

            background: white;    </div>

            border-radius: 12px;    <div class="viewer-container">

            box-shadow: 0 4px 20px rgba(0,0,0,0.1);        ${viewerContent}

            padding: 40px;    </div>

          }    

          .file-icon {    ${isPDF ? `

            font-size: 4rem;    <script>

            margin-bottom: 20px;        const pdfViewer = document.getElementById('pdfViewer');

          }        const loading = document.getElementById('loading');

          h1 {        const errorMessage = document.getElementById('errorMessage');

            margin: 0 0 10px 0;        

            color: #1f2937;        // Try to load the PDF

            font-size: 1.5rem;        async function loadPDF() {

          }            try {

          .file-info {                // Method 1: Try direct iframe loading (most compatible)

            color: #6b7280;                pdfViewer.src = '/api/files/${fileId}#toolbar=1&navpanes=1&scrollbar=1&view=FitH';

            margin-bottom: 30px;                pdfViewer.style.display = 'block';

            line-height: 1.6;                loading.style.display = 'none';

          }                

          .preview-message {                // Set a timeout to show error if PDF doesn't load

            background: #fef3c7;                const timeout = setTimeout(() => {

            border: 1px solid #f59e0b;                    // If the iframe doesn't load within 5 seconds, try blob approach

            border-radius: 6px;                    loadPDFAsBlob();

            padding: 15px;                }, 5000);

            margin-bottom: 30px;                

            color: #92400e;                // Handle successful load

          }                pdfViewer.onload = () => {

          .btn {                    clearTimeout(timeout);

            display: inline-block;                    loading.style.display = 'none';

            padding: 12px 24px;                };

            margin: 0 10px;                

            background: #2563eb;            } catch (error) {

            color: white;                console.error('Error loading PDF:', error);

            text-decoration: none;                loadPDFAsBlob();

            border-radius: 6px;            }

            border: none;        }

            cursor: pointer;        

            font-size: 1rem;        // Fallback method using blob

          }        async function loadPDFAsBlob() {

          .btn:hover {            try {

            background: #1d4ed8;                const response = await fetch('/api/files/${fileId}');

          }                if (!response.ok) {

          .btn-secondary {                    throw new Error('Failed to fetch PDF');

            background: #64748b;                }

          }                

          .btn-secondary:hover {                const blob = await response.blob();

            background: #475569;                const dataUrl = URL.createObjectURL(blob);

          }                

        </style>                pdfViewer.src = dataUrl;

      </head>                pdfViewer.style.display = 'block';

      <body>                loading.style.display = 'none';

        <div class="container">                

          <div class="file-icon">📎</div>                // Clean up the object URL after a delay

          <h1>${fileData.originalName}</h1>                setTimeout(() => URL.revokeObjectURL(dataUrl), 10000);

          <div class="file-info">                

            <strong>File Type:</strong> ${fileData.type}<br>            } catch (error) {

            <strong>Size:</strong> ${(fileData.size / 1024).toFixed(2)} KB<br>                console.error('Error loading PDF as blob:', error);

            <strong>Uploaded:</strong> ${new Date(fileData.uploadDate).toLocaleString()}                loading.style.display = 'none';

          </div>                errorMessage.style.display = 'block';

          <div class="preview-message">            }

            ⚠️ Preview not available for this file type. You can download the file to view it.        }

          </div>        

          <div class="actions">        // Load the PDF when the page loads

            <button class="btn" onclick="downloadFile()">📥 Download File</button>        window.addEventListener('load', loadPDF);

            <button class="btn btn-secondary" onclick="window.close()">❌ Close</button>    </script>

          </div>    ` : ''}

        </div></body>

        </html>

        <script>        `

          function downloadFile() {

            // For binary files, we need to convert base64 to blob        return new NextResponse(html, {

            const byteCharacters = atob('${fileData.content}');          status: 200,

            const byteNumbers = new Array(byteCharacters.length);          headers: {

            for (let i = 0; i < byteCharacters.length; i++) {            'Content-Type': 'text/html',

              byteNumbers[i] = byteCharacters.charCodeAt(i);            'Cache-Control': 'no-cache',

            }          },

            const byteArray = new Uint8Array(byteNumbers);        })

            const blob = new Blob([byteArray], { type: '${fileData.type}' });

              } catch (error) {

            const url = URL.createObjectURL(blob);    console.error('Error creating document viewer:', error)

            const a = document.createElement('a');    return NextResponse.json({ error: 'Server error' }, { status: 500 })

            a.href = url;  }

            a.download = '${fileData.originalName}';}
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        </script>
      </body>
      </html>
    `

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Error creating file viewer:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
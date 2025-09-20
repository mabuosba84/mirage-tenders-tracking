import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 File debug endpoint called')
    
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    const altDir1 = path.join(process.cwd(), 'uploads');
    const altDir2 = path.join(process.cwd(), 'data');
    
    const result = {
      directories: {
        main: {
          path: uploadsDir,
          exists: fs.existsSync(uploadsDir),
          files: []
        },
        alt1: {
          path: altDir1,
          exists: fs.existsSync(altDir1),
          files: []
        },
        alt2: {
          path: altDir2,
          exists: fs.existsSync(altDir2),
          files: []
        }
      },
      environment: {
        cwd: process.cwd(),
        nodeEnv: process.env.NODE_ENV,
        railwayEnv: process.env.RAILWAY_ENVIRONMENT,
        vercel: process.env.VERCEL
      }
    }
    
    // List files in main directory
    if (result.directories.main.exists) {
      try {
        const files = fs.readdirSync(uploadsDir);
        result.directories.main.files = files.slice(0, 20).map(file => {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            isFile: stats.isFile(),
            modified: stats.mtime
          };
        });
      } catch (error) {
        console.error('Error reading main directory:', error);
      }
    }
    
    // List files in alt directories
    [altDir1, altDir2].forEach((dir, index) => {
      const key = index === 0 ? 'alt1' : 'alt2';
      if (result.directories[key].exists) {
        try {
          const files = fs.readdirSync(dir);
          result.directories[key].files = files.slice(0, 10).map(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            return {
              name: file,
              size: stats.size,
              isFile: stats.isFile(),
              modified: stats.mtime
            };
          });
        } catch (error) {
          console.error(`Error reading ${key} directory:`, error);
        }
      }
    });
    
    console.log('📂 Debug result:', JSON.stringify(result, null, 2));
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
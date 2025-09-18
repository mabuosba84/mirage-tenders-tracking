# Railway Deployment Script (Windows PowerShell version)

Write-Host "Starting Railway deployment setup..." -ForegroundColor Green

# Create persistent data directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "data\uploads" | Out-Null

# If uploads directory exists (from previous deployments), move files to persistent storage
if (Test-Path "uploads" -PathType Container) {
    $uploadsFiles = Get-ChildItem "uploads" -ErrorAction SilentlyContinue
    if ($uploadsFiles) {
        Write-Host "Found existing uploads directory, moving files to persistent storage..." -ForegroundColor Yellow
        Copy-Item "uploads\*" "data\uploads\" -Force -ErrorAction SilentlyContinue
        Write-Host "Files moved to data/uploads/" -ForegroundColor Green
    }
}

Write-Host "Persistent storage setup complete" -ForegroundColor Green
Write-Host "Files will be stored in: $(Get-Location)\data\uploads" -ForegroundColor Cyan

# Continue with normal build process
Write-Host "Installing dependencies..." -ForegroundColor Blue
npm ci

Write-Host "Building application..." -ForegroundColor Blue
npm run build

Write-Host "Railway deployment setup finished" -ForegroundColor Green
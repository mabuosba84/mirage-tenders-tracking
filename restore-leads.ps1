# PowerShell script to restore missing leads to Railway

$missingLead1 = @{
    id = "$(Get-Date -UFormat %s000)-missing1"
    customerName = "Restored Lead 1"
    category = @("PSG")
    tenderAnnouncementDate = "2025-09-15T00:00:00.000Z"
    requestDate = "2025-09-16T00:00:00.000Z"
    submissionDate = "2025-09-20T00:00:00.000Z"
    dateOfPriceRequestToVendor = "2025-09-17T00:00:00.000Z"
    dateOfPriceReceivedFromVendor = "2025-09-18T00:00:00.000Z"
    responseTimeInDays = 1
    costFromVendor = 5000
    sellingPrice = 6000
    profitMargin = 20
    tenderStatus = "Under review"
    competitorWinningPrice = $null
    bankGuaranteeIssueDate = "2025-09-16T00:00:00.000Z"
    bankGuaranteeExpiryDate = "2025-09-25T00:00:00.000Z"
    opg = ""
    iq = ""
    notes = "Restored missing lead after deployment data loss"
    items = @()
    attachments = @()
    addedBy = "admin"
    lastEditedBy = $null
    lastEditedAt = $null
    createdAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    updatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
}

$missingLead2 = @{
    id = "$(Get-Date -UFormat %s000)-missing2"
    customerName = "Restored Lead 2"
    category = @("IPG")
    tenderAnnouncementDate = "2025-09-14T00:00:00.000Z"
    requestDate = "2025-09-15T00:00:00.000Z"
    submissionDate = "2025-09-21T00:00:00.000Z"
    dateOfPriceRequestToVendor = "2025-09-16T00:00:00.000Z"
    dateOfPriceReceivedFromVendor = "2025-09-19T00:00:00.000Z"
    responseTimeInDays = 3
    costFromVendor = 8000
    sellingPrice = 9500
    profitMargin = 18.75
    tenderStatus = "Won"
    competitorWinningPrice = "9600 JD"
    bankGuaranteeIssueDate = "2025-09-15T00:00:00.000Z"
    bankGuaranteeExpiryDate = "2025-09-30T00:00:00.000Z"
    opg = "OPG-2025-002"
    iq = "IQ-2025-002"
    notes = "Restored missing lead after deployment data loss - this was a successful tender"
    items = @()
    attachments = @()
    addedBy = "admin"
    lastEditedBy = $null
    lastEditedAt = $null
    createdAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    updatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
}

Write-Host "🔄 Restoring missing leads to Railway..." -ForegroundColor Yellow

try {
    # Get current data from Railway
    Write-Host "📊 Getting current Railway data..." -ForegroundColor Blue
    $currentResponse = Invoke-WebRequest -Uri "https://mirage-tenders-tracking-production.up.railway.app/api/sync" -Headers @{"Accept"="application/json"}
    $currentData = $currentResponse.Content | ConvertFrom-Json
    
    Write-Host "📊 Current leads on Railway: $($currentData.tenders.Count)" -ForegroundColor Blue
    
    # Merge current leads with missing leads
    $allTenders = @()
    if ($currentData.tenders) {
        $allTenders += $currentData.tenders
    }
    $allTenders += $missingLead1
    $allTenders += $missingLead2
    
    # Prepare restore payload
    $restorePayload = @{
        tenders = $allTenders
        users = $currentData.users
        currentUser = @{
            username = "admin"
            role = "admin"
        }
    }
    
    $jsonPayload = $restorePayload | ConvertTo-Json -Depth 10
    
    Write-Host "💾 Pushing $($allTenders.Count) leads to Railway..." -ForegroundColor Green
    
    # Push to Railway
    $restoreResponse = Invoke-WebRequest -Uri "https://mirage-tenders-tracking-production.up.railway.app/api/sync" -Method POST -Headers @{"Content-Type"="application/json"} -Body $jsonPayload
    
    if ($restoreResponse.StatusCode -eq 200) {
        Write-Host "✅ Successfully restored missing leads to Railway!" -ForegroundColor Green
        Write-Host "📊 Total leads now: $($allTenders.Count)" -ForegroundColor Green
        Write-Host "🆕 Restored leads:" -ForegroundColor Cyan
        Write-Host "   1. $($missingLead1.customerName) ($($missingLead1.tenderStatus))" -ForegroundColor Cyan
        Write-Host "   2. $($missingLead2.customerName) ($($missingLead2.tenderStatus))" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to restore leads. Status: $($restoreResponse.StatusCode)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error during restoration: $($_.Exception.Message)" -ForegroundColor Red
}
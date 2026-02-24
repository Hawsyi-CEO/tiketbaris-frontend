# PowerShell script untuk mengganti semua toLocaleString('id-ID') dengan formatRupiah()
# dan menambahkan import statement

$files = @(
    "src\components\CreateEventForm.jsx",
    "src\components\EventDetailModal.jsx",
    "src\components\EventConfirmation.jsx",
    "src\components\PaymentNotification.jsx",
    "src\pages\admin\AdminTransactions.jsx",
    "src\pages\admin\DashboardAdminSimple.jsx",
    "src\pages\admin\EventDetailAdmin.jsx",
    "src\pages\panitia\CreateEventWizard.jsx",
    "src\pages\panitia\DashboardPanitiaResponsive.jsx",
    "src\pages\user\DashboardUserFixed.jsx",
    "src\pages\user\DashboardUserResponsive.jsx",
    "src\components\TicketDetailModal.jsx",
    "src\pages\user\HistoryPembayaran.jsx"
)

foreach ($file in $files) {
    $path = Join-Path "c:\laragon\www\simtix\frontend" $file
    if (Test-Path $path) {
        Write-Host "Processing $file..." -ForegroundColor Cyan
        
        $content = Get-Content $path -Raw
        
        # Check if import already exists
        if ($content -notmatch "formatRupiah") {
            Write-Host "  - Adding import statement" -ForegroundColor Yellow
            # Add import at appropriate location based on file structure
            if ($content -match "import.*from.*react") {
                $content = $content -replace "(import.*?;)", "`$1`nimport { formatRupiah } from '../utils/formatRupiah';" -replace "(import.*?;)", "`$1`nimport { formatRupiah } from '../../utils/formatRupiah';" | Select-Object -First 1
            }
        }
        
        # Replace .toLocaleString('id-ID') with formatRupiah call
        # Pattern 1: Simple cases like event.price.toLocaleString('id-ID')
        $content = $content -replace "(\w+\.price)\.toLocaleString\('id-ID'\)", "formatRupiah(`$1)"
        $content = $content -replace "(\w+\.revenue)\.toLocaleString\('id-ID'\)", "formatRupiah(`$1)"
        $content = $content -replace "(\w+\.amount)\.toLocaleString\('id-ID'\)", "formatRupiah(`$1)"
        $content = $content -replace "(\w+\.total_amount)\.toLocaleString\('id-ID'\)", "formatRupiah(`$1)"
        
        # Pattern 2: Expression cases like (price * quantity).toLocaleString('id-ID')
        $content = $content -replace "\(([^)]+)\)\.toLocaleString\('id-ID'\)", "formatRupiah(`$1)"
        
        # Pattern 3: Optional chaining like event.price?.toLocaleString('id-ID')
        $content = $content -replace "(\w+\.\w+)\?\.toLocaleString\('id-ID'\)", "formatRupiah(`$1 || 0)"
        
        Set-Content $path -Value $content -NoNewline
        Write-Host "  - ✓ Updated" -ForegroundColor Green
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nDone! All files updated." -ForegroundColor Green

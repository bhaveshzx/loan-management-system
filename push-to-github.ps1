# PowerShell script to fix GitHub remote and push

Write-Host "=== Fixing GitHub Remote ===" -ForegroundColor Cyan
Write-Host ""

# Remove old remote
Write-Host "Removing old remote..." -ForegroundColor Yellow
git remote remove origin

Write-Host ""
Write-Host "Please enter your GitHub username:" -ForegroundColor Green
$username = Read-Host "GitHub Username"

Write-Host ""
Write-Host "Please enter your repository name (default: loan-management-system):" -ForegroundColor Green
$repoName = Read-Host "Repository Name"
if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "loan-management-system"
}

# Add new remote
$remoteUrl = "https://github.com/$username/$repoName.git"
Write-Host ""
Write-Host "Adding remote: $remoteUrl" -ForegroundColor Yellow
git remote add origin $remoteUrl

Write-Host ""
Write-Host "Remote added successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Now you can push with:" -ForegroundColor Cyan
Write-Host "  git push -u origin master" -ForegroundColor White
Write-Host ""
Write-Host "If you get authentication errors, you may need to:" -ForegroundColor Yellow
Write-Host "1. Use a Personal Access Token as password" -ForegroundColor Yellow
Write-Host "2. Or set up SSH keys (see FIX_GITHUB_AUTH.md)" -ForegroundColor Yellow


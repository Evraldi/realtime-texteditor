# Script untuk membuat struktur branch untuk proyek Realtime Text Editor

# Pastikan kita berada di direktori proyek
cd c:\projek\realtime-texteditor

# Pastikan kita berada di branch master (branch utama yang sudah ada)
git checkout master

# Buat branch develop dari master
git checkout -b develop master

# Buat branch fitur
$featureBranches = @(
    "feature/auth",
    "feature/document-management",
    "feature/real-time-collaboration",
    "feature/comment-system",
    "feature/document-history",
    "feature/document-sharing",
    "feature/cursor-tracking",
    "feature/formatting-tools",
    "feature/offline-mode",
    "feature/ui-improvements"
)

foreach ($branch in $featureBranches) {
    Write-Host "Creating branch: $branch"
    git checkout develop
    git checkout -b $branch
    # Kembali ke develop setelah membuat branch
    git checkout develop
}

# Buat branch bugfix
$bugfixBranches = @(
    "bugfix/comment-system",
    "bugfix/auth-issues",
    "bugfix/cursor-sync",
    "bugfix/document-saving"
)

foreach ($branch in $bugfixBranches) {
    Write-Host "Creating branch: $branch"
    git checkout develop
    git checkout -b $branch
    # Kembali ke develop setelah membuat branch
    git checkout develop
}

# Buat branch rilis
$releaseBranches = @(
    "release/v1.0",
    "release/v1.1"
)

foreach ($branch in $releaseBranches) {
    Write-Host "Creating branch: $branch"
    git checkout develop
    git checkout -b $branch
    # Kembali ke develop setelah membuat branch
    git checkout develop
}

# Buat branch hotfix
$hotfixBranches = @(
    "hotfix/security-vulnerability",
    "hotfix/critical-bug"
)

foreach ($branch in $hotfixBranches) {
    Write-Host "Creating branch: $branch"
    git checkout master
    git checkout -b $branch
    # Kembali ke master setelah membuat branch
    git checkout master
}

# Kembali ke branch develop
git checkout develop

Write-Host "Branch structure created successfully!"
Write-Host "Current branch: $(git branch --show-current)"
Write-Host "All branches:"
git branch -a

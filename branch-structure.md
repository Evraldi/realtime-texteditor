# Struktur Branch untuk Realtime Text Editor

## Branch Utama
- `master` - Branch produksi yang stabil (sudah ada)
- `develop` - Branch pengembangan utama

## Branch Fitur
- `feature/auth` - Sistem autentikasi pengguna
- `feature/document-management` - Pengelolaan dokumen (CRUD)
- `feature/real-time-collaboration` - Kolaborasi real-time dan sinkronisasi
- `feature/comment-system` - Sistem komentar pada dokumen
- `feature/document-history` - Riwayat versi dokumen
- `feature/document-sharing` - Berbagi dokumen dengan pengguna lain
- `feature/cursor-tracking` - Pelacakan kursor pengguna lain
- `feature/formatting-tools` - Alat pemformatan teks
- `feature/offline-mode` - Dukungan mode offline
- `feature/ui-improvements` - Perbaikan antarmuka pengguna

## Branch Bug Fix
- `bugfix/comment-system` - Perbaikan bug pada sistem komentar
- `bugfix/auth-issues` - Perbaikan masalah autentikasi
- `bugfix/cursor-sync` - Perbaikan sinkronisasi kursor
- `bugfix/document-saving` - Perbaikan masalah penyimpanan dokumen

## Branch Rilis
- `release/v1.0` - Rilis versi 1.0
- `release/v1.1` - Rilis versi 1.1

## Branch Hotfix
- `hotfix/security-vulnerability` - Perbaikan kerentanan keamanan
- `hotfix/critical-bug` - Perbaikan bug kritis

## Alur Kerja Git yang Direkomendasikan

1. Buat branch fitur dari `develop`:
   ```
   git checkout develop
   git pull
   git checkout -b feature/nama-fitur
   ```

2. Kembangkan fitur dan commit perubahan:
   ```
   git add .
   git commit -m "Deskripsi perubahan"
   ```

3. Setelah fitur selesai, merge ke `develop`:
   ```
   git checkout develop
   git pull
   git merge --no-ff feature/nama-fitur
   git push origin develop
   ```

4. Untuk rilis, buat branch dari `develop`:
   ```
   git checkout develop
   git pull
   git checkout -b release/vX.Y
   ```

5. Setelah pengujian, merge ke `master` dan `develop`:
   ```
   git checkout master
   git pull
   git merge --no-ff release/vX.Y
   git tag -a vX.Y -m "Version X.Y"
   git push origin master --tags

   git checkout develop
   git pull
   git merge --no-ff release/vX.Y
   git push origin develop
   ```

6. Untuk hotfix, buat branch dari `master`:
   ```
   git checkout master
   git pull
   git checkout -b hotfix/nama-hotfix
   ```

7. Setelah hotfix selesai, merge ke `master` dan `develop`:
   ```
   git checkout master
   git pull
   git merge --no-ff hotfix/nama-hotfix
   git tag -a vX.Y.Z -m "Version X.Y.Z"
   git push origin master --tags

   git checkout develop
   git pull
   git merge --no-ff hotfix/nama-hotfix
   git push origin develop
   ```

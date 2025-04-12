# Alur Kerja Git untuk Realtime Text Editor

## Pengantar

Dokumen ini menjelaskan alur kerja Git yang direkomendasikan untuk pengembangan Realtime Text Editor. Alur kerja ini mengikuti model GitFlow yang telah dimodifikasi untuk kebutuhan proyek ini.

## Struktur Branch

### Branch Utama
- `master` - Branch produksi yang stabil, selalu dalam keadaan siap deploy
- `develop` - Branch pengembangan utama, tempat integrasi fitur-fitur baru

### Branch Sementara
- `feature/*` - Branch untuk pengembangan fitur baru
- `bugfix/*` - Branch untuk perbaikan bug
- `release/*` - Branch untuk persiapan rilis
- `hotfix/*` - Branch untuk perbaikan darurat pada produksi

## Alur Kerja Detail

### 1. Pengembangan Fitur Baru

Untuk mengembangkan fitur baru:

```bash
# Pastikan develop branch up-to-date
git checkout develop
git pull

# Buat branch fitur baru
git checkout -b feature/nama-fitur

# Kembangkan fitur dengan beberapa commit
git add .
git commit -m "Deskripsi perubahan"
git push origin feature/nama-fitur

# Setelah fitur selesai, merge ke develop
git checkout develop
git pull
git merge --no-ff feature/nama-fitur
git push origin develop

# Hapus branch fitur (opsional)
git branch -d feature/nama-fitur
git push origin --delete feature/nama-fitur
```

### 2. Perbaikan Bug

Untuk memperbaiki bug pada branch develop:

```bash
# Pastikan develop branch up-to-date
git checkout develop
git pull

# Buat branch bugfix
git checkout -b bugfix/deskripsi-bug

# Perbaiki bug dengan beberapa commit
git add .
git commit -m "Perbaikan: deskripsi bug"
git push origin bugfix/deskripsi-bug

# Setelah bug diperbaiki, merge ke develop
git checkout develop
git pull
git merge --no-ff bugfix/deskripsi-bug
git push origin develop

# Hapus branch bugfix (opsional)
git branch -d bugfix/deskripsi-bug
git push origin --delete bugfix/deskripsi-bug
```

### 3. Persiapan Rilis

Untuk mempersiapkan rilis baru:

```bash
# Pastikan develop branch up-to-date
git checkout develop
git pull

# Buat branch rilis
git checkout -b release/vX.Y

# Lakukan perbaikan minor dan persiapan rilis
git add .
git commit -m "Persiapan rilis vX.Y"
git push origin release/vX.Y

# Setelah rilis siap, merge ke master dan develop
git checkout master
git pull
git merge --no-ff release/vX.Y
git tag -a vX.Y -m "Version X.Y"
git push origin master --tags

git checkout develop
git pull
git merge --no-ff release/vX.Y
git push origin develop

# Hapus branch rilis (opsional)
git branch -d release/vX.Y
git push origin --delete release/vX.Y
```

### 4. Hotfix untuk Produksi

Untuk memperbaiki bug kritis di produksi:

```bash
# Pastikan master branch up-to-date
git checkout master
git pull

# Buat branch hotfix
git checkout -b hotfix/deskripsi-bug

# Perbaiki bug dengan beberapa commit
git add .
git commit -m "Hotfix: deskripsi bug"
git push origin hotfix/deskripsi-bug

# Setelah hotfix selesai, merge ke master dan develop
git checkout master
git pull
git merge --no-ff hotfix/deskripsi-bug
git tag -a vX.Y.Z -m "Version X.Y.Z"
git push origin master --tags

git checkout develop
git pull
git merge --no-ff hotfix/deskripsi-bug
git push origin develop

# Hapus branch hotfix (opsional)
git branch -d hotfix/deskripsi-bug
git push origin --delete hotfix/deskripsi-bug
```

## Konvensi Penamaan

### Branch
- `feature/nama-fitur` - Contoh: feature/auth, feature/document-sharing
- `bugfix/deskripsi-bug` - Contoh: bugfix/login-error, bugfix/save-conflict
- `release/vX.Y` - Contoh: release/v1.0, release/v1.1
- `hotfix/deskripsi-bug` - Contoh: hotfix/security-issue, hotfix/crash-on-save

### Commit
- Fitur baru: "Tambah: deskripsi fitur"
- Perbaikan: "Perbaiki: deskripsi bug"
- Refaktor: "Refaktor: deskripsi perubahan"
- Dokumentasi: "Dokumen: deskripsi perubahan"
- Versi: "Versi X.Y.Z"

## Praktik Terbaik

1. **Commit Sering** - Lakukan commit kecil dan sering daripada commit besar dan jarang
2. **Pull Sebelum Push** - Selalu pull sebelum push untuk menghindari konflik
3. **Deskripsi yang Jelas** - Berikan deskripsi commit yang jelas dan informatif
4. **Uji Sebelum Merge** - Pastikan kode berfungsi dengan baik sebelum di-merge
5. **Code Review** - Lakukan code review sebelum merge ke branch utama
6. **Jangan Commit Langsung ke Master** - Selalu gunakan branch fitur atau hotfix

## Alur Kerja Visual

```
master   ──────────────────────────────────────────────────────────
          │                                       ↑           ↑
          │                                       │           │
          │                                       │           │
release   │                                       │           │
          │                                       │           │
          │                                       │           │
develop   ├─────────────────────────────────────→│───────────│───→
          │           ↑           ↑               │           │
          │           │           │               │           │
          ↓           │           │               │           │
feature   ─────────→  │           │               │           │
                      │           │               │           │
                      │           │               │           │
bugfix                └───────────┘               │           │
                                                  │           │
                                                  │           │
hotfix                                            └───────────┘
```

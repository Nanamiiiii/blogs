---
title: ArchWSL Installation Memo
description: ArchWSLの導入メモ
cover: profile_icon.png
tags:
  - WSL
  - Windows
created: 2024-10-19T18:02:42+09:00
updated: 2025-01-04T17:42:26+09:00
permalink: archwsl
publish: true
---
# Download

https://github.com/yuk7/ArchWSL/tree/master

# 手順
1. ダウンロードして`Arch.exe`と`rootfs.tar.gz`を適当な場所へ解凍
2. `Arch.exe`を起動
3. Keyringの更新
   ```
   pacman -Sy archlinux-keyring
   ```
4. 諸々のパッケージ
   ```
   pacman -S base-devel vim man-db man-pages texinfo reflector git wget curl rsync openssh
   ```
5. reflectorで近いmirrorに変更
   ```
   reflector -c JP -p https -p http --sort rate --save /etc/pacman.d/mirrorlist
   ```
6. 通常ユーザー作成・sudo
   ```
   useradd -m hoge
   passwd hoge
   usermod -aG wheel hoge
   
   EDITOR=vim visudo
   # Comment Out
   %wheel ALL=(ALL:ALL) ALL
   ```
7. `/etc/wsl.conf`に以下を追加．デフォルトユーザーとWinのPATH除外．
   ```
   [user]
   default=nanami
   [interop]
   appendWindowsPath = false
   ```
8. 一旦抜けて再起で完了
   ```
   wsl -t Arch
   wsl -d Arch
   ```
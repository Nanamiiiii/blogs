---
title: pacmanの設定
description: Archのパッケージマネージャ pacmanの設定
cover: profile_icon.png
tags:
  - Linux
  - Arch
created: 2024-10-19T18:01:49+09:00
updated: 2025-01-04T17:41:48+09:00
permalink: pacman-pkg
publish: true
---
# ミラー最適化
`reflector`を使い高速なミラーへ変更
```
pacman -S reflector
reflector -c JP -p https -p http --sort rate --save /etc/pacman.d/mirrorlist
```

# ラッパー `yay` を使う
AURを併せて使える
```
git clone https://aur.archlinux.org/yay.git
cd yay
makepkg -si
```

# `paru`のほうが新しいらしい
```
git clone https://github.com/Morganamilo/paru
cd paru
makepkg -si
```

# プログレスバーをpacmanに
`/etc/pacman.conf`の`[options]`に追加
```ini
[options]
ILoveCandy
```

# aria2
ダウンローダーをaria2へ変更
```
pacman -S aria2
```
`/etc/pacman.conf`に追加
```ini
XferCommand = /usr/bin/aria2c --allow-overwrite=true --continue=true --file-allocation=none --log-level=error --max-tries=2 --max-connection-per-server=2 --max-file-not-found=5 --min-split-size=5M --no-conf --remote-time=true --summary-interval=60 --timeout=5 --dir=/ --out %o %u
```

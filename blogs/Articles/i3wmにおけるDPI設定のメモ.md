---
tags:
  - Linux
cover: profile_icon.png
title: i3wmにおけるDPI設定のメモ
description: i3wmで4Kなどの高解像度ディスプレイをつかう際，DPIや諸々のサイズ設定における変更点
created: 2024-10-19T01:45
updated: 2025-01-04T17:42:22+09:00
permalink: i3wm-dpi
publish: true
---

# TL;DR

4K 27inchのディスプレイ x 2 と WQHDのディスプレイ x 1を常用しているが，i3wmで不意にスケーリングがおかしくなる．
大抵はDPIの設定が変になってるので設定変更のまとめ

# i3wm全体におけるDPI

## .Xresources を使う

自分の環境では結果的に効果なし．以下を`~/.Xresources`へ書き込む．

```
Xft.dpi: 144
```

## xorg.conf を使う

`xorg.conf`の`Section "Screen"`へ以下のオプションを追加することで設定可能．
i3bar含めたi3wm自体のDPIが変化する．

```
    Option    "DPI" "144 x 144"
```

起動中に`xrandr`で変更することも可能．i3wmのリスタートで反映されるが，永続はしない．

```
xrandr -dpi 144
i3-msg restart
```

# カーソルサイズ

GTK, Qtなどのアプリケーション上では問題ないが，i3wm自体のコンポーネント上でバカデカいサイズになったりした．
これは`~/.Xresources`にカーソルサイズを指定することで調整可能．

```
Xcursor.size: 24
```

# GTKアプリケーションのDPI

i3wm自体のDPIとGTKのDPIで整合がとれていないのか，GTKアプリケーションが異様に小さいスケールになっていた．
GTK3+であれば環境変数でDPIスケーリングを調整可能なため，以下を`~/.xprofile`へ追加．

```
export GDK_DPI_SCALE=1.25
```

QTもスケーリングがおかしくなってるのかと思いきや，こっちは無事だった．よくわからん．

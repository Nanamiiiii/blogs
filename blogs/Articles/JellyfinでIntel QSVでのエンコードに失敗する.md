---
tags:
  - Linux
description: JellyfinのHardware Transcodeにて，QSVによるエンコードを有効にするとTranscodeを必要とする条件で再生に失敗する際の対処
title: JellyfinでIntel QSVでのエンコードに失敗するときの対処
created: 2024-10-19T01:25
updated: 2025-01-05T00:40:59+09:00
permalink: jellyfin-qsv
publish: true
---

# TL;DR

JellyfinでIntel QSVによるH.264, HEVCエンコードを有効にすると，一部の条件下で動画のストリーミングができなくなった．

これはデフォルトでHuCが有効になっておらず，一部のHWエンコーディングのみが有効となっていることが原因である．
カーネルパラメータにてHuC Firmwareのロードを有効化することで解消する．

# 環境

- OS
  - TrueNAS SCALE 24.04
- Jellyfin
  - TrueChartでの導入
  - TrueChartsのアプリケーションはk3s上で動作
  - HW TranscodeのためiGPUを割り当て
- CPU/GPU
  - Intel Core i7-9700K
  - Intel UHD Graphics 630

# エラー詳細

HEVCやVP9，Apple ProResなどでエンコードした動画を，これらのDirect Playに対応しないクライアントへストリーミングする際に発生（対応形式へのTranscodeが行われるため）
JellyfinのUI上では「サーバー・クライアントが対応した形式にできない」的な文面が表示される（うろ覚えで凄い適当）

以下のようなTranscodeのログが残っていた．

```
...
[h264_qsv @ 0x55f9ad49e8c0] Selected ratecontrol mode is unsupported
[h264_qsv @ 0x55f9ad49e8c0] some encoding parameters are not supported by the QSV runtime. Please double check the input parameters.
Error initializing output stream 0:0 -- Error while opening encoder for output stream #0:0 - maybe incorrect parameters such as bit_rate, rate, width or height
Conversion failed!
```

調べていると，以下のエントリを発見．
https://www.reddit.com/r/jellyfin/comments/ulw3ct/transcoding_with_intel_quicksync_in_docker/

これによると，カーネルパラメータに `i915.guc_enable=2` を追加することで解消するケースがあるよう．

# GuC/HuC

詳細は[ArchWiki](https://wiki.archlinux.jp/index.php/Intel_graphics#GuC.2FHuC_.E3.83.95.E3.82.A1.E3.83.BC.E3.83.A0.E3.82.A6.E3.82.A7.E3.82.A2.E3.81.AE.E3.83.AD.E3.83.BC.E3.83.89.E3.82.92.E6.9C.89.E5.8A.B9.E3.81.AB.E3.81.99.E3.82.8B)を参照すべし

第9世代 Core以降のGPUに搭載されたgraphics micro controllerとのこと．HEVCなどのエンコードをを専用コントローラへオフロードしたりする．
第12世代 Core以前では，Linuxにおいてこれがデフォルト無効のため，カーネルパラメータで有効化する必要がある．

上記の`i915.guc_enable=2`はHuCファームウェアのロードを有効にするもので，第9世代以降が対応している．

# HuCファームウェアロードの有効化

通常のLinux環境であれば，GRUBなどのbootloaderの設定で上記パラメーターを設定すれば良い．
`/etc/modprobe.d`以下に設定を置いても良いだろう．

TrueNASではGRUBの設定を書き換えても，システム更新があると永続化できないため，少し方法が異なる．

以下のコマンドでデータベースエントリを追加し，再起動

```
midclt call system.advanced.update '{"kernel_extra_options": "`i915.guc_enable=2"}'
```

すると再起動時にこれがGRUBのパラメータへ反映される．

ロードされたかは`dmesg`で確認

```
[    5.300401] i915 0000:00:02.0: [drm] GT0: GuC firmware i915/kbl_guc_70.1.1.bin version 70.1.1
[    5.300425] i915 0000:00:02.0: [drm] GT0: HuC firmware i915/kbl_huc_4.0.0.bin version 4.0.0
```

これで問題無くTranscodeが効くようになった．

---
title: yabaiとskhdでマウスから解放されよう
description: macOSでのyabai + skhdを使ったキーボードonly生活のはなし
tags:
  - macOS
created: 2024-10-19T18:05:31+09:00
updated: 2025-01-06T18:47:56+09:00
permalink: yabai
publish: true
---

# TL;DR

マウス嫌いでもmacOSが使いたい！()

macOS用タイル型ウィンドウマネージャの`yabai`とHotkey daemonの`skhd`で，`i3wm`/`swaywm`のような操作感にできる

https://github.com/koekeishiya/yabai

https://github.com/koekeishiya/skhd

# Initial Setup

## SIPの一部無効化

yabaiの機能のうち，

- space（仮想デスクトップ）の切り替え
- space切り替えアニメーションの無効化
- ウィンドウ透過
- Sticky Window

などを使用する場合，Dock.appをインジェクトするためSIPを無効化する必要がある．
これは後述のScripting Additionという機能である．
その他の使える機能とかは[ここ](https://github.com/koekeishiya/yabai/wiki/Disabling-System-Integrity-Protection)を参照．

保護レベルが低下することになるが，個人的にはこれらの機能なしならばyabaiは使わない方が良い印象．

### 無効化手順

1. マシンをリカバリーモードで起動する
   - M1, M2, M3 Mac: 電源キー長押し
   - Intel Mac: `Command` + `R` を押しながら起動
2. メニューバーの「ユーティリティ」>「ターミナル」からターミナルを起動
3. 以下を実行し，Reboot
   ```
   # M* Mac on macOS Ventura or later
   csrutil enable --without fs --without debug --without nvram
   # M* Mac with previous version
   csrutil disable --with kext --with dtrace --with basesystem
   # Intel Mac
   csrutil disable --with kext --with dtrace --with nvram --with basesystem
   ```
4. 通常起動し，bootargを書き換え（M\* Macのみ）
   ```
   sudo nvram boot-args=-arm64e_preview_abi
   ```

正しく無効化できるとSIPステータスはこうなる (on M1 Pro with macOS Sonoma)
![SIP Status](https://storage.googleapis.com/zenn-user-upload/7c641bdec64b-20230910.png)

## Install

アクセシビリティ許可のポップアップに従って許可設定も行う．

```
# yabai
brew install koekeishiya/formulae/yabai
yabai --start-service
# skhd
brew install koekeishiya/formulae/skhd
skhd --start-service
```

# Configuration

## yabai

設定ファイルは以下に配置する．

- `$XDG_CONFIG_HOME/yabai/yabairc`
- `$HOME/.config/yabai/yabairc`
- `$HOME/.yabairc`

設定ファイルに書くのは `yabai -m config` で行う設定とウィンドウごとのルール（デフォルトfloatingにする等）

## skhd

設定ファイルは以下に配置する．

- `$XDG_CONFIG_HOME/skhd/skhdrc`
- `$HOME/.config/skhd/skhdrc`
- `$HOME/.skhdrc`

基本文法は`<キーストローク> : <実行コマンド>` といった形式．
yabaiのspaceやwindowの操作コマンドに加え，アプリケーション起動のショートカットを設定するとよい．
他のアプリケーションやシステムとキーストロークが重複する際は，Bypassするような設定も可能．

また，モード切り替えによって複雑な設定も可能．
たとえば，自分の設定ではresizeモードを作成し，フォーカス移動と同じストロークでウィンドウサイズの調整が行えるようにしている．
resizeモードを抜けるとフォーカス移動の動作に戻る．

```
# resize mode
:: resize @ : borders active_color=0xffccb3ff inactive_color=0xff494d64 width=5.0 &
alt - r ; resize
resize < escape ; default

# increase window size
resize < alt - h : yabai -m window --resize left:-20:0
resize < alt - j : yabai -m window --resize bottom:0:20
resize < alt - k : yabai -m window --resize top:0:-20
resize < alt - l : yabai -m window --resize right:20:0

# decrease window size
resize < cmd - h : yabai -m window --resize left:20:0
resize < cmd - j : yabai -m window --resize bottom:0:-20
resize < cmd - k : yabai -m window --resize top:0:20
resize < cmd - l : yabai -m window --resize right:-20:0

# rotate tree
resize < alt - r : yabai -m space --rotate 90

# mirror tree y-axis
resize < alt - y : yabai -m space --mirror y-axis

# mirror tree x-axis
resize < alt - x : yabai -m space --mirror x-axis
```

## My Configuration

- [yabai](https://github.com/Nanamiiiii/dotfiles/tree/main/yabai)
- [skhd](https://github.com/Nanamiiiii/dotfiles/tree/main/skhd)

# Scripting Addition

TBD

# Status Bar

TBD

# M\* Macのノッチ対応

TBD

# Widnowsルール

TBD

# JankyBordersの併用

TBD

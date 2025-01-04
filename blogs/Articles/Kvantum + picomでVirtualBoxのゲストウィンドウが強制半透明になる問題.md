---
tags:
  - Linux
cover: profile_icon.png
title: Kvantum + picomでVirtualBoxのゲストウィンドウが強制半透明になる問題
description: QtのテーマとしてKvantumを使用している際，コンポジタを起動するとVirtualBoxのゲストウィンドウが透過されて可笑しくなる問題の解決策
created: 2024-10-19T01:45
updated: 2025-01-04T17:42:11+09:00
permalink: virtualbox-issue-00
publish: true
---

# TL;DR

タイトルの通り．
Qt5/Qt6のテーマとしてKvantumを使っていると，VirtualBoxのゲストウィンドウが不必要に透過してしまう．

# 環境

- ArchLinux
- i3wm
- picom
- kvantum

# 原因

Kvantumによる透過の設定

# 直し方

Kvantumの透過例外にVirtualBoxのExecutableを追加する．
Kvantum Managerの，**Configure Active Theme** > **Compositing & General Look** > **Opaque apps**が透過の例外アプリケーションリスト．
VirtualBoxのゲストウィンドウは `VirtualBoxVM` というExecutableなのでこれを追加する．
![[KvantumManager_20240407234625.png]]

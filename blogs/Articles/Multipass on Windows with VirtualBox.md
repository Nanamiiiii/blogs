---
title: Multipass on Windows with VirtualBox
description: MultipassをVirtualBoxバックエンドで使うときのメモ on Windows
tags:
  - Windows
  - VM
created: 2024-10-19T18:06:26+09:00
updated: 2025-01-05T00:41:05+09:00
permalink: multipass-windows
publish: true
---

# TL;DR

いろいろあってWindows機のHyper-Vを燃やした（消した）が，WSL-likeに雑に捨てれるLinux環境が欲しかった
デフォからいろいろと手を加えたのでメモ

## なぜHyper-Vを捨てた？

ホストのWindowsくんも一応Hyper-V上で動くようになるので，若干だけどもパフォーマンスロスがある．
諸々のエミュレータとかよく使うのでHypervisor Platform経由にしたくなった．遅いので．
別にHyper-Vでもいいんだけど，グラフィックス周りがうんちなのが気に食わない．

# VBoxバックエンドにしたときの構成

- SYSTEMユーザーでVBoxを動かしてる．なので通常ユーザーとかAdministratorからはインスタンスの実体は見えない．
- ネットワークアダプタはデフォルトでNATになる
  - ホストからはアクセスできないよん

# VBox CLIやGUIから操作したい

[PsExec](https://learn.microsoft.com/ja-jp/sysinternals/downloads/psexec)を使ってSYSTEMユーザーで実行すればOK．リンク先から落としてPathを通しておく．
VirtualBoxのインストールディレクトリもシステムのPathに通しておく．

```powershell
# CLI
psexec64 -s vboxmanage
# GUI
psexec64 -s -i virtualbox
```

# Bridge Networkにする

デフォルトのNATだと，構成によってはホストからもSSH等が通らない (Windowsのネットワーク周りをよく知らないのでなんでかは不明)．
Bridgeでローカルネットワークに出してしまえば多少使い勝手は良くなる．

## VirtualBox上でのNIC名称を調べる

```powershell
vboxmanage list bridgedifs
```

全NICの情報が出てくる．BridgeさせたいNICの`Name`をメモ．

## Multipassインスタンスを止める

```powershell
multipass stop <instance>
```

## インスタンスにBridgeインターフェースを追加

管理者権限で実行しているShellにて

```powershell
psexec64 -s vboxmanage modifyvm <instance> --nic2 bridged --bridge-adapter2 <interface name>
```

## インスタンス起動 & netplan

```bash
multipass shell <instance>

# nic名確認
ip a

# netplan config
# enp0s8は適当なnic名に
sudo vim /etc/netplan/60-bridge.yaml
```

```yaml
# 60-bridge.yaml
network:
  ethernets:
    enp0s8:
      dhcp4: true
      dhcp4-overrides:
        route-metric: 200
  version: 2
```

# apply

```shell
sudo netplan apply
```

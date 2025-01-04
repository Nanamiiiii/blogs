---
title: WSLでのUSBデバイス利用
description: WSLでUSBを利用するためのusbipdの使用方法について
cover: profile_icon.png
tags:
  - Windows
  - WSL
created: 2024-10-19T17:46:26+09:00
updated: 2025-01-04T17:40:57+09:00
permalink: wsl-usb
publish: true
---
# TL;DR
`usbipd`の使い方のメモ
メジャーバージョン4での破壊的変更後の仕様

# 導入
## インストーラ

https://github.com/dorssel/usbipd-win/releases

## winget
```
winget install usbipd
```

# 基本

## list
Windowsホストに接続されている，USBIPで使用可能なデバイスを列挙する．

```
usbipd list
```

![[スクリーンショット2024-03-02182844.png]]

Connectedはホストに接続されているデバイス，Persistedは接続されていないがbindが永続化されているデバイス．

- BUSID
  - 接続されているUSBバスのID
  - 操作するデバイスを指定する際に使用
- VID:PID
  - Vendor ID & Product ID
  - デバイスの特定に使える
- STATE
  - デバイスの状態
    - `Not Shared`: 共有されていない
    - `Shared`: 共有対象
    - `Shared (forced)`: 共有対象（force bind）
    - `Attached`: アタッチ済み

## bind
USBデバイスをUSBIPによる共有の対象とする．
あくまで共有対象となるだけで，attachしなければWindows側で使用できる．
この設定は，一度行えばunbindするまで永続する．

```
usbipd bind -b <BUSID>
```

![[スクリーンショット2024-03-02190117.png]]

## force bind
デバイスをWindows側で認識させず，USBIPでの共有Onlyにする．
attachしていなくてもホストから使用できない．
デバイスがbusyと認識されているとattachができないため，それを避けるために有効．

`-f`オプションの付加のみで設定可能．

```
usbipd bind -b <BUSID> -f
```

![[スクリーンショット2024-03-02194516.png]]

## attach
複数のWSLディストリビューションがある場合，すべてにattachされる．
```
usbipd attach --wsl -b <BUSID>
```

![[スクリーンショット2024-03-02192716.png]]

## detach
```
usbipd detach -b <BUSID>
```

# 応用
## vSwitchをBridgeにしている場合
WSLでBridgeインタフェースを使用し，ローカルネットワークのIPを付与している場合，`usbip attach`ではアタッチできない．
WSL側でattach操作を行う．

### attach
```
sudo usbip attach --remote=<HOST IP> --busid=<BUSID>
```

![[スクリーンショット2024-03-03022325.png]]

### WSL側でのデバイスの確認
```
usbip port
```

![[スクリーンショット2024-03-03023138.png]]

### detach
上記で確認したPort番号を指定する
```
sudo usbip detach --port=<PORT>
```

![[スクリーンショット2024-03-03023512.png]]

Windows側からdetachすることも可能
```
usbipd detach -b <BUSID>
```

## 他のLinuxでの利用
Bridgeの場合のWSLと同様
ただし別のマシンからのアクセスの場合，ファイアウォールで3240ポート(TCP)が許可されている必要がある．
これはBridge使用のWSLでも同じかも．

# Troubleshoot
## Mounting 'C:\Program Files\usbipd-win\WSL' within WSL failed
以下のようなエラーでattachに失敗することがある．
![[スクリーンショット2024-03-02190345.png]]

Windows側の`usbipd`からWSLへattachさせる際，`C:\Program Files\usbipd-win\WSL`以下にあるバイナリ・スクリプトをWSLで実行させている．
そのため，このディレクトリを`drvfs`でWSLへマウントさせなければいけないが，何らかの理由で自動マウントに失敗してしまう．

以下のコマンドをWSLで実行すれば問題無くattachできるようになる．
```
sudo mount -t drvfs -o "ro,umask=222" "C:\Program Files\usbipd-win\WSL" "/var/run/usbipd-win"
```

原因はよく分かっていないが，恐らく公式配布のディストリビューションではこの問題は起きない．

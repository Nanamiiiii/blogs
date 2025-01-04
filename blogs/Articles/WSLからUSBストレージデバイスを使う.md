---
title: WSLからUSBストレージデバイスを使う
description: WSLでUSBデバイスを直接扱う方法
cover: profile_icon.png
tags:
  - WSL
  - Windows
created: 2024-10-19T18:07:41+09:00
updated: 2025-01-04T17:41:03+09:00
permalink: wsl-usb-storage
publish: true
---
# WSLでUSBメモリとかを使いたい
いつ頃かは知りませんが，USBIPを利用してWSL2上のLinuxにUSBデバイスを共有できるようになってたみたいですね．

Windows11のWSL標準Linuxカーネルには，既にUSBIPのモジュールが組み込まれています．なので単に接続するだけであれば，USBIPホストとクライアントの設定だけで利用できます．
ただ，USB Mass Storage Driverが標準カーネルに組み込まれていないので，ストレージデバイスとして使いたい場合は独自にビルドしたカーネルを使用する必要があります．

Windows10の場合はUSBIPのモジュールもデフォルトで組み込まれていないようなので，これも独自にビルドする必要があるようですね．

備忘録がてら手順を残しておきます．

# 使用環境
- Windows 11 Pro 22H2 (x64)
- WSL (Version `1.0.0`, MS Store版)
  - Distribution: Arch Linux (ArchWSL `22.10.16.0`, WSL2)
  - Kernel: `5.15.74.2-microsoft-standard-WSL2`

# 要件
基本はMicrosoftの[ドキュメント](https://learn.microsoft.com/ja-jp/windows/wsl/connect-usb#prerequisites)の要件を満たしていればOKです．

Linuxカーネルのビルドをするので，ある程度**リソースに余裕のある**WSLか普通のLinux環境があると望ましいです．ここでは既存のWSL上でそのままビルドします．

# Linuxカーネルのビルド・変更
## 依存パッケージの導入
カーネルビルドに必要なパッケージを調べて，先に導入しておきます．
[Linuxの公式ドキュメント](https://www.kernel.org/doc/html/latest/process/changes.html)に最低限必要なプログラムのリストがありますが，`<ディストリビューション名> kernel build requirements`とかでググれば，パッケージマネージャのコマンドごと出てくると思います．

Ubuntuの場合は以下のパッケージをインストールしておきます．
```bash
sudo apt install build-essential flex bison dwarves libssl-dev libelf-dev cpio
```

ArchLinuxは公式カーネルのPKGBUILDに従うと以下が最低限必要と思われます．
```shell
pacman -S base-devel xmlto kmod inetutils bc libelf git cpio perl tar xz asp 
```

## リポジトリのクローン
WSL2カーネルのリポジトリをクローンします．

https://github.com/microsoft/WSL2-Linux-Kernel

```shell
git clone https://github.com/microsoft/WSL2-Linux-Kernel.git --depth=1
```
`--depth=1`でshallow cloneをしています．フルでクローンするとトータルで**3~4GB**くらいになるので，ストレージに余裕のない方は注意した方が良いです．

## Build Configuration
いくつかやり方はありますが，ここではデフォルトのconfigをコピーしてきて，`menuconfig`で変更します．

1. クローンしたディレクトリのルートで，以下を実行します．
   ```shell
   cp ./Microsoft/config-wsl ./.config
   make menuconfig
   ```

2. このようなTUIが出てきます．十字キーと`<Enter>`で操作します．
   ![menuconfig](https://storage.googleapis.com/zenn-user-upload/6211a9ddf951-20221128.png)
   `Device Drivers` → `USB Support` と進み，`USB Mass Storage support` を探します．
   ![](https://storage.googleapis.com/zenn-user-upload/0f8002873c26-20221128.png)
   ![](https://storage.googleapis.com/zenn-user-upload/463e2b704a8e-20221128.png)
   ![](https://storage.googleapis.com/zenn-user-upload/aea916bd01fd-20221128.png)
   これを選択した状態で，`Y`を押します．すると項目左側のカッコに`*`が表示され，ドライバが有効になります．
   ![こんな感じ](https://storage.googleapis.com/zenn-user-upload/4243f3790562-20221128.png)
   基本的にはこれでOKですが，別途特別なドライバが必要な場合はここで一緒に有効にしておきます．心当たりがなければ，このままで問題無いです．

3. 変更したConfigを保存します．左右キーで下側のコマンドのカーソル（画像参照）を動かし，`Save`を選んで`Enter`を押します．
   ![](https://storage.googleapis.com/zenn-user-upload/59a0dcfd27d3-20221128.png)
   保存するファイル名を聞かれますが，特に変更の必要もないのでそのまま`Enter`でOKです．
   
  > [!tips] 
  > `General Setup` → `Local version` から，Local version名の変更が可能です．`uname -a`とかで確認したときに出てくるやつですね．
  > そのままでも問題無いですが，オリジナルと区別できるように適当に変えておくと良いでしょう．
  > デフォルトは`-microsoft-standard-WSL2`です．
  > ![](https://storage.googleapis.com/zenn-user-upload/72962bef04c7-20221128.png)

4. 同様に`Exit`を選択して終了します．

## ビルド
以下のコマンドでビルドします．
```shell
make -j $(nproc)
```
何回もカーネルのビルドを経験してると最早気になりませんが，貧弱なCPUだと結構時間がかかります．
筆者のデスクトップで4分程度，ラップトップでは十数分かかりました．
`-j`オプションなしだと単一ジョブで走るので，更に遅くなります．

参考までにビルドした環境も載せときます．WSLで利用できるリソースに制限をかけているので，フルパワーの時より劣る結果になっています．

- ビルド環境
  - デスクトップ
    - **CPU:** Intel Core i7-12700K 12C/20T **8コア制限**
    - **RAM:** DDR5-5200 64GB **16GB制限**
  - ラップトップ
    - **CPU:** Intel Core i7-8750H 6C/12T **6コア制限**
    - **RAM:** DDR4-2666 16GB **8GB制限** 

特に設定をいじっていなければ，CPUは搭載の全コア，メモリは全体の80%上限だったと思います．

完成したカーネルは，`vmlinux`という名前でディレクトリのルートにいます．
```shell
$ ls -lh vmlinux 
-rwxr-xr-x 1 nanami nanami 808M Nov 28 01:39 vmlinux
```

ちなみに，ビルド後は成果物で **+4GB** 程度ストレージを圧迫します．
そもそもLinuxをフルでクローンすると，リポジトリ自体で3GB程度あります．
Shallow cloneであればもう少し少ないはずです．
```shell
$ du -sh
7.1G    .
```

## カスタムカーネルに変更
`.wslconfig`で作成したカーネルを指定し，WSLで使われるカーネルを差し替えます．
この操作はWSLの全ディストリビューションに対して有効です．

1. `vmlinux`をWindows側のファイルシステムへコピー
   置き場所はWindows側のファイルシステム上であればどこでも良いです．
   わかりやすい場所が良いので，Cドライブ直下などにディレクトリを作るのがベターでしょう．
   併せて適当にリネームもしています．
   ```shell
   mkdir -p /mnt/c/wsl
   cp ./vmlinux /mnt/c/wsl/515-microsoft-nanamiiiii-WSL
   ```

2. (作成していない場合) `%USERPROFILE%`直下に`.wslconfig`ファイルを作成する
`%USERPROFILE%`はユーザーディレクトリ，つまり`C:\Users\username`直下のことです．
![](https://storage.googleapis.com/zenn-user-upload/a918f48ddc5d-20221128.png)

3. `.wslconfig`にカーネルの設定を書き込む
`.wslconfig`は`ini`形式の設定ファイルで，全WSL環境で共通の設定になります．
ここで`kernel`に先ほどコピーした`vmlinux`へのパスを指定します．
`\`はエスケープをしないと正しく解釈されません
   ```ini
   [wsl2]
   kernel=C:\\wsl\\515-microsoft-nanamiiiii-WSL
   ```

## WSLを再起動
以下はWindows側のシェルから実行してください．

```powershell
wsl --shutdown
wsl -d <distribution>
```

これで正常にWSLが立ち上がれば完了です．`uname -a`でVersion Stringを確認すると，変化していることが分かります．

![](https://storage.googleapis.com/zenn-user-upload/729208c55cb8-20221128.png)

# usbipd-winのインストール

https://github.com/dorssel/usbipd-win

上のリポジトリのReleaseより，最新のmsiをダウンロード・インストールします．

`winget`でもインストールできます．
```powershell
winget install --interactive --exact dorssel.usbipd-win
```

`PATH`を反映するため，ここで再起動 or 再ログインしておくと良いでしょう．

# LinuxにUSBIPクライアントをインストール
ここもディストリビューションによって異なるので，自身の環境にあったものを導入してください．
Ubuntuの場合は[Microsoft公式Docs](https://learn.microsoft.com/ja-jp/windows/wsl/connect-usb#install-the-usbip-tools-and-hardware-database-in-linux)に記載があります．

ArchLinuxの場合は以下でOKです．
```shell
yay -S usbip usbutils
```

# デバイスをUSBIPの共有対象にする

> [!info]
> `usbipd`は基本的にAdministratorで実行する必要があります

> [!tips]
> Windowsでも，LinuxのsudoのようにAdministratorへ昇格できる方法があります．
> 以下の記事の方法が一番簡単でしょう．
>
> https://zenn.dev/ryuu/articles/wanttousesudo-with-win
>
> これを導入すると，`sudo <command>`を打つことでUACダイアログが現れ，管理者権限でコマンドを実行できます．

まず，対象のUSBデバイスをUSBIPによる共有の対象にする必要があります．

1. ホストのWindowsで接続可能なUSBデバイスをリストアップ
   ```powershell
   usbipd list
   ```
   ![スクリーンショット2024-03-02182844.png](https://myuu-dev.assets.newt.so/v1/78bf17c9-4c9f-482b-b764-e5631f05be5f/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%882024-03-02182844.png)
   ここでは`USB Mass Storage Device`や`USB 大容量記憶装置`としか表示されないので，接続したいデバイスが特定できない場合があります．そのときは，USBデバイスのプロパティでVendor IDとProduct IDを特定します．
   ![](https://storage.googleapis.com/zenn-user-upload/172aae4592b4-20221128.png)

2. 共有対象にする
   リスト時に既に`Shared`であればこの手順は不要です．
   ```powershell
   usbipd bind -b <BUSID>
   ```
   ![スクリーンショット2024-03-02190117.png](https://myuu-dev.assets.newt.so/v1/db8f1e3e-99a5-440c-b378-4d9d59b7f0c0/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%882024-03-02190117.png)

#  デバイスをWSLにアタッチ
```powershell
usbipd attach --wsl [DISTRIBUTION] -b <BUSID>
```

`--wsl`オプションでWSLのディストリビューション名を指定しますが，関係なく全てのディストリビューションでマウントされるようです．
なので引数を省略し，オプションのみでもOKです．

WSLにアタッチしている間，そのデバイスにはWindows側からアクセスできないので注意してください．

![スクリーンショット2024-03-02192716.png](https://myuu-dev.assets.newt.so/v1/0637b845-f11f-4666-b6f5-05db68af71e6/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%882024-03-02192716.png)

> [!warning]
> WSL環境によっては以下のようなエラーが発生することがあります．
>
> ![スクリーンショット2024-03-02190345.png](https://myuu-dev.assets.newt.so/v1/78e69ab7-a3ec-4863-b8af-56f0305d3795/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%882024-03-02190345.png)
> 
> Windows側の`C:\Program Files\usbpid-win\WSL`がWSLで正常にマウント出来ないことが原因です．
> WSLにて以下のコマンドを正常に実行できれば問題無く使用可能となります．
> 
> ```
> sudo mount -t drvfs -o "ro,umask=222" "C:\Program Files\usbipd-win\WSL" "/var/run/usbipd-win"
> ```


> [!warning]
> Windows側で常にデバイスが使用中扱いとなり，アタッチ出来ないことがあります．
> 
> ![スクリーンショット2024-03-02194313.png](https://myuu-dev.assets.newt.so/v1/486f48e1-80ac-4714-a5bf-42f3bcbd0477/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%882024-03-02194313.png)
> 
> この場合，バインドの際にforceバインドをすることでWindowsから完全に切り離され，アタッチ可能になります．
>
> ```
> usbipd bind -b \<BUSID\> -f
> ```
>
> ![スクリーンショット2024-03-02194516.png](https://myuu-dev.assets.newt.so/v1/c49ce112-b314-4d9f-a909-916c3734a558/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%882024-03-02194516.png)
> 
> forceバインド後はデバイスを再接続してください．

# WSL側で確認
`lsusb`や，ストレージデバイスなら`lsblk`で確認します．

![スクリーンショット2024-03-02200724.png](https://myuu-dev.assets.newt.so/v1/169eff3a-f121-469c-a662-a7d90ae384bd/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%882024-03-02200724.png)

# デタッチ
WSLからデタッチして，Windows側に戻します．同じく管理者権限のPowershellで以下を実行します．

```powershell
usbipd detach -b <BUSID>
```

![スクリーンショット2024-03-02213552.png](https://myuu-dev.assets.newt.so/v1/85ef57d8-cfca-4d25-973d-903c9430f588/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%882024-03-02213552.png)

# おわりに
大したことをやっているわけではないですが，慣れない人からすれば面倒な点がいくらかあるかと思ったので，少し丁寧に書きました．

自分は組み込みデバイスのFWフラッシュやシリアルコンソール，JTAGデバッガなどをよく使うので，この機能は重宝しています．

間違いや指摘などあれば気軽に教えていただけると助かります．
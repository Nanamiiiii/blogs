---
title: 自分用のArchLinuxパッケージリポジトリを作った
description: 自分用にArchLinuxのパッケージリポジトリを作った話
tags:
  - Arch
  - Linux
created: 2024-10-19T17:55:56+09:00
updated: 2025-01-05T00:41:42+09:00
permalink: archpkg-repo
publish: true
---

# 経緯

[これ](https://myuu.dev/blogs/nvim-head-brew)と同様．
AURにHEADをビルドできるPKGBUILDがあるが，これがまたtreesitterのparserをデフォで抱き合わせていない．
（抱き合わせがなくても動くようなconfigにしろよって話でもある）
また複数のArch環境があるから，それぞれで毎日ビルドするのも非常に面倒くさい．
なんで毎日HEADをビルドしてパッケージ化し，ホストするリポジトリを作った．

# 作り方

## PKGBUILDを作る

ArchWikiの[PKGBUILD](https://wiki.archlinux.jp/index.php/PKGBUILD)を見るのが早い．実体としてはただのbash構文のスクリプト．
パッケージ名やら依存関係やらをゴリゴリと書いていくだけなのでそこまで難しくない．
今回はAURの`neovim-git`をベースにビルド方法を一部変えただけなのでもっと楽．
作ったのはこれ↓

```bash
# Maintainer: Akihiro Saiki <nanami at myuu.dev>

_pkgname=neovim
pkgname="$_pkgname-head"
pkgver=0.10.0.r2388.gb12d193b4a
pkgrel=1
pkgdesc='Fork of Vim aiming to improve user experience, plugins, and GUIs'
arch=(i686 x86_64 armv7h armv6h aarch64)
url='https://neovim.io'
backup=('etc/xdg/nvim/sysinit.vim')
license=('custom:neovim')
makedepends=('cmake' 'git' 'ninja' 'unzip')
optdepends=(
    'python-pynvim: for Python plugin support (see :help python)'
    'xclip: for clipboard support on X11 (or xsel) (see :help clipboard)'
    'xsel: for clipboard support on X11 (or xclip) (see :help clipboard)'
    'wl-clipboard: for clipboard support on wayland (see :help clipboard)'
)
provides=("$_pkgname=${pkgver/\.r*/}" 'vim-plugin-runtime')
conflicts=("$_pkgname")
source=(
    "git+https://github.com/neovim/$_pkgname.git"
    "nvimdoc::https://aur.archlinux.org/cgit/aur.git/plain/nvimdoc?h=neovim-git"
    "nvimdoc.hook::https://aur.archlinux.org/cgit/aur.git/plain/nvimdoc.hook?h=neovim-git"
)
sha512sums=(
    'SKIP'
    '22662462c823de243599cdd3483e46ade4ab59b219e907468d34c18e584fe7477548e357ee2ce56bb098cf54b770b108a3511703dd486f0774a65c84af78f6aa'
    '3c6ee1e4646d09c164a2212f9e4d2f53158ff32911b0972e060a395a8d4685334574a7ede995a81680dcc0750cd3327a78beb7904a4bb326b2399d79a8b12d5e'
)
b2sums=(
    'SKIP'
    'd31cf81659e238fada8092755eb9be16f77c00a466107eb5770c6c9c32e043c91e6efada7ddb51663716a0e38ffa6e3d0093b3e6833aa961d845c7451a95491e'
    '26588b9da6459393076723bdfb8d2b16fed882070f2326bf7c35cd272dee9c18df603afb1ae2254cd0a59eff68189caf04828ef165d5de42c7a4222267604101'
)

pkgver() {
    cd "$_pkgname"
    local nvim_version nvim_version_git
    nvim_version="$(sed -nE '/NVIM_VERSION_/ s/.* +([0-9]+)\).*/\1/p' ./CMakeLists.txt | sed ':b;N;$!bb;s/\n/\./g')"
    nvim_version_git="$(git describe --first-parent --always | sed -E 's/^v[0-9]+.[0-9]+.[0-9]+-//; s/^([0-9]+)-([a-z0-9]+)/\1\.\2/')"
    printf "%s.r%s\n" "$nvim_version" "$nvim_version_git"
}

build() {
    cd "$_pkgname"
    make CMAKE_BUILD_TYPE=RelWithDebInfo CMAKE_INSTALL_PREFIX=/usr
}

check() {
  cd "$_pkgname"
  ./build/bin/nvim --version
  ./build/bin/nvim --headless -u NONE -i NONE +q
}

package() {
    install -Dm644 -t "$pkgdir/usr/share/libalpm/hooks/" nvimdoc.hook
    install -Dt "$pkgdir/usr/share/libalpm/scripts/" nvimdoc

    cd "$_pkgname"
    make DESTDIR="$pkgdir" install

    install -Dm644 LICENSE.txt -t "${pkgdir}/usr/share/licenses/${pkgname}/"
    install -Dm644 runtime/nvim.desktop -t "${pkgdir}/usr/share/applications/"
    install -Dm644 runtime/nvim.appdata.xml -t "${pkgdir}/usr/share/metainfo/"
    install -Dm644 runtime/nvim.png -t "${pkgdir}/usr/share/pixmaps/"

    # Make Arch Vim packages work
    mkdir -p "${pkgdir}"/etc/xdg/nvim
    echo "\" This line makes pacman-installed global Arch Linux vim packages work." > "${pkgdir}"/etc/xdg/nvim/sysinit.vim
    echo "source /usr/share/nvim/archlinux.vim" >> "${pkgdir}"/etc/xdg/nvim/sysinit.vim

    mkdir -p "${pkgdir}"/usr/share/vim
    echo "set runtimepath+=/usr/share/vim/vimfiles" > "${pkgdir}"/usr/share/nvim/archlinux.vim
}
```

## パッケージアーカイブを作る

PKGBUILDからパッケージアーカイブ `*.pkg.tar.zst` を作る．
PKGBUILDと同一のディレクトリで以下を実行すればよい．

```shell
makepkg -s
```

完了するとカレントディレクトリにパッケージが生成される．設定によってはデバッグパッケージも生成される．

```
[nanami@arch-pkgbuilder neovim-head]$ ls -la neovim-*
-rw-r--r-- 1 nanami nanami 7562254 Feb 26 20:14 neovim-head-0.10.0.r2452.gad5a155b1f-1-x86_64.pkg.tar.zst
```

## リポジトリを作成

pacmanのリポジトリはデータベースとパッケージ本体で構成される．
データベースの生成は`pacman`に含まれる`repo-add`で可能．
ArchWikiの説明は[これ](https://wiki.archlinux.jp/index.php/Pacman/%E3%83%92%E3%83%B3%E3%83%88%E3%81%A8%E3%83%86%E3%82%AF%E3%83%8B%E3%83%83%E3%82%AF#.E3.82.AB.E3.82.B9.E3.82.BF.E3.83.A0.E3.83.AD.E3.83.BC.E3.82.AB.E3.83.AB.E3.83.AA.E3.83.9D.E3.82.B8.E3.83.88.E3.83.AA)．

リポジトリのディレクトリ構成は，データベースファイルの`reponame.db`, `reponame.files` とパッケージ本体が同一ディレクトリであれば特段問題はない．そのディレクトリに対してXferCommandで指定されてるアプリケーション（デフォルトは`curl`だった気がする…？）がアクセス可能であればよい．
ただ他のディストリビューションやアーキテクチャで併用することを考慮して，適当に決めたルート（ここでは`reporoot`にしておく）から`archlinux/x86_64`の位置に配置することにした．

あとは配置するディレクトリにパッケージをコピーして，`repo-add`を実行すればよい．

```bash
# Copy
cp neovim-head-0.10.0.r2452.gad5a155b1f-1-x86_64.pkg.tar.zst reporoot/archlinux/x86_64
# Create repo
cd reporoot/archlinux/x86_64
repo-add reponame.db.tar.xz neovim-head-0.10.0.r2452.gad5a155b1f-1-x86_64.pkg.tar.zst
```

データベースが存在すれば既存のものが更新され，存在しなければ新たにデータベースが作成される．
`reponame`で指定した名前がリポジトリの名称になる．これを後で`pacman.conf`に記載することになる．

## 適当にホストする

ローカルで使うだけなら特段何もしなくてもよし．
HTTP経由で引っ張りたいのであれば，`reporoot`に対してnginxとかapacheでHTTPアクセス可能にすれば良いだろう．

自分は自宅のNFS上に置いたので，これを自宅k8sで走らせたnginxコンテナからマウントしてホストした．
特に隠す物もないのでPublicにしている．[https://pkg.myuu.dev](https://pkg.myuu.dev)

## pacmanの設定に加える

`pacman.conf`を編集し，以下のエントリを追加する．

```ini
[reponame]
SigLevel = Optional # 署名検証を任意にする．パッケージ署名に関しては後ほど書く．
# 以下は必要な方だけ
Server = http://hogehoge.com/archlinux/$arch # HTTPアクセス
Server = files:///reporoot/archlinux/$arch # ローカル
```

`$arch`にはマシンのアーキテクチャが勝手に入る．

正しく設定出来ていれば，`pacman -Sy`で自作リポジトリのデータベースが落ちてくるはず．

```
[nanami@arch-pkgbuilder ~]$ sudo pacman -Sy
:: Synchronizing package databases...
 core                                                                              129.9 KiB   565 KiB/s 00:00 [##################################################################] 100%
 extra                                                                               8.3 MiB  39.0 MiB/s 00:00 [##################################################################] 100%
 myuurepo                                                                          728.0   B  2.63 KiB/s 00:00 [##################################################################] 100%
```

こんな感じで`myuurepo`ってのが追加されている．

# 補足

## パッケージ署名

正当なパッケージであることを保証するために，パッケージ署名をを付与するとよい．
今回は自動でビルドさせたりをしたかったので面倒だから付けていない（そもそもパッケージ作成を自動化ワークフローでやらせるのが推奨されてない．まあそれはそう．）

### GPG Keyを作る

```
gpg --gen-key
```

ここでは書かないがバックアップと失効証明書はちゃんとエクスポートした方が良い．
作成すると鍵のfingerprintが出力されるので覚えておく．以下のコマンドで後から確認も出来る．

```
gpg --list-keys
```

### 自身の公開鍵を鍵サーバーへアップロード

他者が検証するときに使うため．

```
gpg --send-key <key fingerprint>
```

### makepkgの署名設定

`/etc/makepkg.conf` or `~/.config/pacman/makepkg.conf`の以下をコメントアウト・編集

```ini
﻿#-- Packager: name/email of the person or organization building packages
PACKAGER="Akihiro Saiki <nanami [at] myuu.dev>" # [at]はリプレイスしている
#-- Specify a key to use for package signing
GPGKEY="XXXXXXXXXXXXXXXXXXXXX"
```

`PACKAGER`はgpg鍵の生成時に入力した実名とメールアドレス，`GPGKEY`は鍵のfingerprint．

### 署名付きでパッケージ生成

```
makepkg -s --sign
```

`makepkg.conf`や`PKGBUILD`側でも署名するよう指示できる．
するとパッケージと`*.pkg.tar.zst.sig`という署名ファイルも生成される．
これをパッケージと同じディレクトリに配置して，同じく`repo-add`をすると勝手に認識してくれる．

# もし使いたければ…

自分で使う物だけなので大したもの置いてないです．

```
pacman-key --recv-key 8F2CA5A0068E9627
```

```ini
[myuurepo]
SigLevel = Optional
Server = https://pkg.myuu.dev/archlinux/$arch
```

---
id: Nixに入門する with nix-darwin
aliases:
  - 以前のdotfiles
tags:
  - Nix
  - macOS
cover: profile_icon.png
created: 2024-11-25T23:35:35+09:00
description: 1週間ほどでnix-darwinからNixに入門したお話
permalink: beHVRLPEdQ9tfCoZ
publish: false
title: Nixへ入門する with nix-darwin
updated: 2025-01-04T17:41:56+09:00
---

1ヶ月ほど前に数年使用してきた[dotfiles](https://github.com/Nanamiiiii/dotfiles)のNix化をはじめた．
動機としては，しばらく前からVim-jp内で流行っていて目をつけていたというのもあるが… 自分のdotfilesがゴチャゴチャしてきて困っていたというのが大きい．
特に，環境をまっさらにして作り直すのを少なくとも年1回はやるので，**1発で非常に再現度の高い環境に戻せる**というNixの特徴がとても魅力的だった．

結局環境を再構築するときに一番嫌なのは，各種パッケージを揃えるところで…
「ヨシ！全部入れたぞ！」と思っていても，いざ使い始めたら色々足りてないとかはザラ．
いい加減嫌気が差したので，思いきってNix化を始めた．

# 以前のdotfiles

https://github.com/Nanamiiiii/dotfiles/tree/54c9f18394de0eff511c18f2468f675a5ffe9421
初めはvimの設定だけだったが，色々やっていくうちにこの有様になっていた．
symlinkを張るようなscriptも特に用意してないので，再構築の時はいつも手でちまちまとやってた．

特に直したかった点としては，

- ホストごとに異なる設定を有する場合でもキレイにしたい
  - luaを使うweztermとかはscript内で収められて非常に親和性が高い
- 何かの拍子で不意に書き換わってしまう（インストーラとかの副作用で）を防ぎたい
  がある．

ただ全てをNix内に収めたいというわけでもなく，特にluaで書けるようなものは柔軟にしておきたいのでそのままsymlinkで対応したいとも考えていた．

ひとまずNixOSには手を出さず，macOS上で試してみることにした．

# 構成

- nix-darwin
  - とくにmacOS側の設定を触る予定はなかったが，homebrewに触れるのと，LaunchAgent辺りの挙動が少しhome-managerと異なりそうなので入れた
- home-manager
  - 諸々のパッケージは基本的にhome-managerで導入
  - `programs`での設定に移行できる物は移行し，既存設定を残したいものはsymlinkで対応

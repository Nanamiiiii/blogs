---
id: Nixに入門する nix-darwin編
aliases:
  - 以前のdotfiles
tags:
  - Nix
  - macOS
created: 2024-11-25T23:35:35+09:00
description: 1ヶ月ほどでNixに入門したお話 nix-darwinの部分より
permalink: nix-noob-darwin
publish: true
title: Nixへ入門する nix-darwin編
updated: 2025-01-05T21:01:12+09:00
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

ただ全てをNix内に収めてしまうと，変更時に毎回Rebuildを走らせなければいけないなどがちょっと煩わしい．
特にluaで書けるようなものは柔軟にしておきたいので，そのままsymlinkで対応したいとも考えていた．

また，全ての環境でNixを使用できないこともあるので，Non-nix環境向けの対応を残しておく必要があった．

# 構成
トップレベルのディレクトリ構成は以下に落ち着いた．
```
.
├── aqua
├── config
├── home-manager
├── nix-darwin
├── nixos
├── overlays
├── profiles
├── secrets
├── sheldon
├── flake.lock
├── flake.nix
├── Makefile
├── README.md
├── renovate.json
└── treefmt.nix
```

Nix環境については，NixOS / nix-darwin / home-managerで共通の部分は共有しつつ定義した．

Nox-nixな環境では，sheldonでShell Plugin, aquaで各種CLIツールを管理し，諸々のconfigはMakefile or 手動でsymlinkを張るものとした．

# nix-darwin
`flake.nix`の`outputs`で以下のように記述して定義する．
```nix title="flake.nix"
      darwinConfigurations =
        let
          darwinSystemArgs =
            {
              profile,
              username,
              system,
            }:
            import ./nix-darwin {
              inherit
                inputs
                profile
                username
                system
                ;
            };
          inherit (darwin.lib) darwinSystem;
        in
        {
          asu = darwinSystem (darwinSystemArgs {
            profile = "asu";
            username = "nanami";
            system = "aarch64-darwin";
          });
        };
```

`./nix-darwin`に`darwinSystem`へ渡す引数を構成する関数を定義しており，ここではそこに必要なものを渡すのみとなる．
`profile`はプロファイルごとに一意の名称とし，hostnameとは別扱いにして同一ホストで別ユーザーを構成するときに支障がないようにはしている（ただし使ってはいない）

`nix-darwin/dafault.nix`は以下．
```nix title="nix-dawrin/default.nix"
{
  inputs,
  profile,
  username,
  system,
  ...
}:
let
  # Pick base system string
  baseSystem = builtins.elemAt (builtins.split "-" system) 2;
in
rec {
  inherit system;

  specialArgs = {
    inherit inputs profile username;
    desktop = true; # Assumed non-headless
    pkgs-stable = import inputs.nixpkgs-stable {
      inherit system;
      config.allowUnfree = true;
    };
  };

  modules =
    let
      inherit (inputs.home-manager.darwinModules) home-manager;
      homeConfig = import ../home-manager {
        inherit
          profile
          username
          system
          specialArgs
          ;
      };
    in
    [
      ../profiles/${profile}
      (import ../overlays { inherit inputs system; })
      home-manager
      homeConfig
    ];
}
```
`profiles/<プロファイル名>`にプロファイルごとに独立したnix-darwinの設定を記述しており，それを`modules`として呼び出す．
あとはnixpkgsへのoverlayの適用と，home-managerを呼び出す．

home-managerの設定は他システムと共有する部分が多くあるため，`home-manager/default.nix`に呼び出す設定を構成する関数を定義する．
この部分はhome-manager編で再度触れる．

profileごとの設定は以下となる．
```nix title="profile/asu/default.nix"
{ config, username, ... }:
{
  imports = [
    ../../nix-darwin/settings
    ./apps.nix
  ];

  users.users.nanami = {
    home = "/Users/${username}";
  };

  networking = {
    hostName = "asu";
  };

  services.cachix-agent = {
    enable = true;
    name = "asu";
    credentialsFile = config.sops.secrets.cachix-agent.path;
  };

  sops.secrets.cachix-agent = {
    sopsFile = ./secrets.yaml;
  };
}
```
ここではユーザーやhostnameの設定が主で，それ以上に手は加えていない．最初はhomebrewをnix-darwinで管理するための設定を含めていたが，nixでの管理をやめてしまったので今は含めていない．

nix-darwinを使用するホストで共通になり得る設定は`nix-darwin/settings`以下に定義しており，各プロファイルからそれを呼び出す構成をとる．
```nix title="nix-darwin/settings/default.nix"
{
  pkgs,
  inputs,
  username,
  ...
}:
{
  imports = [
    ./packages.nix
    ./sops.nix
    inputs.sops-nix.darwinModules.sops
  ];

  nix.settings.trusted-users = [ username ];

  nix.extraOptions = ''
    experimental-features = nix-command flakes
  '';

  nixpkgs.config.allowUnfree = true;

  programs.zsh.enable = true;

  services.nix-daemon.enable = true;

  environment.variables = {
    EDITOR = "nvim";
    LANG = "en_US.UTF-8";
  };

  fonts = {
    packages = with pkgs; [
      plemoljp
      plemoljp-nf
      plemoljp-hs
      ibm-plex
      nerd-fonts.symbols-only
      noto-fonts-cjk-sans
      noto-fonts-cjk-serif
      (noto-fonts.override {
        variants = [
          "NotoSansSymbols"
          "NotoSansSymbols2"
        ];
      })
    ];
  };

  time.timeZone = "Asia/Tokyo";

  system.stateVersion = 5;
}
```
内容としては，nix, nixpkgsの設定と環境変数・フォントなど．

# home-manager
`nix-darwin`の`modules`に食わせていたhome-managerの設定は以下．
```nix title="home-manager/default.nix"
{
  profile,
  username,
  system,
  specialArgs,
  ...
}:
{ config, ... }:
{
  home-manager = {
    useGlobalPkgs = true;
    useUserPackages = true;
    users.${username} = import ./profiles/${profile};
    extraSpecialArgs = specialArgs // {
      hostname = config.networking.hostName;
    };
    backupFileExtension = "hm-bkp";
  };
}
```
この関数はAttrSetを2つ受け取る．
1つ目が`nix-darwin/default.nix`でimportする際に明示的に食わせているもの，2つ目がnix-darwinの`modules`に暗黙的に食わされるものとなる．

`home-manager/profiles`以下に置いているプロファイルごとの設定が中核で，これを`users.<ユーザー名>`に食わせている．
あとはnix-darwin側の設定(`config`)からhostnameを引き渡すようにしている．
これはNixOSでも同様に使えるもので，システム側の設定値と同じ物を二重で書きたくないという怠け心です．変えたときに絶対もう片方を変え忘れるので．

`backupFileExtension`は，home-managerが配置するファイルが既に存在する場合にそのバックアップに付加されるsuffixで，正直あってもなくても良い．

profileごとの設定は以下．
基本的にhome-managerで扱うものは共通のものが多いので，`home-manager/common` `home-manager/darwin`に含めている．
```nix title="home-manager/profile/asu/default.nix"
{ pkgs, ... }:
{
  imports = [
    ../../common
    ../../darwin
  ];

  home.packages = with pkgs; [
    yt-dlp
    flyctl
    vlc-bin
  ];

  home.stateVersion = "24.05";
}
```

共通部分に関しては，home-manager編で書くと思う（多分…）

# ハマったところなど
## アプリケーションパッケージの配置場所
macOSのGUIアプリケーションをnix経由で導入した場合，アプリケーションパッケージのsymlinkが張られる．
このとき，nix-darwinで宣言したものとhome-managerで宣言したものとでsymlinkの配置場所が異なる．
- nix-darwin: `/Applications/Nix Apps`
- home-manager: `~/Applications/Home Manager Apps`

## アプリケーションパッケージの名前解決
macOSではCLIから`open`でアプリケーションパッケージを起動できる．
```
open -a "Hoge"
```
Nixでアプリケーションパッケージを導入した場合，GCで回収されるまでは`/nix/store`にアプリケーションパッケージ自体あは存在するため，`open`によって呼び出されるものが古いバージョンのままになってしまうことがあった．

あまりmacOSに詳しくないので，この辺がどういった扱いになっているのかはよく知らない．
とりあえずの解決法としては残っている古いパッケージを消す以外が無かった．
(だれか詳しい人いたら教えてください…)

# To be continued...
引き続きNixOSとかの部分も書こうと思う．いつか．
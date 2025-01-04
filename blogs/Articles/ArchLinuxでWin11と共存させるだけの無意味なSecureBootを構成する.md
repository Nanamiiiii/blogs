---
tags:
  - Linux
  - Arch
  - SecureBoot
cover: profile_icon.png
title: ArchLinuxでWin11と共存させるだけの無意味なSecureBootを構成する
description: SecureBoot必須になったWin11との共存を手抜きでやる方法
created: 2024-10-19T01:53
updated: 2025-01-04T17:42:32+09:00
permalink: gaba-secureboot
publish: true
---
# TL;DR
SecureBootは有効だけど，検証はしないよ！（？？？）とかいう意味不明な構成にする（頻繁に破壊して𝑰𝑵𝑺𝑻𝑨𝑳𝑳 𝑩𝑨𝑻𝑻𝑳𝑬をするから真面目に構成するのめんどくなった）．
あくまでSecureBoot必須のWin11と共存する目的であって，**セキュリティ的には破綻**しているので非推奨．
真面目な人はMOKの鍵を生成して署名するかハッシュをenrollするかして，ちゃんと検証するようにしてね．

# そもSeucure Bootって？いるの？
ggrks

# 手順
## 前提
- ArchLinuxの初期インストールが終わって，GRUB導入済み・起動済み．
- WinとArchは別ストレージにいて，ESPも個別に持ってる想定（壊したくないので）．
- ESPは`/boot`想定
- AURの使えるpacmanラッパーを入れておく（ここでは`yay`で進める）

## GRUBのバイナリにsbatセクションを付加
1. バイナリに内包するmoduleをexportしておく
    [ここ](https://git.launchpad.net/~ubuntu-core-dev/grub/+git/ubuntu/tree/debian/build-efi-images)を参考に必要なmoduleを選ぶ．片っ端から入れとくと失敗はしない．以下は全部含めた例．
   ```bash
   export GRUB_MODULES="all_video boot btrfs cat chain configfile echo efifwsetup efinet ext2 fat font gettext gfxmenu gfxterm gfxterm_background gzio halt help hfsplus iso9660 jpeg keystatus loadenv loopback linux ls lsefi lsefimmap lsefisystab lssal memdisk minicmd normal ntfs part_apple part_msdos part_gpt password_pbkdf2 peimage png probe reboot regexp search search_fs_uuid search_fs_file search_label serial sleep smbios squash4 test tpm true video xfs zfs zfscrypt zfsinfo cryptodisk gcry_arcfour gcry_blowfish gcry_camellia gcry_cast5 gcry_crc gcry_des gcry_dsa gcry_idea gcry_md4 gcry_md5 gcry_rfc2268 gcry_rijndael gcry_rmd160 gcry_rsa gcry_seed gcry_serpent gcry_sha1 gcry_sha256 gcry_sha512 gcry_tiger gcry_twofish gcry_whirlpool luks lvm mdraid09 mdraid1x raid5rec raid6rec"
   ```
2. sbatを付加してGRUBを再インストール
   ```bash
   grub-install --target=x86_64-efi --efi-directory=/boot --modules=${GRUB_MODULES} --sbat /usr/share/grub/sbat.csv
   ```
3. sbatが付いてるか確認
   ```bash
   objdump -j .sbat -s /boot/efi/grub/grubx64.efi
   ```

## Secure Boot有効化と検証無効化
1. `shim-signed`と`mokutil`を入れる
   ```bash
   yay -S shim-signed mokutil
   ```
2. `shim`とMOK Manager `mm` を `/boot/efi/<bootloader-id>`以下に移動
   `shim`, `mm`, `grub`は同一ディレクトリにいないといけない
   ```bash
   cp /usr/share/shim-signed/shimx64.efi /boot/EFI/<bootloader-id>/
   cp /usr/share/shim-signed/mmx64.efi /boot/EFI/<bootloader-id>/
   ```
3. ブートエントリの編集
   efivarsに保存されてるブートエントリを編集し，`shimx64.efi`が初めに起動するように変更．
   `shimx64.efi`を`/boot/efi/boot/bootx64.efi` (fallback) としてる場合，勝手にUEFI Firmwareが見つけてくれるので変更不要
   マザーボードによってはefibootmgrでの変更を認識しない場合がある (MSI MPG Z690 FORCE Wi-Fi はNGだった)．
   ```bash
   efibootmgr -c -L <label> -d <boot device> -l /boot/efi/<bootloader-id>/shimx64.efi
   ```
4. `shim`以降のVerification Chainを無効化
   なんでこんな設定ができるんですかね…意味ねぇな…🤔
   ```
   mokutil --disable-verification
   # 再起動時に入力するパスワードを設定
   ```
5. Reboot
6. MOK ManagerでSecure Boot Stateを変更
   MOK Managerが勝手に起動するので，**Change Secure Boot State**を選択．
7. 設定したパスワードのx文字目を何個か聞かれる
8. **disable secure boot**を確認して`yes`
9. 再起動
10. 晴れて無効化完了．起動時に **Booting insecure mode**と表示される．

本来はGRUBとカーネルに署名をして，鍵のenrollをしないといけないが，これで省ける．
本来のセキュリティを保ちたいのであればこの方法は愚行なのでやめた方が良い．メリット・デメリットが完全に理解できる人のみやるべき．
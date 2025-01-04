---
tags:
  - Linux
  - Arch
cover: profile_icon.png
title: ArchLinux Install Battle
description: ArchLinux Install Battle
created: 2024-10-19T01:53
updated: 2025-01-04T17:42:54+09:00
permalink: archinstall
publish: true
---

Install Battleのメモ
DEはi3wm & KDE
KernelはZen

# Partitioning

`root`, `home` を分離
fsは`btrfs`

```
# Partitioning
cgdisk <device>

# ESP
mkfs.fat -F32 <esp>
# root, home
mkfs.btrfs <part>
```

# Install

## timezone

```
timedatectl set-ntp true
timedatectl set-timezone Asia/Tokyo
# on windows dualboot
timedatectl set-local-rtc true
```

## Mounting

```
mount <root part> /mnt
mkdir /mnt/boot
mkdir /mnt/home
mount <esp> /mnt/boot
mount <home part> /mnt/home
```

## mirror optimization

```
reflector -c JP -p https -p http --sort rate --save /etc/pacman.d/mirrorlist
```

## pacstrap

```
pacstrap /mnt base linux-zen linux-zen-headers linux-firmware btrfs-progs dosfstools networkmanager vim man-db man-pages texinfo base-devel efibootmgr grub reflector git wget curl rsync
```

### Microcode

```
# Intel
pacstarp /mnt intel-ucode
# AMD
pacstrap /mnt amd-ucode
```

## Generate fstab

```
genfstab -U /mnt >> /mnt/etc/fstab
```

# chroot

```
arch-chroot /mnt
```

## Timezone

```
ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime
hwclock --systohc
```

## Generate Locale

```
# uncomment needed locale
vim /etc/locale.gen
locale-gen
```

## Hostname

```
echo "rika" > /etc/hostname
```

## Enable NM

```
systemctl enable NetworkManager
```

## Install Bootloader

Windowsのエントリは自作 or OS_PROBERを有効化する

```
grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=Arch
grub-mkconfig -o /boot/grub/grub.cfg
```

## Create User

```
# enable sudo for wheel user group
visudo

useradd -m nanami
usermod -aG wheel nanami
passwd nanami
su nanami
```

## Paru

```
git clone https://aur.archlinux.org/paru-bin.git
cd paru-bin
makepkg -si
```

## Configure Insecure SecureBoot

[[ArchLinuxでWin11と共存させるだけの無意味なSecureBootを構成する]]

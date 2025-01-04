---
title: ThinkPad + Arch + SecureBoot + LUKS + TPM + DualBoot
description: ThinkPadでLUKS Full Disk EncryptionとTPMによる復号化を有効にしたDualBoot ArchLinux環境を構築した記録
cover: profile_icon.png
tags:
  - Arch
  - Linux
  - Windows
  - SecureBoot
  - TPM
created: 2024-10-21T00:49:49+09:00
updated: 2025-01-04T17:41:16+09:00
permalink: cGqBgNqubsNyLiQ4
publish: false
---
# TL;DR
以前[[ArchLinuxでWin11と共存させるだけの無意味なSecureBootを構成する]]でWin11の制約を突破する為だけのガバガバSecureBootを構築したが，今回は真面目に構築することにした．

新たに導入したラップトップで，Disk Encryptionをちゃんとやりたかったというのがモチベ．またLinux側で`sbctl`などのSecureBoot周辺ツールが充実してきており，以前より簡単にMicrosoftの署名に頼らないSecureBootが構築できるようになったのも１つのきっかけだった．
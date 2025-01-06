---
tags:
  - k8s
  - Linux
title: systemd-resolvedを使わない場合のkubeletでのおまじない
description: JellyfinのHardware Transcodeにて，QSVによるエンコードを有効にするとTranscodeを必要とする条件で再生に失敗する際の対処
created: 2024-10-19T01:39
updated: 2025-01-06T18:48:24+09:00
permalink: kubelet-resolv
publish: true
---

`kubelet`はホストのDNS情報を得るため，`resolv.conf`を参照する．デフォルトでは，`systemd-resolved`の生成するものを参照するが，これを使っていない場合，ファイルに到達できずpodが立ち上がらなくなる．

エラーとしては以下が発生．

```
"Failed to generate sandbox config for pod" err="open /run/systemd/resolve/resolv.conf: no such file or directory"
```

対処法として，`/etc/resolv.conf`のsymlinkを`/run/systemd/resolve/resolv.conf`に張る方法をよく見るが，リブートごとに張らなきゃいけない（`/run`以下はtmpfsなので消える）ので根本解決にはならない．

参照する`resolv.conf`は`kubelet`で設定される．`/var/lib/kubelet/config.yaml`の以下の箇所．

```yaml
resolvConf: /run/systemd/resolve/resolv.conf
```

これを変更することで参照先を変えることが可能．以下に変更する．

```diff
- resolvConf: /run/systemd/resolve/resolv.conf
+ resolvConf: /etc/resolv.conf
```

変更後は`kubelet`を再起動

```
sudo systemctl restart kubelet
```

これでリブート時に変更は維持される．ただし，k8sのバージョンアップデートを行うと消失するのでその際には再度変更の必要あり．

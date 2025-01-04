---
title: Use Keystone Enclave on HiFive Unmatched
description: How to run Keystone Enclave on HiFive Unmatched Development Board
tags:
  - RISC-V
  - TEE
created: 2024-10-19T18:18:43+09:00
updated: 2025-01-05T00:41:31+09:00
permalink: keystone-hifive-unmatched
publish: true
---

# Build SD card image

You can build all-in-one SD card image by single make command from [this commit](https://github.com/keystone-enclave/keystone/commit/a06b05485ed59489ba0a8158a7de8c85988a1009).

```shell
make KEYSTONE_PLATFORM=unmatched -j $(nproc)
```

SD card image is to be located in `build-unmatched64/buildroot.build/images/sdcard.img`

## Included components

Some patches included in [freedom-u-sdk](https://github.com/sifive/freedom-u-sdk) are also applied.

- U-Boot SPL
  - applied secureboot patch for Keystone
- Keystone SM (OpenSBI)
- U-Boot
  - load address is modified due to PMP conflict issue
- Buildroot
  - Linux
  - Keystone Driver

## Known Issues

- building linux perf sometimes fails
  - re-running make , build will succeed

# Deal with buildroot build system

In Keystone's build system, buildroot target can be passed directly by `BUILDROOT_TARGET`. For example,

```shell
make BUILDROOT_TARGET=linux-build
```

Target name format is `<package>-<command>`. `<package>` is package name such as linux, u-boot, opensbi and keystone-sm. `<command>` is subcommand for package such as build, configure, patch, clean and rebuild.

# Build single component

## Keystone SM

You can build following command:

```shell
make KEYSTONE_PLATFORM=unmatched BUILDROOT_TARGET=opensbi-build
```

Artifacts are located in `build-unmatched64/buildroot.build/build/opensbi-<version>/build/platform/generic/firmware`

### PMP issue

Security Monitor set no permission to range `0x80000000 - 0x801fffff`. But U-Boot initially set stack pointer its load address, `0x80200000`, and stack stretches to lower region. So U-Boot try to touch protected region, and access violation occurs.

Changing U-Boot's load address to upper region solve this issue. U-Boot built in keystone build system is loaded to `0x80210000`.

U-Boot load address can be changed by adding/modifying config as following:

```
CONFIG_TEXT_BASE=0x80210000
CONFIG_SYS_LOAD_ADDR=0x80210000
```

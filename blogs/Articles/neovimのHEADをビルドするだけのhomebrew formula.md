---
title: neovimのHEADをビルドするだけのhomebrew formula
description: タイトルの通り
tags:
  - macOS
created: 2024-10-19T18:00:44+09:00
updated: 2025-01-05T00:41:07+09:00
permalink: nvim-head-brew
publish: true
---

# Why

公式のformulaでHEADをビルドするとtreesitter parserが内包されない（stableだといくつかがデフォルトで含まれる）．
自分のneovimのconfigはデフォでLuaのparserがないと死ぬみたいなので，HEADのビルドに含めたかった．
手動の時みたいに`cmake`じゃなくて`make`を叩くやり方ならその辺をよしなにやってくれてるので，そのformulaを書いた．

# formula

✝The 適当✝なのでdependencyとかも多分ガバガバ．

```ruby
class Neovim < Formula
  desc "Ambitious Vim-fork focused on extensibility and agility"
  homepage "https://neovim.io/"
  license "Apache-2.0"

  head "https://github.com/neovim/neovim.git", branch: "master"

  depends_on "ninja" => :build
  depends_on "cmake" => :build
  depends_on "gettext"
  depends_on "curl"

  uses_from_macos "unzip"

  conflicts_with "neovim"

  def install
    system "make CMAKE_BUILD_TYPE=RelWithDebInfo CMAKE_INSTALL_PREFIX=#{prefix}"
    system "make install"
  end

end
```

# 使いたい人へ

まあいないと思うけど

```
brew tap Nanamiiiii/formula
brew install Nanamiiiii/formula/neovim --HEAD
```

# Appendix

https://github.com/Nanamiiiii/homebrew-formula

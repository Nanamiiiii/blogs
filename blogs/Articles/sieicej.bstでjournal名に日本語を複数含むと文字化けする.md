---
title: sieicej.bstでjournal名に日本語を複数含むと文字化けする
description: 電子情報通信学会のTeXテンプレにある文献スタイルsieicej.bstで文字化けする問題
cover: profile_icon.png
tags:
  - Scrap
created: 2024-10-19T18:03:33+09:00
updated: 2025-01-04T17:41:32+09:00
permalink: sieicej-bug-00
publish: true
---
# 補足
既にissueとしてあがっており，upstreamには修正が入っている模様．

https://github.com/texjporg/tex-jp-build/issues/157

TeXLive2023リリース後のrevisionでの修正なので，OverleafでTeXLive2023を選択している場合にバグる．TexLive2022を選択すれば問題なく動作した．

# 環境
Overleafを使用
- TeXLive2023
- e-upTeX: Version 3.141592653-p4.1.0-u1.29-230214-2.6 (utf8.euc) (TeX Live 2023)
- upbibtex: Version 0.99d-j0.36-u1.29 (utf8.euc) (TeX Live 2023)
- ソースは全てUTF-8

# 状況
bibの`article`エントリで，`journal`に複数の日本語を含めると2文字目以降が文字化けする．
以下のエントリを追加した際に発覚した．
```
@article{weko_204499_1,
   author	 = "須崎 有康 and 佐々木 貴之",
   title	 = "ハードウェアセキュリティの最新動向：5．Trusted Execution Environmentによるシステムの堅牢化",
   journal	 = "情報処理",
   year 	 = "2020",
   volume	 = "61",
   number	 = "6",
   pages	 = "576--579",
   month	 = "may"
}
```

以下のエラー出力が出る．`upbibtex`の吐いた`bbl`に文字化けがあり，`uplatex`から怒られが発生する．
```
See the LaTeX manual or LaTeX Companion for explanation.
Type  H <return>  for immediate help.
 ...                                              
                                                  
l.26 情塀諭^^a4
```

`upbibtex`が吐いたbblを確認したところ，`journal`の「情報処理」が化けているよう．
色々試したが，日本語1文字だけなら通るが，2文字以上だと絶対に文字化けが起きる．

# 原因
IEICEの配布テンプレに含まれる`sieicej.bst`に含まれる，文字列のフォーマットを行う関数が原因．

`article`エントリは，以下の関数が処理する．
```
FUNCTION {article}
{
  output.bibitem
  format.authors "author" output.check
  new.block
  format.title "title" output.check
  new.block
  crossref missing$
    {
      format.journal "journal" output.check
      format.vol.num.pages output
      format.date "year" output.check
    }
    {
      format.article.crossref output.nonnull
      format.pages output
    }
  if$
  after.block 'output.state :=
  new.block
  note output
  fin.entry
}
```
`journal`が処理されるのは`format.journal "journal" output.check`のところで，`format.journal`が整形を行う関数．
これの実体は以下．
```
FUNCTION {format.journal}
{
  journal empty$
    {
      ""
    }
    {
      journal format.string
    }
  if$
}
```
このとおり，実際に整形を行っているのは`format.string`らしい．これの実体を見てみる．
```
FUNCTION {format.string}
{
  't :=
  ""
  { t empty$ not}
  {
    t #1 #1 substring$ "." =
      {
        t #1 #2 substring$ ". " = not
          {
            t #1 #1 substring$ *
            t #2 global.max$ substring$ 't :=
          }
          {
            ".\ " *
            t #3 global.max$ substring$ 't :=
          }
        if$
      }
      {
        t #1 #1 substring$ is.kanji.str$
          {
            t #1 #2 substring$ *
            t #3 global.max$ substring$ 't :=
          }
          {
            t #1 #1 substring$ *
            t #2 global.max$ substring$ 't :=
          }
        if$
      }
    if$
  }
  while$
}
```
少しわかりにくいが，`substring$`というビルトイン関数で1文字ずつ取り出し，連結していく処理をしている．名前の通り`substring$`は文字列の一部を取り出す関数．
日本語が含まれるものは`is.kanji.str`で判別され2文字ずつ取り出すようになっている．2バイト対応のためだろうか．

`format.string`の取り出す処理が怪しいのは明らかなので，`substring$`について調べてみたところ，関連のありそうな[フォーラム投稿](https://okumuralab.org/tex/mod/forum/discuss.php?d=2006)を見つけた．

![[ScreenShot_20240207010249.png]]

古い投稿だが，`substring$`の処理とUTF-8の相性があまり良くないというのはわかった．
今回のテンプレの`format.string`の処理自体は特に何か変更しているわけではなさそうなので，これに通すのをやめることで対症療法とした．

```
FUNCTION {format.journal}
{
  journal empty$
    {
      ""
    }
    {
      %journalに日本語を複数字含むとUTF-8エンコードが壊れる
      %format.stringが原因
      %journal format.string
      journal
    }
  if$
}
```

これで問題なくパスするようにはなった．ただ恐らくピリオド後方にスペースをを入れるような処理が元々あったようなので，そこで影響は出そう．
同様の処理を`booktitle`などでも使っているようなので，自分のおま環でなければ同じエラーになるだろう．
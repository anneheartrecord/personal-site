---
title: "go.sum是什么"
description: "博客:cbb777.fun"
date: 2023-03-24
tags: ["Go", "Git", "并发"]
---
# go.sum是什么

博客:cbb777.fun

全平台账号:安妮的心动录

github: [https://github.com/anneheartrecord](<https://github.com/anneheartrecord>)

下文中我说的可能对，也可能不对，鉴于笔者水平有限，请君自辨。有问题欢迎大家找我讨论

`go.sum`是Go语言管理包管理 `go mod`而使用的一种锁文件，用于记录Go项目中所有依赖包的路径和哈希值。每一行记录了一个依赖项的信息，包括依赖项的模块路径、版本、哈希值等等。例如：

```

github.com/pkg/errors v0.8.1 h1:OIzxFfzpYLMvPCkkN+UD9dJ9yRuoxzZbDvI8Du5OJ+E=

github.com/pkg/errors v0.8.1/go.mod h1:9JFJoAoLZpNq3W4x/+xGw15jqJ7VHvq3u/L7V9XbTcg=

golang.org/x/crypto v0.0.0-20210322153248-947e6a75a262 h1:2Q1cGh1Zpq/NWDTzDxKk/gZN+Yyo0F8wgJOu09Kml9Q=

golang.org/x/crypto v0.0.0-20210322153248-947e6a75a262/go.mod h1:XTbTeuV6yl+B2H/UsM6UStw6z/5PhRlQIyH9/pXli/Y=

```

go.sum文件的作用在于记录各个依赖项的版本和哈希值，用于验证项目的依赖关系是否发生变化。

当使用go mod安装依赖包的时候，会根据go.mod文件中指定的版本号下载相应的依赖包，并计算依赖包的哈希值，将这些信息记录到go.sum中，当再次构建项目的时候，go.mod会检查go.sum文件，确保依赖项的哈希值和之前记录的值一样，以此来保证项目的构建过程是可重现的

go.sum文件的重要性在于保证Go项目的依赖关系的可靠性和安全性，避免因为依赖包版本不一样导致的不可预期的问题

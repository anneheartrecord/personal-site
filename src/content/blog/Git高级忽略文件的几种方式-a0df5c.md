---
title: "Git高级——忽略文件的几种方式"
description: "首先我们创建一个`git-learn`目录，通过`git init`来初始化`git`仓库。"
date: 2022-06-02
tags: ["Git", "职场"]
---
# Git高级——忽略文件的几种方式

## 初始化git仓库

首先我们创建一个`git-learn`目录，通过`git init`来初始化`git`仓库。

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1714814532109-1d3f967f-8519-42f9-a560-2e486eb92c79.png)

创建一个新文件，能看出来默认是`Git`不会追踪这个新文件的，文件出现在对应的`untracked files`中。

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1714814678219-ac43d2ca-43c6-4329-9151-b39303ed3cc1.png)

## git rm

通过`git add`添加追踪，然后再通过`git rm --cached `移除追踪。`git rm`用于删除某些文件，这个命令会删除`Git`版本库和工作目录中的文件，如果加上`--cached`标签，则只会删除版本库，保留工作目录。

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1714819191954-7df98738-f77e-413d-8023-c4b9088b1e40.png)

`git rm`命令用于从Git仓库中移除文件或目录，它有以下几个作用

  1. **从版本控制中移除文件** ：通过****` git rm` 命令可以将文件从版本控制中移除，即将文件从 Git 仓库的历史记录中删除。这样，文件在将来的提交中将不再被跟踪。
  2. **从暂存区中移除文件** ：使用 `git rm `命令可以将文件从 Git 的暂存区中移除，这意味着文件将不会包含在下一次提交中。
  3. **删除工作目录中的文件** ：默认情况下，`git rm` 命令会同时删除工作目录中的对应文件，除非使用了 `--cached` 选项。

## .gitignore文件

`.gitignore`是一个用来指定Git忽略哪些文件或目录的文件。它的作用是告诉`Git`在进行版本控制时忽略特定的文件或目录，这些文件不会被纳入`Git`版本控制管理里面。

`.gitignore`支持的功能比较强大，可以包含文件名、路径、通配符模式等规则，用于描述需要被忽略的文件或目录，这些规则可以指定具体的文件名，也可以使用通配符来匹配一类文件。

`.gitignore`文件通常位于Git仓库的根目录下，但也可以放置在子目录中，这样就可以只对该子目录生效。

`.gitignore`文件通常会提交到远程仓库，指定一些忽略的文件或目录，维护一些整个团队共享的规则，比如`logs`，比如一些需要在本地修改的`settings`

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1714819375269-916c1e40-7b38-4edf-a955-4c4caca34f56.png)

我们在`.gitignore`文件中添加这么一行
[code]
    a.go
[/code]

这里会默认从`.gitignore`的当前目录进行查找，忽略当前目录下`a.go`文件的改动。

## git/info/exclude

`git/info/exclude`文件是`Git`用于指定需要在本地忽略的文件或目录的文件，功能和`.gitignore`类似。

我们先创建一个`b.go`文件，然后在`git/info/exclude`中添加对应文件的追踪。

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1714820615095-509a9642-a74d-487a-aa3b-f04e4c258ab8.png)

再次查看`git status`，发现已经没有这个文件的修改了。

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1714820708305-eb8e43f0-7bd6-48c9-b835-088c1e5a79e1.png)

`git/info/exclude`文件和`.gitignore`文件都用于指定需要在`Git`中忽略的文件或目录，但它们有一些区别

  * `.gitignore`适用于整个`Git`仓库，会被提交到远程仓库，也可以被其他开发者看到和编辑。
  * `/git/info/exclude`文件只对本地开发者可见，不能提交到远程仓库，用于指定个人特定的忽略规则，不会影响到团队。

## **git update-index --no-assume-unchanged**

` git update-index --no-assume-unchanged` 命令用于取消对文件的 `--assume-unchanged` 标记，即告诉 Git 停止假设指定文件未被修改。这个命令是忽略、提交文件的大杀器，优先级比前几种方式都要高。

具体作用包括：

  1. 当文件被标记为 `--assume-unchanged` 后，Git 将不会检查这些文件是否发生了变化，从而提高性能。
  2. 通过取消 `--assume-unchanged` 标记，Git 将重新开始检查文件是否被修改，以便在必要时将其包含在提交中。

  

相反的命令是 `git update-index --assume-unchanged`，它用于将文件标记为 `--assume-unchanged`，告诉 Git 假设指定文件未被修改，从而避免不必要的文件状态检查。

## 结语

本文总结了几种忽略文件的Git方式，主要有`rm`、`.gitignore`、`git/info/exclude`、`git update-index --no-assumen-unchanged`几种方式，可以覆盖我们日常大部分的开发场景。

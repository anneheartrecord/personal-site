---
title: "入职一家新公司如何配置Git及远程开发？"
description: "首先在我们的开发机上生成对应的`ssh-key`公钥和私钥"
date: 2023-11-16
tags: ["Git"]
---
# 入职一家新公司如何配置Git及远程开发？

## 配置Git

### clone 仓库

首先在我们的开发机上生成对应的`ssh-key`公钥和私钥

`ssh-keygen -t rsa -C "youremail"`

生成的时候会让你输入密码和确认密码，也可以不设置，直接一路回车到底。

`～/`表示的是当前用户主目录，比如用户名为`apple`,那么`～/`表示的就是`/home/apple`。

之后就可以在`~/.ssh`目录下面找到当前用户，也就是自己的公钥和私钥，公钥文件为`id_rsa.pub`，私钥文件为`id_rsa`。

之后打开代码托管的网站，比如`github`，然后点击`setting\key`，配置自己的公钥，也就是把`～/.ssh/id_rsa.pub`文件打开，全部复制上去。

之后这个代码托管的网站就能够确定，这台机器是你这个用户来使用，可以通过`git clone`的方式进行代码下载，因为配置的是`ssh`，最好还是通过`ssh`的方式下载，`git clone git@url`的方式。

因为`ssh`的方式其实是通过公私钥的方式进行的用户身份验证，并且需要有读取和写入的权限才能够`clone`成功；而`https`的方式只需要读取仓库的权限，同时需要你提供账户和密码，有些公司的密码随时可能会变，比较麻烦，建议还是配置`ssh`。

### 配置信息

然后查看一下配置

`git config --global --list`

这里的`global`对应的是用户级别，用户的所有项目都会走这个配置

`git config --local --list`

这个`local`对应的是项目/仓库级别，对应的是项目/仓库具体的`.git`目录。

配置一下需要的信息

`git config user.eamil`

`git config user.name`

`git remote add origin xxxurl`

注意这里禁止修改系统配置，也就是`/etc/gitconfig`文件，这会影响到整台机器的配置，因为`git`读取配置是从里到外的，也就是先读取`local`（仓库级别），再读取`global`（用户级别），然后读取`system`（系统级别），如果不小心修改了系统级别的配置，小心被同事骂哦。

如果需要本地改一些配置，然后又不能上传到仓库的时候，这个时候改完了项目里面就会有很多`git`修改的提示。例如
[code]
    git status
    On branch develop
    Your branch is up to date with 'origin/develop'.
    
    Changes not staged for commit:
      (use "git add ..." to update what will be committed)
      (use "git checkout -- ..." to discard changes in working directory)
    
    modified:   xxx/settings
[/code]

这时候我们每次`git status`都会有一些modified提示，非常麻烦，我们可以用`git update-index _--assume-unchanged file_` 的方式来忽略掉这些修改的文件，或者用`git stash`来暂存这些文件。

### 用户级别环境变量

如果多人共用一台开发机的话，是不能够轻易修改`/etc/profile`的，这样可能会影响到他人的一些配置，正确操作是使用和配置自己用户级别的环境变量，`～/.bashrc`和`~/.bash_profile`都可以用来存储用户级别的环境变量。

  * ~/.bashrc是每次打开新的终端会话时都会加载的文件。它通常包含一些用于自定义Bash shell行为的设置，例如别名（alias）、环境变量、自定义函数等。这些设置将适用于当前用户的每个终端会话。
  * ~/.bash_profile是在用户登录时加载的文件。它通常用于设置与登录会话相关的环境变量和启动脚本。这些设置只会在用户登录时执行一次，而不是每次打开新的终端会话。

这两个文件是同一个级别的，`bash_profile`只会在交互式，也就是登陆、系统启动的时候会读取，而`bashrc`只需一次登陆，每开一个窗口都会读取一次。

### top使用

`top`是`linux`中的一个常用命令，它是一个最常用的性能分析工具，并且实时显示各个进程所消耗的资源，可以动态的监视服务器上的一些常用指标，比如内存、`cpu`等等。

[linux系统下top命令的详细用法、参数详解、以及模式配置_top显示条目-CSDN博客](<https://blog.csdn.net/LEON1741/article/details/84024815>)

这篇文章说的已经很详细了，这里不过多赘述，补充几个常用但是文章里面没有提及的命令。

`top -u username` //和top u一样 分析对应用户的进程

`top -n 10 ` //筛出最耗资源的n个进程

`top -p pid` //筛出对应pid的进程

## 配置远程开发环境

常用的远程开发有`vscode`直接编辑远程文件，和`jetbrains`在本地编辑文件然后同步到服务器的文件上，这两种方式，虽然`jetbrains`也推出了类似`vscode`直接编辑远程文件的方式，但是用起来体感并不好，开销太大，有点卡顿。

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1710487583138-294f6e94-46c2-475d-9c56-c26960c1d7ff.png)

`vscode`我用不习惯，并且它功能相对于`jetbrains`的`ide`确实有些弱小了，大部分功能都是通过插件的方式撑起来的，所以下文主要还是介绍如何在`pycharm`上配置远程开发环境。

1.开发机器把项目跑起来，下载好需要的依赖。

2.把本地公钥上传到开发机上。

和`git`一样，生成`id_rsa.pub`文件，然后放在开发机的`~/.ssh/authorized_keys`文件中，并`chmod 600 `给这个文件权限。

3.配置远程解释器

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1710487833275-c5343ea8-e8e6-47cd-8d86-3d97b87accfd.png)![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1710487908052-9eadd926-4127-4f06-a708-c4986a483844.png)

4.`git clone`下载一下项目/下载项目压缩包，或者通过`scp`将开发机上的项目拉下来，都一样的，因为本地并不直接开发，而是提供一个编辑器环境，在开发机上验证、测试代码的正确性。

5.配置文件目录映射，下图中选`Deployment`，将本地文件和开发机文件映射起来，可以开启文件自动上传功能。

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1710488006278-c96d75f2-ddca-476f-8d4c-3bbcb285efec.png)

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1710488055341-e2e4a0ce-bf1b-48a9-a646-292883d47326.png)

  

## 推荐阅读

[当说到云原生时，我们究竟在谈论什么？ - 掘金](<https://juejin.cn/post/7342391308614877196>)

[不太熟悉Git？ 不妨看看这篇文章 - 掘金](<https://juejin.cn/post/7343139078487310390>)

[一文搞定常见分布式事务实现 - 掘金](<https://juejin.cn/post/7341007339215929356>)

[你真的理解分布式理论吗？ - 掘金](<https://juejin.cn/post/7322356470254370835>)

[深入了解异地多活 - 掘金](<https://juejin.cn/post/7299666003364855858>)

[02.K8S架构详解 - 掘金](<https://juejin.cn/post/7292323577210404915>)

[01.你为什么需要学习K8S - 掘金](<https://juejin.cn/post/7291513540025434169>)

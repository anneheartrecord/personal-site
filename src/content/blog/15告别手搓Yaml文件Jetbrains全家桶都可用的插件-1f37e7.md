---
title: "15.告别手搓Yaml文件，Jetbrains全家桶都可用的插件"
description: "在使用K8S的过程中，我们不可避免的会需要接触到Yaml文件，如果一直用`vim/vi`来编写、修改Yaml文件也未尝不可，就是失去了对齐校验和自动补全，免不了造成效率低下的问题。这里推荐几个工具帮助我们快速编写、验证Yaml文件的可用性。"
date: 2023-10-28
tags: ["K8S"]
---
# 15.告别手搓Yaml文件，Jetbrains全家桶都可用的插件

在使用K8S的过程中，我们不可避免的会需要接触到Yaml文件，如果一直用`vim/vi`来编写、修改Yaml文件也未尝不可，就是失去了对齐校验和自动补全，免不了造成效率低下的问题。这里推荐几个工具帮助我们快速编写、验证Yaml文件的可用性。

## KubeLinter

KubeLinter是一个静态分析的工具，可以很快速方便的检测出`Kubernetes Yaml`文件是否符合规范，并且可以自定义检测的内容。

**MAC 安装KubeLinter**

  1. ` brew install kube-linter`
  2. `kube-linter version`

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1720855660751-3a58367e-fb93-4c1b-bd94-17bcfd2d9ac1.png)

看到这样的内容说明已经安装成功了，让我们用一个有问题的文件和一个正确的文件来试验一下。

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1720855905046-0df4c52e-3fa3-4c75-b729-6e9c61d7f42a.png)

能看到有问题的文件在执行`kube-linter lint`命令之后报错了一个`warning`，这个时候我们只需要根据提示进行对应的修改即可。

## K8Syaml.com

[k8syaml](<https://k8syaml.com/>)这个网站可以帮助我们快速的构建一个正确、可运行的Yaml文件，我们可以在左侧定制化选择对应的配置进行修改，确定之后就会直接同步到右侧的Yaml文件，也可以直接编辑Yaml文件。

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1720856109442-ae0077cc-182d-4871-a875-6d41a60d9652.png)

缺点：定制化的能力还是不够强，很多配置都是给你一些选项进行选择，如果选择的内容不在选项中，就需要自己编辑大段的Yaml文件，并且在线网站，对于数据的可靠性也有部分风险，可能会涉及到隐私问题。

## K8S Plugin

`Jetbrains`全家桶的`IDE`相信大家都用过，我个人是觉得这种专业的`IDE`会比`VSCODE`这类轻量级的编辑器+编译器好用很多，我本人是直接全家桶走天下的，各类配置、数据库等等都是直接通过IDE配置好，这样也可以免于各种冗余的工具。并且现在`Jetbrains`全家桶也在着力于提供各类丰富的插件、ssh远程配置等等。

这里给大家推荐一个K8S Plugin，我们点开设置，在`Settings/Plugins`这个Tab中搜索`Kubernetes`就能看到这个插件

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1720856382792-37110282-070d-4fcd-b831-7d653b3612bb.png)

之后我们可以随便建一个Yaml进行插件功能的验证，直接输入字母就可以看到对应的提示，`Tab`一键补全，还可以通过`IDE`内置的对齐功能对文件进行对齐和格式化，非常方便。

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1720856434889-a795a6a6-e1f8-4110-9328-73450d90ffd8.png)

## 结语

这篇博客主要介绍了**临时容器和Pod调试** 相关操作。《每天十分钟，轻松入门K8S》的第15篇**告别手搓Yaml文件，Jetbrains全家桶都可用的插件** 到这里就结束了，感兴趣的朋友欢迎**点赞、评论、收藏、订阅，您的支持就是我最大的动力。**

##  推荐阅读

[**08.源码级别Pod详解（四）： Pod readiness与Container Probe**](<https://juejin.cn/post/7307542269674651682>)

[**06.源码级别Pod详解（三）：Container 生命周期**](<https://juejin.cn/post/7296303730772656162>)

[**05.源码级别Pod详解（二）：Pod生命周期**](<https://juejin.cn/post/7295565904406511657>)

[**02.K8S架构详解**](<https://juejin.cn/post/7292323577210404915>)

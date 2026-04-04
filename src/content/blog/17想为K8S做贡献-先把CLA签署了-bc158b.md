---
title: "17.想为K8S做贡献？先把CLA签署了"
description: "七月毕业之后正式入职了深圳的某家大厂，最近慢慢的能cover住手里的工作(主要是前端部分)之后，就想着开始做自己一直想做但是没有做的事情，为现在最大的云原生技术K8S做贡献。"
date: 2023-10-28
tags: ["K8S", "云原生", "前端"]
---
# 17.想为K8S做贡献？先把CLA签署了

## 前言

七月毕业之后正式入职了深圳的某家大厂，最近慢慢的能cover住手里的工作(主要是前端部分)之后，就想着开始做自己一直想做但是没有做的事情，为现在最大的云原生技术K8S做贡献。

## 第一步

作为一个足够大的开源项目，K8S的贡献者指南是很齐全的，我们可以看到不管你是想做文档、代码还是组织活动方面的贡献，都可以在贡献者指南里面找到一些前置条件。链接[https://www.kubernetes.dev/docs/guide](<https://www.kubernetes.dev/docs/guide>)

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1723901961266-6e9f74c2-4c6c-42bb-9858-03b9f8fc1ce1.png)

纵观这些条件，必不可少的一点就是签署CLA。

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1723902012272-713f32f4-a61f-4829-8e39-9831fbdb56a9.png)

WIKI中是这么解释CLA的

CLA 是 "Contributor License Agreement" 的缩写，中文可以翻译为“贡献者许可协议”。这是开源项目中常见的一种协议，旨在确保项目维护者和贡献者之间的权利和义务明确。

CLA 是 "Contributor License Agreement" 的缩写，中文可以翻译为“贡献者许可协议”。这是开源项目中常见的一种协议，旨在确保项目维护者和贡献者之间的权利和义务明确。

具体来说，CLA 通常包括以下内容：

  1. **版权许可** ：贡献者将其贡献的代码授予项目维护者使用的权利，这样项目维护者就可以合法地使用、修改和再发布这些代码。
  2. **保证贡献的代码是原创的** ：贡献者保证自己贡献的代码是自己创作的，或者有权将其贡献给项目，并且代码不侵犯他人的版权或其他权利。
  3. **授权协议的类型** ：CLA 还可能包括对贡献者代码如何被授权（例如 Apache 许可证、MIT 许可证等）的具体条款。

CLA 的签署通常是为了保护开源项目的法律合规性，防止潜在的法律纠纷。签署 CLA 后，贡献者仍然拥有其贡献代码的版权，但项目维护者获得了使用、分发和修改这些代码的许可。

## 签署具体过程

1.找到具体的代码仓库[contributor-playground](<https://github.com/kubernetes-sigs/contributor-playground>)，这是一个专门用于签署CLA和练习发起Pull Request的仓库，我们进行本地的fork。几乎所有的开源项目都是采用fork + PR的方式进行开发，即复制一份子仓库，在子仓库的分支上开发，之后和主仓库发起合并，经过两名以上的成员Review过之后即可合入

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1723902321854-fd6d7e84-3fac-41dd-b30b-dbaac20232a1.png)

2.看到这个仓库的`README.md`文档，里面详细解释了如何发起一次签署CLA的请求

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1723902371141-5e11c650-cea6-4f3c-be78-41419661de18.png)

不要在根目录下之间修改，而是在`remote`或者其他地域的文件下修改

3.新建修改，在`remote`目录下新建一个自己`github_name`的文件

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1723902400040-81bde3d4-68f2-4139-840e-80fd2a1ee225.png)

4.进行提交，这里需要先配置一下自己的`github`信息，建议不要用它提示的命令`--global`，这样会让整台电脑的`git`配置都修改，可能会影响到我们其他项目的开发。

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1723902524266-64c14ea1-bd4e-4f25-a153-42087fc98289.png)

5.直接`push`的话会报错，这是因为`github`已经不支持使用账户名和密码进行身份验证了。

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1723902549195-9c7c52de-65c0-4dcd-979b-ee6774c04969.png)

6.配置一下`personal access token`

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1723902591197-08486410-54dd-4c3f-87eb-e8a15cc5b72e.png)

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1723902618720-250f9d1c-aae9-4bd9-badf-a9edce573e58.png)

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1723902651152-0248222e-54d1-4bbf-86a1-c6c08bde9901.png)

创建时请务必复制生成的`token`，因为之后不会再显示这个`token`的值，如果忘记了就只能修改了

7.将密码配置到mac的密钥链中

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1723900993098-d228ba9f-42a3-490b-ae26-b6b3b6401efb.png?x-oss-process=image%2Fformat%2Cwebp%2Fresize%2Cw_1162%2Climit_0)

8.`push`之后发起`pull request`

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1723907247260-19fce845-3f9a-4f6c-becb-25f840cb1e69.png)

9.完成签署

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1723902827138-3f130628-4d4e-460d-bfcc-5f41d4e6ae3d.png)![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1723907215770-723fb902-9514-498c-86af-8dcf8803e6e8.png)

  

完成以上步骤后跳回到pr，能够看到已经完成了`CLA`的签署，只是因为还没有被相关的责任人`approved`，所以还没有合并

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1723907498392-43fc59b7-269e-4726-946a-5518ac360807.png)

  

接下来就可以开始你的K8S贡献之旅了。

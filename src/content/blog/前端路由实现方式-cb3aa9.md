---
title: "前端路由实现方式"
description: "博客:cbb777.fun"
date: 2024-01-21
tags: ["Git", "前端"]
---
# 前端路由实现方式

博客:cbb777.fun

  

全平台账号:安妮的心动录

  

github: [https://github.com/anneheartrecord](<https://github.com/anneheartrecord>)

  

下文中我说的可能对，也可能不对，鉴于笔者水平有限，请君自辨。有问题欢迎大家找我讨论

  

现在主流的路由实现方式主要有两种 分别是history和hash模式

  

单页面：服务只有一个index.html静态文件

  

![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1676531017401-9e69ba3f-38c0-452b-896a-4ef2e6534924.png)

  

那么内容区域：首页、商城、购物车、我的对应的内容，并且浏览器并没有发出实际的http请求，内容区域是如何认识到用户点击了不同的模块，从而更新内容区域呢？

  

## hash模式

  

这些内容区域的url可能如下

  

  * 首页：[yourdomain.xxx.com/index.html/#/](<http://yourdomain.xxx.com/index.html/#/>)
  * 商城：[yourdomain.xxx.com/index.html/#/shop](<http://yourdomain.xxx.com/index.html/#/shop>)
  * 购物车：[yourdomain.xxx.com/index.html/#/shopping-cart](<http://yourdomain.xxx.com/index.html/#/shopping-cart>)
  * 我的：[yourdomain.xxx.com/index.html/#/mine](<http://yourdomain.xxx.com/index.html/#/mine>)

  

#后面的就是一个URL关于hash的组成部分，不同路由对应的hash不一样，我们要做的就是监听URL中关于Hash部分发生的变化，从而做出对应的改变

  

浏览器中有一个暴露的hashchange方法，在hash改变的时候就会触发改时间，有了监听事件且改变hash页面不刷新，这样就可以实现前端路由了

  

结论

  

  * hash模式下所有的工作都是在前端完成的，不需要后端服务
  * hash模式就是监听URL中hash部分的改变，从而做出对应的渲染逻辑
  * hash模式下，URL会带有#

  

## history模式

  

HTML5中提供了一个history全局对象，它包含了关于我们访问网页（历史会话）的一些信息，还有一些暴露出来的方法

  

  * window.history.go 可以跳转到浏览器会话历史中的指定的某一个记录页
  * window.history.forward 指向浏览器会话历史中的下一页，跟浏览器的前进按钮相同
  * window.history.back 返回浏览器会话历史中的上一页，跟浏览器的回退按钮功能相同
  * window.history.pushState 可以将给定的数据压入到浏览器会话历史栈中
  * window.history.replaceState 将当前的会话页面的url替换成指定的数据

  

而history路由的实现，主要就是依靠pushState与replaceState实现的，特点如下

  

  * 都会改变当前页面显示的url，但都不会刷新页面
  * pushState是压入浏览器的会话历史栈中，会使得history.length+1，而replaceState是替换当前的这条会话历史，因此不会增加history.length

  

history模式如果跳转路由然后刷新会得到404的错误，浏览器会把整个地址当成一个可访问的静态资源路径进行访问，然后服务端并没有这个文件

---
title: "前端debug学习"
description: "找元素，右边会显示style样式"
date: 2023-12-19
tags: ["前端"]
---
# 前端debug学习

找元素，右边会显示style样式

  * 源码的对应html代码，放上去
  * 左上角小按钮，放到页面元素上

直接在debug修改样式，确定没问题之后，可以再去修改代码

调试样式：上下以1为单位微调，键盘上下键

右健点击元素，存储为全局变量，快速获取dom元素，然后console打印出来

前端万物皆对象

三种console打印

  * log 普通文字
  * warn 黄色警告
  * error 红色错误
  * dir 当作对象打印 

比如

xxx = document.querySelector

console.dir(xxx)

源代码断点

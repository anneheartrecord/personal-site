---
title: "django"
description: "**Django的开发服务器具有自动重载功能，当你的Python代码有修改，服务器会在一个时间周期后自动重载。** 但是，有一些动作，比如增加文件，不会触发服务器重载，这时就需要你自己手动重启。所以建议，在任何修改代码的操作后，手动重启开发服务器，确保修改的内容被重载。"
date: 2023-02-23
tags: ["Go", "Python", "数据库"]
---
# django

**1.自动重载**

**Django的开发服务器具有自动重载功能，当你的Python代码有修改，服务器会在一个时间周期后自动重载。** 但是，有一些动作，比如增加文件，不会触发服务器重载，这时就需要你自己手动重启。所以建议，在任何修改代码的操作后，手动重启开发服务器，确保修改的内容被重载。

  

问:django shell能不能

2.project与app

app应用与project项目的区别：

  * 一个app实现某个具体功能，比如博客、公共档案数据库或者简单的投票系统；
  * 一个project是配置文件和多个app的集合，这些app组合成整个站点；
  * 一个project可以包含多个app；
  * 一个app可以属于多个project！

app的存放位置可以是任何地点，但是通常都将它们放在与manage.py脚本同级的目录下，这样方便导入文件
[code]
    INSTALLED_APPS = [
    'polls.apps.PollsConfig',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    ]
[/code]

3.path的kwags、name

### name

对你的URL进行命名，让你能够在Django的任意处，尤其是模板内显式地引用它。这是一个非常强大的功能，相当于给URL取了个全局变量名，不会将url匹配地址写死。

  

4.

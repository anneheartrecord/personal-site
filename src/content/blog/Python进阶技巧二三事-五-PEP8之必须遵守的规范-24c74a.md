---
title: "Python进阶技巧二三事（五）：PEP8之必须遵守的规范"
description: "链接http://www.python.org/dev/peps/pep0008，建议每位python开发者都自己看一遍规则详情，下面列出几条绝对应该遵守的规则。"
date: 2022-12-17
tags: ["Python"]
---
# Python进阶技巧二三事（五）：PEP8之必须遵守的规范

## PEP8规范

链接http://www.python.org/dev/peps/pep0008，建议每位python开发者都自己看一遍规则详情，下面列出几条绝对应该遵守的规则。

**空白** ：Python中的空白（whitespace）会影响代码的含义。Python程序员使用空白的时候尤其在意，因为它们还会影响代码的清晰程度。

  * 使用space（空格)来表示缩进，而不要用tab(制表符）。
  * 和语法相关的每一层缩进都用4个空格来表示。又每行的字符数不应超过79。
  * 对于占据多行的长表达式来说，除了首行之外的其余各行都应该在通常的缩进级别之上再加4个空格。
  * 文件中的函数与类之间应该用两个空行隔开。
  * 在同一个类中，各方法之间应该用一个空行隔开。
  * 在使用下标来获取列表元素、调用函数或给关键字参数赋值的时候，不要在两旁添加空格。
  * 为变量赋值的时候，赋值符号的左侧和右侧应该各自写上一个空格，而且只写一个就好。

**命名** ：PEP8提倡采用不同的命名风格来编写Python代码中的各个部分，以便在阅读代码时可以根据这些名称看出它们在Python语言中的角色

  * 函数、变量及属性应该用小写字母来拼写，各单词之间以下划线相连，例如，lowercase_underscore
  * 受保护的实例属性，语义是在内部使用，不应该从类的外部直接访问或者修改，但子类仍然可以访问和修改它，应该以单个下划线开头，例如，_leading_underscore。
  * 私有的实例属性，强制在类外部不能直接使用，可以封一个方法返回，应该以两个下划线开头，例如__double_leading_underscore。
  * 类与异常，应该以每个单词首字母均大写的形式来命名，例如，CapitalizedWord。
  * 模块级别的常量，应该全部采用大写字母来拼写，各单词之间以下划线相连，例如，ALL_CAPS。
  * 类中的实例方法(instancemethod)，应该把首个参数命名为self，以表示该对象自身。
  * 类方法(classmethod)的首个参数，应该命名为cls，以表示该类自身。

**表达式和语句：** 《TheZenofPython》中说:“每件事都应该有直白的做法，而且最好只有一种。”PEP8在制定表达式和语句的风格时，就试着体现了这种思想。

  * 采用内联形式的否定词，而不要把否定词放在整个表达式的前面，例如，应该写`if a is not b`而不是`if not a is b`
  * 不要通过检测长度的办法(如`if len(somelist) == 0`)来判断`somelist`是否为`[]`或`""`等空值，而是应该采用`if not somelist`这种写法来判断，它会假定空值将自动评估为`False`。
  * 检测`somelist`是否为`[1]`或`'hi'`等非空值时，也应如此，`if somelist`语句默认会把非空的值判断为`True`。
  * 不要编写单行的`if`语句、`for`循环、`while`循环及`except`复合语句，而是应该把这些语句分成多行来书写，以示清晰。
  * `import`语句应该总是放在文件开头，如果项目庞大有循环依赖问题之后，才考虑放在函数内部。
  * 引入模块的时候，总是应该使用绝对名称，而不应该根据当前模块的路径来使用相对名称。例如，引入`bar`包中的`foo`模块时，应该完整地写出`from bar import foo`，而不应该简写为`import foo`。
  * 如果一定要以相对名称来编写`import`语句，那就采用明确的写法:`from . import foo`。
  * 文件中的那些`import`语句应该按顺序划分成三个部分，分别表示标准库模块、第三方模块以及自用模块。在每一部分之中，各`import`语句应该按模块的字母顺序来排列。

## str与unicode

Python2中有两种表示字符序列的类型，分别是str和unicode，str的实例的每个元素包含原始的8位二进制码，而unicode的实例，则包含Unicode字符。

如果想要把Unicode字符转换成二进制数据，那么就需要用到encode方法；反过来将二进制数据转换成str类型，需要用到decode方法。
[code]
    def to_unicode(unicode_or_str):
      if instance(unicode_or_str, str):
          value = unicode_or_str.decode('utf-8')
      else:
          value = unicode_or_str
      return value      
[/code]
[code]
    def to_str(unicode_or_str):
      if instance(unicode_or_str, unicode):
          value = unicode_or_str.encode('utf-8')
      else:
          value = unicode_or_str
      return value    
[/code]

## pyenv

因为`Python`有两个大版本`python2`和`python3`，而这两个版本之间相互又不兼容，很容易出现一些老项目使用的版本是`python2`，而我们在开发过程中又需要用到`python3`的情况，这时候`pyenv`就能给我们带来很多方便，这是一个能够快速管理、安装、切换`python`版本的工具。

**安装**

**⚠️**` homebrew`已经在很早的时候移除了`Python2`的安装，现在不能直接通过`brew install python@2`的方式进行安装了，推荐先安装`pyenv`，通过这个来安装具体的语言环境。

`brew install pyenv`

输入`pyenv -h` 如果看到下面这个列表就表示安装成功了

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1720870371732-f5756ebf-df18-4a78-a895-c19f58dbfd64.png)

`pyenv install 2.7.18` //Python2最后一个可商用的版本

`pyenv install 3.7.9`

`pyenv versions`能看到现在使用的是系统指定版本

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1720870343788-c16b705f-0b52-4f83-ae4f-b655dcb9d588.png)

通过`pyenv virtual env xxx`分别创建不同版本的虚拟环境

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1720870928708-0d0a9d2d-a864-4b58-935a-a63d3d819347.png)

`python virtualenvs`结果如下则ok

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1720870943346-941eddb2-d99a-40ee-a29e-69264e9c5a79.png)

通过`pyenv global xxx`进行版本的切换

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1720870479526-6b1bf847-b311-4b74-a425-2b0985156a07.png)

通过`pyenv activate myenv-2.7`进入虚拟环境，如果报错如下

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1720871068581-2f63462b-b52e-404e-a9d9-7e27f08fcc85.png)

那么需要在`~/.bashrc`或者`～/.zshrc`中添加下面这段环境变量设置
[code]
    export PATH="$HOME/.pyenv/bin:$PATH"
    eval "$(pyenv init --path)"
    eval "$(pyenv init -)"
    eval "$(pyenv virtualenv-init -)"
[/code]

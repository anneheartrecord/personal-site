---
title: "Python进阶技巧二三事（七）：字符串、python版本控制、"
description: "Python2中有两种表示字符序列的类型，分别是str和unicode，str的实例的每个元素包含原始的8位二进制码，而unicode的实例，则包含Unicode字符。"
date: 2022-11-15
tags: ["Python"]
---
# Python进阶技巧二三事（七）：字符串、python版本控制、

## str与unicode

Python2中有两种表示字符序列的类型，分别是str和unicode，str的实例的每个元素包含原始的8位二进制码，而unicode的实例，则包含Unicode字符。

**在py3中**

  * bytes是由8位二进制码组成的ascii串
  * str是包含Unicode字符的序列
  * 开发者不能通过 + 这种运算符来混合操作两种类型

**在py2中**

  * str是由8位二进制码组成的ascii串
  * unicode是一种包含Unicode字符的序列
  * 如果str只含有七位ascii字符，那么可以和unicode进行运算，因为unicode中包含这些字符，八位则不行

[code]
    In [1]: a = 'a'
    
    In [2]: b = u'b'
    
    In [3]: print(type(a), type(b))
    (<type 'str'>, <type 'unicode'>)
    
    In [4]: 
    
    In [4]: print(a+b)
    ab
    
    In [5]: c = '\x80'
    
    In [6]: print(type(c))
    <type 'str'>
    
    In [7]: print(c+b)
    ---------------------------------------------------------------------------
    UnicodeDecodeError                        Traceback (most recent call last)
    <ipython-input-7-daf5f87919e9> in <module>()
    ----> 1 print(c+b)
    
    UnicodeDecodeError: 'utf8' codec can't decode byte 0x80 in position 0: invalid start byte
[/code]

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

## 辅助函数取代复杂的表达式

Python的语法非常精炼，很容易就能用一行表达式来实现许多逻辑。用查询字段的key来举例子，在查询不同的参数时，可能会获得不同的返回值
[code]
    print('Red:' , my_values.get('red')) 
    print('Green:', my_values.get('green')) 
    print('Opacity:', my_values.get('opacity')
    >>>
    Red : '5'
    Green: ''
    Opacity: None
[/code]

现在要实现这个功能：如果待查询的参数没有出现在字符串中，或者当该参数的值为空白的时候，我们能够返回统一的默认值，比如`None`，这样能够使我们的调用层调用时更简单。

这个逻辑并不值得用完整的`if`语句或者辅助函数来实现，于是你可能会考虑用`boolean`表达式

随后上面的代码改成
[code]
    print('Red:' , my_values.get('red')) or 0
    print('Green:', my_values.get('green')) or 0
    print('Opacity:', my_values.get('opacity') or 0
    >>>
    Red : '5' 
    Green: 0
    Opacity: 0
    // Red有值 所以或运算之后的结果是原本的值'5'
    // Green和Opacity的值为'' 和 None 
    // 在或运算中都是False值 所以或运算结果为0
[/code]

这样的表达式虽然语法正确，但是增加了开发者的阅读难度，而且有时未必完全符合要求，比如如果我们最终需要的结果是一个数字类型，那还需要再增加这个代码的长度

`int(my_values.get('red')) or 0)`

在`python 2.5`版本之后添加了`if/else`条件表达式，也称作三元运算法，我们可以把上述逻辑写的更清晰一点，同时还能保持代码整洁

`my_values.get('red')`

`int(red) if red else 0`

总结

  * 开发者很容易过度使用`Python`的语法特性，要尽量避免写出特别复杂并且难以理解的单行表达式
  * 复杂的表达式需要单独移入到一个辅助函数中，如果要反复的使用相同的逻辑，就更应该这么做
  * 使用`If/else`表达式，比使用`or\and`这种操作符表达式更加清晰

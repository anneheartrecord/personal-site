---
title: "Python进阶技巧二三事(二) 继承与取值"
description: "`Python`是一门纯面向对象的语言，面向对象的三大特征相信大家都已经听烂了，那就是：继承、多态、封装。和`Go`语言这种类`c`的语言不一样，`Go`是通过结构体组合的方式实现继承的，而`Python`则是完完全全的直接继承基类，和`Php`的`extend`有异曲同工之妙。"
date: 2022-10-13
tags: ["Go", "Python"]
---
# Python进阶技巧二三事(二): 继承与取值

## 继承

`Python`是一门纯面向对象的语言，面向对象的三大特征相信大家都已经听烂了，那就是：继承、多态、封装。和`Go`语言这种类`c`的语言不一样，`Go`是通过结构体组合的方式实现继承的，而`Python`则是完完全全的直接继承基类，和`Php`的`extend`有异曲同工之妙。

通常，`python`中的类是以`__init__`方法来构建的，但是如果想要继承的话，这还远远不够，`python`提供了一个`super()`内置函数，用于在子类中调用父类的方法。

`super()`函数的最主要作用就是让子类有能力调用基类的方法，这样就很方便我们使用、拓展、修改基类的某些方法。
[code]
    # python2需要显式的制定继承自object
    # 所有类的基类都是object
    class Animal(object):
        def __init__(self, name):
            self.name = name
    
        def greet(self):
            print("hello, i'm {}".format(self.name))
    
    class Dog(Animal):
        def __init__(self, name, breed):
            super(Dog, self).__init__(name)
            self.breed = breed
    
        def bark(self):
            print("wangwang")
    # Dog类不仅能够使用 Animal类的方法
    # 进行greet
    # 还能够使用bark方法
    # 这是Dog类自身具有的方法
    # 同样的，其他类cat\bird 继承自
    # Animal类，也能够进行greet
    # 且有其他属于自己的方法
    
    my_dog = Dog("yyt", "xis")
    my_dog.greet() #hello, i'm yyt
    my_dog.bark() #wangwang
[/code]

## 全局变量

`python`中使用全局变量可以直接使用，但是想要在函数块内修改全局变量的值，则要通过`global`关键字来声明，因为在函数块里的变量在`python`默认都是局部变量。

也就是说`global`关键字的作用有两个

  * 在函数内部修改全局变量的值
  * 在函数内部声明全局变量

下面的
[code]
    # 1.在函数内部声明全局变量
    num = 1
    
    def increase():
        global num  
        num = 2  
    
    increase()
    
    print(num)  #  2
    
    
    # 2.在函数内部声明全局变量
    def test():
        global x  
        x = 1  
    
    test()
    
    print(x)  # 1
[/code]

## 获取实例属性的几个方法

dir(), vars() 和 get_fields() 都是Python中用于获取对象属性的方法。

  * dir：这个函数尝试返回一个对象的所有属性列表，包括方法和变量等。如果对象有__dir__()方法，这个方法将被调用。如果对象没有__dir__()方法，这个函数将最大限度地收集对象的属性和方法，包括实例继承的基类的属性与方法，**但是不会给出具体属性的值。**
  * vars：这个函数返回对象的__dict__属性，这通常是一个字典，包含了对象的所有属性和它们的值。如果对象是**模块、类、实例** 或其他有__dict__属性的对象，vars()函数就会生效。否则，它将引发一个TypeError。同时，vars()函数只会给出这个实例具体的属性和值，不会包括继承的属性和值。**一般，我们都会使用这个函数来获取实例的具体属性。**
  * ._meta.get_fields()：这是Django模型特有的方法，用于获取模型的所有字段，用于类和类的实例都可以。这个方法返回一个**包含模型所有字段的列表** ，每个字段都是一个字段实例，包含了字段的名称、类型、是否可以为空等信息。仅用于django的model，作用范围相比于前两个小。

[code]
    class MyClass:
        ...:     ...:     def __init__(self, name, age):
        ...:     ...:         self.name = name
        ...:     ...:         self.age = age
        ...:     ...: 
        ...:     ...:     def say_hello(self):
        ...:     ...:         return "Hello, my name is {} and I'm {} years old.".format(self.name, self.age)
        ...:     ...: 
        ...:     ...: my_instance = MyClass("Alice", 25)
        ...: 
    
    In [24]: print(dir(my_instance))
    ['__doc__', '__init__', '__module__', 'age', 'name', 'say_hello']
    
    In [25]: print(vars(my_instance))
    {'age': 25, 'name': 'Alice'}
[/code]

## Python取值
[code]
    In [15]: my_dict = {'a': 1, 'b':2}
    
    In [16]: print(my_dict.get('a'))
    1
    
    In [17]: print(my_dict.get('c'))
    None
    
    In [18]: print(my_dict.get('c', 'default_value'))
    default_value
    
    In [19]: print(my_dict['a'])
    1
    
    In [20]: print(my_dict['c'])
    ---------------------------------------------------------------------------
    KeyError                                  Traceback (most recent call last)
    <ipython-input-20-9a3f6f287e87> in <module>()
    ----> 1 print(my_dict['c'])
    
    KeyError: 'c'
[/code]

所以在python中，一般都会有两种取值，在dict中优先推荐get取值，取不到的时候会返回None，不会抛出异常，并且还能够设置default值。

同样的，对于python对象的取值，也推荐getattr()，取budao的时候会返回None，并且不会抛出异常。而不是直接使用点号`.`取值符号。

### list

左闭右开原则，左边是能取到的下表，右边取不到
[code]
    list = [1,2,3,4,5]
    print(list[:2]) // 1 2
    print(list[1:]) // 2 3 4 5
[/code]

  

### python2中需要注意的一些小点

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1711936898897-70572cbe-0758-43c3-b946-febc1079e1a3.png)

1.无论是/还是//都是整除，不会有小数部分。

2.max不能用于带none的元素list，不然会抛出异常。

3.去除python2的数字类型前面的L(long int类型)和字符串类型前面的u(unicode编码，即unicode类型)，直接使用int()和str()强转，不过long int转int类型可能会有精度丢失。

4.Python内部unicode和str是混用的，都认为是大的字符串类，是可以进行互查的，比如在`django.model`中可以通过一个`uid=u'abc'`的值去查到数据库中值为`uid='abc'`的记录，像下面这样

`myclass.objects.filter(uid=uid).first()`

## __main__是什么

`if **name** == '__main__'`是一个常见的python项目中主程序常用的写法，用于判断当前模块是否作为主程序直接运行。因为python是脚本语言，和静态类型语言`c\java\go`不一样的是，理论上来说每个python文件都是一个可以运行的个体，可以单独运行，这个时候我们尤其需要通过`name`和`__main__`进行比较，判断当前模块和文件是不是主程序。

当python脚本被直接运行的时候，解释器会将该脚本文件的__name__属性设置为‘__main__’，而该脚本被作为模块导入到其他脚本文件中，__name__属性则是该模块的名称。

这样的话，就可以保证在文件为主文件的时候执行某些模块代码，而被导入的时候不执行。

## 推荐阅读

[当说到云原生时，我们究竟在谈论什么？ - 掘金](<https://juejin.cn/post/7342391308614877196>)

[不太熟悉Git？ 不妨看看这篇文章 - 掘金](<https://juejin.cn/post/7343139078487310390>)

[一文搞定常见分布式事务实现 - 掘金](<https://juejin.cn/post/7341007339215929356>)

[你真的理解分布式理论吗？ - 掘金](<https://juejin.cn/post/7322356470254370835>)

[深入了解异地多活 - 掘金](<https://juejin.cn/post/7299666003364855858>)

[02.K8S架构详解 - 掘金](<https://juejin.cn/post/7292323577210404915>)

[01.你为什么需要学习K8S - 掘金](<https://juejin.cn/post/7291513540025434169>)

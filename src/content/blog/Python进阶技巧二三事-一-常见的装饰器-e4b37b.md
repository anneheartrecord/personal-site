---
title: "Python进阶技巧二三事(一)： 常见的装饰器"
description: "`classmethod`是`python`中的一个装饰器，它的作用是：无需创建类的实例，就能够使用类的方法。很典型的一个使用就是"
date: 2022-10-11
tags: ["Python"]
---
# Python进阶技巧二三事(一)： 常见的装饰器

## 常见的装饰器

### 类方法

`classmethod`是`python`中的一个装饰器，它的作用是：无需创建类的实例，就能够使用类的方法。很典型的一个使用就是

`datetime.datetime.now()`
[code]
        @classmethod
        def now(cls, tz=None): # known case of datetime.datetime.now
            """ [tz] -> new datetime with tz's local day and time. """
            return datetime(1, 1, 1)
[/code]

前一个`datetime`是包名，下面的`datetime`是类名，而因为`now`方法被`@classmethod`修饰，所以无需声明类的实例，而是通过`datetime.datetime`这个类名，就能够直接使用这个方法。

类方法的第一个参数通常被命名为`cls`，它表示类本身，而不是实例。

通过这个参数，类方法可以访问类的属性，并调用其他的类方法。

类方法的用处有很多，最主要有以下几个作用

  * 在不创建类的情况下，执行与类相关的操作
  * 在类方法中访问类的属性，或者调用其他类的方法
  * 提供一种代替构造函数的方式，来创建类的实例

让我们来写几个简单的🌰来理解类方法的这几种作用。

**不创建类，执行与类相关的操作**
[code]
    In [1]: class MyUtils:
       ...:     @classmethod
       ...:     def add(cls,x,y):
       ...:         return x+y
       ...:     
    
    In [2]: result=MyUtils.add(2,3)
    
    In [3]: print(result)
    
    //这个例子里 直接使用类来调用其中的add方法
[/code]

**调用其他类的方法**
[code]
    In [12]: class Circle:
        ...:     PI = 3.14
        ...:     def __init__(self, radius):
        ...:         self.radius = radius
        ...:     @classmethod
        ...:     def from_diameter(cls,diameter):
        ...:         radius = diameter/2
        ...:         return cls(radius)
        ...:     def area(self):
        ...:         return self.PI * self.radius ** 2
        ...:     
    
    In [13]: 
    
    In [13]: circle = Circle.from_diameter(10)
    
    In [14]: print(circle.area())
    78.5
    
    //这个例子里，直接通过类调用类的方法得倒一个实例
    //类的方法又修改了实例的属性
    //最终能得到一个带值的实例
[/code]

**构建类的实例**
[code]
    In [7]: class Person:
       ...:     def __init__(self, name, age):
       ...:         self.name = name 
       ...:         self.age = age 
       ...:     @classmethod
       ...:     def how_old(cls, name, birth_year):
       ...:         current_year = 2024
       ...:         age = current_year - birth_year
       ...:         return cls(name, age)
       ...:     
    
    In [8]: li = Person.how_old('xiaoli', 2003)
    
    In [9]: print(li)
    <__main__.Person instance at 0x7fa5e63f1690>
    
    In [10]: print(li.name, li.age)
    ('xiaoli', 21)
    
    //通过cls参数构造类的实例
    相对于对__init__的封装，包装你想要的逻辑
[/code]

### 静态方法

`@staticmethod`是`python`中的一个装饰器，用于定义静态方法，静态方法是绑定到类而不是实例的方法，可以通过类本身或者类的实例来调用。

**静态方法是属于类的方法，但是与类的实例无关，因此可以再不创建类的情况下直接调用。**

` @staticmethod`可以将方法装饰成静态方法，静态方法不需要访问类的实例或属性，他们在逻辑上与类无关。静态方法常用于执行与类相关、但是不依赖于类的操作。

静态方法没有特殊的参数，不需要传递类或者实例作为第一个参数，因此在静态方法中，不能访问类的属性和方法。
[code]
    class MyClass:
        @staticmethod
        def my_static_method(arg1, arg2):
            # 静态方法的实现
            print(f"Static method called with arguments: {arg1}, {arg2}")
    
    # 通过类调用静态方法
    MyClass.my_static_method("Hello", "World")
    
    # 通过类的实例调用静态方法 不推荐
    obj = MyClass()
    obj.my_static_method("Hello", "World")
[/code]

静态方法和累方法在某种程度上是重合的，二者都可以不创建类的实例，而直接调用类的方法。

### 属性方法

`@property`是一个装饰器，用于定义一个属性的 `getter` 方法。它提供了一种简洁的方式来访问和操作类的属性，同时隐藏了底层实现的细节。

使用` @property`装饰器可以将一个方法转换为只读属性，使其在使用时可以像访问属性一样进行调用，而不需要使用额外的括号。这些属性是只读属性，只能被读取而不能被修改。

以下是 `@property`装饰器的作用：

  * 封装属性的访问：装饰器允许你将一个方法转换为只读属性，使其在访问时可以像访问属性一样进行调用，而不需要使用括号。这样可以提供更简洁的语法，同时隐藏了底层实现的细节。
  * 计算属性：可以使用`@property`装饰器定义一个方法，该方法会在访问属性时动态计算并返回一个值。这样，每次访问属性时都会执行该方法，以获取最新的计算结果。
  * 属性验证和保护：通过在 `@property `装饰器中定义一个 `getter` 方法，在获取属性值时执行验证和保护逻辑。这样可以确保属性值的有效性，并防止对属性进行非法操作。

**封装属性的访问**
[code]
    class Person:
        def __init__(self, age, name):
            self._age = age 
            self.name = name 
        @property    
        def age(self):
            return self._age
        def setname(self, name):
            self.name = name 
        @property
        def trysetname(self,newname):
            self.name = newname
    
            
    //这里可以通过hong.age直接获取年龄，不需要（）
    In [20]: hong = Person(18,'xiaohong')
    
    In [21]: print(hong.age)
    18
    
    In [22]: print(hong.name)
    xiaohong
    
    hong.trysetname('dahong')
    ---------------------------------------------------------------------------
    TypeError                                 Traceback (most recent call last)
    <ipython-input-23-3c0ed651c0cd> in <module>()
    ----> 1 hong.trysetname('dahong')
    
    
    而一个只读方法是不能用来修改属性的
[/code]

**计算属性**
[code]
    In [27]: class Rectangle:
        ...:     def __init__(self, width, height):
        ...:         self._width = width 
        ...:         self._height = height 
        ...:         
        ...:     @property
        ...:     def area(self):
        ...:         return self._width * self._height
        ...:     
    
    In [28]: r = Rectangle(4, 5)
    //这里类只有长宽两个属性
    //但是面积显然是常用的一个属性
    //我们使用之属性方法进行封装，让其成为一个
    //只读的属性
[/code]

**属性验证与保护**
[code]
    class Person:
          def __init__(self, age):
              self._age = age
    
          @property
          def age(self):
            return self._age
    
          def set_age(self, value):
              try:
                  if not isinstance(value, int):
                      raise ValueError("Age must be an integer")
                  if value < 0:
                      raise ValueError("Age cannot be negative")
                  self._age = value
              except ValueError as e:
                  print("Error:", e)
    In [3]: p = Person(18)
    
    In [4]: print(p.age)
    18
    
    p.set_age(17)
    
    In [7]: print(p.age)
    17
    
    In [8]: p.set_age(-1)
    ('Error:', ValueError('Age cannot be negative',))
    
    // 通过set_age方法 对age属性保护起来
    // 不能设置age为预期之外的值
[/code]

### 抽象方法

`@abstractmethod`是`abc`模块中的一个装饰器，用于修饰抽象方法。抽象方法指的是抽象基类中定义了，但没有提供实现的方法。

抽象基类通常用于定义接口，规定了子类必须要实现的方法，从而确定子类的行为和规范。

抽象方法的作用

  * 定义接口：规定子类必须要实现的方法。确保子类有特定的结构和功能，能够增强代码的可读性和可维护性。
  * 强制实现：子类的实例必须要满足这些方法和条件才能过实例化，能够避免遗漏。

[code]
    from abc import ABCMeta, abstractmethod
    
    class Shape:
        __metaclass__ =  ABCMeta
    
        @abstractmethod
        def area(self):
            pass
    class Rectangle(Shape):
          def __init__(self, width, height):
              self.width = width
              self.height = height 
          
          def area(self):
              return self.width * self.height
    // 基类定义了一个area方法
    // 所有子类都需要实现这个方法
    // 这也符合图形的特征，每个图形都有自己的面积
    // 所以shape基类可以作为所有图形的基类
[/code]

## 推荐阅读

[当说到云原生时，我们究竟在谈论什么？ - 掘金](<https://juejin.cn/post/7342391308614877196>)

[不太熟悉Git？ 不妨看看这篇文章 - 掘金](<https://juejin.cn/post/7343139078487310390>)

[一文搞定常见分布式事务实现 - 掘金](<https://juejin.cn/post/7341007339215929356>)

[你真的理解分布式理论吗？ - 掘金](<https://juejin.cn/post/7322356470254370835>)

[深入了解异地多活 - 掘金](<https://juejin.cn/post/7299666003364855858>)

[02.K8S架构详解 - 掘金](<https://juejin.cn/post/7292323577210404915>)

[01.你为什么需要学习K8S - 掘金](<https://juejin.cn/post/7291513540025434169>)

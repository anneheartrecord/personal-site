---
title: "Python进阶技巧二三事（九)"
description: "部署环境指的是程序在运行的时候所用的一套配置，每个程序至少都会有一种部署环境，这就是生产环境。同样的，我们需要再开发机运行代码，这套环境的具体配置可能和生产环境有很大区别，所以通常情况下还需要额外和生产环境做一个区分环境，也就是开发环境或者是测试环境。"
date: 2022-12-16
tags: ["容器", "Python", "数据库"]
---
# Python进阶技巧二三事（九)

## 模块级别配置部署环境

部署环境指的是程序在运行的时候所用的一套配置，每个程序至少都会有一种部署环境，这就是生产环境。同样的，我们需要再开发机运行代码，这套环境的具体配置可能和生产环境有很大区别，所以通常情况下还需要额外和生产环境做一个区分环境，也就是开发环境或者是测试环境。

`pyenv`等工具使得开发者能够保证所有的环境都装有同一套软件包，但问题在于，生产环境通常还会依赖很多的外部先决条件。例如，我们需要在Web服务器容器中运行某个程序，并通过该程序访问数据库，那么每次修改完程序的代码，都需要把容器运行起来，设置好数据库，并输入访问数据库需要的密码。每次在开发环境验证却需要花费如此大的经历。

解决此类问题的最佳方法是在程序启动的时候，覆写其中的某些部分，以便根据部署环境来提供不同的功能。例如编写两份不同的`main`文件，一份用于生产环境，一份用于开发环境。
[code]
    # dev_main
    
    TESTING = True
    import db_connection
    db = db_connection.Database()
    
    # prod_main
    TESING = False 
    import db_connection 
    db = db_connection.Database()
    
    if __main__.TESTING:
      Database = TestingDatabase
    else:
      Database = RealDatabase
[/code]

这两份文件唯一的区别，就在于`TESTING`常量的取值。于是，程序中的其他模块就可以引入`__main__`模块，并通过TESTING的值来决定如何定义自身的属性。

我们可以在这种模块级别的代码，用if语句来决定本模块应该如何定义相关的变量。这使得开发者可以根据各种不同的部署环境来定制这些模块，在不需要配置数据库的时候，我们就可以不配置数据库，从而避免大规模的代码修改。

如果部署环境变得过于复杂，那我们就该考虑把上面常量从代码中移走，并把它们放到专门的配置文件里面。开发者可以通过`configparser`等内置模块，把生产环境中所需的配置信息和产品代码相分离。

## 通过repr字符串来输出调试信息

通常我们在打印信息的时候直接使用print打印出程序状态，并根据状态的变化来进行debug。但是这样的问题是，这种便于阅读的字符串并不能清晰的展示该值的类型，例如这种情况
[code]
    print(5)
    print('5')
    >>>
    5
    5
[/code]

在调试程序的时候不同类型之间的差别时相当重要的，所以在当我们调试某个对象时，应该打印`repr`版本的字符串。内置的`repr`函数会根据某个对象返回可供打印的表示形式，这是一种最为清晰且又易于理解的字符串表达形式
[code]
    a = '\x07'
    print(repr(a))
    print(repr(5))
    print(repr('5'))
    >>>
    '\x07'
    5
    '5'
[/code]

对于动态的Python对象来说，默认的print易读字符串的结果和`repr`函数所返回的字符串是相同的。也就是说可以只需要把动态对象传递给`print`函数，即可打印出`repr`字符串的内容。但是示例默认给出的那个`repr`值，对调试来说，并不是特别有用。
[code]
    class OpaqueClass(object):
      def __init__(self, x, y):
        self.x = x
        self.y = y
    obj = OpaqueClass(1, 2)
    print(obj)
    
    >>>
    <__main__.OpaqueClass object at 0x107880ba8
[/code]

像上述内容并不能传给`eval`函数，而且从中也看不出该对象各实例字段的取值。

解决此问题有两种办法，如果我们可以控制该类的源代码，那么就定义名为`__repr__`的特殊方法，并且返回对应的内容，比如
[code]
    class OpaqueClass(object):
      def __init__(self, x, y):
        self.x = x
        self.y = y
      def __repr__(self):
        return 'BetterClass(%d, %d)' % (self.x, self.y)
[/code]

如果不能修改该类的定义，那我们可以通过对象的`__dict__`属性来查询它的实例字典。比如

`print(obj.__dict__)`

## 使用unittest来测试全部代码

Python没有静态类型检查机制，编译器不能保证程序一定会在运行的时候正确地执行；也并不清楚程序里面调用的那些函数，在运行的时候是否会具备正确的定义。这是Python动态的设计决定的。

许多Python程序员都认为，这样做是值得的，它可以令代码更加短小和简洁，Python程序有可能在运行时出现奇奇怪怪的问题。

所以只有通过编写测试，我们才能够确信程序在运行的时候不会出问题，我们不能通过静态类型检查来获得安全感。这个动态特性一方面阻碍了静态类型检查，另一方面却也是的开发者能够非常容易地为代码编写测试。良好的测试，实际上会使开发者在修改python程序时感到更加方便，而不是更加困难。

要编写测试，最简单的办法，就是使用内置的`unittest`模块

例如下面这个工具函数
[code]
    # utils.py
    def to_str(data):
      if isinstace(data, str):
        return data
      elif isinstance(data, bytes):
        return data.decode('utf-8')
      else:
        raise TypeError('Must supply str or bytes, data:{}'.format(data)
[/code]

然后创建一份`test_utils.py`文件，并在文件中测试自己所期望的行为
[code]
    from unittest import TestCase, main
    from utils import to_str
    
    class UtilTestCase(TestCase):
      def test_to_str_bytes(self):
        self.assertEqual('hello', to_str(b'hello))
      def test_to_str_str(self):
        self.assertEqual('hello', to_str('hello'))
      def test_to_str_bad(self):
        self.assertRaises(TypeError, to_str, object())
    
    if __name__ == '__main__':
      main()
[/code]

测试以`TestCase`类的形式来组织的，每个以`test`开头的方法，都是一项测试。如果测试方式在运行过程中，既没有抛出任何类型的`Exception`，也没有因`assert`语句而导致`AssertionError`，那么旧测试就算顺利通过。

`TestCase`类提供了一些辅助方法，以供开发者在编写测试的时候做出各种断言，例如`assertEqual`可以判断两值是否相等，`assertTrue`可以验证`Boolean`表达式是否为真，`assertRaises`可以验证程序能否在适当的时机抛出异常。

## pdb

在其他大部分编程语言中，我们先必须告诉调试器应该在源代码的哪一行停下来，然后再调试程序，但python不是这样，最简单的调试手法就是修改程序，直接启动调试器。

只需要引入内置的`pdb`模块，并运行期`set_trace`函数，即可触发调试器。这两个操作通常会写在同一行之中，这使得开发者在不需要调试的时候，能够通过一次注释把整行代码注释掉。

`import pdb; pdb.set_race()`

只要运行到这行语句，程序就会暂停。执行该程序所用的那个终端机会转入交互式的`Python`提示符界面。

在Pdb提示符界面中，我们可以输入局部变量的名称，以打印他们的值。也可以调用内置的`Locals`函数，来列出所有的局部变量，还可以引入模块、检查全局状态、构建新对象、运行内置的`help`函数，甚至修改程序中的某个部分。另外调试器还提供了三个命令，可以帮助我们更方便的查看正在调试的程序。

  * bt：针对当前执行点的调用栈，打印其回溯信息。可以据此判断出程序当前执行到了哪个位置，也可以看出程序是如何从最开头运行到触发pdb的
  * up：把调试范围沿着函数调用栈上移一层，回到当前函数的调用者，并且可以查看上层的局部变量
  * down:把调试范围沿着函数调用栈下移一层

检查过当前的状态之后，可以用下面的几个调试器命令来精准地控制程序执行状态

  * step：执行当前这行代码，并把程序继续运行到下一条可执行的语句开头，然后把控制权交还给掉时期。如果这行代码中调用了函数，那么会进入到这个函数中，并且停留在这个函数开头
  * next：执行当前这行代码，并把程序继续运行到下一条可执行的语句开头，然后把控制权交还给掉时期。如果这行代码中调用了函数，那么调试器不会停留在函数里面，而是会调用那个函数，并等待其返回
  * return：继续运行程序，直至到达当前函数的`return`语句开头，然后把控制权交还给调试器
  * continue：继续运行程序，直至到达下一个断点或下一个`set_trace`调用点

## profiler

Python提供了两种内置的profiler，一种是纯python的profiler，名字叫做profile，另一种是C语言拓展模块，名字叫做cProfile，在这两者中，内置的cProfile模块更好，因为它在做性能分析时，对受测程序的效率只会产生很小的影响，而纯Python版本的profiler，则会产生较大的的开销，从而使测试结果变得不够准确。

下面实例化cProfile模块中的Profile对象，并通过runcall方法来运行我们定义的`test`函数。之后再采用内置的Stats类，剖析由Profile对象所收集到的性能统计数据。
[code]
    profiler = Profile()
    profiler.runcall(test)
    
    stats = Stats(profiler)
    stats.strip_dirs()
    stats.sort_stats('cumulative')
    stats.print_stats()
    
    //输出内容有
    ncalls: 函数在性能分析期间的调用次数
    tottime: 执行该函数所花的总秒数
    tottime percall: 每次调用该函数所花的平均秒数
    cumtime：执行该函数及其中所有的全部函数调用操作所花的总秒数
    cumtime percall：每次执行该函数的平均秒数
[/code]

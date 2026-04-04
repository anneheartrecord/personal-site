---
title: "Python进阶技巧二三事（八)"
description: "Python提供了一种把序列切成小块的写法，语法是`somlist[start:end]`，遵循左闭右开原则，start的元素在结果之中，end的元素在结果之外。同样我们也可以使用负数来倒取切片，这也是被推荐的切片方式。"
date: 2022-12-18
tags: ["Python"]
---
# Python进阶技巧二三事（八)

## 数组切片

Python提供了一种把序列切成小块的写法，语法是`somlist[start:end]`，遵循左闭右开原则，start的元素在结果之中，end的元素在结果之外。同样我们也可以使用负数来倒取切片，这也是被推荐的切片方式。
[code]
    a = ['a','b','c','d','e','f','g','h']
    
    
    print(a[:4]) // a b c d 
    print(a[:-4) // e f g h 
    print(a[3:-3]) // d e
[/code]

如果从列表开头获取切片，就不要在start那里写上0，而是应该把它留空，这样代码看起来会清爽一些。

`assert a[:5] == a[0:5]`

如果切片一直要取到列表末尾，那就应该把end留空。

`assert [5:] == a[5:len(a)]`

切割列表时，即使start或end索引越界是不会出现问题的，利用这一特性，我们可以限定输入序列的最大长度。反之，访问列表中的单个元素时，下标不能越界，否则会导致异常。

`first_twenty_items = a[:20]`

`last_twenty_items = a[-20:]`
[code]
    a [20]
    >>>
    IndexError: l ist index out of range
[/code]

**注：使用负变量作为start索引来切割列表时，在极个别情况下可能会有奇怪的结果，尽量不要使用这种写法。**

对原列表进行切割之后，会产生另外一份全新的列表。系统依然维护着指向原列表中各个对象的引用。在切割后的新列表上进行修改，并不会影响原列表。

在单次切片操作内，不要同时指定start、end、stride，这样的写法会使得代码难以阅读。

## 列表推导和生成器表达式

Python提供了一种精炼的写法，可以根据一份列表来制作另一份，这被称作为列表推导。例如
[code]
    a = [1,2,3]
    squares = [x**2 for x in a]
    print(squares)
    
    [1,4,9]
    
    squares = map(lambda x: x**2,a)
[/code]

除非是只有一个参数的函数，否则对于简单的情况来说，列表推导比内置的map函数更加清晰。

列表推导的缺点是：在推导过程中，对于输入序列中的每个值来说都需要创建仅含一项元素的全新列表，当数据特别多时会消耗大量内存，并导致程序崩溃。

例如，要读取一份文件并返回每行的字符数，如果使用列表推导来做，需要把文件每一行的长度都保存在内存中。当这个文件很大时，列表推导就会消耗巨量资源。
[code]
    value = [len(x) for x in open('sometxt')]
    print(value)
[/code]

为了解决这个问题，Python提供了生成器表达式，这是对列表推导和生成器的一种泛化。生成器表达式在运行的时候，并不会把整个输出序列都呈现出来，而是会估值为迭代器，这个迭代器每次可以根据生成器表达式产生一项数据。

以刚刚的例子来举例
[code]
    it = (len(x) for x in open('sometext')
    print(it)
    
    print(next(it))
    print(next(it))
[/code]

逐次调用内置的next函数，可以按照生成器表达式来输出下一个值，而不需要担心内存激增的问题。

## 使用enumerate取代range

在一系列整数上面迭代时，内置的range函数很有用。对于只需要知道值的列表，我们可以直接用`In`进行遍历；如果还需要知道元素对应的下标，那就需要使用到`range`。
[code]
    >>> somelist = [1,2,3]
    >>> for value in somelist:
    ...     print(value)
    ...
    1
    2
    3
    
    a = [1, 2, 3]
    
    >>> for i in range(len(a)):
    ...     print(a[i])
    ...
    1
    2
    3
[/code]

上面这段代码比单纯的迭代来比有点生硬，因为首先获取了列表长度，并且通过下标来访问数组，这种代码是不便于理解的。

Python提供了内置的`enumerate`函数以解决此问题，这个函数可以把各种迭代器包装为生成器，每次产生一对输出，前者表示的是循环下标，后者从迭代器中获取到的下一个序列元素。
[code]
    >>> flavor_list = ['y', 'y', 't']
    >>> for index,value in enumerate(flavor_list):
    ...     print('index:{},value:{}'.format(index,value))
    ...
    index:0,value:y
    index:1,value:y
    index:2,value:t
[/code]

还可以直接指定`enumerate`函数计数时所用的值，这样能把代码写的更短
[code]
    >>> flavor_list = ['y', 'y', 't']
    >>> for index,value in enumerate(flavor_list, 1):
    ...     print('index:{},value:{}'.format(index,value))
    ...
    
    index:1,value:y
    index:2,value:t
[/code]

## 同时遍历两个迭代器

相同所引出的两个元素之间有着关联，如果想平行地迭代这两份列表，那么可以根据names源列表的长度来执行循环。
[code]
    names = ['Cecilia', 'Lise', 'Marie']
    letters = [len(n) for n in names]
    
    for i in range(len (names)): 
      count = letters[i]
      if count > max letters: 
        longest_name = names [i]：
        max_letters = count
        print(longest_name)
    >>> 
    Cecilia
[/code]

这段代码的问题在于，整个循环语句看上去很乱。使用下标来访问元素会很不易阅读，通过内置的`zip`函数能够令上述代码更为简介。

`zip`函数有两个需要注意的点

  * Python2的zip并不是生成器，而是会把开发者提供的迭代器都平行的遍历一次，在此过程中，它会把迭代器所产生的值汇聚成元组，并把元组构成的列表完整的返回给调用者，这可能会导致内存飙增。如果在python2用zip来遍历数据量非常大的迭代器，那么应该使用`itertools`内置模块中的izip函数。
  * 如果输入的迭代器长度不同，那么zip的结果可能会比较奇怪。只要有一个迭代器耗尽了，那么zip就不再生成新元素。如果不确定zip所封装的列表是否等长，则可考虑使用`itertools`内置模块中的`zip_longest`函数

## try/except/else/finally

Python程序的异常处理可以考虑四种不同的时机，这些时机可以用`try\except\else\finally`块来表述，每个块都有特定的用途，他们可以构成很多种有用的组合方式。

  * 无论try块是否发生异常，都可以用finally块来执行兜底操作
  * else块可以用来缩减try的代码量，并且执行没有发生衣长是需要进行的操作
  * 顺利执行try块后，如果想某些操作能在finally块的清理代码之前执行，可以把这些代码写在else块中

## 函数

用异常来表示函数的返回错误，而不是用None\0\False之类的值，在条件表达式里都会被评估为False
[code]
    def sort_priority2(numbers, group): found = False
    def helper(x):
    if x in group:
    found = True # Seems simple
[/code]

## docstring

由于Python是一门动态语言，所以文档显得尤其重要。Python对文档提供了内置的支持，使得开发者可以把文档和代码块关联起来，在程序运行的时候也能够直接访问源代码中的文档信息。

例如，在为函数编写了`def`语句之后，可以紧接着提供`docstring`，以便将一段开发文档和该函数关联起来，在程序中我们可以通过`__doc__`的特殊属性来访问该函数的文档
[code]
    def palindrome(word):
      """
      Some tips
      """
    
    print(repr(palindrome.__doc__)) 
    >>>
    some tips
[/code]

函数、类和模块，都可以与文档字符串相关联，系统会在编译和运行Python程序的过程中，维护这种关系，这有以下三个好处

  * 由于能够访问代码中的文档，所以交互式开发变得更加方便了。可以用help函数来查看函数、类、模块的文档
  * 标准的文档定义方式可以方便开发者构建出一些工具
  * Python将文档视为第一等级的对象，可以让开发者在程序中访问格式良好的文档信息。

具体的规范可以参阅[PEP257](<https://peps.python.org/pep-0257/>)，以下几条规范是大家都应该遵守的

  * 每个模块都应该有顶级的docstring，这个字符串字面量应该作为源文件的第一条语句，通过`"""`三重双引号来介绍这个模块和模块中的内容。也可以在其中强调模块中比较重要的类和函数
  * 类需要有类级别的docstring，写法和模块级别的docstring大致相同。比较重要的public属性及方法应该在这个docstring中加以强调，此外，还应该告诉子类的实现者，如何才能正确地与protected属性及超类方案相交互
  * 每个函数和方法都应该有docstring，应该介绍函数的每个参数和返回值。如果没有参数、返回值那么就不要在docstring中提到相应的内容。如果有可变参数或者默认值应该指出这些参数的用途和默认值

## 包来安排模块

程序的代码量变大之后，我们自然就需要重新调整其结构。当到了一定的阶段之后，我们就会发现模块的数量实在太多了，于是就需要在程序之中引进一种抽象层，使得代码更加便于理解。Python的包就可以充当这样的抽象层。**包，是一种含有其他模块的模块。**

多数情况下我们会给目录中放入名为`__init__.py`的空文件，并以此来定义包。只要目录里有`__init__.py`，我们就可以采用相对于该目录的路径，来引入目录中的其他python文件。当然`__init__.py`文件也不是非要为空，通常我们可以在文件中通过`__all__`变量来定义被导出时的模块或者对象。
[code]
    # mymodule.py
    __all__ = ['foo', 'Bar']
    
    def foo():
        pass
    
    class Bar:
        pass
    
    def _private_function():
        pass
    
[/code]

例如这里就只会导出`foo和bar`这两部分内容。

对于Python来说，包主要能提供两种能力

1.命名空间区分，包能够将模块划分到不同的命名空间中，这使得开发者可以编写多个文件名相同的模块，并把他们放在不同的绝对路径下。但是如果包里面定义的函数、类或者子模块相互重名，那么还是会冲突的。因为之后的导入会将前面作用域给覆盖掉。正确的解决这个问题的方式是通过`as`子句来引入别名。
[code]
    from analysis.utils import inspect
    from fronted.utils import inspect # overwrites!
    
    from analysis.utils import inspect as analysis_inspect
    from fronted.utils import inspect as fronted_inspect
[/code]

2.稳定的API，如果想要提供使用范围较广的API，就需要提供一些稳固的功能，并保证它们不会因为版本的变动而受到影响。为此，我们必须把代码的内部结构对外隐藏起来，以便在不影响用户的前提下，通过重构来改善包内的模块。

3.不要通过`import *`这种方式引入，这样我们无法确定具体导入的某个定义究竟在哪个模块中；也有可能引入了一些重复的名称，可能会引发奇怪的bug

## 自定义异常

Python内置了一套异常体系，以供语言本身及标准库使用。我们通常不会自己去定义新的异常类型，而是直接复用现有的内置异常类型。例如当外界给函数传递了一个无效的参数时，可能会想抛出`ValueError`异常以指出这一错误。
[code]
    def determine_weight(volume, densitry):
      if density =< 0:
        raise ValueError('Density must be positive') # ......
[/code]

在某些情况下，使用`ValueError`也许是比较合适的，但是在设计API时，还是应该自己来定义一套新的、特定的异常体系，这样可以使我们的代码系统更加强大和稳定，并且能使得异常更符合我们的代码体系。也可以定义几类根异常，然后在不同的根异常下定义具体的异常，这样能够快速帮助我们定位异常的类型。
[code]
    # my_module.py
    class Error(Exception):
    ''"Base-class for all exceptions raised by this module.""'
    class InvalidDensityError(Error) :
    '*"There was a problem with a provided density value. """
    
    try:
      weight = my_module.determine weight (1, 1-)
    except my_module.Error as e:
      somehandler
[/code]

使用根异常可以帮助模块的开发者找寻调用API里的bug，在编写模块代码时，应该只抛出本模块的异常体系中定义过的那些异常，其他类型的异常不应该由这个模块抛出。这样就能够快速定位到异常抛出处。并且对于API的后续演化也有便利，将来我们可能会在模块里提供更为具体的异常，以便在特定的情况下抛出。

## 循环导入
[code]
    # dialog. py import app
      class Dialog (object) :
        def _init__(self, save_dir):
          self.save_dir = save_dir # ...
      save_dialog = Dialog(app.prefs.get('save_dir'))
      def show(): #...
    
    # app. py import dialog
      class Prefs(object) : #. ..
          def get (self, name): #...
      prefs = Prefs（）
      dialog.show()
[/code]

上面的这段代码就形成了循环依赖关系，两个模块互相之间都有调用关系

在引入模块的时候，Python会按照深度优先的顺序执行下列操作

  1. 在由sys.path所指定的路径中，搜寻待引入的模块
  2. 从模块中加载代码，并保证这段代码能够正确编译
  3. 创建与该模块相对应的空对象
  4. 把这个空的模块对象，添加到sys.modules里
  5. 运行模块对象中的代码以定义其内容

循环依赖的问题是：某些属性必须要等python系统把对应的代码执行完毕之后，也就是第五步之后才有完整的定义，但是包含该属性的模块，却只需要等Python系统执行完第4步，就可以用import语句引入并添加到sys.modules里了。

解决方法：

1.调整引入顺序，例如我们可以把上面的`import`语句放在模块底部，这样等引入模块的主要内容运行完毕之后才会引入`dialog`模块，这样报错就会消失。但是这种方法和`PEP8`的风格冲突，因此其实不能使用在实际开发中。

2.先引入、再配置、最后运行

第二种方法是尽量缩减模块在引入时所产生的副作用，只在模块中给出函数、类和常量的定义，而不要在引入的时候真正去运行那些函数。
[code]
    # 定义dialog模块，在引入的时候不执行任何动作
    # dialog. py import app
      class Dialog(object) : #
        save_dialog = Dialog()
        def show() : #
        def configure(): 
          save_dialog. save_dir = app.prefs.get('save_dir')
      
    # 同时也重新定义app 模块，令它不要在引入的时候执行任何动作。 # app. py
    import dialog
      class Prefs(object) : #
        prefs = Prefs)
      def configure): #
    
    # 现在，我们在main 模块中，分 三个阶段来执行代码:首先引入所有模块，然后配 置它们，最后执行程序中的第一个动作。
    # main. py 
      import app
      import dialog
      app. configure() 
      dialog.configure()
      dialog.show)
[/code]

这种方案在很多情况下都非常合适，而且方便开发者实现依赖注入等模式。但是，有时候很难从代码中提取出`configure`步骤，另外在模块内部划分不同的阶段，也会令代码变得不易理解。这样会把对象的定义和配置区分开

3.动态引入

在函数或者方法内部使用import语句，这种办法是最简单的，程序会等到真正运行相关的代码时，才去触发模块的引入操作，而不会在刚开始启动并初始化其他模块时，就去引入那个模块，所以这种方案又称为动态引入。一般来说我们尽量不要使用这种引入方案，因为`import`语句的执行开销，还没有小道可以忽略不计的底部，而且在循环中反复引入模块，更是一种不好的编程方式。

## 虚拟环境

如果程序构建的比较庞大复杂，那么通常会需要依赖`Python`社区中的许多软件包，这些软件包如果不额外处理的话默认是全局性的，也就是说这些模块、第三方库会影响系统中的所有Python程序。

最麻烦的是不同的第三方库之间可能会引发冲突，比如a包和b包都相互依赖`jinja2`这个版本，如果在相同的版本下可以相安无事，但是如果之后这两个包依赖的版本不一致了，那么就会有严重的问题，可能只能运行某个包。

这个问题的根源是：在同一时刻，python只能够把模块的某一个版本安装位整个系统的全局版本。如果某个已经安装好的软件包，必须使用新版模块，而另外一个已经安装好的软件包，又必须使用旧版模块，那么系统就没法正常运作了。

当我们和其他同事使用一台机器协作开发时，这个问题就会十分严重。最后可能导致一份代码可以在某些环境下运行，在另一份环境下又无法运行。这些问题都可以通过虚拟环境的手段来解决。

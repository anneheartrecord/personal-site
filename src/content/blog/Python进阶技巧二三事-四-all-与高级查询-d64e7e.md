---
title: "Python进阶技巧二三事(四) all 与高级查询"
description: "在python中，`__all__ `是一个特殊的变量，用于定义模块的公开接口。它是一个包含字符串的列表，指定了在使用 from module import * 语句时，应该导入哪些名称。通过定义 `__all__`，你可以明确控制模块的导出接口，限制哪些名称在` from module impor"
date: 2022-11-14
tags: ["Python"]
---
# Python进阶技巧二三事(四):__all__与高级查询

## __all__

在python中，`__all__ `是一个特殊的变量，用于定义模块的公开接口。它是一个包含字符串的列表，指定了在使用 from module import * 语句时，应该导入哪些名称。通过定义 `__all__`，你可以明确控制模块的导出接口，限制哪些名称在` from module import *` 语句中可用。

当然，这里我们不推荐`import *`这种隐式导入语法，更推荐`import a,b,c`这种显示的导入语法，隐式导入可能会导致以下问题

  * **命名空间污染** ：会将模块中的所有公共符号导入到当前命名空间中，可能会覆盖或冲突现有的名称，导致难以追踪和调试的错误。
  * **可读性差** ：这种导入方式使代码不清楚模块的提供哪些功能，增加了理解和维护代码的难度。
  * **循环引用问题** ：from module import * 导入所有名称可能会加剧循环引用问题，因为不必要的依赖可能被无意中导入。
  * **更大的消耗：** 主要体现在命名空间和加载时间两方面，`import *`会将模块中的所有公共符号导入当前命名空间，可能会增大命名空间的大小，导致更多的内存消耗；并且所有的内容都需要被导入，会增加加载的时间。

`**__all__**`**的作用**

  1. **限制导入名称** ：只有在 __all__ 列表中的名称才会被导入，这样可以避免不必要的名称被导入。
  2. **提高代码可读性** ：通过明确列出模块的公共接口，可以提高代码的可读性和可维护性，使其他开发人员更容易理解模块提供的功能。
  3. **避免命名冲突** ：防止导入不需要的名称，可以减少命名冲突的可能性，能间接的减少不必要的依赖和导入，减少循环引用的可能性。

**示例**
[code]
    # my_module.py文件
    
    __all__ = ['MDeployment', 'delete_deployment', 'get_deployment_by_name']
    
    class MDeployment:
        pass
    
    def delete_deployment():
        pass
    
    def get_deployment_by_name():
        pass
    
    def helper_function():
        pass
    
    # another_module.py 另一个模块文件
    
    from my_module import *
    
    # 只能访问到 __all__ 列表中的名称
    MDeployment
    delete_deployment
    get_deployment_by_name
    # 不能访问到 helper_function
    helper_function  # 这将引发 NameError: name 'helper_function' is not defined
[/code]

## filter.first()和get()查询

这两个查询都能用来查出某条具体的数据，比如想要查询id为200的某条数据，对应的查询语法分别为`filter(id=200).first()`和`get(id=200)`，但是它们还是有不小的区别。

### filter().first()

**优点**

  * **避免异常** ：如果没有对象满足条件，first() 返回 None 而不是抛出异常。
  * **处理多个匹配** ：即使有多个对象满足条件，也只会返回第一个对象，避免 MultipleObjectsReturned 异常。

**缺点**

  * **潜在的性能问题** ：在内部，filter() 会生成一个查询集，然后 first() 获取第一个对象，这可能比直接获取单个对象稍微慢一点（尽管这个差异在大多数情况下微不足道）。
  * **模糊意图** ：使用 first() 可能会使代码意图不明确，尤其是在业务逻辑要求确切知道只有一个匹配对象的情况下。

**适用场景**

  * 当你不确定是否有对象匹配时，避免 DoesNotExist 异常。
  * 当你希望返回第一个匹配的对象，而不关心是否有多个对象满足条件。

### get()

**优点**

  * **精确查询** ：get() 确保查询返回的对象是唯一的。如果有多个对象满足条件，代码会抛出 MultipleObjectsReturned 异常。
  * **简洁性** ：代码清晰明确，表明查询期望获得唯一的对象。

**缺点**

  * **异常处理** ：必须处理 DoesNotExist 和 MultipleObjectsReturned 异常，这使得代码稍微冗长一些。
  * **严格性** ：在数据不确定或不一致时可能会抛出异常，需要额外的处理逻辑。

**适用场景**

  * 当你确信数据库中只有一个对象满足条件，或者你希望确保唯一性时。
  * 当业务逻辑要求严格的一对一关系，并且需要处理不存在或多个对象的情况。

## Q

在 Django 中，Q 对象用于构建复杂的查询条件，允许你使用逻辑运算符（如 AND、OR、NOT）组合多个查询条件。

**示例**
[code]
    from django.db import models
    
    class Book(models.Model):
        title = models.CharField(max_length=100)
        author = models.CharField(max_length=100)
        published_date = models.DateField()
    
    
    # 导入Q模块
    from django.db.models import Q
    
    # 进行contains高级查询 用或连接
    books = Book.objects.filter(Q(title__contains='Django') | Q(author__contains='John'))
    # not查询
    books = Book.objects.filter(~Q(title__contains='Django'))
    # 组合查询
    books = Book.objects.filter(
        Q(title__contains='Django') | Q(author__contains='John'),
        published_date__gt='2021-01-01'
    )
[/code]

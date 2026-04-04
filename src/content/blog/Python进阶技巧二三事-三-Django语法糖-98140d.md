---
title: "Python进阶技巧二三事(三) Django语法糖"
description: "`SomeModel.objects.filter(env=env).prefetch_related('fileds')`"
date: 2022-10-12
tags: ["Python", "数据库"]
---
# Python进阶技巧二三事(三):Django语法糖

## prefetch_related

`SomeModel.objects.filter(env=env).prefetch_related('fileds')`

在某些代码中，我们会看到一个这样的`django`查询语法，这里的`prefetch_related`是`django`中的一个方法，用于优化数据库查询性能，特别是在处理一对多或者多对多关系时，可以通过减少数据库查询来提高性能，那么它是怎么做到的呢？

**作用**

  1. 预取出相关对象：在执行初始查询时，一次性预取相关对象，避免在访问的时候进行额外的操作或查询
  2. 提高性能：减少数据库查询次数，从而提高性能

**使用场景**

  * 有一对多或者多对多关系的模型
  * 需要在查询结果中访问这些对象，而不是查出来一个不使用的状态，或者不复杂的对象
  * 一次性获取所有对象

**示例**

假设有两个模型parent和child，其中child有一个外建指向parent
[code]
    class Parent(models.Model):
        name = models.CharField(max_length=100)
    
    class Child(models.Model):
        name = models.CharField(max_length=100)
        parent = models.ForeignKey(Parent, related_name='children', on_delete=models.CASCADE)
    
    # Without prefetch_related
    parents = Parent.objects.all()
    for parent in parents:
        children = parent.children.all()  # This will hit the database for each parent
    
    # With prefetch_related
    parents = Parent.objects.prefetch_related('children')
    for parent in parents:
        children = parent.children.all()  # This will not hit the database again
    
[/code]

在没有prefetch_related的情况下，每次访问 parent.children.all() 时都会执行一个新的数据库查询。使用 prefetch_related 后，Django 会在第一次查询时预取所有 Child 对象，并在内存中缓存这些对象，从而避免后续查询。

## 不同数据源的类型匹配

在django查询中，有一个很有意思的现象，数据源为pg的`__in`查询字段必须为int类型，而数据源为mysql的`__in`查询则不必须为int类型。

**Pg类型匹配**

PostgreSQL 是一种强类型数据库管理系统，这意味着它对类型非常敏感。如果字段定义为 IntegerField，在执行查询时传递的参数也必须是整数类型。否则，查询可能会失败或者结果不准确。

也就是说，PG中数据库部分，和ORM部分，以及实际的传参部分都需要严格的一一对应起来，这种严格的类型匹配要求有助于提高查询性能和数据一致性，因为 PostgreSQL 可以有效地使用索引和其他优化技术。

**MySQL 类型匹配**

相比之下，MySQL 在类型匹配方面更为宽松。MySQL 会自动进行类型转换，因此在查询 IntegerField 时传递字符串类型的参数通常不会导致问题。MySQL 的这种灵活性在某些情况下可能会导致性能下降或意外的查询结果，因为隐式类型转换会增加数据库引擎的开销。
[code]
    class MyModel(models.Model):
        id = models.IntegerField(primary_key=True)
    
    # PostgreSQL 中
    ids = ['1', '2', '3']  # 字符串类型的ID
    results = MyModel.objects.filter(id__in=ids)  # 这会导致类型不匹配错误
    
    # MySQL 中
    ids = ['1', '2', '3']  # 字符串类型的ID
    results = MyModel.objects.filter(id__in=ids)  # 这会成功，因为 MySQL 会自动进行类型转换
[/code]

## as_view

在 Django 中，视图是url对应的处理程序，也就是具体处理请求参数的代码，有函数视图和类视图两种。`as_view() `是基于类的视图（Class-based View, CBV）的一部分，用于将类转换为可调用的视图函数。它允许你在 URL 路由中使用类，而不是函数。

类视图比起普通的函数视图有以下几个优势

  * **实例化视图类** ：as_view() 方法在每次请求时都会实例化视图类。这意味着每个请求都会有一个新的视图实例，从而避免了多线程环境下共享状态的问题。
  * **处理请求方法** ：它根据请求的方法（如 GET、POST、PUT、DELETE 等）来调用类中的相应方法，如 get()、post() 等。**也就是可以完美的融合**`**RESTFUL**`**思想，用同一个URL、不同的HTTP方法，来表示不同的语义。** 比如GET表示查询，DELETE表示删除。
  * **中间件和装饰器兼容性** ：转换后的视图函数可以像基于函数的视图一样使用中间件和装饰器。

[code]
    from django.http import HttpResponse
    from django.views import View
    
    class MyView(View):
        def get(self, request):
            return HttpResponse('Hello, world!')
    
    我们可以在 URL 配置中使用 as_view() 方法将 MyView 类注册为一个视图函数
    from django.urls import path
    from .views import MyView
    
    urlpatterns = [
        path('my-view/', MyView.as_view(), name='my-view'),
    ]
    
[/code]

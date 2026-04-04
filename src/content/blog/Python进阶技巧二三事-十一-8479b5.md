---
title: "Python进阶技巧二三事（十一)"
description: "python内置的字典类型可以保存某个对象的动态内部状态，我们定义了字典之后可以手动的为这个字典添加/删除元素。"
date: 2023-02-21
tags: ["Python", "并发"]
---
# Python进阶技巧二三事（十一)

## 类与集成

### 使用辅助类来维护程序的状态

python内置的字典类型可以保存某个对象的动态内部状态，我们定义了字典之后可以手动的为这个字典添加/删除元素。

比如现在我们需要记录多名学生成绩和学生名，可以定义一个类，把所有的学生名字都保存到字典里。

## 用锁来代替可复用的`try/finally`语句

  

Django REST framework (DRF) 是一个强大的工具，用于构建 Web APIs。它提供了一些约定和规则，使得开发者可以快速构建和管理 API 端点。以下是一些关键规则和机制，解释了为什么 GET 请求会自动被 `list` 方法处理。

### 1\. 视图集 (ViewSets)

视图集是 DRF 中的一种高级抽象，结合了视图和路由。视图集可以处理一组相关的视图逻辑，例如列表视图、详情视图、创建视图等。常见的视图集包括：

  * `ViewSet`
  * `ModelViewSet`
  * `ReadOnlyModelViewSet`

这些视图集提供了一组默认的动作（actions），如 `list`、`retrieve`、`create`、`update` 和 `destroy`。

### 2\. 动作 (Actions)

视图集中的动作是处理特定 HTTP 方法的函数。例如：

  * `list`：处理 GET 请求，用于获取资源的列表。
  * `retrieve`：处理 GET 请求，用于获取单个资源的详情。
  * `create`：处理 POST 请求，用于创建新资源。
  * `update`：处理 PUT 请求，用于更新资源。
  * `partial_update`：处理 PATCH 请求，用于部分更新资源。
  * `destroy`：处理 DELETE 请求，用于删除资源。

### 3\. 路由 (Routers)

DRF 提供了路由器（routers）来自动生成 URL 路由，并将这些路由映射到视图集中的动作。常用的路由器包括：

  * `DefaultRouter`
  * `SimpleRouter`

这些路由器会根据视图集中的动作自动生成 URL 路由。例如，`DefaultRouter` 会为 `list` 动作生成一个 URL 路由。

### 4\. URL 路由和动作映射

当你注册一个视图集时，路由器会自动生成 URL 路由，并将这些路由映射到视图集中的相应动作。例如：
[code]
    from rest_framework.routers import DefaultRouter
    from .views import HarborImageView
    
    router = DefaultRouter()
    router.register(r'harborimage', HarborImageView, basename='harborimage')
    
    urlpatterns = [
        path('', include(router.urls)),
    ]
[/code]

在这个例子中，`DefaultRouter` 会为 `HarborImageView` 生成以下 URL 路由：

  * `GET /harborimage/`：映射到 `HarborImageView` 的 `list` 方法。
  * `GET /harborimage/{pk}/`：映射到 `HarborImageView` 的 `retrieve` 方法。
  * `POST /harborimage/`：映射到 `HarborImageView` 的 `create` 方法。
  * `PUT /harborimage/{pk}/`：映射到 `HarborImageView` 的 `update` 方法。
  * `PATCH /harborimage/{pk}/`：映射到 `HarborImageView` 的 `partial_update` 方法。
  * `DELETE /harborimage/{pk}/`：映射到 `HarborImageView` 的 `destroy` 方法。

### 5\. 视图集的默认行为

视图集提供了一些默认行为，使得常见的操作变得简单。例如，`ModelViewSet` 提供了对模型的完整 CRUD 操作，而 `ReadOnlyModelViewSet` 只提供读取操作（`list` 和 `retrieve`）。

### 6\. 自定义动作

你可以在视图集中定义自定义动作，并使用 `@action` 装饰器来指定这些动作的 HTTP 方法和路由。例如：
[code]
    from rest_framework.decorators import action
    from rest_framework.response import Response
    
    class HarborImageView(SessionViewSet):
    
        @action(detail=False, methods=['get'])
        def custom_action(self, request):
            return Response({'message': 'This is a custom action'})
[/code]

这个自定义动作会生成一个新的 URL 路由，例如 `GET /harborimage/custom_action/`，并映射到 `custom_action` 方法。

### 总结

  * **视图集 (ViewSets)** ：提供了一组相关的视图逻辑。
  * **动作 (Actions)** ：处理特定 HTTP 方法的函数，如 `list`、`retrieve`、`create` 等。
  * **路由 (Routers)** ：自动生成 URL 路由，并将这些路由映射到视图集中的动作。
  * **默认行为** ：视图集提供了一些默认行为，使得常见的操作变得简单。
  * **自定义动作** ：可以定义自

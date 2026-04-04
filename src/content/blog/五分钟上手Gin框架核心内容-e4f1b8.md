---
title: "五分钟上手Gin框架核心内容"
description: "因为毕设是用`Go`写的，涉及到`Web`的内容用的是`Gin`框架，所以顺便归纳总结了一下`Gin`的一些核心使用方法，下面是Gin框架开发会用到的核心内容。"
date: 2023-09-11
tags: ["Go"]
---
# 五分钟上手Gin框架核心内容

## 前言

因为毕设是用`Go`写的，涉及到`Web`的内容用的是`Gin`框架，所以顺便归纳总结了一下`Gin`的一些核心使用方法，下面是Gin框架开发会用到的核心内容。

  

## 基础

  

**1.Gin.Use和Gin.Default的区别**

  

[code]
    //Default加了两个中间件
    Gin.Use(Logger(),Recovery())
[/code]

  

这两个中间件有打印日志和从Panic中恢复的能力  
Logger中间件会将日志写入gin.DefaultWriter，即使配置了GIN_MODE=release  
Recovery中间件会recover任何panic，如果有panic的话，会写入500响应码  

**2.Gin怎么分组**  
gin.Group对路由进行分组，一个路由组拥有着相同的前缀。
[code]
    	r := gin.Default()
    
    	// 创建路由组 "/api"
    	apiGroup := r.Group("/api")
    
    	// 在路由组中定义具体的路由
    	apiGroup.GET("/users", getUsers)
    	apiGroup.POST("/users", createUser)
    
      //这两个方法的URL就是
      ..../api/users
[/code]

  

## 参数处理

  

Gin怎么拿到URL中的参数  
用ID举例子  
**Param**

  

[code]
    C.Param("id")
    
    // 这个时候路由要这么写 id就成为了不定参数
    GET（"/:id")
    
    
    //这时候url中的请求格式就应该如下
    http://localhost:8080/id=xx
    //如果有多的参数则应该是
    http://localhost:8080/id=xx&name=xx
    GET("/:id/:name")
    
    //当我们想处理URL中所有的参数的时候
    //比如说有name id type等等
    //这个时候路由就该这么写
    
    c.Param("all")
    GET("/*all"）
[/code]

  

**在URL中传参时必须传某个param该怎么做？**

  

[code]
    type Produdct struct {
      	ID int `uri:"id" binding:"required" 
      	Name string `uri:"name" binding:"required"
    }
    // uri也是tag支持的一个键值对之一
    
    
    var p Product 
    err := c.ShouldBindUri(&p)
    // 如果这里err有问题了，那么很显然就是某个param没有传
[/code]

  

## struct tag

  

在很多项目代码里面，很容易看到有一些结构体的定义是类似下面这个结构体的

  

[code]
    type Location struct {
        Longitude float32 `json:"lon,omitempty"`
        Latitude  float32 `json:"lat,omitempty"`
    }
[/code]

  

字段后面会有一个标签，这个标签通常是由反引号给括起来的  
Go提供了可通过发射发现的结构体标签，这些在标签库json/xml中得到了广泛的使用，orm框架也支持了结构体标签，上面的这个例子就是因为encoding/json支持json结构体标签，每种标签都有自己的特殊规则  
不过所有标签都遵循一个总体规则，这个规则是不能更改的，具体格式如下  
`key1:"value1" key2:"value2" key3:"value3"...`  
结构体标签可以有多个键值对，键与值要用冒号分割，值要使用双引号括起来，多个键值对之间使用一个**空格** 进行分割  
而一个值中要传递多个信息，不同库的实现是不一样的，在encoding/json中，多值使用逗号进行分割  
例如下面的例子  
`json:"lon,omitempty"`  
在gorm中，多值使用分号进行分隔  
``gorm:"column:id;primaryKey"`结构体标签的具体作用时机如下 **在编译阶段和成员进行关联，以字符串的形式进行关联，在运行阶段可以通过反射读取出来** 在Go项目的编译阶段是不会对struct tag做合法键值对的检查的，如果我们不小心写错了，就会很难被发现，这个时候我们就可以使用`go vet`工具，帮助我们做CI检查  
下面是Go支持的struct tag类型  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1679832101087-edb7ec1a-6f48-47d8-8924-30e026d91e35.png)  
![](https://cdn.nlark.com/yuque/0/2023/png/26372139/1679832115673-63915df4-4051-4cd3-be57-55241b6dcda5.png#averageHue=%23fefefd&clientId=u8f9b1cd5-5793-4&from=paste&height=729&id=ub673d28c&name=image.png&originHeight=1458&originWidth=986&originalType=binary&ratio=2&rotation=0&showTitle=false&size=433641&status=done&style=none&taskId=u3e24625a-2b01-4580-a2f4-724c44832ea&title=&width=493)![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1679832127523-b79d0c7c-07aa-4a4c-98db-d835ae72e925.png)

  

## 自定义结构体标签

  

结构体标签是可以随意写的，只要符合语法规则。但是一些库没有支持该标签的情况下，随意写的标签是没有任何意义的，如果想要我们的标签变得有意义，就需要我们提供解析方法。可以通过**反射的方法** 获取标签，下面是一个例子

  

[code]
    type test struct {
    	Name string `cheng:"name"`
    	ID   int    `cheng:"id"`
    	Type int    `cheng:"type"`
    }
    
    func getStructTag(obj interface{}) {
    	t := reflect.TypeOf(obj)
    	for i := 0; i < t.NumField(); i++ {
    		value := t.Field(i)
    		tag := value.Tag.Get("cheng")
    		fmt.Println("get tag is", tag)
    	}
    }
    
    func main() {
    	t := test{
    		Name: "yuyating",
    		ID:   2021212345,
    		Type: 1,
    	}
    	getStructTag(t)
    }
    
    输出结果
    get tag is name
    get tag is id
    get tag is type
[/code]

  

## Post-body参数的类型

  

在POST请求中，常见的body数据类型包括

     1. application/x-www-form-urlencoded: 这是最常见的POST请求数据格式，适用于简单的表单数据。在这种格式下，数据以键值对的形式出现，每个键值对之间使用&符号分割，例如:key1=value1&key2=value2
     2. multipart/form-data：适用于上传文件或者二进制数据，通常用于文件上传功能。在这种格式下，数据被分割成多个部分，每个部分有自己的Content-Type，例如Content-Type:image/jpeg。这种格式下，数据以一定的边界符分割，每个部分之间以该边界符分割
     3. application/json：适用于发送JSON格式的数据，在这种格式下，数据以JSON格式组织，例如{"key1":"value1","key2":"value2"}
     4. text/xml: 适用于发送XML格式的数据，在这种格式下，数据以XML格式组织，例如value1

一般情况下，POST请求的body数据类型是需要根据API设计要求而选择的。如果混用不同类型的数据格式，服务器端可能无法正确解析请求的数据，导致请求失败。

  

## ShouldBind方法

  

`ShouldBind`用于绑定请求中的参数，将其转换成Go结构体或者map类型，该方法的参数类型绑定顺序为

     1. 如果是query string，则按照form表单的格式进行解析
     2. 如果是post表单数据，则按照form表单的进行解析
     3. 如果是json格式，按照json格式解析
     4. 如果是xml格式，按照XML格式解析
     5. 如果是protobuf格式，按照protobuf格式解析

  

在绑定参数的时候，Gin会根据请求的Content-Type自动选择核实的参数绑定方式，可以通过ShouldBind方法来完成自动绑定。例如，如果请求的Content-Type为application/json，则Gin会自动将请求体中的JSON数据解析为Go结构体  
**这里有个问题，为什么query string会按照form表单进行解析呢？form表单不是放在body里的吗？**  
虽然form表单数据通常被放在POST请求中的body里面，但是在HTTP请求中，form表单数据也可以以query string的形式出现在url中。在这种情况下，query string中的键值对与form表单中的键值对是相同的，都是由键和值组成的键值对，通过&符号进行分割  
因此，Gin在解析query string时会按照form表单的格式进行解析，即将query string中的键值对解析为Go结构体或者Map类型。这样就能够通过Gin的ShouldBind方法统一处理query string和form表单数据，提高了代码复用性和可读性  
需要注意的是，在将query string解析为Go结构体或者map类型的时候，需要将URL编码转义的字符进行解码。例如将%20转换为空格。Gin会自动进行这一步操作，不需要手动进行解码。

  

## Gin中间件

  

Gin允许开发者在处理请求的过程中加上自己的钩子函数，这个钩子函数就被称为中间件，中间件适合处理一些公共的业务逻辑，比如**登录认证、权限校验、数据分页、记录日志、耗时统计等等** 。

### AOP、拦截器、中间件傻傻分不清？

  
在JAVA等面向对象编程语言中，面向切面编程（AOP）的思想和中间件是类似的。  
而拦截器（interceptor）的思想和中间件也是类似的  
AOP和MiddleWare、Interceptor都是用于改善软件系统架构的技术，但它们的实现和目标有所不同  
**相同点**

    * 都是通过将特定功能从主要业务逻辑中分离出来，以改善系统的可维护性和可扩展性
    * 都是在系统中插入特定代码来实现所需功能的（hook）
    * 都可以提高代码的复用性，减少重复代码的编写

  

**不同点**

    * AOP关注的是切面，即与业务逻辑无关的横切关注点，如安全性、日志记录、性能检测等等，它们被成为切面，AOP使用依赖注入和动态代理等特定的技术，实现这些切面
    * 中间件关注的是不同系统组件之间的通信和交互，是一种软件层，为应用程序提供基础服务，如消息传递、数据传输和远程调用等等

  

AOP更关注于解决代码层面的问题，中间件则更关注于解决系统层面的问题

  

拦截器通常只在特定的代码路径或者逻辑流中执行，例如在特定的web请求或者调用特定的方法的时候，通常由程序本身实现，通过代码中的特定注解或配置来声明和使用，旨在通过拦截请求和响应来处理和修改它们，以实现特定的功能，如安全性、性能检测和日志记录等等  

使用中间件

  

[code]
    //注册全局中间件  
    c.Use(middleware())
    //注册某一条路由的中间件 
    r.GET("/xxx",MiddleWare(),handler)
[/code]

  

**注意** ：**在中间件或者handler中启用新的goroutine的时候，不能使用原始的上下文**`**c**** _gin.Context_**`** _，必须使用其只读副本_**`** _c.Copy()_**`  

###  c.Next与c.Abort源码

  

[code]
    func (group *RouterGroup) combineHandlers(handlers HandlersChain) HandlersChain {
    	finalSize := len(group.Handlers) + len(handlers)
    	if finalSize >= int(abortIndex) {  // 这里有一个最大限制
    		panic("too many handlers")
    	}
    	mergedHandlers := make(HandlersChain, finalSize)
    	copy(mergedHandlers, group.Handlers)
    	copy(mergedHandlers[len(group.Handlers):], handlers)
    	return mergedHandlers
    }
    一个路由的中间件函数和处理函数结合到一起成为一条处理链条
    本质上就是一个由HandlerFunc组成的切片
    
    
    Next:
    func (c *Context) Next() {
    	c.index++
    	for c.index < int8(len(c.handlers)) {
    		c.handlers[c.index](c)
    		c.index++
    	}
    }
    通过索引遍历HandlersChain链条，从而实现依次调用该路由的每一个函数
    
    Abort:
    func (c *Context) Abort() {
    	c.index = abortIndex  // 直接将索引置为最大限制值，从而退出循环
    }
[/code]

  

Next:  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1679882242461-75c03479-998e-40a1-bf3a-a0f41b0fde87.png)  
Abort:  
中断整个调用链条，从当前函数返回  
我们的handlers也是HandleFunc类型，所以如果一条路由的专用middleware，调用了c.Next，其实就是直接跳到了handlers中去执行

  

## 优雅关机

优雅关机的使用场景：我们不能让一个项目随意的退出，因为这个时候**可能还有请求没有处理完** ，如果你一个信号、或者一个stop按键能够直接让程序停止，那么显然这个项目是不合格的。

正确做法是应该处理完所有请求、释放对应资源之后，再停止程序  
栗子
[code]
    // 把 run 放在子协程中执行
    go func() {
     r.Run()
    }()
    // 一个信号通道
    exit:=make(chan os.Signal)
    // 监听通道中有没有这两种信号
    signal.Notify(exit,syscall.SIGINT,syscall.SIGTERM)
    <-exit
    log.Println("process exit")
[/code]

## 结语

本文介绍了一些web开发的基础知识，以及Go的一些进阶语法、Gin框架的核心内容及部分源码，相信能够帮助各位读者了解Gin框架内容。

创作不易，如果有收获欢迎**点赞、评论、收藏** ，您的支持就是我最大的动力。

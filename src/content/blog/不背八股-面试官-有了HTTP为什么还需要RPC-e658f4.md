---
title: "不背八股！！！面试官：有了HTTP为什么还需要RPC？"
description: "在前文[为什么说TCP是基于字节流的？](<https://juejin.cn/post/7304531203771449379>)中我们介绍了为什么`TCP`是基于字节流的，其中最本质的原因就是因为`TCP`是流式传输数据的，并且`TCP`的数据格式没有消息边界。"
date: 2023-08-09
tags: ["面试", "网络"]
---
# 不背八股！！！面试官：有了HTTP为什么还需要RPC？

## 前言

在前文[为什么说TCP是基于字节流的？](<https://juejin.cn/post/7304531203771449379>)中我们介绍了为什么`TCP`是基于字节流的，其中最本质的原因就是因为`TCP`是流式传输数据的，并且`TCP`的数据格式没有消息边界。

在网络实践中，为了解决`TCP`粘包的问题，我们通常使用的是**自定义消息头** 的方法，因为这样比较高效且灵活，通常消息头内有一些控制信息，比如这条消息的包长度具体是多少，这条消息的格式是什么样子的，有没有进行压缩，来源方IP，来源方是哪里等等。后来随着这种方式慢慢在互联网中被认同，就形成了各种各样的规范，我们将这些规范称之为**协议** ，而这些协议通常是在传输层之上的应用层实现的，`HTTP`和`RPC`就是其中之二。

按照四层网络来看，每一层对应的常用协议大概是下面这样子的。 

![](https://cdn.nlark.com/yuque/0/2023/png/26372139/1700745567943-36e626ae-b9b6-4a5e-b47d-dd7f92676850.png)

## HTTP与RPC

**HTTP协议** （Hyper Text Transfer Protocol），又叫做超文本传输协议，常见于我们的`web`服务中，它就是用来解析、传输由`html`标签组成的超文本的。

**RPC协议** （Remote Procedure Call），直译过来为远程过程调用，它的定义是**允许程序执行在远程计算机上的过程或函数，而不需要显示的处理底层的通信细节** ，`RPC`并不是一种协议，而是一类协议，只要某个协议能够做到执行远程计算机上的程序/应用，那么就可以称之为`RPC`协议，现在常用的`RPC`协议有`gRPC`（底层实现也是使用的http 2.0）、`thifht`等等。

从这个角度来说，`HTTP`其实也是`RPC`的一种实现，同时也是使用最多的一种实现。

### 历史发展

其中`TCP`是在70年代被`Vinton Cert和Bob Kahn`等人开发的，`RPC`的概念最早由`Bruce Jay Nelson`于81年提出，最早的RPC协议是在84年由`NFS`实现的，而`HTTP`1.0版本在1996年发布，我们最常用的`HTTP1.1` 版本是在99年才产生的。

计算机科学的发展是很快的，中间的十几年涌现了各种各样的协议，但是因为各种各样的原因又淹没在历史中，之后因为`HTTP`的简便性、灵活性、可扩展性等优势，才被广泛适用于浏览器、服务器之间的交互，甚至于服务器、服务器之间的交互，这又更能体现`HTTP`是`RPC`的实现之一了。

所以上面的问题应该换一换，改为：**为什么有了RPC还需要HTTP？**

**但是我们为什么会觉得**`**HTTP**`**和**`**RPC**`**是两类协议，或者为什么会觉得RPC比HTTP更加高级，更晚出现呢？**  
我想这和当前开发者的学习路径是分不开的，大部分开发者首先接触到的是`HTTP`协议，也就是`web`开发相关的内容；后续技术精进之后，接触到分布式相关内容，这才接触到`RPC`这类协议。所以我们很容易先入为主的觉得`RPC`比`HTTP`更加高级、更晚出现。

### 比较

**服务发现**

服务发现就是找到具体请求需要发送给哪一台服务器，在`HTTP`中这个过程是由`DNS`自动来实现的，无需人为配置；但是在`RPC`中通常都是通过服务注册与发现中心进行服务发现，例如`consul`或者`etcd`等等，需要引入额外的第三方组件。

**底层协议**

二者都是用的`TCP`连接，并且可以开启长链接模式进行数据交互。

**消息格式**

` HTTP`通常使用的是`JSON`这种易读的键值对消息格式进行消息的传输，而RPC为了追求效率，通常使用的是不易读但是对机器友好的二进制消息格式，比如`protobuf`这种。

**使用场景**

目前`HTTP`在公司中主要负责向外提供服务，而`RPC`主要负责内部之间进行通信，但是现在随着架构的融合发展以及`HTTP`效率的提升，不少内部服务之间进行通信也是使用的`HTTP`，因为`HTTP`足够简单方便且高效。

## HTTP与RPC实现

### HTTP实现

`HTTP`服务端代码
[code]
    // 定义参数和响应
    type addParam struct {
    	X int `json:"x"`
    	Y int `json:"y"`
    }
    type addResult struct {
    	Code int `json:"code"`
    	Data int `json:"data"`
    }
    
    func add(x, y int) int {
    	return x + y
    }
    
    // addHandler 解析参数+调用add+响应写回
    func addHandler(w http.ResponseWriter, r *http.Request) {
    	// parse parameters
    	b, _ := io.ReadAll(r.Body)
    	var param addParam
    	json.Unmarshal(b, &param)
    	// use the add func
    	ret := add(param.X, param.Y)
    	// return the response
    	respBytes, _ := json.Marshal(addResult{Code: 0, Data: ret})
    	w.Write(respBytes)
    }
    
    func main() {
    	http.HandleFunc("/add", addHandler)
    	log.Fatal(http.ListenAndServe(":9090", nil))
    }
[/code]

`HTTP`客户端代码
[code]
    type addParam struct {
    	X int `json:"x"`
    	Y int `json:"y"`
    }
    type addResult struct {
    	Code int `json:"code"`
    	Data int `json:"data"`
    }
    
    func main() {
    	url := "http://127.0.0.1:9090/add"
    	param := addParam{
    		X: 10,
    		Y: 20,
    	}
    	// marshal to json
    
    	paramBytes, _ := json.Marshal(param)
    	// call
    	resp, _ := http.Post(url, "application/json", bytes.NewReader(paramBytes))
    	defer resp.Body.Close()
    	respBytes, _ := ioutil.ReadAll(resp.Body)
    	var respData addResult
    	json.Unmarshal(respBytes, &respData)
    	fmt.Println(respData.Data)
    }
[/code]

### RPC实现

![](https://cdn.nlark.com/yuque/0/2023/png/26372139/1700786339908-a5622897-f6dd-4936-b5c8-f6427cbb76c0.png)

`RPC Service`实现
[code]
    type Args struct {
    	X, Y int
    }
    
    type ServiceA struct{}
    
    // Add is an out method
    // has two args and a return 
    // two params must be out 
    // and the return value must be error type 
    func (s *ServiceA) Add(args *Args, reply *int) error {
    	*reply = args.X + args.Y
    	return nil
    }
[/code]

`RPC Server`实现
[code]
    func main() {
      //new service instance   
    	service := new(yunyuansheng.ServiceA)
      //register rpc service   
    	rpc.Register(service) 
      //botton on http  
    	//rpc.HandleHTTP()      
      //botton on tcp   
    	l, e := net.Listen("tcp", ":9091")
    	if e != nil {
    		log.Fatal("listen error:", e)
    	}
    	//http.Serve(l, nil)
    	for {
    	  // accpet the request and serve   
    		conn, _ := l.Accept()
    		rpc.ServeConn(conn)
    	}
    }
[/code]

`RPC Client`实现
[code]
    func main() {
    	//因为服务端是HTTP请求 所以要建立HTTP连接
    	client, err := rpc.Dial("tcp", "127.0.0.1:9091")
    	if err != nil {
    		fmt.Println(err)
    	}
    	// 同步调用 Call
    	args := &yunyuansheng.Args{10, 20}
    	reply := new(int)
    	err = client.Call("ServiceA.Add", args, reply)
    	if err != nil {
    		log.Fatal("ServiceA.Add error:", err)
    	}
    	fmt.Printf("ServiceA.Add %d+%d=%d\n", args.X, args.Y, *reply)
    
    	//异步调用 Go
    	var reply2 int
    	divCall := client.Go("ServiceA.Add", args, &reply2, nil)
    	replyCall := <-divCall.Done //Done是一个调用结果的通知 有值了就说明调用完成了
    	fmt.Println(replyCall.Error)
    	fmt.Println(reply2)
    }
[/code]

## 结语

本文主要向大家介绍了TCP与HTTP及RPC协议之间的关系，通过历史发展的角度，将有了`HTTP`为什么还要有`RPC`这个问题拨乱反正为：有了`RPC`为什么还要有`HTTP`，并介绍了二者的优缺点及相关代码示例，相信在面试官面前吹水是绝对够用了。创作不易，如果有收获欢迎**点赞、评论、收藏** ，您的支持就是我最大的动力。

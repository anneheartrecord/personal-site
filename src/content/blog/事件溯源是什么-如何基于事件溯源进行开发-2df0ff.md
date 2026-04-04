---
title: "事件溯源是什么？如何基于事件溯源进行开发"
description: "之前偶尔接触到了事件溯源，但没有刨根究底的学习，最近抽时间看了一下有关这方面的内容。"
date: 2023-08-10
tags: ["Go", "数据库"]
---
# 事件溯源是什么？如何基于事件溯源进行开发

## 前言

之前偶尔接触到了事件溯源，但没有刨根究底的学习，最近抽时间看了一下有关这方面的内容。

本文会泛谈传统持久化技术实现，以及对应的问题，从而介绍事件溯源是什么，解决了什么问题，以及基于事件溯源开发的优缺点。

## 传统的持久化技术

  

通常，我们在DB层面存储的内容是一条详尽的数据，比如一条评论的数据最核心的内容可能像下面是这样的，当然，在公司里面还会有很多附加的控制信息，比如平台的ID，其他表的信息之类以方便交互。

  

`id | father-id | comment | publisher | create_time | delete_time | expand`

  

**一般是将类Go中的结构体映射到数据库表，将字段映射到列，将实例的值映射到行**

  

这种方式的效果很好，所以大多数企业使用这种持久化的方式来进行持久化，但是它也存在着某些问题

  

## 传统持久化方式的问题

  

**对象与关系的阻抗失调**

  

关系型数据的表格结构模式与领域模型及其复杂关系的图状结构之间，存在基本的概念不匹配问题

  

例如，一个订单对象可能包含多个订单项对象，每个订单项对象又包含多个商品对象，这种复杂的嵌套关系**无法直接映射** 到关系型数据库的表格结构中

  

为了解决这个问题，ORM框架通常会提供一些机制来实现对象和关系之间的映射，例如，可以使用外键来表示对象之间的关系，或者使用**嵌套查询** 来获取嵌套对象的数据

  

**缺乏聚合的历史**

  

传统持久化机制的另一个限制是它只存储聚合的当前状态，聚合更新之后，其先前的状态将丢失。如果应用程序想要保留之前的历史记录，则必须由开发人员手动实现此机制

  

**不利于实施审计功能**

  

某些应用程序必须维护审计日志，用于跟踪哪些用户更改了聚合，以满足安全性或者监管的要求。实施审计的挑战在于：除了这是一项耗时的工作之外，负责记录审计日志的代码可能会和业务逻辑代码发生偏离，从而导致各种错误

  

审计功能有很多种，比如记录用户的登录和注销、记录用户对数据的访问和修改、记录系统的错误和异常情况等等。

  

审计日志通常包含时间戳、用户ID、操作类型、操作对象、操作结果等信息，以便在需要时进行审计和调查。

  

**事件发布凌驾于业务逻辑之上**

  

传统持久化不支持发布领域事件，某些ORM框架可以在数据对象更改时调用应用程序提供的回调接口。但是我们无法把自动发布消息作为更新数据事务的一部分。因此，和审计及历史操作一样，开发人员必须自己处理事件生成的逻辑，这可能会与业务代码不完全同步

  

## 什么是事件溯源

  

除了像传统的持久化技术一样通过行与列来存储当前状态的数据之外，我们也可以选择存储一个事件，也就是使用事件溯源（Event Sourcing）的方式来进行数据存储，这**是一种以事件为中心的编写业务逻辑和持久化领域对象的方法** 。

  

事件溯源是构建业务逻辑和持久化聚合的另一种选择，它将聚合以一系列事件的方式持久化保存。每个时间代表聚合的一次状态变化，应用程序通过重放事件来重新创建聚合的当前状态

  

**事件溯源是一种以事件为中心的技术，用于实现业务逻辑和聚合的持久化，聚合作为一系列事件存储在数据库中，每个事件代表着聚合的状态变化，聚合的业务逻辑围绕生成和使用这些事件的要求而构建。** 每条记录会记录事件的ID，类型，具体操作等等

  

下面是一段Go实现简单事件溯源的代码

  

[code]
    package main
    
    import (
    	"fmt"
    	"time"
    )
    
    // Event 表示一个通用的事件 所有的事件都可以用Event来表示
    type Event struct {
    	Timestamp time.Time
    	Payload   interface{}
    }
    
    // OrderCreatedEvent 表示一个创建订单的事件
    type OrderCreatedEvent struct {
    	OrderID   string
    	Customer  string
    	Product   string
    	Timestamp time.Time
    }
    
    // OrderPaidEvent 表示一个支付订单的事件
    type OrderPaidEvent struct {
    	OrderID   string
    	Amount    float64
    	Timestamp time.Time
    }
    
    // EventStore 表示事件的集合 即事件溯源集
    type EventStore struct {
    	events []Event
    }
    
    // AppendEvent 往事件集中添加事件
    func (es *EventStore) AppendEvent(event Event) {
    	es.events = append(es.events, event)
    }
    
    // GetEvents 返回所有的事件
    func (es *EventStore) GetEvents() []Event {
    	return es.events
    }
    
    // CreateOrder 创建订单
    func CreateOrder(orderID, customer, product string) {
    	event := OrderCreatedEvent{
    		OrderID:   orderID,
    		Customer:  customer,
    		Product:   product,
    		Timestamp: time.Now(),
    	}
    	eventStore.AppendEvent(event)
    }
    
    // PayOrder 支付订单
    func PayOrder(orderID string, amount float64) {
    	event := OrderPaidEvent{
    		OrderID:   orderID,
    		Amount:    amount,
    		Timestamp: time.Now(),
    	}
    	eventStore.AppendEvent(event)
    }
    
    // Example usage
    var eventStore EventStore
    
    func main() {
    	CreateOrder("123", "John Doe", "Product A")
    	PayOrder("123", 100.0)
    
    	events := eventStore.GetEvents()
    	for _, event := range events {
    		switch e := event.Payload.(type) {
    		case OrderCreatedEvent:
    			fmt.Printf("Order created: %s\n", e.OrderID)
    		case OrderPaidEvent:
    			fmt.Printf("Order paid: %s, Amount: %.2f\n", e.OrderID, e.Amount)
    		}
    	}
    }
[/code]

  

## 如何处理并发

  

**传统数据库实现隔离性**

  

两个或多个请求同时更新同一数据的情况并不少见，使用传统持久化技术的应用程序通常使用乐观锁来防止一个事物覆盖另一个事务的修改。乐观锁通常使用版本列来检测聚合自读取以来是否更改。程序将聚合映射到具有VERSION列的表，每当更新的时候都会递增，例如

  

[code]
    update table set version = version+1 shere version = origin version
[/code]

  

只有当前版本和应用程序读取聚合时的版本一致的时候，update才会成功。如果同时有多个事务读取相同的聚合，则只有第一个更新的事务才会成功

  

**事件溯源事件间实现隔离性**

  

事件存储库也可以使用乐观锁来处理并发更新，一种简单的方式是使用事件数来作为版本号。 我们对上述的代码进行修改

  

[code]
    package main
    
    import (
    	"errors"
    	"fmt"
    	"sync"
    	"time"
    )
    
    // Event represents a generic event in the system
    type Event struct {
    	Sequence  int
    	Timestamp time.Time
    	Payload   interface{}
    }
    
    // OrderCreatedEvent represents the event when an order is created
    type OrderCreatedEvent struct {
    	OrderID   string
    	Customer  string
    	Product   string
    	Timestamp time.Time
    }
    
    // OrderPaidEvent represents the event when an order is paid
    type OrderPaidEvent struct {
    	OrderID   string
    	Amount    float64
    	Timestamp time.Time
    }
    
    // EventStore represents the event store
    type EventStore struct {
    	events   []Event
    	sequence int
    	mutex    sync.Mutex
    }
    
    // AppendEvent appends a new event to the event store
    func (es *EventStore) AppendEvent(event Event) error {
    	es.mutex.Lock()
    	defer es.mutex.Unlock()
    
    	if event.Sequence != es.sequence+1 {
    		return errors.New("invalid sequence number")
    	}
    
    	es.events = append(es.events, event)
    	es.sequence = event.Sequence
    	return nil
    }
    
    // GetEvents returns all events in the event store
    func (es *EventStore) GetEvents() []Event {
    	es.mutex.Lock()
    	defer es.mutex.Unlock()
    
    	return es.events
    }
    
    // CreateOrder creates a new order and appends the OrderCreatedEvent to the event store
    func (es *EventStore) CreateOrder(orderID, customer, product string) error {
    	es.mutex.Lock()
    	defer es.mutex.Unlock()
    
    	event := OrderCreatedEvent{
    		OrderID:   orderID,
    		Customer:  customer,
    		Product:   product,
    		Timestamp: time.Now(),
    	}
    	event.Sequence = es.sequence + 1
    
    	err := es.AppendEvent(Event{
    		Sequence:  event.Sequence,
    		Timestamp: event.Timestamp,
    		Payload:   event,
    	})
    	if err != nil {
    		return err
    	}
    
    	return nil
    }
    
    // PayOrder pays an existing order and appends the OrderPaidEvent to the event store
    func (es *EventStore) PayOrder(orderID string, amount float64) error {
    	es.mutex.Lock()
    	defer es.mutex.Unlock()
    
    	event := OrderPaidEvent{
    		OrderID:   orderID,
    		Amount:    amount,
    		Timestamp: time.Now(),
    	}
    	event.Sequence = es.sequence + 1
    
    	err := es.AppendEvent(Event{
    		Sequence:  event.Sequence,
    		Timestamp: event.Timestamp,
    		Payload:   event,
    	})
    	if err != nil {
    		return err
    	}
    
    	return nil
    }
    
    // Example usage
    var eventStore EventStore
    
    func main() {
    	err := eventStore.CreateOrder("123", "John Doe", "Product A")
    	if err != nil {
    		fmt.Println(err)
    		return
    	}
    
    	err = eventStore.PayOrder("123", 100.0)
    	if err != nil {
    		fmt.Println(err)
    		return
    	}
    
    	events := eventStore.GetEvents()
    	for _, event := range events {
    		switch e := event.Payload.(type) {
    		case OrderCreatedEvent:
    			fmt.Printf("Order created: %s\n", e.OrderID)
    		case OrderPaidEvent:
    			fmt.Printf("Order paid: %s, Amount: %.2f\n", e.OrderID, e.Amount)
    		}
    	}
    }
[/code]

  

## 事件溯源如何发布事件？

  

事件溯源可以作为可靠的发布机制，在事件存储库中保存事件本质上是一个原子化的操作，我们需要实现一种机制，将这些持久化保存的事件传递给所有感兴趣的消费者

  

假设我们现在的事件存储在Events表中，我们如何实现这些事件的发布呢？

  

**使用轮询**

  

我们可以简单的使用SELECT语句轮询Events表，并将事件发布到消息代理。这种做法的挑战在于如何确定哪些事件是新事件

  

例如，假设eventIds是自增的，我们可以简单的通过最后一个处理的eventId来筛选出来哪些是新事件

  

[code]
    select * from events where event_id > ? order by event_id asc
[/code]

  

但是因为事务的存在，上述情况可能会跳过某些数据，比如一个eventid为10的事务和eventid为11的两个事务，我们很容易看出eventid=10的事务更先开启

  

但有一种情况是eventid=11的事务先提交，然后被系统处理，这时上述SQL语句中的?就被赋值为11。当eventid=10的事务进行提交就会被忽略

  

解决方式：在events表中添加一个额外的列，以跟踪时间是否已经发布，然后事件发布方可以采用以下过程

  

● 通过执行select语句查找未发布的事件 select * from events where published = 0 order by event_id asc

  

● 将事件发布到消息代理

  

● 将事件标记为已发布 update events set published = 1 where event_id in

  

## 事件溯源的优点

  

**可靠地发布领域事件**

  

事件溯源的一个好处是，只要聚合状态发生变化，它就可以可靠地发布事件。为事件驱动的微服务架构提供了一个可靠的基础。此外，因为每个时间都可以存储进行更改操作的用户身份，因此提供了准确的审计日志。可以用于各种目的，包括通知用户、集成到程序中、分析和监控等等

  

**保留聚合的历史**

  

存储了每个聚合的完整历史记录，可以轻松实现检索聚合过去状态的查询，想要确定给定时间点的聚合状态，只需重放直到该时间点位置发生的所有事件

  

**提供一个时光机**

  

事件溯源存储了应用程序生命周期中发生的所有事件的历史记录，基于事件溯源的应用程序可以立即回溯到开发者想回溯的状态

  

例如：想要对将商品添加到购物车后又将其删除的客户进行一些新的促销行为，传统应用程序不会保留此信息，而事件溯源可以立即回溯到添加状态进行促销

  

## 事件溯源的弊端

  

**有一定的学习曲线**

  

这是一个完全不同的、陌生的编程模型，有一定的学习曲线，而且对于已经存在的系统需要重写业务逻辑

  

**基于消息传递的复杂性**

  

对于事件溯源来说，消息队列至少要确保一次成功投递，这意味着非幂等的时间处理程序必须检测并丢弃重复时间，这个可以通过事件溯源框架的单调递增ID来解决

  

**删除数据存在难度**

  

事件溯源的目标之一是保留聚合的历史，它的目的就是永久地存储数据。使用事件溯源删除数据的传统方法是进行软删除，应用程序通过设置已删除表示来删除聚合

## 推荐阅读

[当说到云原生时，我们究竟在谈论什么？ - 掘金](<https://juejin.cn/post/7342391308614877196>)

[不太熟悉Git？ 不妨看看这篇文章 - 掘金](<https://juejin.cn/post/7343139078487310390>)

[一文搞定常见分布式事务实现 - 掘金](<https://juejin.cn/post/7341007339215929356>)

[你真的理解分布式理论吗？ - 掘金](<https://juejin.cn/post/7322356470254370835>)

[深入了解异地多活 - 掘金](<https://juejin.cn/post/7299666003364855858>)

[02.K8S架构详解 - 掘金](<https://juejin.cn/post/7292323577210404915>)

[01.你为什么需要学习K8S - 掘金](<https://juejin.cn/post/7291513540025434169>)

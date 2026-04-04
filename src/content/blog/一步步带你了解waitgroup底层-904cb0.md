---
title: "一步步带你了解waitgroup底层"
description: "回顾一下Go的并发控制，其实大概有以下几种控制手段"
date: 2023-06-03
tags: ["Go", "并发"]
---
# 一步步带你了解waitgroup底层

## 前言

回顾一下Go的并发控制，其实大概有以下几种控制手段

  * 全局变量（不优雅）
  * waitgroup，很简单的并发控制手段，只有三个方法，容易使用
  * channel，有三种panic的情况，且操作比较复杂
  * context，官方推荐，在带层级的goroutine中有奇效，比如goroutine嵌套着goroutine；而且能够在不同的goroutine之间进行值传递，方便

本文会介绍一步步介绍`WaitGroup`底层实现。

## WaitGroup示例

`sync.WaitGroup()`的出现就是解决go中并发时，多个`goroutine`同步的问题  
大致用法如下

  1. 主goroutine通过wg.Add(i)让设置需要启动的goroutine数量
  2. 子goroutine之间通过wg.Done()来表示子goroutine执行完毕，本质上就是调用了Add(-1)
  3. 主goroutine之间通过Wait()来等待所有的子goroutine执行完毕

  

[code]
    func main() {
    	var wg sync.WaitGroup 
    	wg.Add(2)
      go func() {
        defer wg.Done()
      	fmt.Println("here1")  
    	}()
    	go func() {
      	defer wg.Done() 
      	fmt.Println("here2") 
    	}()  
    	wg.Wait() 
    	fmt.Println("finish")  
    }
    
    //输出
    // here2
    // here1 
    // finish
    因为这里用了defer 所以答案是确定的 先进后出 必先打印here2
[/code]

  

## 底层

下面是Go1.20版本对于`WaitGroup`的定义
[code]
    //https://github.com/golang/go/blob/go1.17.10/src/sync/waitgroup.go
    // A WaitGroup waits for a collection of goroutines to finish.
    // The main goroutine calls Add to set the number of
    // goroutines to wait for. Then each of the goroutines
    // runs and calls Done when finished. At the same time,
    // Wait can be used to block until all goroutines have finished.
    //
    // A WaitGroup must not be copied after first use.
    type WaitGroup struct {
    	noCopy noCopy
    
    	// 64-bit value: high 32 bits are counter, low 32 bits are waiter count.
    	// 64-bit atomic operations require 64-bit alignment, but 32-bit
    	// compilers do not ensure it. So we allocate 12 bytes and then use
    	// the aligned 8 bytes in them as state, and the other 4 as storage
    	// for the sema.
    	state1 [3]uint32
    }
[/code]

  

### 第一个字段:noCopy

Go中检测禁止复制的技术，如果有复制行为，那么就认为违规，在编译阶段禁止赋值和复制wg实例，因为wg中有一个计数器，多个goroutine会并发的修改该计数器。在使用wg的时候，建议按照官方文档的要求，使用指针传递wg实例，同时如果wg作为结构体的成员，也需要显式地定义一个nocopy字段，以避免在结构体复制时导致竞态问题

  

### 第二个字段：state1数组

这是一个长度为3的数组，包含了wg使用到的三种数据：`counter、waiter、semaphore`  
三个元素的具体作用如下

  * counter：计数器，用来计算要执行的协程g的数量，表示当前要执行的goroutine个数，wg.Add(i)时，counter+=i，wg.Done()时，count-=1
  * waiter：计数器，表示已经调用Wait()函数的goroutine-group个数，也就是需要结束的goroutine组数，当wg.Wait()的时候，waiter+=1，并且挂起当前的goroutine
  * semaphore：go runtime内部的信号量实现，会用到以下两个函数

1.runtime_Semacquire 增加一个信号量，并且挂起当前goroutine  
2.runtime_Semrelease 减少一个信号量，并唤醒semaphore上其中一个正在等待的字段

  

### Add

  

[code]
    // https://github.com/golang/go/blob/go1.17.10/src/sync/waitgroup.go#L53
    func (wg *WaitGroup) Add(delta int) {
        statep, semap := wg.state() // 获取state(counter+waiter)和semaphore信号量的指针
        
    	... ...
        // uint64(delta)<<32 把 delta 左移32位，因为counter在statep的高32位
        // 然后把delta原子的增加到counter中
    	state := atomic.AddUint64(statep, uint64(delta)<<32)
        // v => counter, w => waiter
    	v := int32(state >> 32)//获取counter值
    	w := uint32(state)     //获取waiter值
        
    	... ...
        //counter变为负值了，panic报错
    	if v < 0 {
    		panic("sync: negative WaitGroup counter")
    	}
        //waiter不等于0，说明已经执行了waiter，这时你又调用Add()，是不允许的
    	if w != 0 && delta > 0 && v == int32(delta) {
    		panic("sync: WaitGroup misuse: Add called concurrently with Wait")
    	}
        //v->counter，counter>0，说明还有goroutine没执行完，不需要释放信号量，直接返回
        //w->waiter, waiter=0，没有等待的goroutine，不需要释放信号量，直接返回
    	if v > 0 || w == 0 {
    		return
    	}
        
        // This goroutine has set counter to 0 when waiters > 0.
    	// Now there can't be concurrent mutations of state:
    	// - Adds must not happen concurrently with Wait,
    	// - Wait does not increment waiters if it sees counter == 0.
    	// Still do a cheap sanity check to detect WaitGroup misuse.
        // Add()和Wait()不能并行操作
        // counter==0，也不能执行Wait()操作
    	if *statep != state {
    		panic("sync: WaitGroup misuse: Add called concurrently with Wait")
    	}
    	
    	*statep = 0 // 结束了将counter清零，下面在释放waiter数的信号量
    	for ; w != 0; w-- {// 循环释放waiter个数的信号量
    		runtime_Semrelease(semap, false, 0)// 一次释放一个信号量，唤醒一个等待者
    	}
    }
[/code]

  

能看出来Add主要干了两件事  
1.将delta值累加到counter计数器中  
2.当counter=0的时候，waiter释放相应的信号量，把等待的goroutine全部唤醒，如果<0，则panic

  

### Done

  

[code]
    // https://github.com/golang/go/blob/go1.17.10/src/sync/waitgroup.go#L97
    // Done decrements the WaitGroup counter by one.
    func (wg *WaitGroup) Done() {
    	wg.Add(-1)
    }
[/code]

  

直接调用wg.Add(-1)，让counter的值减一

  

### Wait

  

[code]
    // https://github.com/golang/go/blob/go1.17.10/src/sync/waitgroup.go#L103
    func (wg *WaitGroup) Wait() {
        statep, semap := wg.state() //获取state(counter+waiter)和semaphore信号量的指针
    	... ...
    	for {// 死循环
    		state := atomic.LoadUint64(statep) //原子的获取state值
    		v := int32(state >> 32) // 获取counter值
    		w := uint32(state)      //获取waiter值
            if v == 0 {// counter=0，不需要wait直接返回
    			// Counter is 0, no need to wait.
    			if race.Enabled {
    				race.Enable()
    				race.Acquire(unsafe.Pointer(wg))
    			}
    			return
    		}
    		... ...
    		// Increment waiters count.
    		if atomic.CompareAndSwapUint64(statep, state, state+1) {// 使用CAS累加wiater
    			... ...
    			runtime_Semacquire(semap) //增加信号量，等待信号量唤醒
                // 这时 *statep 还不等于 0，那么使用过程肯定有误，直接 panic
    			if *statep != 0 {
    				panic("sync: WaitGroup is reused before previous Wait has returned")
    			}
    			... ...
    			return
    		}
    	}
    }
[/code]

  

累加waiter计数器的值，增加信号量，等待唤醒

### 注意事项

  1. Add()操作必须早于Wait()操作
  2. Done()的次数必须和Add的值相等
  3. 不能让counter的值<0，也就是Done不能大于Add(i)
  4. Add和Wait不能并行调用，必须一个在子协程一个在主携程
  5. 如果想重复调用wg，必须得等待Wait()执行完后才能进行下一轮调用

## 结语

相信这篇文章能够让大家大致了解`waitgroup`的底层原理，创作不易，如果有收获欢迎**点赞、评论、收藏** ，您的支持就是我最大的动力。

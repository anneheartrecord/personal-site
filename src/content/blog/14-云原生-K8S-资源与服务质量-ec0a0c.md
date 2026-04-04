---
title: "14.【云原生-K8S】：资源与服务质量"
description: "我们可以精确到容器级别为其设置资源数量，资源`resource`由两部分组成，分别是请求`requests`和限制`limits`。**当我们设置**`**limits**`**时，**`**kubelet**`**和容器运行时以及底层的**`**cgroup**`**会保证容器使用的资源不超过设置"
date: 2023-10-28
tags: ["K8S", "容器", "云原生"]
---
# 14.【云原生-K8S】：资源与服务质量

## 资源

### 设置Pod/容器资源

我们可以精确到容器级别为其设置资源数量，资源`resource`由两部分组成，分别是请求`requests`和限制`limits`。**当我们设置**`**limits**`**时，**`**kubelet**`**和容器运行时以及底层的**`**cgroup**`**会保证容器使用的资源不超过设置的值；当我们设置**`**requests**`**时，调度器会根据这个值进行pod的调度，并且节点会预留对应大小的资源，以供容器运行时使用，避免出现资源不足的情况。**

如果Pod所在的节点拥有足够的资源，那么容器可能并且可以使用超过`requests`设置的资源量，不过不能超过`limits`设置的资源量，这个限制可能是以主动的方式来实现，即通过`cgroups`来设置可使用的资源量；也可能是以被动的方式来实现，即发现超出设置量时进行系统级别的干预。常用的容器运行时如`docker\containerd\CRI-O`都是通过`cgroups`也就是主动的方式来实现的资源限制。

新版本k8s的默认容器运行时是`containerd`，这里`minikube`的默认运行时依旧是新版本的`docker`

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1719912570896-b4fbbe28-2659-404c-a626-afe263bacbb7.png)

`kubectl describe node minikube`，能看到`allocated resources`的具体情况，这是k8s集群认为该节点可分配的资源，当某Pod的资源超出对应的`allocated resources`，则无法调度到这个节点上。

⚠️ 如果只设置了Limits但是没有设置Requests，那么k8s将默认把Limits的值复制一份给Requests。

当`Kubelet`将容器作为Pod的一部分启动时，它会将容器的CPU和内存请求与限制信息传递给容器运行时，在Linux系统上，容器运行时会配置内核`CGroups`，负责处理容器的请求和限制

  * `CPU Limit`是容器可使用的CPU时间的硬性上限，在每个操作系统时间片中，Linux内核会检查是否超出这个限制
  * `CPU Request`是一个权重值，如果若干不同的容器需要在一个共享的系统上竞争运行，CPU请求值大的负载会获得比请求值小的负载更多的CPU时间
  * `Memory Request`值主要用于K8S Pod的调度期间，容器运行时可能用内存请求值作为设置`memory.min和memory.low`的提示值
  * `Memory Limit`定义的是cgroup的内存限制，当容器尝试分配的内存量超出限制，则会停止分配容器中的某个进程内存
  * Pod和容器的内存限制也适用于通过内存供应的卷，比如`emptyDir`卷，`kubelet`会跟踪内存的卷用量，将其作为容器的内存用量，而不是临时存储用量

### 资源类型

K8S可为容器/Pod设置的资源类型分为三种，分别是`CPU Memory 和 HugePages`，对应Linux系统，我们可以设置`HugePage`值，这是Linux特有的功能，节点内核在其中分配的内存款会比默认页大小大得多。

这些资源都统称计算资源，计算资源的数量是可以测量的，并且可以被请求、分配、消耗，它们与API资源不同，API资源是可以通过K8S API服务器读取和修改的资源。

针对每个容器，你都可以指定它的资源请求和限制，包括以下选项

  * `spec.containers[].resources.limits.cpu`
  * `spec.containers[].resources.limits.memory`
  * `spec.containers[].resources.limits.hugepages-<size>`
  * `spec.containers[].resources.requests.cpu`
  * `spec.containers[].resources.requests.memory`
  * `spec.containers[].resources.requests.hugepages-<size>`

**一个Pod的资源请求/限制是这个Pod中所有容器对这类资源的请求/限制的总和。**

CPU资源的单位是核数，1CPU=一个物理CPU核心或者一个虚拟CPU核心，支持小数，比如`0.5 = 500m`

memory资源的单位是自结束，对应的后缀是`E、P、T、G、M、k`，注意区分`m和M`，`M代表MB，m代表的是毫字节 1M = 1024*1024字节 1m = 0.001字节`

### 节点可用资源

节点资源分为两部分，一部分是已经分配给节点上某些k8s组件的资源，这是不可改变也不可取消的；另一部分则是可分配的资源，在调度pod到节点上时比较的就是这部分资源，如果`allocatable`资源不足，即`allocatable` < `pod request`，那么就不会分配到该节点上；已经在该节点上运行的`pod`消耗的也是这部分资源。

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1719916082907-482ee774-58a2-4c9e-8f2a-2b24cd51e69e.png)

可以看到节点的`allocated resources`也是分为四种，我们用的最多的还是计算资源`cpu/memory`

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1719913156928-41582610-3420-4683-9b98-c0ff4e610042.png)

## 服务质量 QOS

服务质量QOS是一种对于Pod的评分分类机制，K8S会对运行中的Pod进行分类，不同QOS的Pod被处理的逻辑方式会不一样。

QOS的分类是基于Pod资源的，`resource`下的`limit`和`request`都会影响到这个QOS，当节点压力比较大时（资源不足），kubelet会主动终止某些Pod以回收节点上的资源，当节点资源耗尽时，首先会驱逐该Node上运行的`BestEffort`等级的Pod，然后是`Burstable`等级的Pod，最后是`Guaranteed`Pod。当这种驱逐是由于资源压力时，只有超出资源请求的Pod才是被驱逐的候选对象。

### Guaranteed

这个级别的Pod具有最严格的资源限制，并且最不可能面临驱逐，只有在Pod使用超过了本身`limit`资源，或者节点上没有更低优先级的Pod，这些Pod才有可能被驱逐。

**条件**

  * Pod中的每个容器都需要有`cpu + memory`的`request`和`limit`
  * Pod中的每个容器资源的值都需要`limit = request`，包括`cpu和memory`

### Burstable

这个级别的Pod有基于`Request`的资源下限保证，但不需要特定的`limit`。如果没有指定`limit`，那么默认为Node总量的资源，在驱逐Pod时，优先会驱逐`BestEffort`的Pod，然后才驱逐`Burstable`类型的Pod

**条件**

  * 不满足`Guaranteed`条件
  * Pod内至少有一个容器具有`CPU的Request和limit`

### BestEffort

`BestEffort`类的Pod可以使用节点中剩下的资源，比如一个16核的节点，已经分配了8核给其他的Pod，那么这个Pod就只能使用剩下的8核，如果遇到资源压力，首先会驱逐这一类的Pod。

**条件**

  * 不满足`Guaranteed`条件
  * 不满足`Burstable`条件

### 独立于QOS 

某些行为独立于 Kubernetes 分配的 QoS 类。例如：

  * 所有超过资源 limit 的容器都将被 kubelet 杀死并重启，而不会影响该 Pod 中的其他容器。
  * 如果一个容器超出了自身的资源 request，且该容器运行的节点面临资源压力，则该容器所在的 Pod 就会成为被驱逐的候选对象。 如果出现这种情况，Pod 中的所有容器都将被终止。Kubernetes 通常会在不同的节点上创建一个替代的 Pod。
  * Pod 的资源 request 等于其成员容器的资源 request 之和，Pod 的资源 limit 等于其成员容器的资源 limit 之和。
  * kube-scheduler 在选择要抢占的 Pod 时不考虑 QoS 类。当集群没有足够的资源来运行你所定义的所有 Pod 时，就会发生抢占。

### 实战

这个Pod因为没有设置`request和limit`，所以`QOS=BestEffort`
[code]
    apiVersion: v1
    kind: Pod
    metadata:
      name: test-taint-pod-8
    spec:
      nodeName: minikube
      containers:
      - name: container-a
        image: alpine:latest
        command: ["sh", "-c", "while true; do echo hello; sleep 10; done"]
      tolerations:
        - key: "test"
          operator: "Equal"
          value: "true"
          effect: "NoSchedule"
        - key: "test2"
          operator: "Exists"
          effect: "NoExecute"
    ~	
[/code]

![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1720500175572-b64f6806-5e15-4de5-8e6d-f06fcbcf0011.png)这个Pod设置了`Request和Limit`，但是二者不相等，所以`QOS=Burstable`  
![](https://cdn.nlark.com/yuque/0/2024/png/26372139/1720501200543-028c8e43-3281-4baa-905b-554392899dfa.png)

## 结语

这篇博客主要介绍了**临时容器和Pod调试** 相关操作。《每天十分钟，轻松入门K8S》的第14篇**14.【云原生-K8S】：资源与服务质量** 到这里就结束了，之后的几讲都会和`Pod`相关，深入源码级别探索K8S核心概念`Pod`相关内容，感兴趣的朋友欢迎**点赞、评论、收藏、订阅，您的支持就是我最大的动力。**

##  推荐阅读

[**08.源码级别Pod详解（四）： Pod readiness与Container Probe**](<https://juejin.cn/post/7307542269674651682>)

[**06.源码级别Pod详解（三）：Container 生命周期**](<https://juejin.cn/post/7296303730772656162>)

[**05.源码级别Pod详解（二）：Pod生命周期**](<https://juejin.cn/post/7295565904406511657>)

[**02.K8S架构详解**](<https://juejin.cn/post/7292323577210404915>)

---
title: "Prometheus存储拓展"
description: "`Prometheus`可以监控各种不同类型的应用、服务和基础设施。但是它自身也存在着一些瓶颈和问题，比如默认存储方案是使用内置的时序数据库`TSDB`进行数据存储，这在数据量、采集量偏大的时候往往是性能不够的。"
date: 2022-09-10
tags: ["K8S", "容器", "监控"]
---
# Prometheus存储拓展

## 前言

`Prometheus`可以监控各种不同类型的应用、服务和基础设施。但是它自身也存在着一些瓶颈和问题，比如默认存储方案是使用内置的时序数据库`TSDB`进行数据存储，这在数据量、采集量偏大的时候往往是性能不够的。

  

## Prometheus监控实现

### 数据类型

  

  * 应用程序指标：程序的各种指标，比如请求处理时间、请求速率、错误率等。这些指标通常由程序本身的客户端暴露出来 
  * 系统指标：操作系统和服务器硬件的指标，如CPU使用率、内存使用率、磁盘空间等等。这些指标通常是通过操作系统级别的采集工具，比如Node Exporter暴露出来 
  * 容器指标：可以监控容器的资源使用情况、运行状态等，这些可以通过容器编排工具如K8S实现 
  * 数据库（中间件）指标：可以监控各种数据库的性能，如查询延迟、连接数、事务数等。大多数流行的数据库都支持导出自身指标，比如MySQL\PostgreSQL等等 
  * 网络服务指标：监控网络服务的可用性和性能，比如HTTP请求的响应时间、状态码、连接数等等。这可以通过服务自身的指标暴露或通过中间件导出 

  

### 组件

  * Prometheus Server：负责从各种数据源收集指标数据，并存储在本地的时序数据库中 
  * Client Libraries：为了方便应用程序暴露指标，Prometheus提供了多种编程语言的客户端库，如Go Java Python等等，这些库使得应用程序能够轻松的将自身的指标暴露出来 
  * Exporters：对于不同的数据源，Prometheus提供了许多指标导出器（Exporter），比如Node Exporter用于收集主机指标，Blackbox Exporter用于对无进行测探 

  

### 采集过程

  1. Instumentation：仪表盘，在程序中需要使用Prometheus的客户端，进行指标的主动采集 
  2. Exporting and Scraping：Server主动的定期从指定的数据源拉取指标数据，一般是30S一次，通过HTTP端点进行拉取 
  3. Storage：Server将采集到的时间序列数据存储在本地的时间序列数据库中 
  4. Queries and Alerting：通过PromQL对数据进行查询、分析和可视化操作 

  

## Prometheus的瓶颈

  

prometheus使用自己的本地存储引擎来存储时间序列数据，这个存储引擎可能会在大量写入数据的时候遇到性能问题，尤其是当需要保留长时间的历史数据时，prometheus的原生数据库TSDB是扛不住这个压力的。

  

prometheus的单机容量大概能支撑住每秒接受80万个数据点，当单机开始撑不住的时候可以考虑升级硬件或者使用分布式块存储。

  

但是其实不是所有场景都需要去拓展Prometheus的容量，因为数据量根本达不到单机的Prometheus的容量上限，假设每台机器每个周期大概采集100个指标，采集频率是10S/次，那么极限情况下，可以同时监控的机器数量是20W台，当然这里没有考虑到采集中间件的指标，实际上，很多中间件抛出指标是很多的。

  

## 解决方案

  

### 联邦集群

  

如果一个Prometheus实在扛不住，那么还可以考虑多Prometheus集群，也就是联邦集群方案

  

联邦集群可以看做是Prometheus内置的一种集群方式，核心就是Prometheus数据的级联抓取，它能够使得不同的Prometheus数据聚拢在一个中心的Prometheus中

  

![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1691723405336-a1850672-f95c-4272-9f11-6794601192b1.png)  
原本一个Prometheus解决不了的问题，拆成了多个，然后又把多个Prometheus的数据聚拢到中心的Prometheus中。但是，中心的Prometheus仍然是个瓶颈。所以，在联邦机制中，中心端的Prometheus去抓取边缘Prometheus数据的时候，不应该把所有数据都抓取到中心，而是应该只抓取那些需要做聚合计算或者需要关注的指标，大部分数据应该下沉在各个边缘Prometheus中消化掉

  

如何做到只抓取特定的指标到中心端呢？通过match[]参数，指定过滤条件就可以实现

  

[code]
    scrape_configs:
      - job_name: 'federate'
        scrape_interval: 30s
        honor_labels: true
        metrics_path: '/federate'
        params:
          'match[]':
            - '{__name__=~"aggr:.*"}'
        static_configs:
          - targets:
            - '10.1.2.3:9090'
            - '10.1.2.4:9090'
[/code]

  

联邦这种机制，可以落地的核心要求是：边缘Prometheus基本消化了绝大部分的指标数据，比如告警、看图等等，都在边缘的Prometheus上搞定了。只有少量数据，比如需要关注的指标被拉取到中心Prometheus，这样就不会触达中心端的容量上限。这就需要对Prometheus的数据聚合建立规范，什么样的数据应该在边缘端被消化，什么样的数据应该被传达到中心端

  

### 远程存储

  

默认情况下，Prometheus收集到监控数据之后是存储在本地，在本地查询、计算。由于单机容量有限，对于海量数据的场景，需要有其他的解决方案。最直接的想法就是：既然本地搞不定，那就在远端做一个集群，分治处理

  

Prometheus本身不提供集群存储能力，而是建立了一套同一的Remote Read和Remote Write接口协议，只要满足这个协议的时序库都可以对接进来，作为Prometheus remote storage使用，目前使用最广泛的应该是VM（VictoriaMetrics）和（Thanos）

## 推荐阅读

[当说到云原生时，我们究竟在谈论什么？ - 掘金](<https://juejin.cn/post/7342391308614877196>)

[不太熟悉Git？ 不妨看看这篇文章 - 掘金](<https://juejin.cn/post/7343139078487310390>)

[一文搞定常见分布式事务实现 - 掘金](<https://juejin.cn/post/7341007339215929356>)

[你真的理解分布式理论吗？ - 掘金](<https://juejin.cn/post/7322356470254370835>)

[深入了解异地多活 - 掘金](<https://juejin.cn/post/7299666003364855858>)

[02.K8S架构详解 - 掘金](<https://juejin.cn/post/7292323577210404915>)

[01.你为什么需要学习K8S - 掘金](<https://juejin.cn/post/7291513540025434169>)

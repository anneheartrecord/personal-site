---
title: "limit与分页键"
description: "查询数据库偏移量的数据，或者查询分页的数据是很常见的需求，本文会介绍一些常用的查询方法。"
date: 2023-04-26
tags: ["数据库"]
---
# limit与分页键

## 前言

查询数据库偏移量的数据，或者查询分页的数据是很常见的需求，本文会介绍一些常用的查询方法。

## limit与分页

在SQL中，limit用于限制返回的结果行数。LIMIT语句可以用于SELECT查询，用于**限制查询结果集的行数** ，从而在处理大型数据集时，减少数据库的负载，提高查询的性能

  

基本语法如下
[code]
    SELECT * FROM table_name LIMIT [offset],row_count;
    //table_name是表名
    //offset是可选的偏移量，用于指定要从结构集的哪个位置开始返回行
    如果省略该参数，默认从第一行开始返回
    //row_count一共返回的行数，也就是查询得到的数量
    
    比如
    select * from students limit 5,10;
    
    或者
    select * from students limit 10 offset 5;
[/code]

  

limit在实际应用中常用于分页查询

举个例子：

现在我有一个article表，想要做到文章分页展示的功能，每一页展示10篇文章
[code]
    //表结构如下
    
    CREATE TABLE article (
    id int(11) not null auto_increment,
    title varchar(255) not null,
    content text,
    publish_time datetime not null,
    primary key (id)
    );
    
    /这个时候调用方传来一个n，通常是Logic层往dao层传 伪代码如下
    select * from article order by
    publish_time desc limit ?,10 values (n*10);
    
    //这条SQL就能做到文章分页的功能，按照时间来分页
    //具体实践中可能没有这么简单，通常是热度、时间等等
[/code]

  

## 深分页

  

查询结果集中的某个位置之后的记录，即查询结果集的偏移量很大的情况。这样需要扫描的数据量就很大，可能导致查询的性能变得很低下

  

如何避免深分页的问题

    * 使用更小的偏移量：比如将偏移量从10000降低到100
    * 使用分页键
    * 缓存结果集，在内存层面进行返回
    * 分库分表，减少每个表的数据量大小

  

## 分页键

  

分页键(pagination key)是一种用于分页查询的技术，它可以帮助我们在大数据集合中快速定位到需要查询的数据段，也叫做**游标（Cursor）** 。分页键通常是一个**唯一的标识符** ，可以表示查询结果集中的某一行。在使用分页键的时候，通过查询分页键来定位结果集的起始位置，从而避免了偏移量很大的情况，也就是避免了SQL深分页的情况。

  

举个例子，假设我们需要查询一个包含一百万行数据的用户表，并且我们需要查询第500001到第500100行的数据。如果用偏移量的方式进行查询，需要查询前5000000行数据才能获得我们需要的结果，这将导致查询性能非常低下。而使用分页键的方式，可以在查询时直接指定分页键的值，从而定位到结果集的起始位置，避免了大量的数据扫描。

  

使用分页键的时候，我们需要选择一个合适的字段作为分页键，并确保该字段具有唯一性。**通常情况下，自增长主键或者时间戳字段都是比较好的选择，分页键适用于有序数据集的分页查询**

  

下面有一个具体的栗子

假设我们有一个包含大量文章的表，每篇文章都有一个唯一编号id和发布时间publish_time两个字段。我们需要查询发布时间在2022年1月1日到2022年3月31日之间的文章，并按照发布时间进行排序，每页显示十篇文章，显示第六页的数据

  

[code]
    1.选择分页键：根据查询条件，我们选择publish_time作为分页键
    
    2.查询第五页的最后一篇文章的发布时间
    我们得确定第五页最后一篇文章的发布时间
    select publish from articles 
    where publish_time>='2022-01-01 00:00:00'
    and publish_time<='2022-03-31 23:59:59'
    order by pulish_time asc 
    limit 1 offset 50;
    
    3.使用分页键查询数据
    select * FROM articels 
    where publish_time>='分页键的值'
    and publish_time<='2022-03-31 23:59:59'
    order by publish_time asc 
    limit 10;
[/code]

## 推荐阅读

[当说到云原生时，我们究竟在谈论什么？ - 掘金](<https://juejin.cn/post/7342391308614877196>)

[不太熟悉Git？ 不妨看看这篇文章 - 掘金](<https://juejin.cn/post/7343139078487310390>)

[一文搞定常见分布式事务实现 - 掘金](<https://juejin.cn/post/7341007339215929356>)

[你真的理解分布式理论吗？ - 掘金](<https://juejin.cn/post/7322356470254370835>)

[深入了解异地多活 - 掘金](<https://juejin.cn/post/7299666003364855858>)

[02.K8S架构详解 - 掘金](<https://juejin.cn/post/7292323577210404915>)

[01.你为什么需要学习K8S - 掘金](<https://juejin.cn/post/7291513540025434169>)

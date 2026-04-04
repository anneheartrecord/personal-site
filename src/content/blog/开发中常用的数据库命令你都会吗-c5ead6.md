---
title: "开发中常用的数据库命令，你都会吗"
description: "**查看一张表的数据量**"
date: 2024-05-04
tags: ["数据库"]
---
# 开发中常用的数据库命令，你都会吗

## mysql篇

  

**查看一张表的数据量**

  

下面这条命令中，'\G'能够让查询结果更加优雅美观的显示，所以一般都推荐使用'\G'结尾进行查询。

  

[code]
    show table status like 'tablename' \G
    *************************** 1. row ***************************
               Name: tablename
             Engine: InnoDB
            Version: 10
         Row_format: Dynamic
               Rows: 1738126 //表中的行数
     Avg_row_length: 83264	//一行记录的平均长度 
        Data_length: 144724508672 //数据存储量（字节）
    Max_data_length: 0
       Index_length: 1303265280 //索引存储量（字节）
          Data_free: 4194304 //未使用的存储大小，比如碎片之类、删除但未释放的数据
     Auto_increment: 2446319 //自增字段的下一个自增值
        Create_time: 2023-09-05 xx:xx:xx
        Update_time: 2024-03-27 xx:xx:xx
         Check_time: NULL
          Collation: utf8_general_ci
           Checksum: NULL
     Create_options: 
            Comment: 
    1 row in set (0.01 sec)
[/code]

  

平常背数据库八股，总有一题是什么时候用索引比较好，什么时候不用索引比较好，上述查询就给出了索引的一个缺点，即：**索引也是需要存储开销的，且这个开销值并不低** 。

  

这个表只有三个字段添加了索引，其中有一个是`unique`索引，可以看到，索引的存储开销是数据的10-2级别，但是在数据量大的时候，开销也能达到数十GB甚至更高。

* * *

**模糊查询表名**

  

[code]
    show tables like '%tablename%'
[/code]

  

在连接到某个数据库时，如果数据库中表很多，通常我们会通过关键字来查询我们所需要的表名，比如事件相关，`show tables like '%event%'`，'%'是正则里的通配符，可以匹配`0-N`个字母或数字。

  

**数据库快速连接**

  

[code]
    mysql -u username -p -h host -P port -A db_name
    
    // -u 指定用户
    // -p 通过密码交互
    // -h 指定host
    // -P 指定port
    // -A 启动自动提交模式，每个语句和操作都会自动提交到数据库
[/code]

  

上述命令一般是我们用来快速连接数据库的命令，只要输入一次密码进行确认就可以连接到对应的DB上。

  

当然如果是通过开发机进行远程开发，而又想要通过本机的一些工具进行数据库连接，比如`IDE`或者`Navicat`这种数据库管理工具的话，那么就需要手动进行打洞（因为一般本机、开发机、服务器的网络环境是隔离开的，开发机可以直连服务器，本机可以直连开发机）。这个操作比较红线，不过也是程序员们心照不宣的操作了，有需要的可以具体了解一下，加快开发效率。

  

**去除某个主键**

  

如果可以，则去除全部主键

  

[code]
    ALTER TABLE tablename DROP PRIMARY KEY;
[/code]

  

但是在高版本的MySQL中，会自动对表进行check，上述命令会移除所有的主键，而表必须有一个唯一标识（主键），所以上述命令会失败。

  

这时候我们可以通过`ALTET TABLE tablename ADD UNIQUE (column_name)`来对某个列添加唯一索引，从而为表添加一个唯一标识，然后再`ALTER TABLE tablename DROP PRIMARY KEY`下掉主键。

  

不行，则删表重建，记得备份数据。

  

**AUTO_INCREMENT的列，一定是主键吗？**

  

在`MySQL`中，`AUTO_INCREMENT`的列并不一定要是主键，但是它必须被定义为索引。这是因为`AUTO_INCREMENT`本质上就是一个鉴于表级别和行级别之间的索引，也可以看成是一个计数器，只要插入了一条新的记录，一定会对这个索引进行修改。

  

通常情况下，AUTO_INCREMENT的列会被设置为主键，因为主键需要是唯一的，而AUTO_INCREMENT可以保证这一点。但是，

  

但是如果业务中需要用别的字段作为主键，比如`user_id`之类的字段，你可以将`AUTO_INCREMENT`的列设置为非主键的索引。一个表只能有一个`AUTO_INCREMENT`的列，而且这个列的数据类型必须是整数类型。同时，这个字段必须显式的指定`unique`属性。

  

## pg篇

  

pg的命令也需要`;`作为结束符号。

  

**描述表的结构**

  

` /d table_name`

  

**模糊查询表名**

  

` select table_name from information_schema.tables where table_name like '%podname%'`

  

**返回大量数据**

  

显示--more--

  

空格往下翻一页，返回往下翻一行，也可以通过vim的方式进行搜索，比如`/xxx`和`?xxx`

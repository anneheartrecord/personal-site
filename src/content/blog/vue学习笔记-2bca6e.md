---
title: "vue学习笔记"
description: "在你给出的代码中，`:key=\"item.id\"`是为Vue的列表渲染指令`v-for`提供一个唯一的键（key）。这个键用于追踪每个节点的身份，从而进行高效的列表更新。"
date: 2023-04-28
tags: ["前端"]
---
# vue学习笔记

## 指令

1.v-for
[code]
    在你给出的代码中，`:key="item.id"`是为Vue的列表渲染指令`v-for`提供一个唯一的键（key）。这个键用于追踪每个节点的身份，从而进行高效的列表更新。
    
    然而，你的`labels`数组只包含字符串，没有`id`属性。在这种情况下，`item.id`实际上是`undefined`。尽管如此，Vue仍然可以运行，因为Vue不强制要求`key`必须有值。如果`key`是`undefined`，Vue将会在内部为每个元素生成一个默认的键。
    
    但是，这并不是最佳实践。在使用`v-for`时，最好总是提供一个唯一的键。如果你的`labels`数组中的元素都是唯一的，你可以直接使用`item`作为键，如下所示：
    
    ```html
    <el-tab-pane :label="labelNameDict[item]" :name="item" v-for="item in labels" :key="item">
    ```
    
    这样，每个`el-tab-pane`元素都会有一个与其内容相对应的唯一键。
[/code]

2.v-if/v-show

v-show 不支持与template

3.slot、slot-scope和v-slot都是vue用于接收子组件的通过作用域插槽传递的数据

  * slot v2.0可以使用，最简单的插槽，父组件可以通过名字来决定哪些内容可以插入到插槽中
  * slot-scope v.2.5.0+可以使用，可以放在任何元素或组件上
  * v-slot: v.2.6.0可以使用，只能用在template标签上，推荐使用v-slot，但是要注意只能用在template标签上

slot:

## API

**$emit**

  * 用于子组件向父组件传递
  * 父组件需要`@toggle-favorite='receiveEmit'`的方式承接住
  * 建议用文档的方式写出`emits: ['toggle-favorite']`

props

  * 父组件向子组件传递
  * 父组件命名`food-name`，子组件显示声明`foodName`
  * 

## 原理

1.nexttime

2.local compoents

不在main.js显式的app.component，而是在父组件中调用子组件

---
layout: post
summary: 
title : 大中型网站技术架构浅析 - 实时通信
category : 架构
tags : [网站架构]
---

本文所讲述的『实时通信』主要围绕浏览器端和服务器端之间的实时通信。<a href="http://kenny7.com/2013/04/2013-3-10-technical-guide-for-website.md" >大中型网站技术架构浅析</a> 系列之一。

实时通信主要分3大类：

##1. Pull技术，轮询(Polling)

<img src="/images/polling.png" alt="轮询(Polling)">

客户端定时轮询请求，服务器端立刻返回。

- 优点：短链接，服务器处理方便，支持跨域。
- 缺点：有一定延迟

<pre><code>微博未读微博数和未读消息（评论，@）就是用polling实现的。</code></pre>

<pre><code>应用场景：对实时性要求不高的应用，如新微博提示，评论提示，回复提示等。</code></pre>

##2. Push，反向Ajax(Reverse Ajax)或者叫Comet.

实现方式主要有2种，长轮询(Long Polling)和 流推送(Comet Streaming)

###2.1 长轮询(Long Polling)

<img src="/images/long_polling.png" alt="Long Polling">

长轮询有2种实现方式：

2.1.1 <strong>XHR Long Polling</strong>

客户端发起一个XHR ajax request，服务器不马上返回，而是hold住这个connection，直到有数据要push给客户端时（或time out）才发送response；客户端收到response之后马上再发起一个新的request，周而复始。

- 优点：减少轮询，低延迟, 各大浏览器均支持
- 缺点：不可跨域，服务器需要hold 住大量connection.


2.1.2 <strong>Script Tag Long Polling</strong>
原理跟XHR Long Polling类似，只是结合long polling和jsonp，用来支持跨域（cross-domain）请求。

- 优点：减少轮询，低延迟，支持跨域，各大浏览器均支持
- 缺点：服务器需要hold 住大量connection.

<pre><code>微博私信提示就是用Script Tag Long Polling实现。</code></pre>

<pre><code>Long Polling的应用场景：对实时性要求较高和浏览器覆盖面广的应用，如私信等一些简单即时聊天应用。</code></pre>


###2.2 流推送(Comet Streaming)

<img src="/images/Comet_Streaming.png" alt="Comet Streaming">

Comet Streaming又有2实现方法.

2.2.1 <strong>Multi-part XMLHttpRequestg</strong>

浏览器必须支持的 multi-part 标志，通过XMLHttpRequest发出request，服务器hold住这个connection，然后可以通过HTTP1.1的chunked encoding机制不断push数据给浏览器直到timeout数据给浏览器直到timeout 或者manual close connection. 

- 优点：客户端一次连接，服务器数据可多次推送。
- 缺点：并非所有的浏览器都支持 multi-part 标志。

2.2.2 <strong>Hidden IFrame(Forever IFrames)</strong>

JS生成一个iframe, 发出request，服务器是hold住这个connection，然后可以通过HTTP1.1的chunked encoding机制不断push数据给浏览器直到timeout 或者manual close connection . 

- 优点：客户端一次连接，服务器数据可多次推送。几乎所有支持 iframe 的浏览器上都可用。
- 缺点：不可跨域，错误处理可控性不强。

<pre><code>流推送的应用场景：实时监控系统，即时聊天</code></pre>

##3. WebSocket

<img src="/images/websocket.png" alt="WebSocket">

###3.1 WebSocket

WebSocket是HTML5开始提供的一种浏览器与服务器间进行全双工通讯的网络技术。浏览器和服务器只需要要做一个握手的动作，然后，浏览器和服务器之间就形成了一条快速通道。两者之间就直接可以数据互相传送

- 优点： 长连接，双向、低延迟和易于处理错误。
- 缺点：HTML5的新规范，只有部分浏览器支持。服务器端（java）还没有WebSocket 相关规范，服务器厂家各自为政。

###3.2 FlashSocket
WebSocket的替代品, 客户端JavaScript与Flash交互调用：JS调用Flash Socket接口发送数据，Flash Socket与服务器端Socket服务器通信

- 优点： 支持所有带flash的浏览器

- 缺点： 需要安装flash插件，要求打开防火墙的 843 端口，以便 Flash 组件能够执行 HTTP 请求来检索包含域授权的策略文件。

<pre><code>WebSocket的应用场景：实时性要求高，双向通信，如页游，实时协作(eg:Google docs)</code></pre>


##4. 技术选型建议

对于实时性要求高和并发量大的应用，建议方案：
<pre><code>
桌面端 
WebSocket（高级浏览器）+ FlashSocket（IE6+）

移动端
WebSocket + 长轮询(对不支持Websocket的浏览器)

前端
<a href="http://socket.io" rel="nofollow">socket.io</a>

服务器端
<a href="http://code.google.com/p/socketio-netty/" rel="nofollow">socketio-netty</a>
</code></pre>

对于实时性要求高和并发量一般的应用，建议方案：

<pre><code>
桌面端 
流推送Hidden IFrame(支持主流浏览器)

移动端
长轮询

服务器端
支持servlet 3.0 的容器（jetty8+，tomcat7+）
</code></pre>

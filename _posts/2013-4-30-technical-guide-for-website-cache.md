---
layout: post
summary: <p>对于一个大中型网站来说，缓存有多重要，肯定不言而喻啦。</p>
title : 大中型网站架构技术浅析 - 缓存机制与使用
category : 创业
tags : [网站架构]
---

对于一个大中型网站来说，缓存有多重要，肯定不言而喻啦。本篇为<a href="http://kenny7.com/2013/04/2013-3-10-technical-guide-for-website.md" >大中型网站架构技术浅析</a> 系列之一。

##1. Cache 分类

###1.1 后端Cache

下文作详细介绍。

###1.2 数据库Cache
会在之后『数据库』篇中详细介绍。

###1.3 文件Cache

主流产品包括 vanish 或 nginx proxy cache 模块。不作重点讨论，简单给出我个人建议：

- 如果是文件量不大 选择nginx proxy cache即可，nginx proxy cache 更省资源。
- 如果你要文件量很大，图片为主的网站，那还是使用vanish，更为稳定一点。

###1.4 浏览器Cache

不作过多介绍，参考这<a href="http://www.cnblogs.com/skynet/archive/2012/11/28/2792503.html" rel="nofollow">文章</a> .

<br>
OK, 接下来主要介绍后端的缓存机制、使用场景、产品选择等。


##2. 缓存机制(Cache mechanism)

###2.1 缓存主动更新
修改数据（已缓存）时，同时立刻update/delete cache item 

	适合场景：实时性要求高，更新频率较低的 entity item, 如 product item， article item .

###2.2 缓存被动（过期后）更新
设置一定的过期时间，过期后删除cache，下次被访问时去DB获取最新数据同时set回cache
	适合场景：可以允许一定延迟，更新频率较高的 List item, 如：商品列表页 item .

但这方式会有个弊端，当cache失效那个点，刚好遇上高并发的话，就可能会发生<a href="http://kenny7.com/2012/10/cache-reload-mechanism.html">雪崩情况</a>

遇到这种情况可以采用<code>分布式锁</code>防止当失效那个点同时去DB获取数据，可以使用 zookeeper 分布式锁实现。但这时候用户还是需要等待个片刻（DB查询时间）。所以就有了下面2个改进机制。

###2.3 缓存主动reload
缓存永不失效或失效时间很长，独立一个服务，按业务需求定期查询最新数据并refresh cache.

详细可以看这：<a href="http://kenny7.com/2012/10/cache-reload-mechanism.html">CACHE RELOAD机制设计和实现</a>

	适合场景：并发量大，允许一定延迟。如：首页、频道页等热门访问页面

###2.4 缓存被动reload
Cache 设置永不失效或失效时间很长，返回cache命中的内容，同时起另外一个线程，异步判断是否过期，若过期，重新reload cache.
这种方式会有个不好处：如果这cache很久没命中，下一个用户获取的是严重 out of date内容。

	适合场景：并发量一般，访问速度要求快，允许一定延迟。如：个人主页，标签产品列表等。

##3. 缓存产品的选择

###3.1 LOCAL CACHE

Guava cache 不二之选，简单易用，性能好，不必重复造轮子了。

	LoadingCache<Key, Graph> graphs = CacheBuilder.newBuilder()
		   .maximumSize(1000)
		   .expireAfterWrite(10, TimeUnit.MINUTES)
		   .removalListener(MY_LISTENER)
		   .build(
			   new CacheLoader<Key, Graph>() {
				 public Graph load(Key key) throws AnyException {
				   return createExpensiveGraph(key);
				 }
			   });
			   
			   
###3.2 REMOTE CACHE / DISTRIBUTED CACHE

现在基本上在 memcached 和 redis 之间选择，这2个产品性能都很好，都比较稳定。

但我个人更偏向选用redis，有几个原因：

- redis 具有snapshot和aof 等持久化功能，在机房断电等宕机情况下，可以很快恢复。
- redis 提供更丰富的数据结构（list，set，hash等）
- redis 提供KEYS 进行枚举操作，可以通过前缀删除item（这很关键，想当年用memcache逐个受到删item，那个痛苦！！）
- redis 提供Master-Slave复制机制
- redis 一直在更新，产品活跃度高，关键作者antirez比较靠谱。
- redis 还提供Lua Script支持，跟nginx 一样可以方便定制一些小功能。

<pre><code>Except：如果要存较大的item的话（gt 10K)，还是选择memcached 吧。</code></pre>

redis的使用场景一览：
<a href="http://kenny7.com/2012/09/redis-usage-scenario.html">REDIS 在电商中的实际应用场景</a>


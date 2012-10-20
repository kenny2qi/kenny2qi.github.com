---
layout: post
summary-only: yes
title : Cache Reload机制设计和实现（防止cache失效引发雪崩）
category : cache
tags : [java, redis, cache, highAbility, 分布式架构]
---

半年前，Guang.com曾发生一次由于首页部分cache失效，导致网站故障。
##故障分析：
当时逛正在做推广，流量突然暴增，QPS达到500，当首页部分cache失效时，需要查询DB，
但由于这部分业务逻辑很复杂导致这SQL包含多表join、groupby、orderby等，执行需要1s，产生的大量临时表，in-memory都装不下，变成on-disk的临时表，但当时放临时表的disk分区容量只有20G，很快disk也爆了，结果显然网站打不开了。
**总结为几点：**
- SQL语句优化不足
- MYSQL <code class="default-size">tmp_table_size</code> 配置太小
- disk分区不合理/tmpdir路径配置不合理
- 部门间沟通不足，大型推广前没事先打招呼。

##临时解决措施：
由于当时持续大量用户访问，查询DB一直hand住，导致cache一直无法set回去，首页那cache一直处于miss状态，恶性循环，雪崩了。
当时我们立马采取以下措施：
- 调整MYSQL <code class="default-size">tmp_table_size</code>, 关于<code class="default-size">tmp_table_size</code> 请看下面详细描述。
- 修改MYSQL临时表保存路径（tmpdir）到较大分区 
- 简化业务逻辑，修改SQL，重新部署。

	NOTE:临时表使用内存(tmp_table_size)：当我们进行一些特殊操作如需要使用临时表才能完成的join，Order By，Group By 等等，MySQL 可能需要使用到临时表。当我们的临时表较小（小于 tmp_table_size 参数所设置的大小）的时候，MySQL 会将临时表创建成内存临时表，只有当 tmp_table_size 所设置的大小无法装下整个临时表的时候，MySQL 才会将该表创建成 MyISAM 存储引擎的表存放在磁盘上。不过，当另一个系统参数 max_heap_table_size 的大小还小于 tmp_table_size 的时候，MySQL 将使用 max_heap_table_size 参数所设置大小作为最大的内存临时表大小，而忽略 tmp_table_size 所设置的值。而且 tmp_table_size 参数从 MySQL 5.1.2 才开始有，之前一直使用 max_heap_table_size.


##长期解决措施：终于到本文的重点**Cache Reload机制设计和实现**


更多Redis 的应用场景，请看[Redis 在电商中的实际应用场景](http://kenny7.com/2012/09/redis-usage-scenario.html)
	
##后记
有同学说，还可以根据User-Agent来屏蔽spider，但我认为这没什么意义，现在的恶意spider都已经将User-Agent伪装成普通浏览器或者正规爬虫的User-Agent了，我也不再这里提了。

我认为，结合以上2种策略，可以很大程度打击那些恶意spider的攻击，保证网站正常运行。如果你有更多奇淫怪招，欢迎留言或Email我<code class="default-size">kasa.life#gmail.com</code>.
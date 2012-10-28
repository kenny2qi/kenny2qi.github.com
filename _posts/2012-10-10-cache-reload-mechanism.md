---
layout: post
summary-only: yes
title : Cache Reload机制设计和实现（防止cache失效引发雪崩）
category : cache
tags : [java, redis, cache, highAbility, 分布式架构]
---

大概半年前，Guang.com曾发生一次由于首页部分cache失效，导致网站故障。
##故障分析：
当时逛正在做推广，流量突然暴增，QPS达到1000+，当首页部分cache失效时，需要查询DB，
但由于这部分业务逻辑很复杂导致这SQL包含多表join、groupby、orderby等，执行需要1s，产生的大量临时表，in-memory都装不下，变成on-disk的临时表，但当时放临时表的disk分区容量只有20G，很快disk也爆了，结果显然网站打不开了。

总结为几点：

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

<pre><code>
<strong>临时表使用内存(tmp_table_size)：</strong>当我们进行一些特殊操作如需要使用临时表才能完成的join，Order By，Group By 等等，MySQL 可能需要使用到临时表。当我们的临时表较小（小于 tmp_table_size 参数所设置的大小）的时候，MySQL 会将临时表创建成内存临时表，只有当 tmp_table_size 所设置的大小无法装下整个临时表的时候，MySQL 才会将该表创建成 MyISAM 存储引擎的表存放在磁盘上。不过，当另一个系统参数 max_heap_table_size 的大小还小于 tmp_table_size 的时候，MySQL 将使用 max_heap_table_size 参数所设置大小作为最大的内存临时表大小，而忽略 tmp_table_size 所设置的值。而且 tmp_table_size 参数从 MySQL 5.1.2 才开始有，之前一直使用 max_heap_table_size.
</code></pre>

##长期解决措施：终于到本文的重点**Cache Reload机制设计和实现**

在讲Cache Reload机制设计和实现之前，先看看cache更新方式：

1. 是缓存time out，让缓存失效，重查。（被动更新）
2. 是由后端通知更新，一量后端发生变化，通知前端更新。（主动更新）

前者适合实时性不高，但更新频繁的；后者适合实时性要求高，更新不太频繁的应用。

**Cache Reload mechanism 设计：**

根据逛当时业务需求，选择被动更新方式，但这种方式的弊端是当cache失效那个点，刚好遇上高并发的话，就会发生上述的雪崩情况。

所以我在想这种使用率高的cache，就不用设置time out或time out设置足够大，然后按业务需求时间间隔定期reload/refresh cache data from DB，这cache就不会出现失效情况，也不出现雪崩现象。

下图是guang.com 关于Cache Reload的一小部分架构：
<img src="/images/showcase_architecture.jpg" alt="部分架构图" >

主要2个step：

1. 将有需要reload cache 的wrapper保存到redis <code class="default-size">Hash</code>.
2. 部署在Daemon server上的<code class="default-size">CacheReloadJob</code>，每分钟去redis拿需要reload的cache的hashmap，判断是否到时间refresh cache，如果到，通过Reflection call relevant method 重新reload data和reset 这个cache。

**Cache Reload mechanism 实现：**

set memcached with reload mechanism if necessary:
	
	/**
	 * <h2>set cache with reload mechanism </h2>
	 * <h3>Example:</h3>
	 * <p>
	 * MethodInvocationWrapper wrapper = new MethodInvocationWrapper();<br>
	 * wrapper.setMethodName("getProductList");<br>
	 * wrapper.setObjectName("productService");<br>
	 * wrapper.setArgs(new Object[] { null,0,1 });<br>
	 * wrapper.setParameterTypes(new Class[] { Product.class,int.class,int.class});
	 * </p>
	 * 
	 * <h3>NOTE:</h3>
	 * Make sure the Args have been Serializable and the service has been marked the name, like "@Service("productService")"
	 *
	 * @param key
	 * @param expiredTime 过期时间,如果reloadable=true, 此时间建议为 24*60*60 一天.
	 * @param value
	 * @param reloadable 是否reload
	 * @param durationTime reload 时间间距,单位 ms
	 * @param wrapper
	 * @return
	 * @author Kenny Qi
	 */
	public boolean set(String key, int expiredTime, Object value,boolean reloadable, long durationTime, MethodInvocationWrapper wrapper) {
		if(reloadable){
			wrapper.setWriteTime(System.currentTimeMillis());
			wrapper.setDuration(durationTime);
			wrapper.setKey(key);
			wrapper.setExpiredTime(expiredTime);
			objectHashOperations.put(RedisKeyEnum.CACHE_RELOAD.getKey(), key, wrapper);
		}
		
		if(value==null) return false;
		try {
			return memcachedClient.set(key, expiredTime, value);
		} catch (Exception e) {
			logger.warn(e.getMessage(), e);
			return false;
		} 
	}

CacheReloadJob:

	public class CacheReloadJob {

		private static Logger logger = LoggerFactory.getLogger(CacheReloadJob.class);
		@Autowired
		MyXMemcachedClient myXMemcachedClient;
		
		@Resource(name="objectHashOperations")
		private HashOperations<String, String, MethodInvocationWrapper> objectHashOperations;
		
		public void reloadCache(){
			logger.info("Try to reload cache");
			Map<String, MethodInvocationWrapper>  map = objectHashOperations.entries(RedisKeyEnum.CACHE_RELOAD.getKey());
			ThreadFactory tf = new NamedThreadFactory("CACHE_RELOAD_THREADPOOL");
			ExecutorService threadPool = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors(), tf);
			for (String key: map.keySet()) {
				final MethodInvocationWrapper wrapper = map.get(key);
				if(wrapper.getWriteTime()+wrapper.getDuration()>System.currentTimeMillis()){//刷新时间大于当前时间
					threadPool.execute(new Runnable() {
						@Override
						public void run() {
							refreshCache(wrapper);
						}
					});
				}
			}
			
			logger.info("completed with reloaded cache");
		}
		
		private void refreshCache(MethodInvocationWrapper wrapper){
			Object object = ReflectionUtils.invokeMethod(SpringContextHolder.getBean(wrapper.getObjectName()), wrapper.getMethodName(), wrapper.getParameterTypes(), wrapper.getArgs());
			myXMemcachedClient.set(wrapper.getKey(), wrapper.getExpiredTime(), object);
			wrapper.setWriteTime(System.currentTimeMillis());
			objectHashOperations.put(RedisKeyEnum.CACHE_RELOAD.getKey(), wrapper.getKey(), wrapper);
		}
		
	}


Redis 存储结构(更多Redis 的应用场景，请看[Redis 在电商中的实际应用场景](http://kenny7.com/2012/09/redis-usage-scenario.html) )：

	redis> HSET cache:reload:memcached <memcache_key> <MethodInvocationWrapper>
	OK
	redis> HGETALL cache:reload:memcached

	
##后记

如果要做的更人性化点，后续可以在网站后台管理系统 增加cache reloadable 的管理工具（删除、修改刷新间隔等）。

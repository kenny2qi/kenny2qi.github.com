---
layout: post
title : Zookeeper使用上的注意事项 
category : 分布式架构
tags : [zookeeper, 分布式架构]
summary-only: yes
---

前段时间为Guang.com引入了Zookeeper，主要用于存储一些动态config/data，分布式锁，负载均衡，服务器监控等。现在，mark down一下zookeeper使用的注意事项和一些总结。

- Zookeeper默认不会自动清理快照和事务日志，如果不用作数据备份，建议开启自动清理(3.4.0后可以使用）。
	<pre><code># The number of snapshots to retain in dataDir 
autopurge.snapRetainCount=3 # Purge task interval in hours
autopurge.purgeInterval=1 # Set to "0" to disable auto purge feature</code></pre>
	

- 客户端调用getData()，ZK client不保证数据是最新的，有可能有延时latency情况，如果对数据精确性要求很高，需要先调用 sync()。

- 客户端对于ZK server list采用round robin 轮询方式连接。

- watches 是 One-time trigger，在通知后，需重新注册watcher。

- 只要执行setData() ，不管data有没有改变，都会出发NodeDataChanged

- 数据被频繁多次修改，客户端可能只会收到一次watch event。

- CONNECTION_LOSS后,在SESSION_TIMEOUT内，re-establish connection后，watches/EPHEMERAL 依然有效。

- 如果整个ZK集群down了，重启后，session 就算超过了timeout，session依然会有效，因为session timeouts 是 tracked by the leader，同理如果leader down了，在重新选leader过程所费时间也算在timeout。

- ZK会将每次更新操作以事务日志的形式写入disk，所以disk的性能很影响ZK的性能，尽量使用单独disk来写事务日志。

- 有时候会由于数据文件出错（READ DATA LOG ERROR)导致无法启动ZK，在确保Leader正常运行情况下，可以删除本地data 和 dataLog，重新启动ZK，通过Leader同步数据。

- 一些常用的命令
	<pre><code>echo stat|nc localhost 2281 //输出server简要状态和连接的客户端信息
echo conf|nc localhost 2281 //输出server的详细配置信息
echo cons|nc localhost 2281	//输出指定server上所有客户端连接的详细信息
echo wchs|nc localhost 2281	//列出所有watcher信息概要信息，数量等
echo wchc|nc localhost 2281	//列出所有watcher信息，以watcher的session为归组单元排列
echo mntr|nc localhost 2281	//输出一些ZK运行时信息，通过对这些返回结果的解析，可以达到监控的效果</code></pre>
	

- watcher绑定与watches event触发对应关系表

<table border="0" cellspacing="0" cellpadding="0" width="674">
<tbody>
<tr>
<th width="200"></th>
<th colspan="3" width="235">“/path”</th>
<th colspan="3" width="238">“/path/child”</th>
</tr>
<tr>
<th width="200"></th>
<th width="62">exists</th>
<th width="70">getData</th>
<th width="102">getChildren</th>
<th width="66">exists</th>
<th width="70">getData</th>
<th width="102">getChildren</th>
</tr>
<tr>
<td width="200">create(“/path”)</td>
<td width="62">√</td>
<td width="70">√</td>
<td width="102"> </td>
<td width="66"> </td>
<td width="70"> </td>
<td width="102"> </td>
</tr>
<tr>
<td width="200">delete(“/path”)</td>
<td width="62">√</td>
<td width="70">√</td>
<td width="102">√</td>
<td width="66"> </td>
<td width="70"> </td>
<td width="102"> </td>
</tr>
<tr>
<td width="200">setData(“/path”)</td>
<td width="62">√</td>
<td width="70">√</td>
<td width="102"> </td>
<td width="66"> </td>
<td width="70"> </td>
<td width="102"> </td>
</tr>
<tr>
<td width="200">create(“/path/child”)</td>
<td width="62"> </td>
<td width="70"> </td>
<td width="102">√</td>
<td width="66">√</td>
<td width="70">√</td>
<td width="102"> </td>
</tr>
<tr>
<td width="200">delete(“/path/child”)</td>
<td width="62"> </td>
<td width="70"> </td>
<td width="102">√</td>
<td width="66">√</td>
<td width="70">√</td>
<td width="102">√</td>
</tr>
<tr>
<td width="200">setData(“/path/child”)</td>
<td width="62"> </td>
<td width="70"> </td>
<td width="102"> </td>
<td width="66">√</td>
<td width="70">√</td>
<td width="102"> </td>
</tr>
</tbody>
</table>




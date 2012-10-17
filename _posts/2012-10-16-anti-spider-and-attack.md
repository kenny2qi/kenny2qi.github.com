---
layout: post
summary-only: yes
title : 关于反爬虫和恶意攻击的一些策略和思路	
category : anti-spam
tags : [java, redis, linux, anti-spam, 分布式架构]
---

前段时间Guang.com经常受到恶意spider攻击，疯狂抓取网站内容，一系列机器人spam发广告，对网站性能有较大影响。

下面我说说一些反恶意spider和spam的策略和思路。

##1. 通过日志分析来识别恶意爬虫/攻击

1. **首先分析access log，类聚统计出访问量前50 IP**

	less guang.com_access.log | awk -F- '{print $1}' | sort | uniq -c | sort -rn | head -n 50 

2. **排除白名单IP 和正常spider（baidu，google...)
	
	host 112.94.32.135 //查看可疑ip是不是baidu、google等常规爬虫。

3. **分析可以ip 请求时间、频率、路径等，你可以很容易发现这是否是一个spider，下面那明显是一个spider。**

	less access.log | grep '112.94.32.135' | less
	
	112.94.32.135 - - [1/Oct/2012:00:00:50 +0800] "GET /baobei/1888476 HTTP/1.1" 200 107876 "-" "Mozilla/4.0"
	112.94.32.135 - - [1/Oct/2012:00:00:50 +0800] "GET /baobei/1922742 HTTP/1.1" 200 110053 "-" "Mozilla/4.0"
	112.94.32.135 - - [1/Oct/2012:00:00:50 +0800] "GET /u/1437104 HTTP/1.1" 200 10751 "-" "Mozilla/4.0"
	112.94.32.135 - - [1/Oct/2012:00:00:50 +0800] "GET /baobei/1733527 HTTP/1.1" 200 98099 "-" "Mozilla/4.0"
	112.94.32.135 - - [1/Oct/2012:00:00:50 +0800] "GET /u/1437105 HTTP/1.1" 200 10891 "-" "Mozilla/4.0"
	112.94.32.135 - - [1/Oct/2012:00:00:50 +0800] "GET /baobei/1646377 HTTP/1.1" 200 95527 "-" "Mozilla/4.0"
	112.94.32.135 - - [1/Oct/2012:00:00:50 +0800] "GET /u/1437106 HTTP/1.1" 200 10681 "-" "Mozilla/4.0"
	112.94.32.135 - - [1/Oct/2012:00:00:51 +0800] "GET /baobei/1922741 HTTP/1.1" 200 98356 "-" "Mozilla/4.0"
	112.94.32.135 - - [1/Oct/2012:00:00:51 +0800] "GET /baobei/1733526 HTTP/1.1" 200 97690 "-" "Mozilla/4.0"
	112.94.32.135 - - [1/Oct/2012:00:00:51 +0800] "GET /u/1437107 HTTP/1.1" 200 10765 "-" "Mozilla/4.0"
	112.94.32.135 - - [1/Oct/2012:00:00:51 +0800] "GET /baobei/1888475 HTTP/1.1" 200 96415 "-" "Mozilla/4.0"
	
4. 既然发现spider，当然要动用<code class="default-size">iptables</code>来封杀这IP, 但很多时候仅仅封一个IP是不够的，因为一般爬虫都是运行在托管机房里面（多台服务器轮换）或者家里ADSL（重新拨号换IP），所以封整个C网段会直接有效得多，当然这样做有可能影响极小数正常用户访问，所以建议一段时间后重新解封这c网段。
	iptables -A INPUT -i eth0 -j DROP -p tcp --dport 80 -s 112.94.32.0/24    

以上可以写成个shell/python脚本，每天执行一次。
 
##2. 实时反爬虫 
通过日志分析来识别恶意爬虫/攻击，无法即时屏蔽这些spider，对网站影响还是在的。再说，假如有人采用分布式的spider（几百个代理服务器一起过来爬），网站很有可能无法访问，分析日志也不能及时解决问题。必须采取实时反爬虫策略，实时识别和封锁恶意爬虫的访问。

**实现思路：**
 
	用redis来记录每个IP的访问频度，在单位时间之内，如果访问频率超过一个阀值，就认为这个IP很有可疑，然后就可以返回一个验证码页面，要求用户填写验证码。如果是爬虫的话，当然不可能填写验证码，如果该IP地址短时间内继续不停的请求，则判断为爬虫，加入黑名单。
 
当然判断这IP是否可疑，单单从访问频率来判断是不够的，还需要增加以下策略：

1. 分析referer。一般爬虫的referer 都是为空或者一个固定值。
2. 分析访问时间间隔。一般爬虫爬取网页的频率都是比较固定的，不像人去访问网页，间隔时间比较无规则。
3. 排除白名单IP地址段。
 
**具体redis操作：**
	//score 为timestamp, value 为{referer}_{request_url}_{sessionId}
	redis> ZADD log:ip:112.94.32.135 61307510400000 "{referer}_{request_url}_{sessionId}" 
	(integer) 1
	//保留1个小时内log会比较合理。
	redis> ZREMRANGEBYSCORE log:ip:112.94.32.135 -inf {timestamp} 
	(integer) 1
	redis> ZRANGE log:ip:112.94.32.135  0 -1
	
更多Redis 的应用场景，看这[Redis 在电商中的实际应用场景](http://kenny7.com/2012/09/redis-usage-scenario.html)
	
##后记
有同学说，还可以根据User-Agent来屏蔽spider，但我认为这没什么意义，现在的恶意spider都已经将User-Agent伪装成普通浏览或者正规爬虫的User-Agent了，我也不再这里提了。

我认为，结合以上2种策略，可以很大程度打击那些恶意spider的攻击，保证网站正常运行。如果你有更多奇淫怪招，欢迎留言或Email我<code class="default-size">kasa.life#gmail.com</code>.
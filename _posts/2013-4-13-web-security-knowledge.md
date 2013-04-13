---
layout: post
summary: <p>关于最近网站安全状况，看下乌云上某大厂的漏洞列表就知道了.</p><img src="/images/defeat_list.jpg"><p>触目惊心吧，这仅仅是被曝光的，未被曝光的就更不好说了...</p><p>作为一名程序员，掌握的一些基本web安全知识，是很有必要的，下面列举一些常见的安全漏洞和对应的防御措施。</p>
title : 程序员需要掌握的web安全知识
category : 网站安全
tags : [网站安全]
---
<p>
关于最近网站安全状况，看下乌云上某大厂的漏洞列表就知道了.
</p>

<img src="/images/defeat_list.jpg"> 
<p>
触目惊心吧，这仅仅是被曝光的，未被曝光的就更不好说了...
</p><p>
作为一名程序员，掌握的一些基本web安全知识，是很有必要的，下面列举一些常见的安全漏洞和对应的防御措施。文笔有限，见笑了。
</p>
## CSRF 攻击

CSRF的全称是Cross Site Request Forgery，就是跨站点伪造请求攻击。
简单理解：Bad guy盗用你的身份，做桌下交易。详细原理看  <a href="http://en.wikipedia.org/wiki/Cross-site_request_forgery" rel="nofollow">Cross Site Request Forgery</a>

### 经典案例：

看看乌云网友如何通过CSRF漏洞，自动加关注和发微博。
<a href="http://www.wooyun.org/bugs/wooyun-2010-017271" rel="nofollow">我是如何刷新浪微博粉丝的</a>

###防御措施：

最有效的措施，对敏感操作增加CSRF Token验证并尽量采用POST请求方式（虽然GET 也可以增加Token验证）。

1. 用户第一次请求网站是生成CSRF Token并保存到session中。
2. POST请求时，增加Input Field <code class="default-size">csrf_token</code>, 参数值通过session获得。
3. 服务器端验证Token的合法性，并更新token。


## XSS攻击

XSS攻击可以说最常见最严重的漏洞攻击了。

XSS的全称是Cross-site Scripting，就是跨站脚本攻击。主要分为非存储型XSS(反射型）和存储型XSS.
详细介绍看WIKI吧： <a href="http://zh.wikipedia.org/wiki/%E8%B7%A8%E7%B6%B2%E7%AB%99%E6%8C%87%E4%BB%A4%E7%A2%BC" rel="nofollow">Cross-site scripting </a>

### 经典案例：
实在太多了，随便找一个：
<a href="http://www.wooyun.org/bugs/wooyun-2013-019036" rel="nofollow">百度经验存储型Xss</a>

### XSS Cheat Sheet：
https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet

### 防御措施：

1. 输入过滤, 即使用Filter 过滤一些敏感字符"<" ">" "#" "script"等. 
2. 输出过滤(output encoding)，htmlEncode, javascriptEncode
3. 对敏感操作增加验证码

### 过滤工具推荐（java）：

	https://code.google.com/p/owaspantisamy  （比较全面，但有点重）
	https://code.google.com/p/xssprotect/ 

## SQL注入攻击

SQL注入这种老掉牙的攻击手段，我就不多介绍了。

最简单的防御措施，使用预编译方式绑定变量：

1. JDBC 使用PreparedStatement.
2. mybatis/ibatis 使用静态变量#


## 正确地使用Cookie

1. 对于无需JS访问的cookie设置HTTPOnly
2. 不要在cookie存放用户敏感数据。

## 合理设计一个cookie自动登录方案

### 要保存哪些数据：

- cookie保存base64 encode(username|sequence|token)的value。
- 服务器使用Redis的Hashs结构保存以下这几个值。
<pre><code>
Key: user:<username>:cookie
hashKey: userAgent_ip,userAgent_sequence,userAgent_token,userAgent_expireTime	
</code></pre>

### 如何验证cookie登录：

- 如果expireTime没到而且username，sequence，token均相同，登录成功。

- 如果expireTime没到，username和sequence相同，token不同，但IP相同和userAgent不同，登录成功。为什么要这样的设计？因为同一用户可能会使用的不同设备/浏览器登录。

- 其余情况均登录失败，并清空登录cookie。

- 成功登录后，服务器update token，同时更新cookie。

### 后续操作：

- 修改密码/点击退出，更新服务器端的token和sequence。
- 对于敏感操作（如修改个人私隐信息，Email，password等）需要输入密码。

## 数据安全

相信大家还记得CSDN 明文密码被暴库泄露的事件吧。
最近又有被暴库的，300w用户数据。<a href="http://www.wooyun.org/bugs/wooyun-2010-018289" rel="nofollow">住哪网300W+用户明文密码泄露</a>

### 防御措施：

对密码采用<code class="default-size">MD5/SHA(salt+password)</code>进行HASH，salt是一串字符，为防止Rainbow Table 破解用的, salt应该放在一个隐秘的地方（某处代码或配置文件中）。


## 完善的日志机制

独立安全相关的log，方便追查和事后分析。

------------下面2项可能偏运维一点，但程序员还是觉得有必要了解--------------

## 服务器运维配置

给大家看看最近的一个案例:
<a href="http://www.wooyun.org/bugs/wooyun-2010-018975" rel="nofollow">UC运维不当 可导致大量数据泄漏</a>

### 防御措施：

iptables 搞起, 该屏蔽就屏蔽，该开放的IP就开放。

## DDOS攻击

一般来说，防御DDos的攻击是比较难，常见的DDOS方式较多（网络层DDOS、应用层DDOS等)。

### 一些非物理措施：

- 增加anti-spam 机制
- 限制IP请求频率, 结合ip+cookie定位一个client 
- 调小Timeout, KeepAliveTimeOut, 增加MaxClients 
- 增加容灾机器，优化网站性能。
- 合理配置防火墙。


##最后

定期了解最新的攻击技术，没事多上上<a href="http://www.wooyun.org/" rel="nofollow">乌云</a>。

推荐书籍：
<br><a href="http://book.douban.com/subject/2705016/" rel="nofollow">The Web Application Hacker's Handbook</a>
<br>
<a href="http://book.douban.com/subject/10546925/" rel="nofollow">白帽子讲Web安全</a>

推荐博客：
<br>
<a href="http://www.80sec.com/" rel="nofollow">80sec</a>
<br>
<a href="http://coolshell.cn/" rel="nofollow">酷壳</a>
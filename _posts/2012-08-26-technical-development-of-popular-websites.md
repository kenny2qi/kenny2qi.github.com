---
layout: post
summary-only: yes
title : 『Mark』知名网站的技术发展历程	
category : 架构
tags : [分布式架构]
---
原文：http://blog.bluedavy.com/?p=389

总共有两篇，分别发表在《程序员》杂志的5月刊和6月刊，暂时还只能公开第一篇，第一篇中介绍了一些Alexa排名较前的网站的技术发展历程，第二篇总结了这些网站是如何来应对可伸缩性、可用性、高性能以及低成本的挑战的。

文中其实有很多链接，建议大家下载pdf版本。

互联网已经发展多年，其中不凡脱颖而出的一些网站，这些网站多数都已存在了接近10年或10年以上，在这么多年的发展过程中，除了业务上面临的挑战外，在技术上也面临了很多的挑战。
在这篇文章中，我挑选了一些Alexa排名较前的网站（http://www.alexa.com/topsites），看看它们在技术是如何应对业务发展过程中的挑战的（由于一个网站需要很多方面的技术支撑，这里不可能全部覆盖，这里更多的是着重在其主要业务的网站的相关技术），所有的资料全部来源于网上，如有错误欢迎指正。

##Google（Alexa排名：1）
Google诞生于1997年，当时是一个研究性项目，每个月build一次索引，build出来的索引通过sharding（shard by doc）的方式分散到多台服务器（Index Servers）上，具体的网页数据同样通过sharding的方式分散到多台服务器（Doc Servers）上，当用户提交请求时，通过前端的一台服务器将请求提交给Index Servers获得打了分的倒排索引，然后从Doc Servers提取具体的网页信息（例如网页标题、和搜索关键词匹配的片段信息等），最终展现给用户。
随着爬的网页的增加，这个结构可通过增加Index Server以及Doc Server来存储索引以及网页的数据，但仍然会面临其他很多方面的问题，于是在这之后的十多年的时间里，Google做了很多事情来改进上面的结构。
1999年，Google增加了一个Cache Cluster，用来Cache查询的索引结果和文档片段信息，同时将Index Servers和Doc Servers通过Replicate的方式变成了Cluster，这两个改造带来的好处是网站的响应速度、可支撑的访问量以及可用性（Availability）提升了。
上面的这个变化造成了成本的增加，Google在硬件方面的风格始终是不用昂贵的高端硬件，而是在软件层面来保证系统的可靠性以及高性能，于是同年Google开始采用了自行设计的服务器来降低成本。
2000年Google开始自行设计DataCenter，采用了各种方法（例如采用其他的制冷方法来替代空调）来降低PUE，同时对自行设计的服务器也做了很多优化。
2001年，Google对Index的格式进行了修改，将所有的Index放入内存， 这次改造带来的好处是网站的响应速度以及可支撑的访问量得到了极大的提升。
2003年，Google发表了Google Cluster Architecture的文章，其Cluster结构组成为硬件LB + Index Cluster+ Doc Cluster + 大量廉价服务器（例如IDE硬盘、性价比高的CPU等），通过并行处理 + sharding来保证在降低对硬件的要求的同时，响应速度仍然很快，同年Google发表Google File System论文（2001年就开始上线），这篇论文很大程度也体现了Google不用昂贵硬件的风格，通过GFS + 大量廉价的服务器即可存储大量的数据。
2004年，Google再次对Index的格式进行了修改，使得网站的响应速度继续提升，同年Google发表MapReduce论文，通过MapReduce + 大量廉价的服务器即可快速完成以前要使用昂贵的小型机、中型机甚至是大型机才能完成的计算任务，而这显然对于Google快速的构建索引提供了很大的帮助。
2006年，Google发表BigTable论文（2003年开始上线），使得海量数据的分析能够达到在线系统的要求了，这对于Google提升网站的响应速度起到了很大的帮助。
以上三篇论文彻底改变了业界对于海量数据的存储、分析和检索的方法（小道消息：Google内部已完成了GFS、MapReduce、BigTable的替换），也奠定了Google在业界的技术领导地位。
在一些场景中，Google也采用MySQL来存储数据，同样，其对MySQL也做了很多修改，这是Google使用的MySQL版本。
2007年Google将build索引的时间缩短到分钟级，当新网页出现后，分钟级后即可在Google搜索到，同时将Index Cluster通过PB对外提供Service，以供Google各种搜索（例如网页、图片、新闻、书籍等）而使用，除了Index Cluster提供的Service外，还有很多其他的Service，例如广告、词法检查等，Google的一次搜索大概需要调用内部50个以上的Service，Service主要用C++或Java来编写。
2009年Google的一篇《How Google uses Linux》的文章，揭示了Google在提升机器利用率方面也做了很多的改造，例如将不同资源消耗类型的应用部署在同一台机器上，
在之后，Google又研发了Colossus（next gen GFS-like file system）、Spanner（Blob Storage,Structured Storage,Next generation of Bigtable stack）、实时搜索（基于Colossus实现的），主要都是为了提升搜索的实时性以及存储更多的数据。
除了在海量数据相关技术上的革新外，Google也不断的对业界的传统技术进行创新，例如提高TCP的初始拥塞窗口值、改进Http的SPDY协议、新的图片格式等等。
在Google的发展过程中，其技术的改造主要围绕在了可伸缩性、性能、成本和可用性四个方面，Google的不采用昂贵硬件的风格以及领先其他网站的数据量决定了其技术改造基本都是对传统的软硬件技术的革新。

##Facebook（Alexa排名：2）
Facebook采用LAMP（Linux + Apache + MySQL + PHP）而构建，同样，随着业务的发展，Facebook也在技术上做了很多的改造。
Facebook首先在LAMP结构中增加了Memcached，用来缓存各种数据，从而大幅度的提升系统的响应时间以及可支撑的访问量，之后又增加了Services层，将News Feed、Search等较通用的功能作为Service提供给前端的PHP系统使用，前端的系统通过Thrift访问这些Service，Facebook采用了多种语言来编写各种不同的Service，主要是针对不同的场景选择合适的语言，例如C++、Java、erLang。
大量使用Memcached以及访问量的不断上涨，导致访问Memcached的网络流量太大，交换机无法支撑，Facebook改造为了采用UDP的方式来访问Memcached，以降低单连接上的网络流量，除此之外，还有其他一些改造，具体信息可在此查看。
PHP作为Scripting Language，优势是开发简单、易上手，劣势是需要消耗较多的CPU和内存，当Facebook的访问量增长到了一定规模后，这个劣势就比较突出了，于是从2007年起Facebook就尝试多种方法来解决这个问题，最后诞生于Facebook Hackathon的HipHop产品成功的脱颖而出，HipHop可以自动的将PHP转化为C++代码，HipHop在Facebook使用后，同等配置的机器情况下，可支撑的请求量是之前的6倍，CPU的使用率平均下降了50%，从而为Facebook节省了大量的机器，在将来Facebook会对HipHop进行再次的改进，通过HipHop将PHP编译为bytecode，放入HipHop VM中执行，再由HipHop VM来编译为机器代码，类似JIT。
2009年Facebook研发了BigPipe，借助此系统Facebook成功的让网站的速度提升了2倍。
随着Facebook的访问量的上涨，收集众多服务器上的执行日志也面临了挑战，于是Facebook研发了Scribe来解决此问题。
对于存储在MySQL的数据，Facebook采用垂直拆分库和水平拆分表的方式来支撑不断增长的数据量。
MySQL作为Facebook技术体系中重要的一环，Facebook也对其进行了很多的优化和改进，例如Online Schema Change等，更多的信息可见：http://www.facebook.com/MySQLAtFacebook，其对MySQL所做的patch可在此获取。
发展之初Facebook采用高端的存储设备（例如Netapp、Akamai）来存图片，随着图片不断的增加，成本就比较高了，于是在2009年Facebook开发了Haystack来存储图片，Haystack可采用廉价的PC Server来存储，大幅度的降低了成本。
Facebook除了使用MySQL存储数据外，近几年也开始摸索采用新的方式，在2008年Facebook开发了Cassandra在Message Inbox Search中作为新的存储方式，在2010年，Facebook放弃了Cassandra，转为采用HBase作为其Messages的存储，并在2011年将HBase应用在了Facebook更多的项目（例如Puma、ODS）上（据小道消息，现在Facebook更是在尝试将其用户以及关系数据从MySQL迁移到HBase）。
从2009年开始，Facebook尝试自行设计DataCenter以及服务器，以降低其运行成本，并对外开放了其构建的PUE仅1.07的DataCenter的相关技术。
Facebook在技术方面的基本原则是：“在能用开源产品的情况下就用开源，根据情况对其进行优化并反馈给社区”，从Facebook的技术发展历程上也能看到这个原则贯彻始终，Facebook的技术改造主要是围绕在可伸缩、性能、成本和可用性四个方面。

##Youtube（Alexa排名：3）
Youtube采用Linux + Apache/Lighttpd + MySQL + Python构建，其中对于性能很关键的部分用C编写，作为Extension供Python使用，数据的存储和搜索则是直接使用Google的Search、GFS和Bigtable（在被Google收购之前，视频的缩略图曾经是Youtube不好解决的问题，收购后采用Bigtable解决了）。
为了提升python的执行效率，Youtube曾经采用Psyco，其作用是在运行期将python代码编译为机器码（同样类似于JIT），提高效率。
Youtube将热门的视频分发到CDN上，以提高用户的访问速度，其他的视频则分散在其多个DataCenter。
对于存储在MySQL的数据，Youtube采用垂直拆分库和水平拆分表的方式来支撑不断增长的数据量，这些数据很多也都cache在Memcached集群中。
Youtube用Go开发了Vitess，以便更好的让MySQL也做到可伸缩，这样当数据量增长后，就只用增加机器即可了。
Youtube在7年多的发展中，主要的技术改造都围绕在了可伸缩和性能上，它总结出来的经验有几点也是比较有趣的：
适当的正确性
一个例子是写评论，通常来说写评论的人自己是希望写完后立刻能看到的，但对于其他人而言慢个几百ms甚至更长时间看到也没关系，因此这里可以做个策略，让评论是异步持久化的，但同时保证写评论的人自己时能看到的，这可以很好的减少系统的压力。
Jitter
一个例子是关于Cache的失效，热门的视频会Cache 24个小时，但这样就意味着如果都是在24小时后失效，那么就会造成瞬间的高峰，于是youtube采取的方法是让其有效期变成随机的18—30个小时，这样就用一个很简单的方法避免了瞬间高峰的问题。
“欺骗“
一个例子是视频的浏览次数，常见的做法是每次都更新，对于热门视频会造成很强的事务竞争，youtube采取的方法是每隔一段时间更新一个估计的数量，这样会有效的降低系统的压力。

##Twitter（Alexa排名： 9）
Twitter在2006年诞生之时是采用Ruby On Rails+ MySQL构建的，2007年增加了Memcached作为cache层，以提升响应速度。
基于Ruby on Rails让Twitter享受到了快速的开发能力，但随着访问量的增长，其对CPU和内存的消耗也让Twitter痛苦不堪，于是Twitter做了不少改造的努力，例如编写了一个优化版的Ruby GC。
2008年Twitter决定逐步往Java迁移，选择了Scala作为主力的开发语言（理由是：can’t sell Java to a room of Ruby programmers），采用Thrift作为其主要的通信框架，开发了Finagle作为其Service Framework，可将后端各种功能暴露为Service提供给前端系统使用，使得前端系统无需关心各种不同的通讯协议（例如对于使用者可以用同样的调用服务的方式去访问memcache、redis、thrift服务端），开发了Kestrel作为其消息中间件（替代之前用Ruby写的Starling）。
数据的存储一直采用MySQL，发展过程中出现的小插曲是，当时Facebook开源了Cassandra，Twitter计划使用，最终放弃，仍然保持了使用MySQL，Twitter的MySQL版本已开源，更多的信息可以到此查看，存储的数据也是采用分库分表的方式来支撑大的数据量，使用Memcached来Cache tweet，timeline的信息则迁移为用Redis来cache，对于很热的搜索的结果也用redis来cache。
2010年，Twitter在盐湖城拥有了第一个自建的DataCenter，主要是为了增加可控性。
从Twitter的发展过程来看，6年来，Twitter的技术改造主要围绕在了可伸缩以及可用性上。

##eBay（Alexa排名：21）
作为一家电子商务网站的员工，请允许我在此介绍下这个Alexa排名不算很前的著名电子商务网站的技术演变。
1995年，eBay诞生，当时采用的是CGI编写的，数据库采用的是GDBM，最多只能支撑5万件在线商品；
1997年，从FreeBSD迁移到Windows NT，数据库从GDBM迁移为Oracle；
1999年，将前端系统改造为Cluster（之前只有一台的），采用Resonate作为负载均衡，后端的Oracle机器升级为Sun E1000小型机，同年给数据库增加了一台机器作为备库，提升可用性，前端机器随着访问量不断增加，但数据库机器在1999年11月的时候已经达到了瓶颈（已经不能再加CPU和内存了），于是在11月开始将数据库按业务拆分为了多个库；
2001年到2002年，将数据表进行了水平拆分，例如按类目存储商品，同时部署Oracle的小型机换为Sun A3500；
2002年，将整个网站迁移为用Java构建，在这个阶段，做了DAL框架来屏蔽数据库分库分表带来的影响，同时还做了一个开发框架以供开发人员更好的上手进行功能的开发。
从eBay的整个发展过程来看，eBay的技术改造主要围绕在了可伸缩性和可用性两点上。

##腾讯（qq.com Alexa排名： 8）
腾讯的资料不多，暂时只能从其分享的QQ IM的技术演变来管窥下腾讯的技术发展。
最初QQ IM采用的是单台接入服务器来处理用户的登录和状态保持，在发展到一百万同时在线时，这台服务器已经无法支撑。
于是QQ IM将所有的单台服务器全部改造为了集群，并增加了状态同步服务器，由其完成集群内状态的同步，用户的信息存储在MySQL中，做了分库分表，好友关系存储在自行实现的文件存储中。
为了提升进程间通讯的效率，腾讯自行实现了用户态的IPC。
之后腾讯将状态同步服务器也改造为同步集群，以支撑越来越多的在线用户。
在经历了前面几次改造后，基本能支撑千万级别的用户同时在线，但可用性比较差，于是腾讯对QQ IM再次进行改造，实现了同城跨IDC的容灾，加强了监控和运维系统的建设。
此后腾讯决定对QQ IM架构进行完全的重写（大概是2009年持续到现在），主要是为了增强灵活性、支持跨城市的IDC、支撑千万级的好友，在这次大的技术改造过程中，腾讯将数据都不再存储在MySQL里了，而是全部存储在了自己设计的系统里。
从QQ IM的技术演变来看，其技术改造主要是围绕在了可伸缩性和可用性上。

##淘宝（Alexa排名： 14）
2003年，淘宝诞生，直接购买了一个商业的phpauction的软件，在此基础上改造产生了淘宝；
2004年，将系统由php迁移到Java，MySQL迁移为Oracle（小型机、高端存储设备），应用服务器采用了Weblogic；
2005年 – 2007年，在此两年的发展过程中，用JBoss替代了Weblogic，对数据库进行了分库，基于BDB做了分布式缓存，自行开发了分布式文件系统TFS，以支持小文件的存储，建设了自己的CDN；
2007年 – 2009年对应用系统进行垂直拆分，拆分后的系统都以Service的方式对外提供功能，对数据采用了垂直和水平拆分；
在进行了数据的垂直和水平拆分后，Oracle产生的成本越来越高，于是在之后的几年，淘宝又开始将数据逐渐从Oracle迁移到MySQL，同时开始尝试新型的数据存储方案，例如采用HBase来支撑历史交易订单的存储和检索等。
近几年淘宝开始进行Linux内核、JVM、Nginx等的修改定制工作，同时也自行设计了低能耗的服务器，在软硬件上进行优化，以更好的降低成本。
从淘宝的整个发展过程来看，淘宝的技术改造主要围绕在了可伸缩性和可用性两点上，现在也开始逐渐将精力着重在了性能和成本上。

##总结
从上面这些Alexa排名较前的网站的技术发展过程来看，每家网站由于其所承担的业务不同、团队人员组成的不同以及做事风格的不同，在技术的不同发展阶段中会采用不同的方法来支撑业务的发展，基本都会围绕在可伸缩性、可用性、性能以及成本这四点上，在发展到比较大规模后，各网站在技术上的结构有了很多的相似点，并且这些结构还将继续进行演变，在下一篇文章中我将根据这些网站的发展历程来介绍下网站在技术上通常是如何来实现可伸缩性、可用性、高性能以及低成本的。


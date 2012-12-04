---
layout: post
title : 使用daemontools监控Zookeeper服务 
category : 监控
tags : [zookeeper, linux, 监控]
summary-only: yes
---
daemontools(http://cr.yp.to/daemontools.html)是一个管理UNIX下服务的工具集。supervise监视一个服务。它启动一个服务、当服务停掉时它会重起服务。

Zookeeper在运行过程中，如果出现一些无法处理的异常，会直接退出进程，也就是所谓的快速失败（fail fast）模式。daemontools 能够帮助你监控ZK进程，一旦进程退出后，能够自动重启进程，从而使down掉的机器能够重新加入到集群中去。

## 安装daemontools
	
	mkdir /package
	chmod 1755 /package
	cd /package
	wget http://cr.yp.to/daemontools/daemontools-0.76.tar.gz
	tar zxf daemontools-0.76.tar.gz
	cd admin/daemontools-0.76
	打开src/error.h 找到：extern int errno; 改成：#include <errno.h>
	package/install


## 监控Zookeeper

在/service下，新建文件夹zookeeper，新建run文件：

	cd /service
	mkdir zookeeper
	cd zookeeper
	touch run
	vim run

run内容：
	
	#!/bin/sh
	exec 2>&1
	exec /zk/zookeeper-3.4.4/bin/zkServer.sh start

运行：

	supervise /service/zookeeper
	//或者可以用nohup以后台方式运行。如下：
	nohup supervise /service/zookeeper &

验证监控zookeeper是否成功：

	kill zookeeper进程，查看zookeeper的进程是否自动重启

	ps -ax|grep Dzookeeper //查看zookeeper的进程


<hr/>

参考文献： http://cr.yp.to/daemontools/faq/create.html

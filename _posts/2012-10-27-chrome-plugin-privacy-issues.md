---
layout: post
summary-only: yes
title : Chrome第三方插件的安全隐患
category : 网络安全
tags : [网络安全, chrome]
---
<img src="/images/163_chrome.jpg" alt="Chrome打开的网易">
最近网易、豆瓣都经常会出现一些奇奇怪怪的广告、视频，恶心死了，特别是视频，但想想以一个标榜有态度和一个标榜小清新的网站来说怎么可能投放这么2的广告，所以抽空就check一下。

如果不是网易、豆瓣自家干的，那是谁干呢! 只有2个可能性：

- SP（网络营运商，电信，网通，华数...) DNS挟持后插入的广告。这种属于常见现象，我现在用的华数，以前用的电信都干过这种无耻流氓的事！个人亲身经历: http://weibo.com/1656692122/ysVsPF4N4
- 所安装Chrome插件（plugin）中有部分做了手脚。

最后经过一些列分析（具体分析过程如下），最终发现Chrome 著名手势插件 Smooth Gestures重大安全问，极大侵犯用户私隐：
<img src="/images/Smooth_Gestures_view.jpg" alt="Smooth_Gestures_view">

1. **窃取用户浏览记录等操作信息。**
2. **篡改网站代码，插入广告。**

虽然这个插件在2011年已经被Google下架，由于没有通知（这点Google做得有所欠缺），相信还有很多用户还在继续使用，所以强烈建议：

**采取以下措施:**

1. 立刻停用<code class="default-size">Smooth Gestures</code>。
2. 检查所有非by Google插件的安全性（嘿嘿，找个懂代码的同学帮你吧），实在不行先暂时停用这些plugin吧。
3. 尽量不要安装来历不明的插件，非要安装找个懂代码同学帮你看下吧。


**By Google 的插件List https://chrome.google.com/webstore/category/collection/by_google **

<img src="/images/chrome_webstore_by_google.jpg" alt="chrome_webstore_by_google">

	NOTE: 以上不单单指Chrome，还有基于Chrome开源<code class="default-size">chromium</code>，如<code class="default-size">360浏览器极速版</code>，<code class="default-size">搜狗高速浏览器</code>，<code class="default-size">猎豹浏览器</code>等。



##整个分析过程（不感冒的同学 可以忽略）

**对比Chrome和Firefox下news.163.com的页面和HTML源码：**
Chrome：
<img src="/images/163_chrome.jpg" alt="Chrome打开的网易">

HTML源码:
	<div class="gg-mod">
		<iframe src="http://g.163.com/r?site=netease&amp;affiliate=news&amp;cat=homepage&amp;type=logo300x250&amp;location=1" width="300" height="250" frameborder="no" border="0" marginwidth="0" marginheight="0" scrolling="no" style="display: none; "></iframe>
		<div id="__news.163.com_aq"><iframe src="http://www.iicdn.com/www/delivery/afr.php?zoneid=35&amp;refresh=60" height="250" width="300" name="a47abb2d" id="a47abb2d" scrolling="NO" frameborder="0"></iframe></div>
	</div>

Firefox：
<img src="/images/163_firefox.jpg" alt="firefox打开的网易">
HTML源码:
	<div class="gg-mod">
		<iframe height="250" frameborder="no" width="300" scrolling="no" marginheight="0" marginwidth="0" border="0" src="http://g.163.com/r?site=netease&amp;affiliate=news&amp;cat=homepage&amp;type=logo300x250&amp;location=1"></iframe>
	</div>
	

已经非常明显了，Chrome下面多插入一段div/iframe，并将原来网易的自家广告disable了，够无耻了吧。那这次可以排除 “SP运营商 DNS挟持后说插入的广告”的可能性了（ps：不要以为那些SP改过自身，仅仅这次“主犯”不是它）。

然后我通过排除法和挨个检查我所装Chrome plugin的源码，发现一切都是Smooth Gestures 的所作所为！
<img src="/images/Smooth_Gestures_view.jpg" alt="Smooth_Gestures_view">

废话少说直接上插件源码截图：
<img src="/images/code_view_0.jpg" alt="Smooth_Gestures_code_view">
<img src="/images/code_view_1.jpg" alt="Smooth_Gestures_code_view">

部分核心代码 background_pn.js

	iframeWithUrl: function(b) {
		var a = document.createElement("iframe");
		a.setAttribute("src", b);
		a.setAttribute("height", 1);
		a.setAttribute("width", 1);
		a.setAttribute("name", "install_frame");
		a.setAttribute("id", "install_frame");
		a.setAttribute("scrolling", "NO");
		a.setAttribute("frameborder", "0");
		document.getElementsByTagName("body")[0].appendChild(a)
	},
	ajaxWithUrl: function(b) {
		var a = new XMLHttpRequest;
		a.open("GET", b, !0);
		a.onreadystatechange = function() {};
		a.send()
	},
	installationEvent: function() {
		localStorage.setItem(pluginnetwork.GLOBALS.PLUGIN_NAMESPACE + ".doneWelcomeMessage", "Yes");
		_gaq.push(["_trackEvent", "Events", "INSTALL"]);
		switch (pluginnetwork.GLOBALS.INST_METHOD) {
		case 1:
			this.openTabWithUrl(pluginnetwork.GLOBALS.PLUGIN_SERVER + "chromeinstall/" + this.getUUID());
			break;
		case 2:
			setTimeout(function() {
				pluginnetwork.background.iframeWithUrl(pluginnetwork.GLOBALS.PLUGIN_SERVER + "chromeinstall/" + pluginnetwork.background.getUUID())
			},
			1500);
			break;
		case 3:
			setTimeout(function() {
				pluginnetwork.background.ajaxWithUrl(pluginnetwork.GLOBALS.PLUGIN_SERVER + "chromeinstall/" + pluginnetwork.background.getUUID())
			},
			1500)
		}
	},
	init: function() {
		this.isFirstRun() && (this.installationEvent(), this.isFirstRunDaily(), this.checkDefinitionUpdate());
		this.isMarketingEnabled() != !1 && (this.isFirstRunDaily() && (_gaq.push(["_trackEvent", "Events", "DAILY_ACTIVE" + this.getVersionInfo()]), localStorage.getItem(pluginnetwork.GLOBALS.PLUGIN_NAMESPACE + ".aqo") == null ? localStorage.setItem(pluginnetwork.GLOBALS.PLUGIN_NAMESPACE + ".aq", pluginnetwork.GLOBALS.AQ) : localStorage.setItem(pluginnetwork.GLOBALS.PLUGIN_NAMESPACE + ".aq", localStorage.getItem(pluginnetwork.GLOBALS.PLUGIN_NAMESPACE + ".aqo"))), this.checkDefinitionUpdate(), setTimeout(function() {
			pluginnetwork.background.init()
		},
		24E5))
	}

##后记

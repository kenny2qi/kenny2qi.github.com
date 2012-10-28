---
layout: post
title : 关于Chrome第三方插件的安全隐患
category : 网络安全
tags : [网络安全, chrome]
summary: <img src="/images/163_chrome.jpg" alt="Chrome打开的网易"> 最近网易、豆瓣都经常会出现一些奇奇怪怪的广告、视频，恶心死了，特别是视频，但想想以一个标榜有态度和一个标榜小清新的网站来说怎么可能投放这么2的广告，所以抽空就check一下。
---
<img src="/images/163_chrome.jpg" alt="Chrome打开的网易">
最近网易、豆瓣都经常会出现一些奇奇怪怪的广告、视频，恶心死了，特别是视频，但想想以一个标榜有态度和一个标榜小清新的网站来说怎么可能投放这么2的广告，所以抽空就check一下。

如果不是网易、豆瓣自家干的，那是谁干呢! 只有2个可能性：

- SP（网络营运商，电信，网通，华数...) DNS挟持后注入的广告。这种属于常见现象，我现在用的华数，以前用的电信都干过这种无耻流氓的事！个人亲身经历: http://weibo.com/1656692122/ysVsPF4N4
- 所安装Chrome插件（plugin）中有部分做了手脚。

<img src="/images/Smooth_Gestures_view.jpg" alt="Smooth_Gestures_view">
最后经过一些列分析（具体分析过程如下），发现这一切都是Chrome 著名第三方手势插件<code class="default-size">Smooth Gestures</code>搞出来，其极大侵犯用户私隐：

1. **窃取用户浏览记录、搜索记录等操作信息。**
2. **篡改网站代码，注入广告。**

好在，Smooth Gestures 这位外国作者还有那么一点点良知，没有窃取用户的cookie，不然后果会好严重。

虽然这个插件已经被Google下架过2次，由于没有通知（这点Google做得有所欠缺），相信还有很多用户还在继续使用，所以强烈建议采取以下措施:

1. 立刻停用Smooth Gestures。
2. 检查所有非by Google插件的安全性（嘿嘿，找个懂代码的同学帮你吧），实在不行先暂时停用那些plugin吧。
3. 尽量不要安装来历不明的插件，非要安装找个懂代码同学帮你看下吧。


**Google官方的插件List：  https://chrome.google.com/webstore/category/collection/by_google **

<img src="/images/chrome_webstore_by_google.jpg" alt="chrome_webstore_by_google">

<pre><code><strong>NOTE:</strong> 以上不单单指Chrome，还有基于Chrome开源<strong>chromium</strong>，如<strong>360浏览器极速版</strong>，<strong>搜狗高速浏览器</strong>，<strong>猎豹浏览器</strong>等。</code></pre> 	



##浏览器安全的一些思考

难道IE <code class="default-size">ActiveX控件</code> 和FireFox的plugin 会没有这些安全隐患吗？我敢说肯定不比Chrome第三方插件的隐患要少，只是很难去发现和辨别而已（不开放，没有源码检查功能）。

**Chrome浏览器依然是网民最佳的选择、最优秀的浏览器，没有之一，Chrome webstore也提供各种丰富的插件。**

但要想让普通用户可以放心去安装使用第三方插件，必须做几点改进：

1. **完善通知机制，像这些有安全隐患的插件被下架，要立刻弹 alert 通知用户让用户选择是否停用。**
2. **增加审查/permission机制，像Android那样，每个插件都要声明需要的permission，在安装时候让用户知道明了。**
3. **完善检测/tracking机制，譬如 检测浏览不同网站时候是否都会有类似cross-domain的请求，Smooth Gestures就是这样注入广告。**
4. **完善举报功能，直接在插件功能list上增加举报按钮。**

<hr>

##整个分析过程

对比Chrome和Firefox下news.163.com的页面和HTML源码：

**Chrome：**

<img src="/images/163_chrome.jpg" alt="Chrome打开的网易">

HTML源码:
	<div class="gg-mod">
		<iframe src="http://g.163.com/r?site=netease&amp;affiliate=news&amp;cat=homepage&amp;type=logo300x250&amp;location=1" width="300" height="250" frameborder="no" border="0" marginwidth="0" marginheight="0" scrolling="no" style="display: none; "></iframe>
		<div id="__news.163.com_aq"><iframe src="http://www.iicdn.com/www/delivery/afr.php?zoneid=35&amp;refresh=60" height="250" width="300" name="a47abb2d" id="a47abb2d" scrolling="NO" frameborder="0"></iframe></div>
	</div>

**Firefox：**

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

<hr>

##最后

期待Chrome的进一步完善，严重鄙视那些注入广告的人和SP机构，赚钱可以，但请不要太流氓!


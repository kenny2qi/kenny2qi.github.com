---
layout: post
summary-only: yes
title : Chrome 著名手势插件 Smooth Gestures	重大安全问题
category : 网络安全
tags : [网络安全, chrome]
---

最近网易、豆瓣都经常会出现一些奇奇怪怪的广告、视频，恶心死了，特别是视频，但想想以一个标榜有态度和一个标榜小清新的网站来说不可能投放这么恶心的广告，所以今天抽空就check一下。
<img src="/images/163_chrome.jpg" alt="Chrome打开的网易">

经过一些列分析（分析过程如下），最终发现Chrome 著名手势插件 Smooth Gestures重大安全问，极大侵犯用户私隐：

**1. 窃取用户浏览记录等操作信息。**
**2. 篡改网站代码，插入广告。**

##强烈建议



##整个分析过程

如果不是网易、豆瓣自家干的，那是谁干呢! 有2个可能性：
- SP（网络营运商，电信，网通，华数...) DNS挟持后插入的广告；这个是经常出现，我现在用的华数，以前用点电信都干过这种无耻流氓的事！个人亲身经历:http://weibo.com/1656692122/ysVsPF4N4
- 所安装Chrome插件（plugin）中有部分做了手脚。

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

跟踪用户访问，出现严重的隐私危机，使用该扩展的用户可能会被窃取浏览记录等操作信息

##后记

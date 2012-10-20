$(function(){
	$(".post-home h1 a").hover(
	  function () {
	    $(this).parent().parent().find(".external").addClass("hover");
	  },
	  function () {
	    $(this).parent().parent().find(".external").removeClass("hover");
	  }
	);
	
	if(($.browser.msie && $.browser.version=="9.0") || $.browser.webkit || $.browser.safari || $.browser.mozilla || $.browser.opera ){
	}else{
		$("body").append('<div class="tipbox"><div class="tipbox-skin"><a class="close" href="javascript:;">x 关闭</a><p>我们检测到你使用的非高级浏览器，无法正常浏览，推荐下载<a href="http://www.google.cn/intl/zh-CN/chrome/browser/" target="_blank">Chrome浏览器</a></p></div></div>');
		$(".close").click(function(){
			$(".tipbox").hide();
		});
		var top = ($(window).height()-$(".tipbox").outerHeight())/2,
		left = ($(window).width()-$(".tipbox").outerWidth())/2;
		$(".tipbox").css({
			top: top+"px",
			left: left+"px"
		});
	}
});
/*
 * 操作cookie
 */
(function($) { 
$.cookie = function(name, value, options) {
    if (typeof value != 'undefined') {
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        var path = options.path ? '; path=' + options.path : '';
        var domain = options.domain ? '; domain=' + options.domain : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
}
})(jQuery);

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
		if($.cookie("notip")!="yes"){
		$("body").append('<div class="tipbox"><div class="tipbox-skin"><a class="close" href="javascript:;">x 关闭</a><p>我们检测到你使用的是非高级浏览器，无法正常浏览，推荐下载<a href="http://www.google.cn/intl/zh-CN/chrome/browser/" target="_blank">Chrome浏览器</a></p></div></div>');
		$(".close").click(function(){
			$(".tipbox").hide();
			$.cookie("notip","yes",{expires:30});
		});
		var top = ($(window).height()-$(".tipbox").outerHeight())/2,
		left = ($(window).width()-$(".tipbox").outerWidth())/2;
		$(".tipbox").css({
			top: top+"px",
			left: left+"px"
		});
		}
	}
});
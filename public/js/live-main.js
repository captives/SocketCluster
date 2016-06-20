$(window).resize(function () {
    //整体
    var width = $(".wrapper").width();                                   // 文档宽度
    var height = $(document).height() - $('.navbar').height();                              // 文档高度

    $('.wrapper').css('height', height - 15);
    $('.sidebar').css('height', $('.wrapper').height());
    $('.chat').css('height', $('.wrapper').height());
    $('.control').css('height', $('.wrapper').height() - $('.video').height());
});


$(document).ready(function () {
    $(window).resize();
    console = new Console();
    $('.console-box').hide();

});
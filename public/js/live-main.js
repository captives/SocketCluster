$(window).resize(function () {
//   $('.container').width($(window).width());
    $('.wrapper').height($(window).height() - $('nav').height());
    $('.main').width($('.wrapper').width()- $('.sidebar').width());
    $('.sidebar > .control').height($('.sidebar').height() - $('.sidebar .video').height());
});
$(window).resize();

$(document).ready(function () {
    console = new Console();
    $('.console-box').hide();
});

$('#conBtn').click(function (e) {
    if($(this).hasClass('btn-success')){
        $(this).removeClass('btn-success').addClass('btn-danger').text('关闭');
        $('.console-box').show();
    }else{
        $(this).removeClass('btn-danger').addClass('btn-success').text('调试');
        $('.console-box').hide();
    }
});
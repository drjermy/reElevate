$(document).ready(function() {

    $(document).bind('keyup', 'h', function () {
        header.toggle();
    });

    $(document).bind('keyup', 's', function () {
        sidebar.toggle();
    });

    $(document).bind('keyup', 'f', function () {
        footer.toggle();
    });

    $(document).bind('keyup', 'm', function () {
        maximise.toggle();
    });

    $(document).bind('keyup', 'shift+m', function () {
        maximise.show();
    });

    $(document).bind('keyup', 'shift+left', function () {
        navigate.previous();
    });

    $(document).bind('keyup', 'shift+right', function () {
        navigate.next();
    });

    $(document).bind('keyup', 'left', function () {
        navigate.back();
    });

    $(document).bind('keyup', 'right', function () {
        navigate.orange();
    });
    
    $('#offline-workflow-page-links li').each(function (n, value) {
        let key = n+1;
        $(document).bind('keyup', 'shift+' + key.toString(), function () {
            navigate.study(key);
        });
    });

    $('.thumb').each(function (n, value) {
        let key = n+1;
        $(document).bind('keyup', key.toString(), function () {
            navigate.series(n);
        });
    });

});

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

    $(document).bind('keyup', 'pageup', function () {
        navigate.up(5);
    });

    $(document).bind('keyup', 'pagedown', function () {
        navigate.down(5);
    });

    $(document).bind('keyup', 'home', function () {
        navigate.top();
    });

    $(document).bind('keyup', 'end', function () {
        navigate.bottom();
    });

    $(document).bind('keyup', 't', function () {
        navigate.to(12);
    });

    $(document).bind('keyup', 'q', function () {
        navigate.imagesTab();
    });

    $(document).bind('keyup', 'w', function () {
        navigate.questionsTab();
    });

    $(document).bind('keyup', 'e', function () {
        navigate.findingsTab();
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

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

    $(document).bind('keyup', 'shift+left', function () {
        navigate.previous();
    });

    $(document).bind('keyup', 'b', function () {
        navigate.back();
    });

    $(document).bind('keyup', 'shift+right', function () {
        navigate.next();
    });

    $(document).bind('keyup', 'left', function () {
        // Need to have this to make maximised forward action work correctly.
        navigate.previous();
    });

    $(document).bind('keyup', 'right', function () {
        // Need to have this to make maximised forward action work correctly.
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

    $(document).bind('keyup', 'q', function () {
        navigate.imagesTab();
    });

    $(document).bind('keyup', 'w', function () {
        navigate.questionsTab();
    });

    $(document).bind('keyup', 'e', function () {
        navigate.findingsTab();
    });

    $(document).bind('keyup', 'p', function () {
        presentation.open();
    });

    $(document).bind('keyup', 'j', function () {
        navigate.jumpTo();
    });

    $(document).bind('keydown', '=', function () {
        canvas.zoom.in();
    });

    $(document).bind('keydown', '-', function () {
        canvas.zoom.out();
    });

    $(document).bind('keydown', ',', function () {
        canvas.move.left();
    });

    $(document).bind('keydown', '/', function () {
        canvas.move.right();
    });

    $(document).bind('keydown', 'l', function () {
        canvas.move.up();
    });

    $(document).bind('keydown', '.', function () {
        canvas.move.down();
    });

    $(document).bind('keydown', ';', function () {
        canvas.crop.in('crop_left');
    });

    $(document).bind('keydown', 'shift+;', function () {
        canvas.crop.out('crop_left');
    });

    $(document).bind('keydown', '\\', function () {
        canvas.crop.in('crop_right');
    });

    $(document).bind('keydown', 'shift+\\', function () {
        canvas.crop.out('crop_right');
    });

    $(document).bind('keydown', '[', function () {
        canvas.crop.in('crop_top');
    });

    $(document).bind('keydown', 'shift+[', function () {
        canvas.crop.out('crop_top');
    });

    $(document).bind('keydown', '\'', function () {
        canvas.crop.in('crop_bottom');
    });

    $(document).bind('keydown', 'shift+\'', function () {
        canvas.crop.out('crop_bottom');
    });


    $(document).bind('keydown', 'r', function () {
        canvas.series.reset();
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

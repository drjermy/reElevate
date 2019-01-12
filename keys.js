$(document).bind('keydown', 'h', function () {
    header.toggle();
});

$(document).bind('keydown', 's', function () {
    sidebar.toggle();
});

$(document).bind('keydown', 'f', function () {
    footer.toggle();
});

$(document).bind('keydown', 'm', function () {
    maximise.toggle();
});

$(document).bind('keydown', 'shift+m', function () {
    maximise.show();
});
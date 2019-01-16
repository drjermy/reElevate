$(document).ready(function() {

    let init = function () {
        loadForm();
        $('#wrapper').css({'opacity': 1, 'transition': 'opacity .2s ease-out'});
    };

    let loadForm = function () {
        chrome.storage.sync.get(['defaultToTopImage'], function (result) {
            console.log('Retrieved (defaultToTopImage): ' + result.defaultToTopImage);
            $('#defaultToTopImage').prop("checked", result.defaultToTopImage);
        });
    };

    $('#defaultToTopImage').change(function() {
        let value = $(this).prop("checked");
        chrome.storage.sync.set({defaultToTopImage: value}, function () {
            console.log('Saved (defaultToTopImage): ' + value)
        });
    });

    init();
});
$(document).ready(function() {
    chrome.storage.sync.get(['defaultToTopImage'], function (result) {
        console.log('Retrieved (defaultToTopImage): ' + result.defaultToTopImage);
        $('#defaultToTopImage').prop("checked", result.defaultToTopImage);
    });


    $('#defaultToTopImage').change(function() {
        let value = $(this).prop("checked");
        chrome.storage.sync.set({defaultToTopImage: value}, function () {
            console.log('Saved (defaultToTopImage): ' + value)
        });
    });

});
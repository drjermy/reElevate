let init = function () {
    loadForm();
    $('#wrapper').css({'opacity': 1, 'transition': 'opacity .2s ease-out'});
};


let loadForm = function () {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {}, function(response) {
            chrome.storage.local.get([response.name], function(result) {
                if (result[response.name]) {
                    response = result[response.name];
                    $('#defaultToTopImage').prop("checked", response.defaultToTopImage);
                }
            });
        });
    });
};


$('#defaultToTopImage').change(function() {
    let defaultToTopImageBool = $(this).prop("checked");

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {}, function(response) {
            chrome.storage.local.get([response.name], function(result) {
                if (!result[response.name]) {
                    result[response.name] = {};
                }
                result[response.name]['defaultToTopImage'] = defaultToTopImageBool;
                console.log(result);
                chrome.storage.local.set(result, function () {});
            });
        });
    });
});


$(document).ready(function() {
    init();
});
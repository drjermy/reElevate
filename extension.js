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
                    $('#hideFindings').prop("checked", response.hideFindings);
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
                if (!result[response.name]) result[response.name] = {};
                result[response.name]['defaultToTopImage'] = defaultToTopImageBool;
                chrome.storage.local.set(result, function () {});
            });
        });
    });
});


$('#hideFindings').change(function() {
    let hideFindings = $(this).prop("checked");

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {}, function(response) {
            chrome.storage.local.get([response.name], function(result) {
                if (!result[response.name]) result[response.name] = {};
                result[response.name]['hideFindings'] = hideFindings;
                chrome.storage.local.set(result, function () {});
            });
        });
    });
});


$(document).ready(function() {
    init();
});
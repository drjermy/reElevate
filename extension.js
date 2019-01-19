let init = function () {
    loadForm();
    $('#wrapper').css({'opacity': 1, 'transition': 'opacity .2s ease-out'});
};

let outputVar = (selector, variable, value) => {
    if (typeof value !== "undefined") {
        $(selector).append('<nobr><div>' + variable + ' <code>' + value) + '</code></div></nobr>';
    }
};

let outputPageVar = (varName, pageSettings) => {
    outputVar('#pageStorage', varName, pageSettings[varName]);
};

let outputGlobalVar = (varName, globalSettings) => {
    outputVar('#globalStorage', varName, globalSettings[varName]);
};

let checkToggle = (selector, value) => {
    $(selector).prop("checked", value);
};


let loadForm = function () {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {}, function(response) {

            chrome.storage.local.get([response.global], function(result) {
                if (result[response.global]) {
                    globalSettings = result[response.global];
                    checkToggle('#globalDefaultToTopImage', globalSettings.defaultToTopImage);
                    checkToggle('#globalHideFindings', globalSettings.hideFindings);

                    if ($('#globalDefaultToTopImage').prop("checked") === true) {
                        $('#pageDefaultToTopImage').parent('div').hide();
                    } else {
                        $('#pageDefaultSlice').parent('div').hide()
                    }

                    if ($('#globalHideFindings').prop("checked") === true) {
                        $('#pageHideFindings').parent('div').hide();
                    } else {
                        $('#pageShowFindings').parent('div').hide()
                    }

                    //outputGlobalVar('backAction', globalSettings);
                }
            });

            chrome.storage.local.get([response.name], function(result) {
                if (result[response.name]) {
                    pageSettings = result[response.name];
                    checkToggle('#pageDefaultToTopImage', pageSettings.defaultToTopImage);
                    checkToggle('#pageDefaultSlice', pageSettings.defaultSlice);
                    checkToggle('#pageHideFindings', pageSettings.hideFindings);
                    checkToggle('#pageShowFindings', pageSettings.showFindings);

                    //outputPageVar('defaultToTopImage', pageSettings);
                }
            });

        });
    });
};


let storage = {

    set:(variableName, variableValue, global) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {}, function(response) {

                let context = response.name;
                if (global === true) {
                    context = response.global;
                }

                chrome.storage.local.get([context], function(result) {
                    if (!result[context]) result[context] = {};
                    result[context][variableName] = variableValue;
                    chrome.storage.local.set(result, function () {});
                });

            });
        });
    }

};

$('#globalDefaultToTopImage').change(function() {
    storage.set('defaultToTopImage', $(this).prop("checked"), true);
    $('#pageDefaultToTopImage').parent('div').toggle();
    $('#pageDefaultSlice').parent('div').toggle();
});


$('#globalHideFindings').change(function() {
    storage.set('hideFindings', $(this).prop("checked"), true);
    $('#pageHideFindings').parent('div').toggle();
    $('#pageShowFindings').parent('div').toggle();
});


$('#pageDefaultToTopImage').change(function() {
    storage.set('defaultToTopImage', $(this).prop("checked"));
});


$('#pageDefaultSlice').change(function() {
    storage.set('defaultSlice', $(this).prop("checked"));
});


$('#pageHideFindings').change(function() {
    storage.set('hideFindings', $(this).prop("checked"));
});

$('#pageShowFindings').change(function() {
    storage.set('showFindings', $(this).prop("checked"));
});


$(document).ready(function() {
    init();
});
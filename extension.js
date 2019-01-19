function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


let init = function () {
    loadForm();
    $('#wrapper').css({'opacity': 1, 'transition': 'opacity .2s ease-out'});
};


let globalPopup = {
    settings: {},
    outputVar: (varName, globalSettings) => {
        outputVar('#globalStorage', varName, globalSettings[varName]);
    },
    toggleHTML: (varName, text, related) => {
        createToggle('#globalInput', 'global', varName, text, globalPopup.settings[varName]);
        if (related) {
            globalPopup.toggleRelated(varName, related);
        }
    },
    toggleRelated: (varName, relatedName) => {
        let globalName = 'global' + capitalizeFirstLetter(varName);
        let pageName = 'page' + capitalizeFirstLetter(varName);
        let pageRelated = 'page' + capitalizeFirstLetter(relatedName);
        if ($('#' + globalName).prop("checked") === true) {
            $('#' + pageName).parent('div').hide();
        } else {
            $('#' + pageRelated).parent('div').hide()
        }
    }
};

let pagePopup = {
    settings: {},
    toggleHTML: (varName, text) => {
        createToggle('#pageInput', 'page', varName, text, pagePopup.settings[varName]);
    }
}




let outputVar = (selector, variable, value) => {
    if (typeof value !== "undefined") {
        $(selector).append('<nobr><div>' + variable + ' <code>' + value) + '</code></div></nobr>';
    }
};


let createToggle = (selector, scope, varName, text, value) => {
    let id = scope + capitalizeFirstLetter(varName);
    $(selector).append(
        '<div class="custom-control custom-switch">\n' +
        '<input type="checkbox" class="custom-control-input toggle" id="' + id + '" data-varName="' + varName + '" data-scope="' + scope + '">\n' +
        '<label class="custom-control-label" for="' + id + '">\n' +
        '<nobr>' + text + '</nobr>\n' +
        '</label>\n' +
        '</div>'
    );
    $('#' + id).prop("checked", value);
};


let checkToggle = (selector, value) => {
    $(selector).prop("checked", value);
};


let outputPageVar = (varName, pageSettings) => {
    outputVar('#pageStorage', varName, pageSettings[varName]);
};



let loadForm = function () {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {}, function(response) {

            chrome.storage.local.get([response.name], function(result) {
                if (result[response.name]) {
                    pagePopup.settings = result[response.name];
                    pagePopup.toggleHTML('defaultToTopImage', 'Start on first slice');
                    pagePopup.toggleHTML('defaultSlice', 'Start on default slice');
                    pagePopup.toggleHTML('hideFindings', 'Hide findings');
                    pagePopup.toggleHTML('showFindings', 'Show findings');
                }
            });

            chrome.storage.local.get([response.global], function(result) {
                if (result[response.global]) {
                    globalPopup.settings = result[response.global];
                    globalPopup.toggleHTML('defaultToTopImage', 'Start on first slice', 'defaultSlice');
                    globalPopup.toggleHTML('hideFindings', 'Hide findings', 'showFindings');
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


$(document).on('change', '.toggle', function() {
    let varName = $(this).attr('data-varName');
    let scope = $(this).attr('data-scope');
    let global = (scope === 'global');
    storage.set(varName, $(this).prop("checked"), global);
});

$(document).on('change', '#globalDefaultToTopImage', function() {
    $('#pageDefaultToTopImage').parent('div').toggle();
    $('#pageDefaultSlice').parent('div').toggle();
});

$(document).on('change', '#globalHideFindings', function() {
    $('#pageHideFindings').parent('div').toggle();
    $('#pageShowFindings').parent('div').toggle();
});




$(document).ready(function() {
    init();
});
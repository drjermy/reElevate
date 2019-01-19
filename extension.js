function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


let init = function () {
    loadForm();
    $('#wrapper').css({'opacity': 1, 'transition': 'opacity .2s ease-out'});
};


let globalPopup = {
    settings: {},
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


let loadForm = function () {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {}, function(response) {

            if (response.series) {
                for (let n in response.series) {
                    let series = response.series[n];
                    let value = series.default;
                    $('#seriesInput').append(
                        '<div class="form-group">\n' +
                        '<label for="startingSlice">Starting slice (' + n + ')</label>\n' +
                        '<input type="range" min="1" max="' + series.count + '" value="' + value + '" class="form-control-range slider" id="startingSlice' + n + '" data-studyNumber="' + n + '">\n' +
                        '</div>'
                    );
                }
            }

            chrome.storage.local.get([response.global], function(result) {
                if (result[response.global][response.name]) {
                    pagePopup.settings = result[response.global][response.name];
                    pagePopup.toggleHTML('defaultToTopImage', 'Start on first slice');
                    pagePopup.toggleHTML('defaultSlice', 'Start on selected slice');
                    pagePopup.toggleHTML('hideFindings', 'Hide findings');
                    pagePopup.toggleHTML('showFindings', 'Show findings');

                    if (response.series) {
                        for (let n in response.series) {
                            $('#startingSlice' + n).val(pagePopup.settings['startingSlice' + n]);
                        }
                    }
                }

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

                let playlist_id = response.global;
                let study_id = response.name;

                chrome.storage.local.get([playlist_id], function (result) {
                    if (!result[playlist_id]) result[playlist_id] = {};
                    if (global) {
                        if (!result[playlist_id]) result[playlist_id] = {};
                        result[playlist_id][variableName] = variableValue;
                    } else {
                        if (!result[playlist_id][study_id]) result[playlist_id][study_id] = {};
                        result[playlist_id][study_id][variableName] = variableValue;
                    }
                    console.log(result);
                    chrome.storage.local.set(result, function () {});
                });
            });
        });
    }
};


function changeSlice(sliceNumber) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {slice: sliceNumber}, function(response) {});
    });
}

function changeSeries(seriesNumber) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {series: seriesNumber}, function(response) {});
    });
}



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

$(document).on('change', '#pageDefaultToTopImage', function () {
    if ($(this).prop('checked') === true) {
        $('#startingSlice').parent('div').hide();
    } else {
        $('#startingSlice').parent('div').show();
    }
});

$(document).on('mousedown', '.slider', function () {
    changeSeries($(this).attr('data-studyNumber'));
});

$(document).on('input', '.slider', function () {
    changeSlice($(this).val());
});

$(document).on('change', '.slider', function () {
    let seriesN = $(this).attr('data-studyNumber');
    storage.set('startingSlice' + seriesN, $(this).val());
});


$(document).ready(function() {
    init();
});
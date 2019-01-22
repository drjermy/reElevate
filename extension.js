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
};




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

            if (typeof response.series !== "undefined") {
                for (let n in response.series) {
                    let series = response.series[n];
                    let value = series.default;
                    let int = Number(n) + 1;
                    $('#seriesInput').append(
                        '<div class="form-group">\n' +
                        '<label for="startingSlice">Starting slice (' + int + ')</label>\n' +
                        '<input type="range" min="1" max="' + series.count + '" value="' + value + '" class="form-control-range slider" id="startingSlice' + n + '" data-studyNumber="' + n + '">\n' +
                        '</div>'
                    );
                }
            }

            chrome.storage.local.get([response.global], function(result) {
                if (result[response.global][response.name]) {
                    pagePopup.settings = result[response.global][response.name];
                }
                pagePopup.toggleHTML('defaultToTopImage', 'Start on first slice');
                pagePopup.toggleHTML('defaultSlice', 'Start on selected slice');
                pagePopup.toggleHTML('hideFindings', 'Hide findings');
                pagePopup.toggleHTML('showFindings', 'Show findings');

                if (response.series) {
                    for (let n in response.series) {
                        $('#startingSlice' + n).val(pagePopup.settings['startingSlice' + n]);
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



function downloadJson() {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {}, function (response) {

            chrome.storage.local.get([response.global], function (result) {
                let json = result[response.global];
                if (json.backAction) delete json.backAction;
                if (json.history) delete json.history;
                let jsonOutput = JSON.stringify(json, null, 4);
                saveText('playlist-' + response.global + '.json', jsonOutput);
            });
        });
    });
}


function saveText(filename, text) {
    let tempElem = document.createElement('a');
    tempElem.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    tempElem.setAttribute('download', filename);
    tempElem.click();
}


function viewJson(jsonDOM) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {}, function (response) {

            chrome.storage.local.get([response.global], function (result) {
                let json = result[response.global];
                if (json.backAction) delete json.backAction;
                if (json.history) delete json.history;
                let jsonOutput = JSON.stringify(json, null, 2);
                jsonDOM.val(jsonOutput);
            });
        });
    });
}


function loadJson() {
    let jsonDOM = $('#jsonContent');
    let jsonString = jsonDOM.val();
    let jsonObj;
    try {
        jsonObj = JSON.parse(jsonString);
    } catch (e) {
        alert('Failure parsing JSON. Make sure it is valid!');
        jsonDOM.val();
        return
    }
    $('#wrapper').show();
    $('#jsonPane').hide();

    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {}, function (response) {
            let store = {};
            let playlist_id = response.global;
            store[playlist_id] = jsonObj;
            chrome.storage.local.set(store, function () {
                location.reload();
            });
        });
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

$(document).on('click', '#downloadJson', () => {
    downloadJson();
});

$(document).on('click', '#viewJson', () => {
    $('.pane').hide();
    $('#jsonPane').show();
    viewJson($('#jsonContent'));
});

$(document).on('click', '#viewHelp', () => {
    $('.pane').hide();
    $('#helpPane').show();
});


$(document).on('click', '#saveJsonSubmit', () => {
    loadJson();
});

$(document).on('click', '#saveJsonCancel', () => {
    $('.pane').hide();
    $('#wrapper').show();
});

$(document).on('click', '#helpCancel', () => {
    $('.pane').hide();
    $('#wrapper').show();
});


$(document).ready(function() {
    init();
});
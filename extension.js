let playlistDetails;

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


let globalPopup = {
    settings: {},
    toggleHTML: (varName, text, related) => {
        createToggle('#globalInput', 'global', varName, text, globalPopup.settings[varName]);
        if (related) {
            globalPopup.toggleRelated(varName, related);
        }
    },
    hr: () => {
        $('#globalInput').append('<hr/>');
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
    },
    textInput: (varName, text) => {
        createInput('#pageInput', 'page', varName, text, pagePopup.settings[varName]);
    },
    textarea: (varName, text) => {
        createTextarea('#pageInput', 'page', varName, text, pagePopup.settings[varName]);
    },
    hr: () => {
        $('#pageInput').append('<hr/>');
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


let createInput =  (selector, scope, varName, text, value) => {
    let id = scope + capitalizeFirstLetter(varName);
    $(selector).append(
        '<div class="mt-1">' +
        '<input type="text" class="form-control" id="' + id + '" data-varName="' + varName + '" data-scope="' + scope + '" placeholder="' + text + '">' +
        '</div>'
    );
    $('#' + id).val(value);
    $(document).on('keyup', '#' + id, function() {
        storage.set(varName, $(this).val());
    });
};


let createTextarea =  (selector, scope, varName, text, value) => {
    let id = scope + capitalizeFirstLetter(varName);
    $(selector).append(
        '<div class="mt-1">' +
        '<textarea type="text" class="form-control" id="' + id + '" data-varName="' + varName + '" data-scope="' + scope + '" placeholder="' + text + '"></textarea>' +
        '</div>'
    );
    $('#' + id).val(value);
    $(document).on('keyup', '#' + id, function() {
        storage.set(varName, $(this).val());
    });
};


let loadDetails = () => {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {}, function (response) {
            if (typeof response !== "undefined") {
                playlistDetails = response;
                $('#introduction').hide();
                $('#navigation').show();
                loadForm();
            }
        });
    });
};

let loadForm = () => {
    response = playlistDetails;

    if (typeof response.series !== "undefined") {

        // Create sliders for selecting starting slices.
        for (let n in response.series) {
            let series = response.series[n];
            if (series.count > 1) {
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

        // Create a dropdown to select starting series.
        if (Object.keys(response.series).length > 1) {
            let options = '<option disabled>Select default</option>';
            for (let n in response.series) {
                // We are saving them as if they started from 1 even though the thumbs are 0-indexed.
                let int = Number(n) + 1;
                options += '<option value="' + int + '">Series ' + int + '</option>';
            }

            $('#seriesInput').append(
                '<p>Default series</p>' +
                '<select id="startingSeries" placeholder="Starting series">' +
                options +
                '</select>'
            );
        }
    }

    chrome.storage.local.get([response.global], function(result) {
        if (result[response.global][response.name]) {
            pagePopup.settings = result[response.global][response.name];
        }
        pagePopup.toggleHTML('maximiseCase', 'Maximise');
        pagePopup.hr();
        pagePopup.toggleHTML('defaultToTopImage', 'Start on first slice');
        pagePopup.toggleHTML('defaultSlice', 'Start on selected slice');
        pagePopup.toggleHTML('hideFindings', 'Hide findings');
        pagePopup.toggleHTML('showFindings', 'Show findings');
        pagePopup.toggleHTML('showPresentation', 'Show presentation');
        pagePopup.toggleHTML('hidePresentation', 'Hide presentation');
        pagePopup.hr();
        pagePopup.textInput('presentationAge', 'Age');
        pagePopup.textInput('presentationGender', 'Gender');
        pagePopup.textarea('presentationPresentation', 'Presentation');

        if (response.series) {
            for (let n in response.series) {
                $('#startingSlice' + n).val(pagePopup.settings['startingSlice' + n]);
            }
            $('#startingSeries').val(pagePopup.settings.startingSeries);
        }

        if (result[response.global]) {
            globalPopup.settings = result[response.global];
            globalPopup.toggleHTML('headerVisible', 'Visible header');
            globalPopup.toggleHTML('sidebarVisible', 'Visible sidebar');
            globalPopup.toggleHTML('footerVisible', 'Visible footer');
            globalPopup.hr();
            globalPopup.toggleHTML('defaultToTopImage', 'Start on first slice', 'defaultSlice');
            globalPopup.toggleHTML('hideFindings', 'Hide findings', 'showFindings');
            globalPopup.toggleHTML('showPresentation', 'Show presentation', 'hidePresentation');
            globalPopup.toggleHTML('hideTabs', 'Hide tabs');
        }
    });

};


let storage = {
    set:(variableName, variableValue, global) => {
        response = playlistDetails;
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
    }
};


function changeSlice(sliceNumber) {
    tabRequest( {slice: sliceNumber} );
}

function changeSeries(seriesNumber) {
    tabRequest( {series: seriesNumber} );
}



function downloadJson() {
    response = playlistDetails;
    chrome.storage.local.get([response.global], function (result) {
        let json = result[response.global];
        if (json.backAction) delete json.backAction;
        if (json.history) delete json.history;
        let jsonOutput = JSON.stringify(json, null, 4);
        saveText('playlist-' + response.global + '.json', jsonOutput);
    });
}


function saveText(filename, text) {
    let tempElem = document.createElement('a');
    tempElem.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    tempElem.setAttribute('download', filename);
    tempElem.click();
}


function viewJson(jsonDOM) {
    response = playlistDetails;
    chrome.storage.local.get([response.global], function (result) {
        let json = result[response.global];
        if (json.backAction) delete json.backAction;
        if (json.history) delete json.history;
        let jsonOutput = JSON.stringify(json, null, 2);
        jsonDOM.val(jsonOutput);
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

    response = playlistDetails;
    let store = {};
    let playlist_id = response.global;
    store[playlist_id] = jsonObj;
    chrome.storage.local.set(store, function () {
        extensionReload();
    });
}


let extensionReload = () => {
    location.reload();
};


let tabAction = (action) => {
    let request = {};
    request.action = action;
    tabRequest(request);
};


let tabRequest = (request) => {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, request, function (response) {});
    });
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

$(document).on('change', '#globalShowPresentation', function() {
    $('#pageShowPresentation').parent('div').toggle();
    $('#pageHidePresentation').parent('div').toggle();
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

$(document).on('change', '#startingSeries', function () {
    storage.set('startingSeries', $(this).val());
});



$(document).on('click', '#viewPlaylist', function() {
    $('.pane').hide();
    $('#playlistPane').show();
    $('#reloadPane').show();
});

$(document).on('click', '#viewStudy', function() {
    $('.pane').hide();
    $('#studyPane').show();
    $('#reloadPane').show();
});

$(document).on('click', '#viewSeries', function() {
    $('.pane').hide();
    $('#seriesPane').show();
    $('#reloadPane').show();
});

$(document).on('click', '#viewJson', function() {
    $('.pane').hide();
    $('#jsonPane').show();
    viewJson($('#jsonContent'));
});

$(document).on('click', '#viewHelp', function() {
    $('.pane').hide();
    $('#helpPane').show();
});

$(document).on('click', '#downloadJson', function() {
    downloadJson();
});

$(document).on('click', '#saveJsonSubmit', function() {
    loadJson();
});

$(document).on('click', '.actionButton', function() {
    let action = $(this).attr('data-action');
    tabAction(action);
});


$(document).ready(function() {
    loadDetails();
    $('#seriesPane').show();
    $('#reloadPane').show();
});
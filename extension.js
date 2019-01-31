/*********************
 * GENERAL FUNCTIONS *
 *********************/

/**
 * Capitalise the first letter of a string.
 *
 * @param string
 * @returns {string}
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


/**
 * Create a downloadable file with text.
 *
 * @param filename
 * @param text
 */
function saveText(filename, text) {
    let tempElem = document.createElement('a');
    tempElem.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    tempElem.setAttribute('download', filename);
    tempElem.click();
}


/**
 * Send a request object to the current tab.
 *
 * @param request
 */
function tabRequest(request) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, request, function (response) {});
    });
}


/**
 * Wrap up an action and ping the current tab.
 *
 * @param action
 */
function tabAction (action) {
    let request = {};
    request.action = action;
    tabRequest(request);
}


/**
 * Change the slicenumber in the live playlist tab.
 *
 * @param sliceNumber
 */
function changeSlice(sliceNumber) {
    tabRequest( {slice: sliceNumber} );
}


/**
 * Change the current series in the live playlist tab.
 *
 * @param seriesNumber
 */
function changeSeries(seriesNumber) {
    tabRequest( {series: seriesNumber} );
}


/**
 * Reload the extension.
 */
let extensionReload = () => {
    location.reload();
};


/** POPUP OBJECTS **/

/**
 * An object of related playlist config values and methods.
 * The init method is called immediately after page-load.
 */
let playlist = {
    offlineMode: null, // (bool) for whether we are online or offline.
    tab: null, // the tab object from the current chrome tab (used to get URL).
    vars: {}, // extracted variables.
    init: (tab) => {
        playlist.tab = tab;
        playlist.isOffline();
        playlist.varsFromUrl();
    },
    isOffline: () => { // Determine whether we are online or offline.
        playlist.offlineMode = (playlist.tab.url.split('://')[0] === 'file');
    },
    varsFromUrl: () => { // Gather all the vars from the URL (different format for online and offline).
        let pathArray = playlist.tab.url.split('/');
        if (playlist.offlineMode === true) {
            let lastPart = pathArray.pop();
            let partsArray = lastPart.split('.html')[0].split('_');
            playlist.vars = {
                playlistId: partsArray[1],
                entryId: partsArray[3],
                caseId: partsArray[5],
                studyId: partsArray[7]
            };
        } else {
            playlist.vars = {
                playlistId: pathArray[2],
                entryId: pathArray[4],
                caseId: pathArray[6],
                studyId: pathArray[8]
            };
        }
    },
    playlist_id: () => { // Create the playlist id that is used as the location for playlist config.
        return 'radiopaedia' + '-' + playlist.vars.playlistId;
    },
    case_id: () => { // Create the case id that is used as the location for case config.
        return 'radiopaedia' + '-' + playlist.vars.playlistId + '-' + playlist.vars.entryId + '-' + playlist.vars.caseId;
    },
    study_id: () => { // Create the study id that is used as the location for study config.
        return 'radiopaedia' + '-' + playlist.vars.playlistId + '-' + playlist.vars.entryId + '-' + playlist.vars.caseId + '-' + playlist.vars.studyId;
    },
    store: (variableName, variableValue, scope = 'page') => { // Store a name => value pair to a scope.
        let playlist_id = playlist.playlist_id();
        let case_id = playlist.case_id();
        let study_id = playlist.study_id();

        chrome.storage.local.get([playlist_id], function (result) {
            if (!result[playlist_id]) {
                result[playlist_id] = {};
            }
            if (scope === 'global') {
                if (!result[playlist_id]) result[playlist_id] = {};
                result[playlist_id][variableName] = variableValue;
            }
            if (scope === 'case') {
                if (!result[playlist_id][case_id]) result[playlist_id][case_id] = {};
                result[playlist_id][case_id][variableName] = variableValue;
            }
            if (scope === 'page') {
                if (!result[playlist_id][study_id]) result[playlist_id][study_id] = {};
                result[playlist_id][study_id][variableName] = variableValue;
            }
            chrome.storage.local.set(result, function () {});
        });
    }
};


/**
 * Json object with methods for view, load and download.
 */
let json = {
    view: function() {
        response = playlistDetails;
        chrome.storage.local.get([response.global], function (result) {
            let json = result[response.global];
            if (json.backAction) delete json.backAction;
            if (json.history) delete json.history;
            let jsonOutput = JSON.stringify(json, null, 2);
            $('#jsonContent').val(jsonOutput);
        });
    },

    load: function() {
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
    },

    download: function() {
        response = playlistDetails;
        chrome.storage.local.get([response.global], function (result) {
            let json = result[response.global];
            if (json.backAction) delete json.backAction;
            if (json.history) delete json.history;
            let jsonOutput = JSON.stringify(json, null, 4);
            saveText('playlist-' + response.global + '.json', jsonOutput);
        });
    }
};


/**
 * Form object with methods for toggle, input and textarea.
 */
let form = {
    toggle: function(selector, scope, varName, text, value) {
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
        $(document).on('change', '#' + id, function() {
            playlist.store(varName, $(this).prop("checked"), scope);
        });
    },

    input: function(selector, scope, varName, text, value) {
        let id = scope + capitalizeFirstLetter(varName);
        $(selector).append(
            '<div class="form-group mt-1">' +
            '<label for="' + id + '">' + text + '</label>' +
            '<input type="text" class="form-control" id="' + id + '" data-varName="' + varName + '" data-scope="' + scope + '" placeholder="' + text + '">' +
            '</div>'
        );
        $('#' + id).val(value);
        $(document).on('keyup', '#' + id, function() {
            playlist.store(varName, $(this).val(), scope);
        });
    },

    textarea: function(selector, scope, varName, text, value) {
        let id = scope + capitalizeFirstLetter(varName);
        $(selector).append(
            '<div class="form-group mt-1">' +
            '<label for="' + id + '">' + text + '</label>' +
            '<textarea type="text" class="form-control" id="' + id + '" data-varName="' + varName + '" data-scope="' + scope + '" placeholder="' + text + '"></textarea>' +
            '</div>'
        );
        $('#' + id).val(value);
        $(document).on('keyup', '#' + id, function() {
            playlist.store(varName, $(this).val(), scope);
        });
    }
};


/**
 * Object to initiate the popup.
 */
let popup = {
    load: function() {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {}, function (response) {
                if (typeof response !== "undefined") {
                    playlistDetails = response;
                    popup.introduction.hide();
                    popup.navigation.show();
                    popup.series.show();
                    popup.reload.show();
                    loadForm();
                }
            });
        });
    },
    introduction: {
        hide: function() {
            $('#introduction').hide();
        }
    },
    navigation: {
        show: function() {
            $('#navigation').show();
        }
    },
    series: {
        show: function() {
            $('#seriesPane').show();
        }
    },
    reload: {
        show: function() {
            $('#reloadPane').show();
        }
    }
};



let playlistTab = {
    settings: {},
    toggleHTML: (varName, text, related, relatedScope = 'page') => {
        form.toggle('#globalInput', 'global', varName, text, playlistTab.settings[varName]);
        if (related) {
            playlistTab.toggleRelated(varName, related, relatedScope);
        }
    },
    hr: () => {
        $('#globalInput').append('<hr/>');
    },
    toggleRelated: (varName, relatedName, scope) => {
        let globalName = 'global' + capitalizeFirstLetter(varName);
        let pageName = scope + capitalizeFirstLetter(varName);
        let pageRelated = scope + capitalizeFirstLetter(relatedName);
        if ($('#' + globalName).prop("checked") === true) {
            $('#' + pageName).parent('div').hide();
        } else {
            $('#' + pageRelated).parent('div').hide()
        }
    }
};


let caseTab = {
    settings: {},
    toggleHTML: (varName, text) => {
        form.toggle('#caseInput', 'case', varName, text, caseTab.settings[varName]);
    },
    textInput: (varName, text) => {
        form.input('#caseInput', 'case', varName, text, caseTab.settings[varName]);
    },
    textarea: (varName, text) => {
        form.textarea('#caseInput', 'case', varName, text, caseTab.settings[varName]);
    },
    hr: () => {
        $('#caseInput').append('<hr/>');
    }
};


let pagePopup = {
    settings: {},
    toggleHTML: (varName, text) => {
        form.toggle('#pageInput', 'page', varName, text, pagePopup.settings[varName]);
    },
    hr: () => {
        $('#pageInput').append('<hr/>');
    }
};



let loadForm = () => {
    response = playlistDetails;

    chrome.storage.local.get([response.global], function(result) {

        if (result[response.global][response.name]) {
            pagePopup.settings = result[response.global][response.name];
        }

        pagePopup.toggleHTML('maximiseCase', 'Maximise');
        pagePopup.toggleHTML('defaultToTopImage', 'Start on first slice');
        pagePopup.toggleHTML('defaultSlice', 'Start on selected slice');
        pagePopup.hr();

        if (result[response.global][response.case]) {
            caseTab.settings = result[response.global][response.case];
        }

        caseTab.toggleHTML('showPresentation', 'Show presentation');
        caseTab.textInput('presentationAge', 'Age');
        caseTab.textInput('presentationGender', 'Gender');
        caseTab.textarea('presentationPresentation', 'Presentation');
        caseTab.toggleHTML('hideFindings', 'Hide findings');
        caseTab.toggleHTML('showFindings', 'Show findings');


        if (response.series) {
            for (let n in response.series) {
                $('#startingSlice' + n).val(pagePopup.settings['startingSlice' + n]);
            }
            $('#startingSeries').val(pagePopup.settings.startingSeries);
        }

        if (result[response.global]) {
            playlistTab.settings = result[response.global];
            playlistTab.toggleHTML('headerVisible', 'Visible header');
            playlistTab.toggleHTML('sidebarVisible', 'Visible sidebar');
            playlistTab.toggleHTML('footerVisible', 'Visible footer');
            playlistTab.hr();
            playlistTab.toggleHTML('defaultToTopImage', 'Start on first slice', 'defaultSlice');
            playlistTab.toggleHTML('hideFindings', 'Hide findings', 'showFindings', 'case');
            playlistTab.toggleHTML('hideTabs', 'Hide tabs');
        }

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

                $('#pageInput').append(
                    '<label for="startingSeries">Default series</label>\n' +
                    '<select id="startingSeries" placeholder="Starting series">' +
                    options +
                    '</select>'
                );
            }
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






$(document).on('change', '#globalDefaultToTopImage', function() {
    $('#pageDefaultToTopImage').parent('div').toggle();
    $('#pageDefaultSlice').parent('div').toggle();
});


$(document).on('change', '#globalHideFindings', function() {
    $('#caseHideFindings').parent('div').toggle();
    $('#caseShowFindings').parent('div').toggle();
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


$(document).on('click', '#viewJson', function() {
    json.view();
});


$(document).on('click', '#downloadJson', function() {
    json.download();
});


$(document).on('click', '#saveJsonSubmit', function() {
    json.load();
});


$(document).on('click', '.actionButton', function() {
    tabAction($(this).attr('data-action'));
});


$(document).on('click', '.openButton', function () {
    let pane = $(this).attr('data-open');
    $('.pane').hide();
    $('#' + pane).show();
    $('#reloadPane').show();
});





/**
 * Wait until the document is ready and initialse the playlist and load.
 */
$(document).ready(function() {
    chrome.tabs.getSelected(null, function(tab) {
        playlist.init(tab);
        popup.load();
    });
});

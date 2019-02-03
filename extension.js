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
    store: (variableName, variableValue, scope = 'study') => { // Store a name => value pair to a scope.
        let playlist_id = playlist.playlist_id();
        let case_id = playlist.case_id();
        let study_id = playlist.study_id();

        chrome.storage.local.get([playlist_id], function (result) {
            if (!result[playlist_id]) {
                result[playlist_id] = {};
            }
            if (scope === 'playlist') {
                if (!result[playlist_id]) result[playlist_id] = {};
                result[playlist_id][variableName] = variableValue;
            }
            if (scope === 'case') {
                if (!result[playlist_id][case_id]) result[playlist_id][case_id] = {};
                result[playlist_id][case_id][variableName] = variableValue;
            }
            if (scope === 'study') {
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
        chrome.storage.local.get([response.playlist], function (result) {
            let json = result[response.playlist];
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
        let playlist_id = response.playlist;
        store[playlist_id] = jsonObj;
        chrome.storage.local.set(store, function () {
            extensionReload();
        });
    },
    download: function() {
        response = playlistDetails;
        chrome.storage.local.get([response.playlist], function (result) {
            let json = result[response.playlist];
            if (json.backAction) delete json.backAction;
            if (json.history) delete json.history;
            let jsonOutput = JSON.stringify(json, null, 4);
            saveText('playlist-' + response.playlist + '.json', jsonOutput);
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
                    $('#introduction').hide();
                    $('#navigation').show();
                    loadForm();
                }
            });
        });
    }
};


let loadForm = () => {
    response = playlistDetails;

    chrome.storage.local.get([response.playlist], function(result) {

        /**
         * Take a selector and get the value from storage that relates to it.
         * @param that
         * @returns {*}
         */
        let getValueFromStorage = function (that) {
            let varName = $(that).attr('data-variable');
            let scope = $(that).parents('.popper-wrapper').attr('data-scope');

            if (typeof scope !== "undefined") {

                let settings = result[response.playlist];
                if (scope !== 'playlist') {
                    settings = settings[response[scope]];
                }
                if (typeof settings === "undefined") {
                    settings = {};
                }

                let defaultValue = $(that).attr('data-default');
                if (typeof settings[varName] === "undefined") {
                    settings[varName] = defaultValue;
                }
                return settings[varName];
            }
        };


        /**
         * Take a selector and make sure visibility of it and related elements are set.
         * @param that
         */
        let setVisibility = function (that) {
            let varName = $(that).attr('data-variable');
            let scope = $(that).parents('.popper-wrapper').attr('data-scope');

            if ($(that).prop('checked') === true) {
                if (scope === 'playlist') {
                    $('#caseInput .toggle[data-variable="' + varName + '"]').parent('div').hide();
                    $('#caseInput .toggle[data-relation="' + varName + '"]').parent('div').show();
                }
                if (scope !== 'study') {
                    $('#studyInput .toggle[data-variable="' + varName + '"]').parent('div').hide();
                    $('#studyInput .toggle[data-relation="' + varName + '"]').parent('div').show();
                }
            } else {
                if (scope === 'playlist') {
                    $('#caseInput .toggle[data-relation="' + varName + '"]').parent('div').hide();
                    $('#caseInput .toggle[data-variable="' + varName + '"]').parent('div').show();
                }
                if (scope !== 'study') {
                    $('#studyInput .toggle[data-relation="' + varName + '"]').parent('div').hide();
                    $('#studyInput .toggle[data-variable="' + varName + '"]').parent('div').show();
                }
            }
        };


        /**
         * Set up initial state for toggles and introduce triggers for change.
         */
        $('.popup-toggle').each(function () {
            let value = getValueFromStorage(this);
            $(this).prop('checked', value);

            if ($(this).attr('data-paired') === 'true') {
                setVisibility(this);
            }
        }).change(function() {
            let varName = $(this).attr('data-variable');
            let scope = $(this).parents('.popper-wrapper').attr('data-scope');
            playlist.store(varName, $(this).prop("checked"), scope);
            setVisibility(this);
        });


        /**
         * Set up initial state for text/textarea inputs and introduce triggers for keyup.
         * Triggering update on keyup means that every keystroke updates the local storage.
         */
        $('.popup-text').each(function () {
            $(this).val(getValueFromStorage(this));
        }).keyup(function() {
            let varName = $(this).attr('data-variable');
            let scope = $(this).parents('.popper-wrapper').attr('data-scope');
            playlist.store(varName, $(this).val(), scope);
        });


        if (typeof response.series !== "undefined") {

            // Create a set of selector buttons for each of the series.
            for (let n in response.series) {
                let int = Number(n) + 1;
                $('#seriesSelectorWrapper').append(
                    '<button class="ml-2 btn-sm selectSeries" data-series="' + int + '">' + int + '</button>'
                );
                $('#seriesEditorWrapper').append(
                    '<div class="form-group seriesSelector" data-series="' + int + '"></div>'
                );
            }

            // Create sliders for selecting starting slices.
            for (let n in response.series) {
                let series = response.series[n];
                let int = Number(n) + 1;

                let defaultValue = series.default;
                let sliceValue;
                if (typeof result[response.playlist][response.study] !== "undefined" || typeof result[response.playlist][response.study]['startingSlice' + n] !== "undefined") {
                    sliceValue = result[response.playlist][response.study]['startingSlice' + n];
                } else {
                    sliceValue = defaultValue;
                }

                // Get the pane where the items are added.
                let seriesEditor = $('.seriesSelector[data-series="' + int + '"]');

                // Add buttons for saving current values and reset.
                // Saving will include any canvas elements that we have set up.
                seriesEditor.append(
                    '<button class="ml-2 btn-sm selectDefaultSeries" data-series="' + int + '">D</button>' +
                    '<button class="ml-2 btn-sm getSeriesData" data-series="' + int + '">save</button>' +
                    '<button class="ml-2 btn-sm deselectSlice" data-series="' + int + '">&#8635;</button>'
                );

                // If we have more than 1 slice in a series, add the slider.
                if (series.count > 1) {
                    seriesEditor.append(
                        '<input type="range" min="1" max="' + series.count + '" value="' + sliceValue + '" class="mt-2 form-control-range slider" id="startingSlice' + n + '" data-studyNumber="' + n + '" data-default="' + defaultValue + '"  data-series="' + int + '" disabled>'
                    );
                }
            }

            
            // Create a trigger for the select button.
            $(document).on('click', '.selectSeries', function  () {
                let n = $(this).attr('data-series');
                $('.selectSeries').removeClass('outline-warning');
                $(this).addClass('outline-warning');
                changeSeries(Number(n) - 1);
                $('.seriesSelector').hide();
                $('.seriesSelector[data-series="' + n + '"]').show();
            });


            // UX change and save default series.
            $(document).on('click', '.selectDefaultSeries', function () {
                let seriesNumber = $(this).attr('data-series');
                $('.selectSeries').removeClass('btn-warning');
                $('.selectSeries[data-series="' + seriesNumber + '"]').addClass('btn-warning');
                playlist.store('startingSeries', seriesNumber);
            });


            // Create a trigger to get the current values for the selected series and save them.
            $(document).on('click', '.getSeriesData', function () {
                let n = $(this).attr('data-series');
                let request = {getData: n};
                chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, request, function (response) {
                        if (typeof response.series !== "undefined") {
                            let id = 'startingSlice' + response.series;
                            $('#' + id).val(response.slice);
                            playlist.store(id, response.slice);
                        }
                    });
                });
            });


            // Create a trigger for the deselect button - set back to default and remove storage item.
            $(document).on('click', '.deselectSlice', function () {
                let n = Number($(this).attr('data-series')) - 1;
                let id = 'startingSlice' + n;
                let defaultValue = Number($(this).attr('data-default'));
                playlist.store(id, undefined);
                $('#' + id).val(defaultValue);
            });


            // Select the default series.
            let defaultSeries
            if (typeof result[response.playlist][response.study]['startingSeries'] !== "undefined") {
                defaultSeries = Number(result[response.playlist][response.study]['startingSeries']);
            } else {
                defaultSeries = 1;
            }
            $('.selectSeries[data-series="' + defaultSeries + '"]').addClass('btn-warning');

            // Select the current series.
            let currentSeries = Number(response.currentSeries) + 1;
            $('.selectSeries[data-series="' + currentSeries + '"]').click().focus();

            // Click the viewStudy pane button and give it focus.
            $('#viewStudy').click().focus();

        }

    });

};


$('#viewJson').click(function() {
    json.view();
});


$('#downloadJson').click(function() {
    json.download();
});


$('#saveJsonSubmit').click(function() {
    json.load();
});


$(document).on('click', '.actionButton', function() {
    tabAction($(this).attr('data-action'));
});


$(document).on('click', '.openButton', function () {
    let pane = $(this).attr('data-open');
    $('.openButton').removeClass('btn-primary');
    $(this).addClass('btn-primary');
    $('.pane').hide();
    $('#' + pane).show();
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

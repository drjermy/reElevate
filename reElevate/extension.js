/*********************
 * GENERAL FUNCTIONS *
 *********************/

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
function tabRequest(request, bClose) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, request, function (response) {
            if (bClose === true) {
                window.close();
            }
        });
    });
}


/**
 * Wrap up an action and ping the current tab.
 *
 * @param action
 */
function tabAction (action, bClose) {
    let request = {};
    request.action = action;
    tabRequest(request, bClose);
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
    tab: null, // the tab object from the current chrome tab (used to get URL).
    vars: {}, // extracted variables.
    init: (tab) => {
        playlist.tab = tab;
        playlist.varsFromUrl();
    },
    hasStudyId: () => {
        return typeof playlist.vars.studyId === 'undefined';
    },
    varsFromUrl: () => {

        let pathname = playlist.tab.url

        let playlistIds = {}

        let regex = /play_([0-9]*).*\.html/
        let pathParts = pathname.match(regex)
        playlistIds.playlistId = pathParts[1]

        let regex1 = /play_.*_entry_([0-9]*).*\.html/
        let pathParts1 = pathname.match(regex1)
        playlistIds.playlistId = pathParts[1]

        if (pathParts1) {
            playlistIds.entryId = pathParts[1]
        }

        let regex2 = /play_.*_case_([0-9]*)_studies_([0-9]*)\.html/
        let pathParts2 = pathname.match(regex2)

        if (pathParts2) {
            playlistIds.caseId = pathParts2[1]
            playlistIds.studyId = pathParts2[2]
        }

        let regex3 = /play_.*_slide_([0-9]*)\.html/
        let pathParts3 = pathname.match(regex3)

        if (pathParts3) {
            playlistIds.slideId = pathParts3[1]
        }

        playlist.vars = playlistIds
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
    jumpTo_url: () => {
        return '/' + playlist.tab.url.split('pages/')[1].split('.html')[0].split('_').join('/');
    },
    store: (variableName, variableValue, scope = 'study') => { // Store a name => value pair to a scope.
        let playlist_id = playlist.playlist_id();
        let case_id = playlist.case_id();
        let study_id = playlist.study_id();

        chrome.storage.local.get([playlist_id], function (result) {
            if (!result[playlist_id]) {
                result[playlist_id] = {};
            }
            if (scope === 'slide') {
                if (!result[playlist_id][case_id]) result[playlist_id][case_id] = {};
                result[playlist_id][case_id][variableName] = variableValue;
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
    },
    storeStudy: (saveObject) => { // Store a name => value pair to a scope.
        let playlist_id = playlist.playlist_id();
        let study_id = playlist.study_id();

        chrome.storage.local.get([playlist_id], function (result) {
            if (!result[playlist_id]) result[playlist_id] = {};
            if (!result[playlist_id][study_id]) result[playlist_id][study_id] = {};

            $.each(saveObject, function(variableName, variableValue) {
                result[playlist_id][study_id][variableName] = variableValue;
            });

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
            //if (json.history) delete json.history;
            let jsonOutput = JSON.stringify(json, null, 2);
            $('#jsonContent').val(jsonOutput);
        });
    },
    load: function() {
        let jsonDOM = $('#jsonContent');
        let jsonString = jsonDOM.val();
        if (jsonString === '') jsonString = '{}';
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


let loadForm;
loadForm = () => {
    response = playlistDetails;

    chrome.storage.local.get([response.playlist], function (result) {

        let getPageValue = function (varName) {
            if (typeof result[response.playlist] !== "undefined" &&
                typeof result[response.playlist][response.study] !== "undefined" &&
                typeof result[response.playlist][response.study][varName] !== "undefined") {
                return result[response.playlist][response.study][varName];
            }
        };

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
                    if (scope === 'slide') {
                        settings = settings[response['case']];
                    } else {
                        settings = settings[response[scope]];
                    }
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
        }).change(function () {
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
        }).keyup(function () {
            let varName = $(this).attr('data-variable');
            let scope = $(this).parents('.popper-wrapper').attr('data-scope');
            playlist.store(varName, $(this).val(), scope);
        });


        if (typeof response.series !== "undefined") {

            let numberOfSeries = Object.keys(response.series).length;
            $('#studySelectorWrapper').append(
                '<div class="mt-2"><button id="saveStudyState" class="btn-sm">Save state for <strong>a</strong>ll series</button></div>'
            );

            // Create a set of selector buttons for each of the series.
            for (let n in response.series) {
                let int = Number(n) + 1;

                let buttonCSS = 'btn-sm';
                if (response.series[n].state === 'unsaved') {
                    buttonCSS += ' btn-outline-danger';
                }

                $('#seriesSelectorWrapper').append(
                    '<button class="ml-2 selectSeries ' + buttonCSS + '" data-series="' + int + '">' + int + '</button>'
                );

                // Create a show/hide pane for the controls for this series.
                $('#seriesEditorWrapper').append(
                    '<div class="form-group seriesSelector" data-series="' + int + '"></div>'
                );
            }

            // Create panes for editing series.
            for (let n in response.series) {
                let series = response.series[n];
                let int = Number(n) + 1;

                let defaultValue = series.default;
                let sliceValue = getPageValue('startingSlice' + n);
                if (typeof sliceValue === "undefined") {
                    sliceValue = defaultValue;
                }

                // Get the pane where the items are added.
                let seriesEditor = $('.seriesSelector[data-series="' + int + '"]');

                // Add buttons for saving current values and reset.
                // Saving will include any canvas elements that we have set up.
                seriesEditor.append(
                    '<button class="ml-2 btn-sm selectDefaultSeries" data-series="' + int + '"><strong>D</strong>efault series</button>'
                );

                let hideSeries = getPageValue('hideSeries' + n);
                if (hideSeries === true) {
                    $('.selectSeries[data-series="' + int + '"]').addClass('hiddenSlice')
                    seriesEditor.append(
                        '<button class="ml-2 btn-sm hideSeries" data-series="' + int + '">Un<strong>h</strong>ide</button>'
                    );
                } else {
                    seriesEditor.append(
                        '<button class="ml-2 btn-sm hideSeries" data-series="' + int + '"><strong>H</strong>ide</button>'
                    );
                }

                // https://dev.w3.org/html5/html-author/charref
                seriesEditor.append(
                    '<div class="mt-2">' +
                    '<button class="ml-2 btn-sm getSeriesData" data-series="' + int + '"><strong>S</strong>ave series state</button>' +
                    '<button class="ml-2 btn-sm resetSlice" data-series="' + int + '"><strong>R</strong>eset</button>' +
                    '</div>'
                );


                // Create a set of selector buttons to clone state.
                if (numberOfSeries > 1) {
                    seriesEditor.append('<hr/><p>Clone state from:</p>');
                    for (let cloneN in response.series) {
                        let cloneInt = Number(cloneN) + 1;

                        if (int === cloneInt) {
                            seriesEditor.append(
                                '<button class="ml-2 btn-sm cloneState" disabled>' + cloneInt + '</button>'
                            );
                        } else {
                            seriesEditor.append(
                                '<button class="ml-2 btn-sm cloneState" data-series="' + n + '" data-clone="' + cloneN + '">' + cloneInt + '</button>'
                            );
                        }
                    }
                }

            }


            $('#saveJumpTo').click(function () {
                $('#playlistJumpURL').val(playlist.jumpTo_url());
                playlist.store('jumpURL', playlist.jumpTo_url(), 'playlist');
            });


            $('#removeJumpTo').click(function () {
                $('#playlistJumpURL').val('');
                playlist.store('jumpURL', '', 'playlist');
            });


            $(document).on('click', '#saveStudyState', function () {
                let currentSeries = $('.selectSeries.active').attr('data-series');
                $('.selectDefaultSeries[data-series="' + currentSeries + '"]').click().focus();

                let request = {lastPositions: true};
                chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, request, function (response) {
                        let storeObject = {};
                        $.each(response, function (seriesNumber, stateObject) {
                            // Store the received state object.
                            storeObject['series' + seriesNumber] = stateObject;

                            // Update the values in the form fields.
                            $.each(stateObject, function (varName, varValue) {
                                $('#' + varName + seriesNumber).val(varValue);
                            });
                        });
                        playlist.storeStudy(storeObject);
                        $('.selectSeries').removeClass('btn-outline-danger');
                    });
                });
            });


            // Create a trigger for the select button.
            $(document).on('click', '.selectSeries', function () {
                let n = $(this).attr('data-series');
                $('.selectSeries').removeClass('outline-warning active');
                $(this).addClass('outline-warning active');
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
                chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { getData: n }, function (response) {
                        let storeObject = {};
                        if (typeof response.series !== "undefined") {
                            let stateObject = response.state;
                            storeObject['series' + response.series] = stateObject;
                            playlist.storeStudy(storeObject);
                            //alert('.selectSeries[data-series="' + (Number(response.series) + 1) + '"]');
                            $('.selectSeries[data-series="' + (Number(response.series) + 1) + '"]').removeClass('btn-outline-danger');

                            // Update the values in the form fields.
                            // TODO think that this is now irrelevant
                            $.each(stateObject, function (varName, varValue) {
                                $('#' + varName + response.series).val(varValue);
                            });

                        }
                    });
                });
            });


            // Create a trigger for the deselect button - set back to default and remove storage item.
            $(document).on('click', '.resetSlice', function () {

                let n = Number($(this).attr('data-series')) - 1;

                let playlist_id = playlist.playlist_id();
                let study_id = playlist.study_id();

                chrome.storage.local.get([playlist_id], function (result) {
                    if (!result[playlist_id]) result[playlist_id] = {};
                    if (!result[playlist_id][study_id]) result[playlist_id][study_id] = {};

                    if (typeof result[playlist_id][study_id]['series' + n]) {
                        delete result[playlist_id][study_id]['series' + n];
                    }

                    chrome.storage.local.set(result, function () {});
                    tabAction('refresh');
                });
            });


            // Create trigger to show/hide series.
            $(document).on('click', '.hideSeries', function () {
                let that = $(this);
                let n = Number(that.attr('data-series'));
                let int = n - 1;

                // TODO this should be updated to sit within the new sliceState object in the JSON.

                if (that.text() === 'Hide') {
                    that.text('Unhide');
                    $('.selectSeries[data-series="' + n + '"]').addClass('hiddenSlice');
                    playlist.store('hideSeries' + int, true);
                } else {
                    that.text('Hide');
                    $('.selectSeries[data-series="' + n + '"]').removeClass('hiddenSlice');
                    playlist.store('hideSeries' + int, undefined);
                }
            });


            $(document).on('click', '.cloneState', function() {
                let seriesId = $(this).attr('data-series');
                let cloneId = $(this).attr('data-clone');

                let playlist_id = playlist.playlist_id();
                let study_id = playlist.study_id();

                chrome.storage.local.get([playlist_id], function (result) {
                    if (!result[playlist_id]) result[playlist_id] = {};
                    if (!result[playlist_id][study_id]) result[playlist_id][study_id] = {};

                    let seriesState = result[playlist_id][study_id]['series' + seriesId];
                    let cloneState = result[playlist_id][study_id]['series' + cloneId];

                    if (typeof cloneState !== "undefined") {
                        if (typeof seriesState !== "undefined") {
                            delete result[playlist_id][study_id]['series' + seriesId];
                        }
                        result[playlist_id][study_id]['series' + seriesId] = cloneState;
                    }

                    chrome.storage.local.set(result, function () {});
                    //$('#reloadTab').click();
                });
            });


            // https://howchoo.com/g/otbhzje1nzr/how-to-handle-keyboard-events-in-jquery
            // Create bindings for keys 1 to n to select this series in the popup.
            $(document).bind('keyup', function (e) {

                let focusedElement = $(':focus');
                let isTypeable = false;

                if (focusedElement.prop('tagName') === 'INPUT' && focusedElement.attr('type') === 'text') isTypeable = true;
                if (focusedElement.prop('tagName') === 'TEXTAREA') isTypeable = true;

                if (isTypeable !== true) {

                    // Determine which series is active.

                    let keyCode = e.which;
                    let shifted = e.shiftKey;
                    let currentSeries = $('.selectSeries.active').attr('data-series');

                    //alert(keyCode);

                    if (keyCode >= 49 && keyCode <= 57) { // 1-9
                        let n = keyCode - 48;
                        $('.selectSeries[data-series="' + n + '"]').click().focus();
                    }
                    if (keyCode === 81) { // q
                        $('#viewPlaylist').click().focus();
                    }
                    if (keyCode === 87) { // w
                        $('#viewCasePane').click().focus();
                    }
                    if (keyCode === 69) { // e
                        $('#viewStudy').click().focus();
                    }
                    if (keyCode === 82 && shifted) { // shift+r
                        $('#reloadTab').click();
                    }
                    if (keyCode === 191 && shifted) { // ?
                        $('#viewHelp').click().focus();
                    }
                    if (keyCode === 37) { // left
                        tabAction('prev', true);
                    }
                    if (keyCode === 39) { // right
                        tabAction('orange', true);
                    }
                    if (keyCode === 38) { // up
                        tabAction('up');
                    }
                    if (keyCode === 40) { // down
                        tabAction('down');
                    }

                    // Perform study actions - default, hide, save state and reset
                    if (keyCode === 65) { // a
                        $('#saveStudyState').click().focus();
                    }
                    if (keyCode === 68) { // d
                        $('.selectDefaultSeries[data-series="' + currentSeries + '"]').click().focus();
                    }
                    if (keyCode === 72) { // h
                        $('.hideSeries[data-series="' + currentSeries + '"]').click().focus();
                    }
                    if (keyCode === 83) { // s
                        $('.getSeriesData[data-series="' + currentSeries + '"]').click().focus();
                    }
                    if (keyCode === 82 && !shifted) { // r
                        $('.resetSlice[data-series="' + currentSeries + '"]').click().focus();
                    }

                    if (keyCode === 90) { // z
                        if (!shifted) tabAction('zoom');
                        else tabAction('unzoom');
                    }
                }
            });


            // Select the default series.
            let defaultSeries = getPageValue('startingSeries');
            if (typeof defaultSeries === "undefined") defaultSeries = 1;
            $('.selectSeries[data-series="' + defaultSeries + '"]').addClass('btn-warning active');


            // Select the current series.
            let currentSeries = Number(response.currentSeries) + 1;
            $('.selectSeries[data-series="' + currentSeries + '"]').click().focus();

            if (numberOfSeries === 1) {
                $('.selectDefaultSeries').prop('disabled', true).addClass('disabled');
                $('.hideSeries').prop('disabled', true).addClass('disabled');
            }

            if (response.isSlide === true) {
                $('#viewStudy').prop('disabled', true).addClass('disabled');
                $('#viewCasePane').prop('disabled', true).addClass('disabled').addClass('d-none');
                $('#viewSlide').removeClass('d-none');
                $('#viewPlaylist').click().focus();
            } else {
                if (response.hasImages !== true) {
                    $('#viewStudy').prop('disabled', true).addClass('disabled');
                    $('#viewCasePane').click().focus();
                } else {
                    // Click the viewStudy pane button and give it focus.
                    $('#viewStudy').click().focus();
                }
            }

            // Show the correct slide elements.
            if ($('#slideShowClock').prop("checked")) {
                $('#slideClockSettings').show();
            }

            $('#slideShowClock').change(function() {
                if ($('#slideShowClock').prop("checked")) {
                    $('#slideClockSettings').show();
                } else {
                    $('#slideClockSettings').hide();
                }
            });

            if ($('#studyAutoScroll').prop("checked")) {
                $('#autoScrollSettings').show();
            }

            $('#studyAutoScroll').change(function() {
                if ($('#studyAutoScroll').prop("checked")) {
                    $('#autoScrollSettings').show();
                } else {
                    $('#autoScrollSettings').hide();
                }
            });


            if ($('#playlistHasClock').prop("checked")) {
                $('#clockSettings').show();
            }

            $('#playlistHasClock').change(function() {
                if ($('#playlistHasClock').prop("checked")) {
                    $('#clockSettings').show();
                } else {
                    $('#clockSettings').hide();
                }
            });

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


$(document).on('click', '#viewHelp', function() {
    $('#viewTabHelp').addClass('btn-secondary').focus();
    $('#helpTabSubPane').show();
});


$(document).on('click', '.openButton', function () {
    let pane = $(this).attr('data-open');
    $('.openButton').removeClass('btn-primary');
    $(this).addClass('btn-primary');
    $('.pane').hide();
    $('#' + pane).show();
});

$(document).on('click', '.openSubButton', function () {
    let subPane = $(this).attr('data-open');
    $('.openSubButton').removeClass('btn-secondary');
    $(this).addClass('btn-secondary');
    $('.subPane').hide();
    $('#' + subPane).show();
});


/**
 * Wait until the document is ready and initialse the playlist and load.
 */
$(document).ready(function() {
    // Get the current active tab in the lastly focused window
    chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
    }, function(tabs) {
        // and use that tab to fill in out title and url
        var tab = tabs[0];
        
        playlist.init(tab);
        popup.load();
    });
});

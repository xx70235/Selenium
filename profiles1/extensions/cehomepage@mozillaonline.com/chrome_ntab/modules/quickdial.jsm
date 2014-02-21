Components.utils['import']('resource://ntab/utils.jsm');
Components.utils['import']('resource://ntab/QuickDialData.jsm');

var Cc = Components.classes;
var Ci = Components.interfaces;
var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);

var EXPORTED_SYMBOLS = ['quickDialModule'];

function completeURL(url) {
    if (!url)
        return url;

    if (url.indexOf('http://') != 0 && url.indexOf('https://') != 0 && url.indexOf('ftp://')!=0) {
        url = 'http://' + url;
    }

    try {
        return ioService.newURI(url, null, null).spec;
    } catch (e) {
        return url;
    }
}

var dialData = QuickDialData.read();

function _notifyAllNewTab(num) {
    // Modify pref to notify all the opened new tab.
    var prefs = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('moa.ntab.dial.');
    prefs.setCharPref('update.' + num, +new Date);
}

function _onDialModified(num) {
    _notifyAllNewTab(num);
    QuickDialData.persist(dialData);
}

var quickDialModule = {
    getDial: function(num) {
        return dialData[num];
    },
    refresh: function() {
        dialData = QuickDialData.read();
    },
    /**
     * Add to blank dial directly without index given. Called by clicking on menu item.
     *
     * @return
     *     -1: no blank dial
     *  >0: blank dial index
     *
     */
    fillBlankDial: function(data) {
        var prefs = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('moa.ntab.dial.');
        var _cell = prefs.getIntPref('column');
        var _row = prefs.getIntPref('row');
        _cell = Math.max(2, Math.min(_cell, 6));
        _row = Math.max(1, Math.min(_row, 20));

        var total = _cell * _row;
        var index = -1;
        for (var i = 1; i <= total; i++) {
            if (dialData[i])
                continue;

            index = i;
            break;
        }

        if (index > 0) {
            this.updateDial(index, data);
        }

        return index;
    },

    /**
     * Update dial title if title is empty or default value.
     */
    updateTitleIfEmpty: function(url, title) {
        for (var idx in dialData) {
            if (url == dialData[idx].url && !dialData[idx].title) {
                dialData[idx].title = title;
                _onDialModified(idx);
            }
        }
    },

    updateDial: function(num, data, force) {
        // Check if cache file should be deleted.
        if (force || (dialData[num] && dialData[num].url != data.url)) {
            var delCacheFile = true;
            var url = dialData[num].url;

            delete dialData[num];

            for (var idx in dialData) {
                if (dialData[idx].url == url) {
                    delCacheFile = false;
                    break;
                }
            }

            if (delCacheFile) {
                utils.removeFile(['ntab', 'cache', utils.md5(url)]);
            }
        }

        // Update dial data
        if (!dialData[num]) {
            dialData[num] = {};
        }
        dialData[num].title = data.title;
        dialData[num].url = completeURL(data.url);

        _onDialModified(num);
    },

    snapshotDone: function(url) {
        this.refreshDialViewRelated(url);
    },

    refreshDialViewRelated: function(url) {
        for (var num in dialData) {
            if (dialData[num].url == url) {
                _notifyAllNewTab(num);
            }
        }
    },

    removeDial: function(num) {
        if (!dialData[num])
            return;

        // Check if cache file should be deleted.
        var url = dialData[num].url;
        var delCacheFile = true;

        for (var idx in dialData) {
            if (dialData[idx].url == url && ('' + num) != ('' + idx)) {
                delCacheFile = false;
                break;
            }
        }
        delete dialData[num];
        _onDialModified(num);

        if (delCacheFile) {
            utils.removeFile(['ntab', 'cache', utils.md5(url)]);
        }
    },

    exchangeDial: function(source, target) {
        if (source == target)
            return;

        var tmp = dialData[source];
        // if target is empty, then delete source data.
        if (!dialData[target]) {
            delete dialData[source];
        } else {
            dialData[source] = dialData[target];
        }

        if (!tmp) {
            delete dialData[target];
        } else {
            dialData[target] = tmp;
        }

        _onDialModified(source);
        _onDialModified(target);
    }
};

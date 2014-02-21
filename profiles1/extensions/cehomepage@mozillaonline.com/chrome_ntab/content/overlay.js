(function() {
    var ns = MOA.ns('NTab');

    var _url = 'about:ntab';
    Cu.import('resource://ntab/quickdial.jsm', ns);
    Cu.import('resource://ntab/QuickDialData.jsm', ns);
    Cu.import('resource://ntab/PartnerBookmarks.jsm', ns);
    Cu.import('resource://ntab/Tracking.jsm', ns);
    if (!window.NetUtil) {
      Cu.import('resource://gre/modules/NetUtil.jsm');
    }

    XPCOMUtils.defineLazyGetter(ns, "gScriptSecurityManager", function () {
        return (Services.scriptSecurityManager ||
                Cc["@mozilla.org/scriptsecuritymanager;1"].getService(Ci.nsIScriptSecurityManager));
    });

    XPCOMUtils.defineLazyGetter(ns, "gPrincipal", function () {
        var uri = Services.io.newURI(_url, null, null);
        return ns.gScriptSecurityManager.getCodebasePrincipal(uri);
    });

    function loadInExistingTabs() {
        if (!Services.prefs.getBoolPref("moa.ntab.loadInExistingTabs")) {
            return;
        }

        if (!Services.prefs.getBoolPref('moa.ntab.openInNewTab')) {
            return;
        }

        var chromehidden = document.getElementById('main-window').getAttribute('chromehidden');
        if (chromehidden.match(/menubar/))
            return;

        var tabs = gBrowser.tabContainer.childNodes;
        for (var i = 0; i < tabs.length; i++) {
            var tab = tabs[i];
            if (!tab.hasAttribute('busy') && !tab.hasAttribute('isPermaTab')) {
                var doc = tab.linkedBrowser.contentDocument;
                if (doc && doc.location == 'about:blank') {
                    doc.location = _url;
                    tab.linkedBrowser.userTypedValue = '';
                }
            }
        }
    }

    var overrideInstallation = {
      prefKey: 'moa.ntab.oldinstalldate',

      get oldInstallDate() {
        var oldInstallDate = '';
        try {
          oldInstallDate = Services.prefs.getCharPref(this.prefKey);
        } catch(e) {}
        return oldInstallDate;
      },

      set oldInstallDate(val) {
        try {
          Services.prefs.setCharPref(this.prefKey, val);
        } catch(e) {}
      },

      get installDateFile() {
        var installDateFile = Services.dirsvc.get('XREExeF', Ci.nsILocalFile);
        installDateFile.leafName = 'distribution';
        installDateFile.append('myextensions');

        if (!installDateFile.exists() || !installDateFile.isDirectory()) {
          installDateFile = Services.dirsvc.get('CurProcD', Ci.nsILocalFile);
          installDateFile.append('distribution');
          installDateFile.append('myextensions');
        }
        installDateFile.append('installdate.ini');

        return installDateFile;
      },

      get newInstallDate() {
        var newInstallDate = '';
        var installDateFile = this.installDateFile;
        if (!installDateFile.exists() || installDateFile.isDirectory()) {
          return '';
        }

        var iniParser = Cc['@mozilla.org/xpcom/ini-parser-factory;1'].
                          getService(Ci.nsIINIParserFactory).
                          createINIParser(installDateFile);
        var sections = iniParser.getSections();
        var section = null;

        while (sections.hasMore()) {
          section = sections.getNext();
          try {
            newInstallDate += iniParser.getString(section, 'dwLowDateTime');
            newInstallDate += iniParser.getString(section, 'dwHighDateTime');
          } catch(e) {
            return '';
          }
        }

        if (!newInstallDate) {
          var fstream = Cc['@mozilla.org/network/file-input-stream;1'].
                          createInstance(Ci.nsIFileInputStream);
          fstream.init(installDateFile, -1, 0, 0);
          newInstallDate = NetUtil.readInputStreamToString(fstream, fstream.available());
        }

        return newInstallDate;
      },

      get isOverride() {
        var everSet = !!this.oldInstallDate;
        var changed = this.oldInstallDate != this.newInstallDate;
        if (!changed) {
          delete this.isOverride;
          return this.isOverride = false;
        }

        this.oldInstallDate = this.newInstallDate;
        // only a change with an exisiting pref count as an override
        delete this.isOverride;
        return this.isOverride = everSet;
      }
    };

    var homepageReset = {
      prefKeyHomepage: "browser.startup.homepage",
      prefKeyOtherNav: "moa.homepagereset.othernav.latestcheck",
      prefKeyPotentialHijack: "moa.homepagereset.potentialhijack.",

      notificationKey: "mo-reset-cehome",

      NO_REASON: 0,
      REASON_OVERRIDE_INSTALL: 1,
      REASON_OTHER_NAV: 2,
      REASON_POTENTIAL_HIJACK: 3,

      defaultHomepage: "about:cehome",
      defaultHomepages: [
        /^about:cehome$/,
        /^http:\/\/[a-z]+\.firefoxchina\.cn/
      ],

      otherNavs: [
        /^http:\/\/www\.hao123\.com/,
        /^http:\/\/www\.2345\.com/
      ],
      firstOtherNavUrl: null,

      get homepage() {
        var homepages = [this.defaultHomepage];
        try {
          homepages = Services.prefs.getComplexValue(this.prefKeyHomepage,
            Ci.nsIPrefLocalizedString).data.split("|");
        } catch(e) {}
        return homepages;
      },

      set homepage(homepage) {
        var defaultHomepages = [homepage];
        try {
          defaultHomepages = Services.prefs.getDefaultBranch("").
            getComplexValue(this.prefKeyHomepage,
              Ci.nsIPrefLocalizedString).data.split("|");
        } catch(e) {};

        var defaultHomepageIsCEHome =
          defaultHomepages.some(function(defaultHomepage) {
            return homepage == defaultHomepage;
          });

        if (defaultHomepageIsCEHome) {
          Services.prefs.clearUserPref(this.prefKeyHomepage);
        } else {
          try {
            Services.prefs.setCharPref(this.prefKeyHomepage, homepage);
          } catch(e) {}
        }
      },

      // for comparison, using int instead of string
      currentCheck: 20131129,

      get latestCheck() {
        var latestCheck = 0;
        try {
          latestCheck = Services.prefs.getIntPref(this.prefKeyOtherNav);
        } catch(e) {}
        return latestCheck;
      },

      set latestCheck(day) {
        try {
          Services.prefs.setIntPref(this.prefKeyOtherNav, day);
        } catch(e) {}
      },

      shouldNotify: function() {
        var homepages = this.homepage;
        var usingCEHome = this.defaultHomepages.some(function(regex) {
          return homepages.some(function(homepage) {
            return regex.test(homepage);
          });
        });

        if (usingCEHome) {
          return this.NO_REASON;
        }

        var ret = overrideInstallation.isOverride ?
          this.REASON_OVERRIDE_INSTALL :
          this.NO_REASON;

        var firstOtherNav = "";
        var usingOtherNav = this.otherNavs.some(function(regex) {
          return homepages.some(function(homepage) {
            var match = regex.test(homepage);
            if (match) {
              firstOtherNav = homepage;
            }
            return match;
          });
        });

        if (!usingOtherNav) {
          return ret;
        }

        this.firstOtherNavUrl = Services.io.newURI(firstOtherNav, null, null)
                                        .QueryInterface(Ci.nsIURL);
        if (this.firstOtherNavUrl.query) {
          var latestCheck = 0;
          try {
            var prefKey = this.prefKeyPotentialHijack + this.firstOtherNavUrl.asciiHost;
            latestCheck = Services.prefs.getIntPref(prefKey);
          } catch(e) {}
          if (latestCheck < this.currentCheck) {
            return this.REASON_POTENTIAL_HIJACK;
          } else {
            return ret;
          }
        } else {
          if (this.latestCheck < this.currentCheck) {
            return this.REASON_OTHER_NAV;
          } else {
            return ret;
          }
        }
      },

      markShown: function() {
        this.latestCheck = this.currentCheck;
      },

      markNomore: function() {
        var prefKey = this.prefKeyPotentialHijack + this.firstOtherNavUrl.asciiHost;
        try {
          Services.prefs.setIntPref(prefKey, this.currentCheck);
        } catch(e) {}
      },

      check: function() {
        var reason = this.shouldNotify();
        var shownCallback = this.markShown.bind(this);
        var nomoreCallback = this.markNomore.bind(this);

        if (reason == this.NO_REASON) {
          return;
        }

        switch (reason) {
          case this.REASON_OVERRIDE_INSTALL:
            this.notify(reason);
            break;
          case this.REASON_OTHER_NAV:
            this.notify(reason, shownCallback);
            break;
          case this.REASON_POTENTIAL_HIJACK:
            this.notify(reason, shownCallback, nomoreCallback);
            break;
          default:
            break;
        }

        ns.Tracking.track({
          type: "homepagereset",
          action: "notify",
          sid: reason
        });
      },

      notify: function(aReason, aShownCallback, aNomoreCallback) {
        var stringBundle = document.getElementById('ntab-strings');

        var message = stringBundle.getString("homepagereset.notification.message");
        if (aReason == this.REASON_POTENTIAL_HIJACK) {
          message = stringBundle.getString("homepagereset.notification.message_alt");
        }
        var resetText = stringBundle.getString("homepagereset.notification.reset");
        var noText = stringBundle.getString("homepagereset.notification.no");
        var nomoreText = stringBundle.getString("homepagereset.notification.nomore");

        var self = this;
        var buttons = [{
          label: resetText,
          accessKey: "R",
          callback: function() {
            self.reset();

            ns.Tracking.track({
              type: "homepagereset",
              action: "click",
              sid: "yes"
            });
          }
        }, {
          label: noText,
          accessKey: "N",
          callback: function() {
            ns.Tracking.track({
              type: "homepagereset",
              action: "click",
              sid: "no"
            });
          }
        }];

        if (aNomoreCallback) {
          buttons.push({
            label: nomoreText,
            accessKey: "D",
            callback: function() {
              aNomoreCallback();

              ns.Tracking.track({
                type: "homepagereset",
                action: "click",
                sid: "nomore"
              });
            }
          });
        }

        var notificationBox = gBrowser.getNotificationBox();
        var notificationBar =
          notificationBox.appendNotification(message, this.notificationKey, "",
            notificationBox.PRIORITY_INFO_MEDIUM, buttons);
        if (aShownCallback) {
          aShownCallback();
        }
        notificationBar.persistence = -1;
      },

      reset: function() {
        this.homepage = this.defaultHomepage;
      }
    }

    var newTabPref = {
        _appPreloadKey: 'browser.newtab.preload',
        _appUrlKey: 'browser.newtab.url',
        extPrefKey: 'moa.ntab.openInNewTab',

        inUse: true,

        _observer: {
            QueryInterface: function(aIID) {
                if (aIID.equals(Ci.nsIObserver) ||
                    aIID.equals(Ci.nsISupports) ||
                    aIID.equals(Ci.nsISupportsWeakReference)) {
                    return this;
                }
                throw Cr.NS_NOINTERFACE;
            },

            observe: function(aSubject, aTopic, aData) {
                if (aTopic == 'nsPref:changed') {
                    switch (aData) {
                        case newTabPref.extPrefKey:
                            newTabPref.refresh();
                            break;
                    }
                }
            }
        },

        init: function() {
            Services.prefs.addObserver(this.extPrefKey, this._observer, true);
            this.refresh();

            gInitialPages.push(_url);
        },
        refresh: function() {
            this.inUse = Services.prefs.getBoolPref(this.extPrefKey);
            if (this.inUse) {
                try {
                    Services.prefs.clearUserPref(this._appUrlKey);
                    Services.prefs.clearUserPref(this._appPreloadKey);
                } catch(e) {};
            } else {
                if (!Services.prefs.prefHasUserValue(this._appUrlKey)) {
                    Services.prefs.setCharPref(this._appUrlKey, "about:newtab");
                }
            }
        }
    };

    ns.browserOpenTab = function(event) {
        if (newTabPref.inUse) {
            openUILinkIn(_url, 'tab');

            // for Fx 12 and older versions
            focusAndSelectUrlBar();
        } else {
            window.originalBrowserOpenTab(event);
        }
    };

    var fakeZoom = {
        setExtraWidth: function(direction) {
            var extraWidth = Services.prefs.getIntPref('moa.ntab.dial.extrawidth');
            extraWidth = extraWidth + direction * 50;
            Services.prefs.setIntPref('moa.ntab.dial.extrawidth', extraWidth);
        },

        _setZoomForBrowser: null,
        setZoomForBrowser: function(aBrowser, aVal) {
            var browser = aBrowser || gBrowser.selectedBrowser;
            if (browser.contentDocument.URL == _url) {
                var origVal = ZoomManager.getZoomForBrowser(aBrowser);
                var offset = aVal - origVal;
                if (offset) {
                    this.setExtraWidth(offset / Math.abs(offset));
                }
            } else {
                this._setZoomForBrowser(aBrowser, aVal);
            }
        },

        _handleMouseScrolled: function(evt) {
            if (gBrowser.selectedBrowser.contentDocument.URL == _url) {
                var pref = 'mousewheel.';

                if (evt.getModifierState) {
                    var pressedModifierCount = evt.shiftKey + evt.ctrlKey + evt.altKey +
                                               evt.metaKey + evt.getModifierState('OS');
                    if (pressedModifierCount != 1) {
                        pref += 'default.';
                    } else if (evt.shiftKey) {
                        pref += 'with_shift.';
                    } else if (evt.ctrlKey) {
                        pref += 'with_control.';
                    } else if (evt.altKey) {
                        pref += 'with_alt.';
                    } else if (evt.metaKey) {
                        pref += 'with_meta.';
                    } else {
                        pref += 'with_win.';
                    }
                } else {
                    if (evt.axis == evt.HORIZONTAL_AXIS) {
                        pref += 'horizscroll.';
                    }

                    if (evt.shiftKey) {
                        pref += 'withshiftkey.';
                    } else if (evt.ctrlKey) {
                        pref += 'withcontrolkey.';
                    } else if (evt.altKey) {
                        pref += 'withaltkey.';
                    } else if (evt.metaKey) {
                        pref += 'withmetakey.';
                    } else {
                        pref += 'withnokey.';
                    }
                }

                pref += 'action';

                var isZoomEvent = false;
                try {
                    isZoomEvent = Services.prefs.getIntPref(pref) == (FullZoom.ACTION_ZOOM || MOUSE_SCROLL_ZOOM);
                } catch(e) {}
                if (!isZoomEvent) {
                    return;
                }

                evt.preventDefault();

                if (evt.detail) {
                    this.setExtraWidth(-evt.detail / Math.abs(evt.detail));
                }
            } else {
                FullZoom._handleMouseScrolled(evt);
            }
        },
        handleEvent: function(evt) {
            switch(evt.type) {
                case 'DOMMouseScroll':
                    this._handleMouseScrolled(evt);
                    break;
            }
        },

        init: function() {
            this._setZoomForBrowser = ZoomManager.setZoomForBrowser.bind(ZoomManager);
            ZoomManager.setZoomForBrowser = this.setZoomForBrowser.bind(this);

            FullZoom.handleEvent = this.handleEvent.bind(this);
        }
    };

    var searchEngines = {
        removeLegacyAmazon: function() {
            var amazondotcn = {
                legacy: Services.search.getEngineByName('\u5353\u8d8a\u4e9a\u9a6c\u900a'),
                update: Services.search.getEngineByName('\u4e9a\u9a6c\u900a')
            };
            if (amazondotcn.legacy && amazondotcn.update) {
                if (Services.search.currentEngine == amazondotcn.legacy) {
                    Services.search.currentEngine = amazondotcn.update;
                }
                Services.search.removeEngine(amazondotcn.legacy);
            }
        }
    };

    ns.onLoad = function() {
        // load ntab page in existing empty tabs.
        // Under Firefox5, this function will open "about:ntab" in the blank page in which
        // the welcome page is opened.
        // So set an timeout to run this function, make sure welcome page will be opened.
        setTimeout(function() {
            loadInExistingTabs();
        }, 1000);

        // Catch new tab
        if (window.TMP_BrowserOpenTab) {
            gBrowser.removeEventListener('NewTab', window.TMP_BrowserOpenTab, true);
            gBrowser.removeEventListener('NewTab', window.BrowserOpenTab, true);
            window.originalBrowserOpenTab = window.TMP_BrowserOpenTab;
            window.BrowserOpenTab = window.TMP_BrowserOpenTab = MOA.NTab.browserOpenTab;
            gBrowser.addEventListener('NewTab', window.BrowserOpenTab, true);
        } else if (window.TBP_BrowserOpenTab) {
            gBrowser.removeEventListener('NewTab', window.TBP_BrowserOpenTab, true);
            window.originalBrowserOpenTab = window.TBP_BrowserOpenTab;
            window.TBP_BrowserOpenTab = MOA.NTab.browserOpenTab;
            gBrowser.addEventListener('NewTab', window.TBP_BrowserOpenTab, true);
        } else {
            gBrowser.removeEventListener('NewTab', window.BrowserOpenTab, false);
            window.originalBrowserOpenTab = window.BrowserOpenTab;
            window.BrowserOpenTab = MOA.NTab.browserOpenTab;
            gBrowser.addEventListener('NewTab', window.BrowserOpenTab, false);
        }

        fakeZoom.init();

        newTabPref.init();
        homepageReset.check();
        searchEngines.removeLegacyAmazon();

        ns.QuickDialData.update();
        ns.PartnerBookmarks.init();
    };

    ns.onMenuItemCommand = function(event) {
        if (event.target.tagName != 'menuitem')
            return;
        var url, title;
        url = gContextMenu.linkURL;
        if (url) {
            title = gContextMenu.linkText();
        } else {
            url = window._content.document.location.href;
            title = window._content.document.title;
        }

        var stringBundle = document.getElementById('ntab-strings');

        if (!isValidURI(url)) {
            Services.prompt.alert(null,
              stringBundle.getString('ntab.contextmenu.title'),
              stringBundle.getString('ntab.contextmenu.invalidurl'));
            return;
        }

        var index = ns.quickDialModule.fillBlankDial({
            title: title,
            url: url
        });

        if (index > 0) {
            Services.prompt.alert(null,
              stringBundle.getString('ntab.contextmenu.title'),
              stringBundle.getFormattedString('ntab.contextmenu.addedtodial', [index]));
        } else {
            Services.prompt.alert(null,
              stringBundle.getString('ntab.contextmenu.title'),
              stringBundle.getString('ntab.contextmenu.noblankdial'));
        }
    };

    var isValidURI = function (aURI) {
      try {
        ns.gScriptSecurityManager.
          checkLoadURIStrWithPrincipal(ns.gPrincipal,
            aURI,
            Ci.nsIScriptSecurityManager.DISALLOW_INHERIT_PRINCIPAL |
            Ci.nsIScriptSecurityManager.DONT_REPORT_ERRORS);
        return true;
      } catch(e) {
        return false;
      }
    };

    function getDialNum(elem) {
        var num = -1;
        while (!(elem instanceof HTMLBodyElement)) {
            if (elem.hasAttribute('data-index') &&
                parseInt(elem.getAttribute('data-index'), 10) > -1 &&
                elem.getAttribute('draggable') == 'true') {
                num = parseInt(elem.getAttribute('data-index'), 10);
                break;
            }

            elem = elem.parentNode;
        }

        return num;
    }

    var toggleUseOpacity = function() {
        var useOpacity = Services.prefs.getBoolPref("moa.ntab.dial.useopacity");
        Services.prefs.setBoolPref("moa.ntab.dial.useopacity", !useOpacity);
    };

    var openCEHPOptions = function() {
        var features = "chrome,titlebar,toolbar,centerscreen";
        try {
            var instantApply = Services.prefs.getBoolPref("browser.preferences.instantApply");
            features += instantApply ? ",dialog=no" : ",modal";
        } catch (e) {
            features += ",modal";
        }
        window.openDialog("chrome://ntab/content/options.xul", "cehpOptions", features).focus();
    };

    var resetAboutNTab = function() {
        var p = Services.prompt;
        var stringBundle = document.getElementById('ntab-strings');
        if (p.confirmEx(null,
                stringBundle.getString('ntab.contextmenu.title'),
                stringBundle.getString('ntab.contextmenu.reset'),
                p.STD_YES_NO_BUTTONS + p.BUTTON_POS_1_DEFAULT + p.BUTTON_DELAY_ENABLE,
                '', '', '', null, {}) === 0) {
            ns.QuickDialData.reset();

            // toggle this pref will trigger Grid.update() in about:ntab
            Services.prefs.setBoolPref(
                "moa.ntab.dial.refreshhack",
                !Services.prefs.getBoolPref("moa.ntab.dial.refreshhack"));
        }
    };

    var _num = -1;
    ns.onContextCommand = function(event, menuid) {
        switch (menuid) {
            case 'nt-refresh':
                content.wrappedJSObject.Grid.refreshGridItem(_num);
                break;
            case 'nt-refreshall':
                content.wrappedJSObject.Grid.refreshAll();
                break;
            case 'nt-edit':
                content.wrappedJSObject.Grid.editGridItem(_num);
                break;
            case 'nt-export':
                content.wrappedJSObject.DataBackup.exportToFile();
                break;
            case 'nt-import':
                content.wrappedJSObject.DataBackup.importFromFile();
                break;
            case 'nt-useopacity':
                toggleUseOpacity();
                break;
            case 'nt-moreoptions':
                openCEHPOptions();
                break;
            case 'nt-reset':
                resetAboutNTab();
                break;
        }
    };

    ns.onContextMenu = function(event) {
        _num = getDialNum(event.target);

        document.getElementById('nt-refresh').hidden = _num < 0;
        document.getElementById('nt-edit').hidden = _num < 0;
        document.getElementById('nt-refreshall').hidden = Services.prefs.getCharPref('moa.ntab.view') !== 'quickdial';

        document.getElementById('nt-menu').openPopupAtScreen(event.screenX, event.screenY, true);

        event.preventDefault();
        event.stopPropagation();
    };

    ns.onKeydown = function(evt) {
        //var selectedDocument = gBrowser.selectedBrowser.contentDocument;
        if (//selectedDocument.URL == _url &&
            Services.prefs.getBoolPref('moa.ntab.display.usehotkey') &&
            evt.ctrlKey && 48 < evt.keyCode && evt.keyCode <= 57) {
            evt.preventDefault();
            evt.stopPropagation();
            var index = evt.keyCode - 48 || 10;
            /*var selector = ['li[data-index="', index, '"] > a'].join('');
            var anchor = selectedDocument.querySelector(selector);
            if (anchor) {
                var clickEvt = selectedDocument.createEvent("MouseEvents");
                clickEvt.initMouseEvent("click", true, true,
                    selectedDocument.defaultView,
                    0, 0, 0, 0, 0, false, false, false, false, 0, null);
                anchor.dispatchEvent(clickEvt);
            }*/
            var dial = ns.quickDialModule.getDial(index);
            if(dial && dial.url) {
                openUILinkIn(dial.url, 'tab');
            }
        }
    };

    ns.onContextMenuGlobal = function() {
        document.getElementById('context-ntab').hidden = !Services.prefs.getBoolPref('moa.ntab.contextMenuItem.show') || window._content.document.location.href == _url;
    };

    ns.isValidURI = isValidURI;
})();

window.addEventListener("load", function() {
    window.setTimeout(function() {
        MOA.NTab.onLoad();
        gBrowser.addEventListener("contextmenu", MOA.NTab.onContextMenuGlobal, false);
        window.addEventListener("keydown", MOA.NTab.onKeydown, true);
    }, 1);
}, false);

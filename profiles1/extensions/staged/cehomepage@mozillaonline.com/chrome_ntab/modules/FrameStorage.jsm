var EXPORTED_SYMBOLS = ['FrameStorage'];

const { classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
if (XPCOMUtils.hasOwnProperty('defineLazyModuleGetter')) {
  XPCOMUtils.defineLazyModuleGetter(this, "Services",
    "resource://gre/modules/Services.jsm");
  XPCOMUtils.defineLazyModuleGetter(this, "FileUtils",
    "resource://gre/modules/FileUtils.jsm");
} else {
  Cu.import('resource://gre/modules/Services.jsm');
  Cu.import('resource://gre/modules/FileUtils.jsm');
}

let FrameStorage = {
  _file: '',
  _key: '',
  _url: '',

  _keys: [],

  get chromeWindow() {
    delete this.chromeWindow;
    return this.chromeWindow = Services.wm
      .getMostRecentWindow('navigator:browser');
  },
  get hiddenBrowser() {
    let document = this.chromeWindow.document;

    let browser = document.createElement('browser');
    browser.setAttribute("type", "content");
    browser.setAttribute("disableglobalhistory", "true");
    browser.collapsed = true;

    let panel = document.getElementById("browser-panel");
    panel.appendChild(browser);

    delete this.hiddenBrowser;
    return this.hiddenBrowser = browser;
  },
  get prefs() {
    let branch = Services.prefs.getBranch('moa.ntab.view.');
    delete this.prefs;
    return this.prefs = branch;
  },
  get timer() {
    delete this.timer;
    return this.timer = Cc["@mozilla.org/timer;1"]
      .createInstance(Ci.nsITimer);
  },

  _bundleFrame: function(aFilename) {
    let uri = Services.io.newURI('resource://ntab/frames/' + aFilename,
      null, null);
    return uri.QueryInterface(Ci.nsIFileURL).file;
  },
  _profFrame: function(aFilename) {
    return FileUtils.getFile('ProfLD', ['ntab', 'frames', aFilename], false);
  },

  _getPersist: function() {
    let nsIWBP = Ci.nsIWebBrowserPersist;
    let persist = Cc['@mozilla.org/embedding/browser/nsWebBrowserPersist;1']
                    .createInstance(nsIWBP);
    persist.persistFlags = nsIWBP.PERSIST_FLAGS_REPLACE_EXISTING_FILES |
                           nsIWBP.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
    return persist;
  },
  _saveCurrent: function() {
    if (this._url) {
      let document = this.hiddenBrowser.contentDocument;
      var filesFolder = this._file.clone();
      filesFolder.leafName = [this._key, 'files'].join('_');

      let persist = this._getPersist();
      try {
        persist.saveDocument(document, this._file, filesFolder, null,
          Ci.nsIWebBrowserPersist.ENCODE_FLAGS_ENCODE_BASIC_ENTITIES, 80);
      } catch(e) {}
    } else {
      this.hiddenBrowser.setAttribute('src', 'about:blank');
    }
  },
  _updateNext: function() {
    if (!this._keys.length) {
      return;
    }
    key = this._keys.pop();
    this._key = key;
    this._url = this.prefs.getCharPref([key, 'url'].join('.'));
    this._file = this._profFrame([key, 'html'].join('.'));
    this.hiddenBrowser.setAttribute('src', this._url);
  },

  frames: function(aFilename) {
    let file = this._profFrame(aFilename).exists() ?
      this._profFrame(aFilename) :
      this._bundleFrame(aFilename);
    return Services.io.newFileURI(file).spec;
  },
  notify: function() {
    this._updateNext();
  },
  update: function() {
    let self = this;
    this._keys = ['preedit', 'site-l', 'site'];
    this.hiddenBrowser.addEventListener('load', function(evt) {
      self._saveCurrent();
      self.timer.initWithCallback(self, 10000, Ci.nsITimer.TYPE_ONE_SHOT);
    }, true);
    this._updateNext();
  }
};

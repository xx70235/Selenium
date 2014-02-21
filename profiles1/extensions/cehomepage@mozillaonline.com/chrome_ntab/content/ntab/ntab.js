let Cc = Components.classes;
let Ci = Components.interfaces;
let Cr = Components.results;
let Cu = Components.utils;

Cu.import('resource://ntab/FrameStorage.jsm');
Cu.import('resource://ntab/History.jsm');
Cu.import('resource://ntab/PageThumbs.jsm');
Cu.import('resource://ntab/quickdial.jsm');
Cu.import('resource://ntab/utils.jsm');

/* RemoteTabViewer from about:sync-tabs */
let RelatedTabViewer = {
  _tabsList: null,

  init: function RelatedTabViewer_init() {
    this._tabsList = document.querySelector("#related-tabs > dl");

    this.buildList();
  },

  buildList: function RelatedTabViewer_buildList() {
    let self = this;
    Frequent.query(function(frequenttabs) {
      Session.query(function(sessiontabs) {
        let list = self._tabsList;

        let count = list.childElementCount;
        if (count > 0) {
          for (let i = count - 1; i >= 0; i--)
            list.removeChild(list.lastElementChild);
        }

        let frequentTitle = self.createItem({
          type: 'section',
          class: 'frequent',
          sectionName: _('ntab.dial.label.frequentvisitedsites')
        });
        list.appendChild(frequentTitle);
        frequenttabs.forEach(function({title, url}) {
          let attrs = {
            type:  "tab",
            title: title || _('moa.ntab.emptytitle'),
            url:   url
          }
          let tab = self.createItem(attrs, Frequent);
          list.appendChild(tab);
        }, self);

        let sessionTitle = self.createItem({
          type: 'section',
          class: 'session',
          sectionName: _('ntab.dial.label.lastvisitedsites')
        });
        list.appendChild(sessionTitle);
        sessiontabs.forEach(function({title, url}) {
          let attrs = {
            type:  "tab",
            title: title || _('moa.ntab.emptytitle'),
            url:   url
          }
          let tab = self.createItem(attrs, Session);
          list.appendChild(tab);
        }, self);
      }, 10);
    }, 10);
  },

  createItem: function RelatedTabViewer_createItem(attrs, removable) {
    let item = null;
    if (attrs["type"] == "tab") {
      item = document.createElement("dd");
      let checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.setAttribute("data-url", attrs.url);
      item.appendChild(checkbox);
      let anchor = document.createElement("a");
      anchor.href = attrs.url;
      anchor.textContent = attrs.title;
      anchor.title = attrs.url;
      if (NTabUtils.prefs.getBoolPref("moa.ntab.openLinkInNewTab")) {
        anchor.setAttribute("target", "_blank");
      }
      item.appendChild(anchor);
      if (removable) {
        let remove = document.createElement("button");
        remove.setAttribute("title", _("moa.ntab.removepage"));
        remove.addEventListener("click", function(evt) {
          removable.remove([attrs.url]);
          item.parentNode.removeChild(item);
          RelatedTabViewer.buildList();
        }, false);
        item.appendChild(remove);
      }
    } else {
      item = document.createElement("dt");
      item.className = attrs.class;
      item.textContent = attrs.sectionName;
    }

    return item;
  }
}

let BookmarkViewer = {
  _tabList: null,

  _getBookmarks: function BookmarkViewer__getBookmakrs() {
    let results = [];
    let dbConn = Cc['@mozilla.org/browser/nav-history-service;1'].
      getService(Ci.nsINavHistoryService).
      QueryInterface(Ci.nsPIPlacesDatabase).
      DBConnection;
    let sql = 'SELECT b.title as title, p.url as url FROM moz_bookmarks b, moz_places p WHERE b.type = 1 AND b.fk = p.id AND p.hidden = 0';
    let statement = dbConn.createStatement(sql);
    while (statement.executeStep()) {
      results.push({
        title: statement.getString(0),
        url: statement.getString(1)
      });
    }
    return results;
  },

  init: function BookmarkViewer_init() {
    this._tabList = document.querySelector('#editor_bookmark');

    this.buildList();
  },

  buildList: function BookmarkViewer_buildList() {
    let list = this._tabList;
    let bookmarks = this._getBookmarks();

    bookmarks.forEach(function({title, url}) {
      let li = document.createElement('li');
      let anchor = document.createElement('a');
      anchor.href = url;
      anchor.textContent = title || _('moa.ntab.emptytitle');
      anchor.title = url;
      NTabUtils.setFaviconAsBg(url, anchor);
      li.appendChild(anchor);

      list.appendChild(li);
    });
  },
};

let NTabUtils = {
  get prefs() {
    delete this.prefs;
    return this.prefs = Cc["@mozilla.org/preferences-service;1"].
      getService(Ci.nsIPrefService).
      QueryInterface(Ci.nsIPrefBranch2);
  },
  get chromeWindow() {
    delete this.chromeWindow;
    return this.chromeWindow = window.
      QueryInterface(Ci.nsIInterfaceRequestor).
      getInterface(Ci.nsIWebNavigation).
      QueryInterface(Ci.nsIDocShellTreeItem).
      rootTreeItem.
      QueryInterface(Ci.nsIInterfaceRequestor).
      getInterface(Ci.nsIDOMWindow).
      QueryInterface(Ci.nsIDOMChromeWindow);
  },
  get faviconService() {
    delete this.faviconService;
    return this.faviconService = Cc['@mozilla.org/browser/favicon-service;1'].
      getService(Ci.mozIAsyncFavicons || Ci.nsIFaviconService);
  },
  get ioService() {
    delete this.ioService;
    return this.ioService = Cc['@mozilla.org/network/io-service;1'].
      getService(Ci.nsIIOService);
  },
  get shellService() {
    let ss = null;
    try {
      ss = Cc["@mozilla.org/browser/shell-service;1"].
        getService(Ci.nsIShellService);
    } catch(e) {}
    delete this.shellService;
    return this.shellService = ss;
  },
  setFaviconAsBg: function NTabUtils_setFaviconAsBg(aUrl, aElement) {
    let url = this.ioService.newURI(aUrl, null, null);
    let self = this;
    let setFaviconAsBg = function(aFaviconUri) {
      aFaviconUri = aFaviconUri || self.faviconService.defaultFavicon;
      aFaviconUri = self.faviconService.getFaviconLinkForIcon(aFaviconUri);
      aElement.style.backgroundImage = 'url(' + aFaviconUri.spec + ')';
    };

    if (Ci.mozIAsyncFavicons) {
      this.faviconService.getFaviconURLForPage(url, setFaviconAsBg);
    } else {
      setFaviconAsBg(this.faviconService.getFaviconImageForPage(url));
    }
  },
  loadIFrame: function NTabUtils_loadIFrame(aFrame, aSrc) {
    /*
    restart with different number of iframes in the same page will cause iframes
    pre-loaded with incorrect document, which may happen during an update.
    so we force refresh any pre-loaded document with about:blank first
    */
    if (aFrame.contentDocument &&
        aFrame.contentDocument.URL != 'about:blank') {
      aFrame.setAttribute('src', 'about:blank');
    }
    aFrame.setAttribute('src', aSrc);
    if (aSrc == 'about:blank') {
      aFrame.removeAttribute('src');
    }
  }
};

let DefaultBrowser = {
  get isDefaultBrowser() {
    return NTabUtils.shellService ?
      NTabUtils.shellService.isDefaultBrowser(true) :
      true;
  },
  get setDefault() {
    delete this.setDefault;
    return this.setDefault = document.querySelector('#setdefault');
  },
  init: function DefaultBrowser_init() {
    if (!this.isDefaultBrowser) {
      let self = this;
      this.setDefault.addEventListener('click', function() {
        self.setAsDefault()
      }, false);
      this.setDefault.removeAttribute('hidden');
    }
  },
  setAsDefault: function DefaultBrowser_setAsDefault() {
    if (NTabUtils.shellService) {
      NTabUtils.shellService.setDefaultBrowser(true, false);
      this.setDefault.setAttribute('hidden', 'true');
    }
  },
};

let Grid = {
  get customizedSize() {
    return NTabUtils.prefs.prefHasUserValue('moa.ntab.dial.column') ||
           NTabUtils.prefs.prefHasUserValue('moa.ntab.dial.row');
  },
  get extraWidth() {
    let extraWidth = NTabUtils.prefs.getIntPref('moa.ntab.dial.extrawidth');

    if (extraWidth) {
      let totalWidth = parseInt(document.defaultView.getComputedStyle(this.gridContainer).width, 10);
      let maxExtraWidth = Math.max(0, totalWidth - this.gridSize.col * this.gridItemMaxWidth);
      let restrictedExtraWidth = Math.max(Math.min(extraWidth, maxExtraWidth), 0);
      if (restrictedExtraWidth != extraWidth) {
        extraWidth = restrictedExtraWidth;
        NTabUtils.prefs.setIntPref('moa.ntab.dial.extrawidth', extraWidth);
      }
    }

    return extraWidth;
  },
  get gridSize() {
    let col = 4;
    let row = 2;
    try {
      col = NTabUtils.prefs.getIntPref('moa.ntab.dial.column');
      row = NTabUtils.prefs.getIntPref('moa.ntab.dial.row');
    } catch(e) {}
    col = Math.max(2, Math.min(col, 6));
    row = Math.max(1, Math.min(row, 20));
    return {
      'col': col,
      'row': row
    }
  },
  set gridSize(aSize) {
    NTabUtils.prefs.setIntPref('moa.ntab.dial.column', aSize.col);
    NTabUtils.prefs.setIntPref('moa.ntab.dial.row', aSize.row);
  },
  get gridContainer() {
    delete this.gridContainer;
    return this.gridContainer = document.querySelector('#grid');
  },
  get gridItemHeight() {
    let gridItem = document.querySelector('span.thumb');
    let width = document.defaultView.getComputedStyle(gridItem).width;
    return Math.round(parseInt(width, 10) * 0.62);
  },
  get gridItemMaxWidth() {
    // see also: max-width of "#grid > ol" in chrome://ntab/skin/ntab.css
    return 270 + 2 * 10;
  },
  get gridItemOpacity() {
    return NTabUtils.prefs.getBoolPref('moa.ntab.dial.useopacity');
  },
  get gridItemStyle() {
    let cssRules = document.styleSheets[0].cssRules;
    let gridItemStyle = null;
    for(var i = 0, l = cssRules.length; i < l; i++) {
      if(cssRules[i].selectorText == "#grid > ol > li") {
        gridItemStyle = cssRules[i];
        break;
      }
    }
    delete this.gridItemStyle;
    return this.gridItemStyle = gridItemStyle;
  },
  get topFlexHeight() {
    let container = QDTabs.qdTabPanels;
    let oHeight = document.defaultView.getComputedStyle(container).height;
    oHeight = parseInt(oHeight, 10);
    let iHeight = this.gridSize.row * (this.gridItemHeight + 20);
    return (oHeight - iHeight) / 2 - 50 / 2 - 20;
  },
  _editGridItem: function Grid__editGridItem(aIndex) {
    let dial = quickDialModule.getDial(aIndex);
    Overlay.overlay.style.display = 'block';
    Overlay.overlay.setAttribute('data-index', aIndex);
    if (dial && dial.url) {
      Overlay.inputTitle.value = dial.title || dial.url;
      Overlay.inputUrl.value = dial.url;
    }
    let prompt = Overlay.overlay.querySelector('#editor_promoted');
    if (prompt && !prompt.getAttribute('src')) {
      let self = this;
      prompt.addEventListener('load', function() {
        Overlay.init();
      }, false);
      NTabUtils.loadIFrame(prompt, FrameStorage.frames('preedit.html'));
    }
  },
  _itemEventInit: function Grid__itemEventInit(aLi) {
    let self = this;
    let index = aLi.getAttribute('data-index');
    let button = aLi.querySelectorAll('button');
    let thumb = aLi.querySelector('span.thumb');
    let title = aLi.getAttribute('title');
    if (button.length) {
      button[0].addEventListener('click', function(evt) {
        self._editGridItem(index);
      }, false);
      button[1].addEventListener('click', function(evt) {
        if (confirm(_('ntab.dial.delConfirmMsg', [title]))) {
          quickDialModule.removeDial(index);
        }
      }, false);
    }
    aLi.querySelector('a').addEventListener('click', function(evt) {
      if (evt.currentTarget.href) {
        let fid = aLi.getAttribute('data-fid');
        if (!fid) {
          return;
        }

        tracker.track({ type: 'quickdial', action: 'click', fid: fid, sid: index });
      } else if (evt.currentTarget.querySelector('form')) {
        evt.currentTarget.querySelector('form > input').focus();
      } else {
        self._editGridItem(index);
      }
    }, false);
    aLi.addEventListener('dragstart', function(evt) {
      evt.dataTransfer.mozSetDataAt('application/x-moz-node', evt.currentTarget, 0);
    }, false);
    aLi.addEventListener('dragover', function(evt) {
      evt.preventDefault();
    }, false);
    aLi.addEventListener('dragenter', function(evt) {
      if (evt.dataTransfer.types.contains('application/x-moz-node')) {
        evt.preventDefault();
      }
    }, false);
    aLi.addEventListener('drop', function(evt) {
      evt.preventDefault();
      let node = evt.dataTransfer.mozGetDataAt('application/x-moz-node', 0);
      if (node.getAttribute('data-index') == index) {
        return;
      }
      quickDialModule.exchangeDial(node.getAttribute('data-index'), index);
    }, false);
  },
  _searchElements: function Grid__searchElements(search, fid) {
    let searchWithKeyword = function(keyword, url, ref) {
      tracker.track({ type: 'quickdial', action: 'search', fid: fid, sid: ref });
      /* any url received through the http protocol should be presumed to be
         malicious. search.template should be okay, as it is either shipped
         with the extension, or comes from a signature verified json */
      if (!url || !NTabUtils.chromeWindow.MOA.NTab.isValidURI(url)) {
        keyword = encodeURIComponent(keyword);
        url = search.template.replace('%KEYWORD%', keyword);
      }
      let where = NTabUtils.prefs.getBoolPref('moa.ntab.openLinkInNewTab') ?
        'tab' :
        'current';
      NTabUtils.chromeWindow.openUILinkIn(url, where);
    };

    let keywordsUl = document.createElement('ul');

    let form = document.createElement('form');
    form.addEventListener('submit', function(evt) {
      evt.preventDefault();
      let keyword = input.value || input.getAttribute('placeholder');
      searchWithKeyword(keyword, '', 'search');
    }, false);

    let input = document.createElement('input');
    input.style.backgroundImage = 'url(' + search.icon + ')';
    input.type = 'text';
    input.addEventListener('click', function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }, false);
    input.addEventListener('keydown', function(evt) {
      if (evt.keyCode == 13) {
        evt.preventDefault();
        evt.stopPropagation();

        let keyword = input.value || input.getAttribute('placeholder');
        searchWithKeyword(keyword, '', 'search');
      }
    }, false);
    form.appendChild(input);

    let submit = document.createElement('input');
    submit.type = 'submit';
    submit.value = 'Go';
    // submit the form, but don't bubble to the parent anchor
    submit.addEventListener('click', function(evt) {
      evt.stopPropagation();
    }, false);
    form.appendChild(submit);

    let xhr = new XMLHttpRequest();
    xhr.open('GET', search.keyword_infos, true);
    xhr.onload = function(evt) {
      try {
        let response = JSON.parse(xhr.responseText);

        let defaultKeyword = response.default;
        input.setAttribute('placeholder', defaultKeyword);

        let keyword_infos = response.keywords;
        let keywords = Object.keys(keyword_infos);
        for (let i = 0, l = keywords.length; i < l; i++) {
          let keywordLi = document.createElement('li');

          let anchor = document.createElement('a');
          /* maybe just set href */
          anchor.href = '#';
          anchor.textContent = keywords[i];
          anchor.addEventListener('click', function(evt) {
            evt.preventDefault();
            evt.stopPropagation();

            let keyword = evt.currentTarget.textContent;
            searchWithKeyword(keyword, keyword_infos[keyword], 'keyword');
          }, false);
          keywordLi.appendChild(anchor);

          keywordsUl.appendChild(keywordLi);
        }
      } catch(e) {}
    };
    xhr.send();

    return [keywordsUl, form];
  },
  _createGridItem: function Grid__createGridItem(aIndex) {
    let dial = quickDialModule.getDial(aIndex);

    let li = document.createElement('li');
    li.setAttribute('draggable', dial ? 'true' : 'false');
    li.setAttribute('data-index', aIndex);
    li.setAttribute('data-fid', dial ?
      dial.defaultposition || '' :
      '');
    li.setAttribute('title', dial ?
      dial.title || '' :
      _('ntab.dial.label.clicktoadddial'));

    if (dial) {
      let edit = document.createElement('button');
      edit.setAttribute('title', _('ntab.dial.label.edit'));
      li.appendChild(edit);
      let remove = document.createElement('button');
      remove.setAttribute('title', _('ntab.dial.label.del'));
      li.appendChild(remove);
    }

    let a = document.createElement('a');
    a.setAttribute('draggable', 'false');
    a.setAttribute('href', dial ? dial.url : '');
    if (NTabUtils.prefs.getBoolPref('moa.ntab.openLinkInNewTab')) {
      a.setAttribute('target', '_blank');
    }
    if (dial) {
      a.setAttribute('contextmenu', 'thumb-menu');
    }

    let backgroundImage = '';
    let backgroundPosition = '';
    let backgroundSize = '';
    if (dial) {
      backgroundPosition = 'center center';
      if (dial.thumbnail) {
        backgroundImage = dial.thumbnail;
      } else {
        backgroundImage = PageThumbs.getThumbnailURL(dial.url) + '&ts=' + Date.now();
        if (PageThumbs.getThumbnailType(dial.url) == 'snapshot') {
          backgroundPosition = 'left top';
          backgroundSize = 'cover';
        }
      }
      backgroundImage = 'url(' + backgroundImage + ')';
    }

    let span_thumb = document.createElement('span');
    span_thumb.className = 'thumb';

    span_thumb.style.backgroundImage = backgroundImage;
    span_thumb.style.backgroundPosition = backgroundPosition;
    span_thumb.style.backgroundSize = backgroundSize;
    a.appendChild(span_thumb);

    let span_title = document.createElement('span');
    span_title.className = 'title';
    if (dial && dial.search) {
      let searchElements = this._searchElements(dial.search,
                                                dial.defaultposition || '');
      span_thumb.appendChild(searchElements[0]);
      span_title.appendChild(searchElements[1]);
      // work around the search input jumping w backspace
      span_title.style.outline = '1px solid #d7d7d7';
    } else {
      span_title.textContent = dial ? dial.title || '' : '';
    }
    a.appendChild(span_title);

    li.appendChild(a);
    this._itemEventInit(li);

    return li;
  },
  _createGrid: function Grid__createGrid() {
    let customizedSize = this.customizedSize;
    let gridSize = this.gridSize;

    let total = gridSize.col * gridSize.row;
    let className_ = customizedSize ? 'c' + gridSize.col : '';
    this.gridContainer.className = className_;

    let ol = document.createElement('ol');
    for (let i = 1; i <= total; i++) {
      let gridItem = this._createGridItem(i);
      ol.appendChild(gridItem);
    }
    return ol;
  },
  _updateSettingsDisplay: function Grid__updateSettingsDisplay() {
    let rowSelect = document.querySelector('#row_num');
    let limit = 4;
    let row = this.gridSize.row;
    if (NTabUtils.prefs.prefHasUserValue('moa.ntab.dial.rowlimit')) {
      limit = NTabUtils.prefs.getIntPref('moa.ntab.dial.rowlimit');
    }
    if (row > limit) {
      limit = Math.ceil(row / 5) * 5;
      NTabUtils.prefs.setIntPref('moa.ntab.dial.rowlimit', limit);
    }
    for (let i = rowSelect.childElementCount + 2; i <= limit; i++) {
      let option = document.createElement('option');
      option.textContent = i;
      option.value = i;
      rowSelect.appendChild(option);
    }
    document.getElementById('row_num').value = this.gridSize.row;
    document.getElementById('col_num').value = this.gridSize.col;
  },
  _columnLimit: function Grid__columnLimit() {
    if (!this.customizedSize) {
      return;
    }
    let origCol = 4;
    let origRow = 2;
    try {
      origCol = NTabUtils.prefs.getIntPref('moa.ntab.dial.column');
      origRow = NTabUtils.prefs.getIntPref('moa.ntab.dial.row');
    } catch(e) {}
    if (origCol > 6) {
      let col = 6;
      let row = Math.ceil(origCol * origRow / col);
      NTabUtils.prefs.setIntPref('moa.ntab.dial.column', col);
      NTabUtils.prefs.setIntPref('moa.ntab.dial.row', row);
      let rowLimit = Math.ceil(row / 5) * 5;
      NTabUtils.prefs.setIntPref('moa.ntab.dial.rowlimit', rowLimit);
    }
  },
  _migrate: function Grid__migrate() {
    let prefKey = 'moa.ntab.gridview.version';
    let oldVer = 1;
    try {
      oldVer = NTabUtils.prefs.getIntPref(prefKey);
    } catch(e) {}
    switch (oldVer) {
      case 1:
      case 2:
        this._columnLimit();
        this.refreshAll();
      //  no break here, run every updates;
      //case 3:
      //  later update;
    }
    NTabUtils.prefs.setIntPref(prefKey, 3);
  },
  _scroll: function Grid__scroll(aDirection, aSpeed) {
    this.gridContainer.scrollTop += aDirection * aSpeed;
  },
  _scrollInterval: null,
  _eventInit: function Grid__eventInit() {
    let self = this;
    window.addEventListener('resize', function(evt) {
      self.resize();
    }, false);
    document.addEventListener('keypress', function(evt) {
      let direction = 0;
      switch(evt.keyCode) {
        case 33:
        case 36:
        case 38:
          direction = -1;
          break;
        case 34:
        case 35:
        case 40:
          direction = 1;
          break;
      }
      let speed = 0;
      switch(evt.keyCode) {
        case 33:
        case 34:
          speed = 3;
          break;
        case 35:
        case 36:
          speed = 20;
          break;
        case 38:
        case 40:
          speed = 1;
          break;
      }
      speed *= (self.gridItemHeight + 20);
      self._scroll(direction, speed);
    }, false);
    if (window.WheelEvent) {
      this.gridContainer.addEventListener('wheel', function(evt) {
        if (evt.ctrlKey) {
          return;
        }
        let direction = evt.deltaY / Math.abs(evt.deltaY);
        let speed = 0;
        switch (evt.deltaMode) {
          case evt.DOM_DELTA_LINE:
            speed = 1;
            break;
          case evt.DOM_DELTA_PAGE:
            speed = 3;
            break;
        }
        speed *= (self.gridItemHeight + 20);
        if (!speed) {
          speed = Math.abs(evt.deltaY);
        }
        self._scroll(direction, speed);
      }, false);
    } else {
      this.gridContainer.addEventListener('MozMousePixelScroll', function(evt) {
        if (evt.ctrlKey) {
          return;
        }
        self._scroll(1, evt.detail);
      }, false);
    }
    [].forEach.call(document.querySelectorAll('#grid > ul > li'), function(aLi) {
      aLi.addEventListener('click', function(evt) {
        evt.stopPropagation();
      }, false);
      aLi.addEventListener('mouseover', function(evt) {
        let direction = evt.target.getAttribute('data-direction');
        evt.target.parentNode.setAttribute('data-scroll', direction);
        window.clearInterval(self._scrollInterval);
        self._scrollInterval = window.setInterval(function() {
          self._scroll(direction, 10);
        }, 20);
      }, false);
      aLi.addEventListener('mouseout', function(evt) {
        window.clearInterval(self._scrollInterval);
        self._scrollInterval = null;
        evt.target.parentNode.setAttribute('data-scroll', '0');
      }, false);
    });
    this.gridContainer.addEventListener('contextmenu', NTabUtils.chromeWindow.MOA.NTab.onContextMenu, false);
  },
  editGridItem: function Grid_editGridItem(aIndex) {
    this._editGridItem(aIndex || document.querySelector('#thumb-menu').getAttribute('data-index'));
  },
  init: function Grid_init() {
    this._migrate();
    this._eventInit();
    this.update();
  },
  refreshAll: function Grid_refreshAll() {
    PageThumbsStorage.wipe();
    this.update();
  },
  refreshGridItem: function Grid_refreshGridItem(aIndex) {
    let index = aIndex || document.querySelector('#thumb-menu').getAttribute('data-index');
    let dial = quickDialModule.getDial(index);
    if (dial) {
      PageThumbsStorage.remove(dial.url);
      this.updateGridItem(index);
    }
  },
  resize: function Grid_resize() {
    let extraWidth = this.extraWidth;
    if (extraWidth) {
      this.gridContainer.lastElementChild.style.maxWidth = (this.gridSize.col * this.gridItemMaxWidth + extraWidth) + 'px';
    }

    this.gridItemStyle.style.height = this.gridItemHeight + 'px';
    this.gridItemStyle.style.opacity = this.gridItemOpacity ? 0.7 : 1;
    this.gridContainer.firstElementChild.style.height = Math.max(this.topFlexHeight, 0) + 'px';

    let iHeight = this.gridContainer.scrollHeight;
    let oHeight = document.defaultView.getComputedStyle(this.gridContainer);
    oHeight = parseInt(oHeight.height, 10);
    if (iHeight > oHeight) {
      document.querySelector('#grid > ul').setAttribute('data-scroll', '0');
    } else {
      document.querySelector('#grid > ul').removeAttribute('data-scroll');
    }
  },
  update: function Grid_update() {
    this._updateSettingsDisplay();
    let oldGrid = this.gridContainer.querySelector('ol');
    let newGrid = this._createGrid();
    if (oldGrid) {
      this.gridContainer.replaceChild(newGrid, oldGrid);
    } else {
      this.gridContainer.appendChild(newGrid);
    }
    this.resize();
  },
  updateGridItem: function Grid_updateGridItem(aIndex) {
    let newItem = this._createGridItem(aIndex);
    let oldItem = document.querySelector('li[data-index="' + aIndex + '"]');
    if (oldItem) {
      oldItem.parentNode.replaceChild(newItem, oldItem);
    }
  },
};

let Background = {
  get backgroundColor() {
    return NTabUtils.prefs.getCharPref('moa.ntab.backgroundcolor');
  },
  set backgroundColor(aColor) {
    NTabUtils.prefs.setCharPref('moa.ntab.backgroundcolor', aColor);
    if (aColor) {
      this.backgroundImage = '';
    }
  },
  get backgroundImage() {
    return NTabUtils.prefs.getCharPref('moa.ntab.backgroundimage');
  },
  set backgroundImage(aImage) {
    NTabUtils.prefs.setCharPref('moa.ntab.backgroundimage', aImage);
    if (aImage) {
      this.backgroundColor = '';
    }
  },
  get backgroundImageStyle() {
    return NTabUtils.prefs.getCharPref('moa.ntab.backgroundimagestyle');
  },
  set backgroundImageStyle(aStyle) {
    NTabUtils.prefs.setCharPref('moa.ntab.backgroundimagestyle', aStyle);
  },
  get backgroundNoise() {
    return NTabUtils.prefs.getBoolPref('moa.ntab.backgroundnoise');
  },

  _styleToPRS: function Background__styleToPRS(aStyle) {
    switch (aStyle) {
      case 'fit':
        return {
          position: 'center center',
          repeat: 'no-repeat',
          size: 'contain'
        };
      case 'stretch':
        return {
          position: '',
          repeat: 'no-repeat',
          size: '100% 100%'
        };
      case 'tile':
        return {
          position: '',
          repeat: 'repeat',
          size: ''
        };
      case 'center':
        return {
          position: 'center center',
          repeat: 'no-repeat',
          size: ''
        };
      case 'fill':
      default:
        return {
          position: '',
          repeat: 'no-repeat',
          size: 'cover'
        };
    }
  },
  init: function Background_init() {
    this.update();
  },
  update: function Background_update() {
    let color = this.backgroundColor;
    let image = this.backgroundImage;
    let noise = this.backgroundNoise;
    let style = this.backgroundImageStyle;

    let prs = this._styleToPRS(style);

    NTab.body.style.backgroundImage = image ? 'url("' + image + '")' : '';
    NTab.body.style.backgroundPosition = image ? prs.position : '';
    NTab.body.style.backgroundRepeat = image ? prs.repeat: '';
    NTab.body.style.backgroundSize = image ? prs.size : '';
    NTab.body.style.backgroundColor = color;
    if (!image && !noise) {
      NTab.body.style.backgroundImage = 'url("")';
    }

    QDTabs.quickDial.className = '';
    if (color) {
      let shouldCheck = document.querySelector('#bgcolor-radio > label > input[value="' + color + '"]');
      if (shouldCheck) {
        shouldCheck.checked = 'checked';
        QDTabs.quickDial.className = 'color';
      }
    } else {
      let checked_ = document.querySelector('#bgcolor-radio > label > input[name="bgcolor"]:checked');
      if (checked_) {
        checked_.checked = '';
      }
    }
    if (style) {
      let shouldCheck = document.querySelector('#bgimagestyle-radio > label > input[value="' + style + '"]');
      if (shouldCheck) {
        shouldCheck.checked = 'checked';
      }
    } else {
      let checked_ = document.querySelector('#bgimagestyle-radio > label > input[name="bgimage-style"]:checked');
      if (checked_) {
        checked_.checked = '';
      }
    }
    document.querySelector('input[name="bgimage"]').value = image;
    if (image) {
      document.getElementById('bgimagestyle-radio').removeAttribute('hidden');
    } else {
      document.getElementById('bgimagestyle-radio').setAttribute('hidden', 'true');
    }
  },
};

let Footer = {
  get displayFooter() {
    return NTabUtils.prefs.getBoolPref('moa.ntab.displayfooter');
  },
  set displayFooter(aDisplay) {
    NTabUtils.prefs.setBoolPref('moa.ntab.displayfooter', aDisplay);
  },
  get footer() {
    delete this.footer;
    return this.footer = document.querySelector('footer');
  },
  get toggle() {
    delete this.toggle;
    return this.toggle = document.querySelector('#toggle');
  },
  init: function Footer__init() {
    let self = this;
    this.toggle.addEventListener('click', function(evt) {
      self.displayFooter = !self.displayFooter;
    }, false);
    this.update();
  },
  update: function Footer_update() {
    if (this.displayFooter) {
      this.footer.classList.remove('off');
    } else {
      this.footer.classList.add('off');
    }
    // refresh the scroll control
    Grid.resize();
  },
};

let QDTabs = {
  get currentTab() {
    let tab = 'grid';
    try {
      tab = NTabUtils.prefs.getCharPref('moa.ntab.qdtab');
    } catch(e) {}
    if (['grid', 'site'].indexOf(tab) == -1) {
      tab = 'grid';
    }
    return tab;
  },
  set currentTab(aTab) {
    NTabUtils.prefs.setCharPref('moa.ntab.qdtab', aTab);
    NTabUtils.prefs.setBoolPref('moa.ntab.qdtab.used', true);
    tracker.track({ type: 'qdtab', action: 'switch', sid: aTab });
  },
  get quickDial() {
    delete this.quickDial;
    return this.quickDial = document.querySelector('#quickdial');
  },
  get prev() {
    delete this.prev;
    return this.prev = document.querySelector('#prevtab');
  },
  get qdTabPanels() {
    delete this.qdTabPanels;
    return this.qdTabPanels = document.querySelector('#quick_dial_tabpanels');
  },
  get qdTabs() {
    delete this.qdTabs;
    return this.qdTabs = document.querySelector('#quick_dial_tabs');
  },
  init: function QDTabs_init() {
    let self = this;
    /* see https://developer.mozilla.org/en-US/docs/DOM/NodeList#Workarounds
       for usage of [].forEach.call */
    [].forEach.call(document.querySelectorAll('#quick_dial_tabs > a'), function(anchor) {
      anchor.addEventListener('click', function(evt) {
        self.currentTab = evt.target.getAttribute('data-tab');
      }, false);
    });
    this.update(true);
    document.querySelector('#prevtab').addEventListener('click', function(evt) {
      let currentTab = self.qdTabPanels.className;
      let prevTab = document.getElementById(currentTab).previousElementSibling;
      if (prevTab) {
        self.currentTab = prevTab.id;
      }
    }, false);
    document.querySelector('#nexttab').addEventListener('click', function(evt) {
      let currentTab = self.qdTabPanels.className;
      let nextTab = document.getElementById(currentTab).nextElementSibling;
      if (nextTab) {
        self.currentTab = nextTab.id;
      }
    }, false);
  },
  update: function QDTabs_update(aInit) {
    let tab = this.currentTab;
    this.qdTabPanels.className = tab;
    this.qdTabs.className = tab;
    //hack for lack of reverse adjacent selector
    this.prev.className = tab;

    let openInNewTab = NTabUtils.prefs.getBoolPref('moa.ntab.openLinkInNewTab');
    let queryString = ['openInNewTab', openInNewTab].join('=');

    let iframes = document.getElementById(tab).querySelectorAll('iframe');
    if (tab == 'site' && iframes.length && iframes[0]) {
      let src_ = [FrameStorage.frames([tab, 'html'].join('.')), queryString].join('?');
      if (iframes[0].getAttribute('src') != src_) {
        NTabUtils.loadIFrame(iframes[0], src_);
      }
    }
    if (tab == 'site' && iframes.length && iframes[1]) {
      let src_ = [FrameStorage.frames([tab + '-l', 'html'].join('.')), queryString].join('?');
      if (iframes[1].getAttribute('src') != src_) {
        NTabUtils.loadIFrame(iframes[1], src_);
      }
    }
    if (aInit) {
      tracker.track({ type: 'qdtab', action: 'load', sid: tab });
    }
  },
};

let Overlay = {
  get editorTabs() {
    delete this.editorTabs;
    return this.editorTabs = this.overlay.querySelectorAll('#editor_tabs > li');
  },
  get inputTitle() {
    delete this.inputTitle;
    return this.inputTitle = this.overlay.querySelector('input[name="title"]');
  },
  get inputUrl() {
    delete this.inputUrl;
    return this.inputUrl = this.overlay.querySelector('input[name="url"]');
  },
  get overlay() {
    delete this.overlay;
    return this.overlay = document.querySelector('#overlay');
  },
  get prompt() {
    delete this.prompt;
    return this.prompt = document.querySelector('#editor_promoted').contentDocument;
  },
  _inited: false,
  init: function Overlay_init() {
    if (this._inited) {
      return;
    }
    let self = this;
    document.querySelector('#prompt-close').addEventListener('click', function(evt) {
      self._finish();
    }, false);
    this.overlay.addEventListener('click', function(evt) {
      if (evt.target == evt.currentTarget) {
        self._finish();
      }
    }, false);
    document.addEventListener('keypress', function(evt) {
      if (evt.keyCode == 27) {
        self._finish();
      };
    }, false);

    Frequent.query(function(aFrequents) {
      aFrequents.forEach(function({title, url}) {
        let frequent = document.querySelector('#editor_frequent');
        let li = document.createElement('li');
        let anchor = document.createElement('a');
        anchor.href = url;
        anchor.textContent = title || _('moa.ntab.emptytitle');
        anchor.title = url;
        NTabUtils.setFaviconAsBg(url, anchor);
        li.appendChild(anchor);
        frequent.appendChild(li);
      });

      Session.query(function(aSessions) {
        aSessions.forEach(function({title, url}) {
          let session = document.querySelector('#editor_session');
          let li = document.createElement('li');
          let anchor = document.createElement('a');
          anchor.href = url;
          anchor.textContent = title || _('moa.ntab.emptytitle');
          anchor.title = url;
          NTabUtils.setFaviconAsBg(url, anchor);
          li.appendChild(anchor);
          session.appendChild(li);
        });


        BookmarkViewer.init();

        [].forEach.call(self.overlay.querySelectorAll('li > a'), function(anchor) {
          anchor.addEventListener('click', function(evt) {
            evt.preventDefault();
            let title = evt.target.textContent;
            let url = evt.target.href;
            self._choose(title, url, false);
          }, false);
        });
      }, 9);
    }, 9);

    [].forEach.call(this.editorTabs, function(tab) {
      tab.addEventListener('mouseover', function(evt) {
        evt.target.parentNode.className = evt.target.getAttribute('data-tab');
      }, false);
    });
    document.querySelector('#dial_editor').addEventListener('submit', function(evt) {
      evt.preventDefault();
      let title = self.inputTitle.value;
      let url = self.inputUrl.value;
      self._finish(title, url);
    }, false);
    try {
      [].forEach.call(this.prompt.querySelectorAll('li > a'), function(anchor) {
        anchor.addEventListener('click', function(evt) {
          evt.preventDefault();
          let title = evt.target.textContent.replace(/\s/g, '');
          let url = evt.target.href;
          self._choose(title, url, true);
        }, false);
      });
    } catch(e) {}
    this._inited = true;
  },
  _choose: function Overlay__choose(aTitle, aUrl, aTrack) {
    this.inputTitle.value = aTitle;
    if (aTrack) {
      this.inputTitle.setAttribute('data-track', 'track');
    }
    this.inputUrl.value = aUrl;
  },
  _finish: function Overlay__finish(aTitle, aUrl) {
    if (aUrl) {
      let index = this.overlay.getAttribute('data-index');
      quickDialModule.updateDial(index, { url: aUrl, title: aTitle }, false);
    }
    if (this.inputTitle.hasAttribute('data-track')) {
      tracker.track({ type: 'links', action: 'click', sid: aTitle });
    }
    this.overlay.style.display = '';
    this.inputTitle.value = '';
    this.inputUrl.value = '';
    this.inputTitle.removeAttribute('data-track');
  },
};

let Launcher = {
  get launcher() {
    delete this.launcher;
    return this.launcher = document.querySelector('#launcher');
  },
  _relatedtabsInit: function Launcher__relatedtabsInit() {
    let self = this;
    RelatedTabViewer.init();
    document.querySelector('#related-tabs > dl').addEventListener('click', function(evt) {
      if (evt.target.tagName.toLowerCase() == 'dt') {
        evt.currentTarget.className = evt.target.className;
        [].forEach.call(document.querySelectorAll('#related-tabs input[type="checkbox"]'), function(aCheckbox) {
          aCheckbox.checked = false;
        });
      }
    }, false);
    document.querySelector('#related-tabs > label > input[type="checkbox"]').addEventListener('change', function(evt) {
      [].forEach.call(document.querySelectorAll('#related-tabs > dl > dd > input[type="checkbox"]'), function(checkbox) {
        if (checkbox.scrollHeight) {
          checkbox.checked = evt.target.checked;
        }
      });
    }, false);
    document.querySelector('#related-tabs > input[type="button"]').addEventListener('click', function(evt) {
      self.launcher.classList.toggle('related-tabs');
      [].forEach.call(document.querySelectorAll('#related-tabs > dl > dd > input[type="checkbox"]:checked'), function(checkbox) {
        NTabUtils.chromeWindow.openUILinkIn(checkbox.getAttribute('data-url'), 'tab');
        checkbox.checked = false;
      });
      document.querySelector('#related-tabs > label > input[type="checkbox"]').checked = false;
    }, false);
  },
  _toolsInit: function Launcher__toolsInit() {
    let self = this;
    [].forEach.call(document.querySelectorAll('#tools > li'), function(li) {
      li.addEventListener('click', function(evt) {
        self.launcher.classList.toggle('tools');
        switch(evt.currentTarget.id) {
          case 'downloads':
            NTabUtils.chromeWindow.BrowserDownloadsUI();
            break;
          case 'bookmarks':
            NTabUtils.chromeWindow.PlacesCommandHook.showPlacesOrganizer("AllBookmarks");
            break;
          case 'history':
            NTabUtils.chromeWindow.PlacesCommandHook.showPlacesOrganizer("History");
            break;
          case 'apps':
            NTabUtils.chromeWindow.openUILinkIn("https://marketplace.mozilla.org/", "tab");
            break;
          case 'addons':
            NTabUtils.chromeWindow.BrowserOpenAddonsMgr();
            break;
          case 'sync':
            NTabUtils.chromeWindow.openPreferences("paneSync");
            break;
          case 'settings':
            NTabUtils.chromeWindow.openPreferences();
            break;
        }
        tracker.track({ type: 'tools', action: 'click', sid: evt.currentTarget.id });
      }, false);
    });
  },
  _settingsInit: function Launcher__settingsInit() {
    [].forEach.call(document.querySelectorAll('#bgcolor-radio > label > input[name="bgcolor"]'), function(input) {
      input.addEventListener('click', function(evt) {
        Background.backgroundColor = evt.target.value;
      }, false);
    });
    document.querySelector('input[name="bgimage"]').addEventListener('change', function(evt) {
      let file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
      file.initWithPath(evt.target.value);
      Background.backgroundImage = NTabUtils.ioService.newFileURI(file).spec;
    }, false);
    [].forEach.call(document.querySelectorAll('#bgimagestyle-radio > label > input[name="bgimage-style"]'), function(input) {
      input.addEventListener('click', function(evt) {
        Background.backgroundImageStyle = evt.target.value;
      }, false);
    });
    [].forEach.call(document.querySelectorAll('select'), function(select) {
      select.addEventListener('change', function(evt) {
        switch(evt.currentTarget.id) {
          case 'row_num':
          case 'col_num':
            Grid.gridSize = {
              row: parseInt(document.getElementById('row_num').value, 10),
              col: parseInt(document.getElementById('col_num').value, 10)
            };
            break;
        }
      }, false);
    });
    [].forEach.call(document.querySelectorAll('#page-settings > fieldset > div > input[type="button"]'), function(input) {
      input.addEventListener('click', function(evt) {
        switch(evt.target.id) {
          case 'bgreset':
            Background.backgroundColor = 'transparent';
            break;
          case 'resetpref':
            NTabUtils.prefs.getChildList('moa.ntab.').forEach(function(aPref) {
              NTabUtils.prefs.clearUserPref(aPref);
            });
            break;
          case 'feedback':
            NTabUtils.chromeWindow.openUILinkIn('http://doc.firefoxchina.cn/document/feedback/', 'tab');
            break;
        }
      }, false);
    });
    [].forEach.call(document.querySelectorAll('#page-settings > fieldset > div > label > input[type="checkbox"]'), function(input) {
      input.addEventListener('click', function(evt) {
        NTabUtils.prefs.setBoolPref(evt.target.getAttribute('data-pref'), evt.target.checked);
      }, false);
    });
  },
  init: function Launcher_init() {
    let self = this;
    [].forEach.call(document.querySelectorAll('#launcher > li'), function(li) {
      li.addEventListener('click', function(evt) {
        let menu = evt.target.getAttribute('data-menu');
        if (menu) {
          self.launcher.classList.toggle(menu);
          if (self.launcher.classList.length) {
            self.launcher.className = menu;
          }
          tracker.track({ type: 'menu', action: 'click', sid: menu });
        }
        evt.stopPropagation();
      }, false);
    });
    document.addEventListener('click', function(evt) {
      self.launcher.className = '';
    }, false);
    document.addEventListener('keypress', function(evt) {
      if (evt.keyCode == 27) {
        self.launcher.className = '';
      };
    }, false);
    this._relatedtabsInit();
    this._toolsInit();
    this._settingsInit();
  },
};

let DataBackup = {
  _intPrefs: ['dial.column', 'dial.row'],
  _charPrefs: ['view', 'qdtab', 'backgroundcolor', 'backgroundimagestyle'],
  _boolPrefs: ['openInNewTab', 'displayfooter', 'openLinkInNewTab',
    'loadInExistingTabs', 'backgroundnoise', 'dial.showSearch',
    'dial.hideSearch', 'dial.useopacity', 'contextMenuItem.show',
    'display.usehotkey'
  ],
  _prefPairs: [
    ['column', 'dial.column'],
    ['row', 'dial.row'],
    ['showSearch', 'dial.showSearch'],
    ['contextMenuItem-show', 'contextMenuItem.show'],
    ['usehotkey', 'display.usehotkey']
  ],
  _getFile: function DataBackup__getFile(aMode) {
    let file = null;
    try {
      let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
      fp.init(window, _('moa.ntab.jsonfile.selectfile'), aMode);
      fp.appendFilter(_('moa.ntab.jsonfile'), '*.json');
      if (fp.show() != Ci.nsIFilePicker.returnCancel) {
        file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
        let path = fp.file.path;
        if (!/\.json$/.test(path)) {
          path += '.json';
        }
        file.initWithPath(path);
      }
    } catch(e) {}
    return file;
  },
  exportToFile: function DataBackup_exportToFile() {
    try {
      let file = this._getFile(Ci.nsIFilePicker.modeSave);
      if (file) {
        let userData = utils.readStrFromProFile(['ntab', 'quickdialdata', 'user.json']) || '{}';
        let dialContent = JSON.parse(userData);
        let userDataJSON = {
          dialContent: dialContent
        };
        this._intPrefs.forEach(function(aPref) {
          userDataJSON[aPref] = NTabUtils.prefs.getIntPref('moa.ntab.' + aPref);
        });
        this._charPrefs.forEach(function(aPref) {
          userDataJSON[aPref] = NTabUtils.prefs.getCharPref('moa.ntab.' + aPref);
        });
        this._boolPrefs.forEach(function(aPref) {
          userDataJSON[aPref] = NTabUtils.prefs.getBoolPref('moa.ntab.' + aPref);
        });
        utils.setStrToFile(file, JSON.stringify(userDataJSON));
        alert(_('moa.ntab.jsonfile.exported'));
      }
    } catch(e) {
      alert(_('moa.ntab.jsonfile.exporterror'));
    }
  },
  importFromFile: function DataBackup_importFromFile() {
    try {
      let file = this._getFile(Ci.nsIFilePicker.modeOpen);
      if (file && file.exists()) {
        let userData = utils.readStrFromFile(file);
        let userDataJSON = JSON.parse(userData);

        let dialContent = userDataJSON.dialContent;
        for (let index in dialContent) {
          if (/^\d+$/.test(index)) {
            let dial = dialContent[index];
            if (!/^\d+$/.test(dial) &&
                ((!dial.title && dial.title !== '') ||
                 !dial.url ||
                 /javascript\s*:/.test(dial.url))) {
              throw 'invalid dial title or url';
            }
          } else {
            throw 'invalid dial index';
          }
        }

        this._prefPairs.forEach(function(aPair) {
          if (aPair[0] in userDataJSON) {
            userDataJSON[aPair[1]] = userDataJSON[aPair[0]];
          }
        });

        this._intPrefs.forEach(function(aPref) {
          try {
            if (aPref in userDataJSON) {
              NTabUtils.prefs.setIntPref('moa.ntab.' + aPref, userDataJSON[aPref]);
            }
          } catch(e) {}
        });
        this._charPrefs.forEach(function(aPref) {
          try {
            if (aPref in userDataJSON) {
              NTabUtils.prefs.setCharPref('moa.ntab.' + aPref, userDataJSON[aPref]);
            }
          } catch(e) {}
        });
        this._boolPrefs.forEach(function(aPref) {
          try {
            if (aPref in userDataJSON) {
              NTabUtils.prefs.setBoolPref('moa.ntab.' + aPref, userDataJSON[aPref]);
            }
          } catch(e) {}
        });

        if (Object.keys(dialContent).length) {
          utils.setStrToProFile(['ntab', 'quickdialdata', 'user.json'], JSON.stringify(dialContent));
        }

        quickDialModule.refresh();
        Grid.init();

        alert(_('moa.ntab.jsonfile.imported'));
      }
    } catch(e) {
      alert(_('moa.ntab.jsonfile.importerror'));
    }
  }
};

let Promo = {
  begin: 1386752400000,
  end: 1386943200000,
  get promo() {
    delete this.promo;
    return this.promo = document.querySelector('#promo');
  },

  init: function() {
    this.update();
  },

  update: function() {
    let disabled = false;
    try {
      disabled = NTabUtils.prefs.getBoolPref('moa.ntab.promo.disabled');
    } catch(e) {}

    if (disabled) {
      return;
    }

    if (NTab.hideSearch) {
      this.promo.setAttribute('hidden', 'true');
      return;
    }

    let epoch = Date.now();
    if (this.begin && this.begin > epoch) {
      return;
    }
    if (this.end && this.end < epoch) {
      return;
    }
    this.promo.addEventListener('click', function(evt) {
      tracker.track({ type: 'promo', action: 'click', sid: '201312' });
    }, false);
    this.promo.removeAttribute('hidden');
  }
};

let NTab = {
  observer: {
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
          case 'moa.ntab.view':
          case 'moa.ntab.dial.hideSearch':
          case 'moa.ntab.dial.showSearch':
          case 'moa.ntab.contextMenuItem.show':
            NTab.update();
            Promo.update();
            break;
          case 'moa.ntab.qdtab':
            QDTabs.update();
            break;
          case 'moa.ntab.openLinkInNewTab':
            // also update mini-nav's queryString
            NTab.update();
            QDTabs.update();
            RelatedTabViewer.buildList();
            // intentionally no break;
          case 'moa.ntab.dial.column':
          case 'moa.ntab.dial.row':
          case 'moa.ntab.dial.extrawidth':
          case 'moa.ntab.dial.useopacity':
          case 'moa.ntab.dial.refreshhack':
            Grid.update();
            break;
          case 'moa.ntab.backgroundcolor':
          case 'moa.ntab.backgroundimage':
          case 'moa.ntab.backgroundimagestyle':
          case 'moa.ntab.backgroundnoise':
            Background.update();
            break;
          case 'moa.ntab.displayfooter':
            Footer.update();
            break;
        }
        let itemPrefix = 'moa.ntab.dial.update.';
        if (aData.indexOf(itemPrefix) == 0) {
          let index = aData.substring(itemPrefix.length);
          Grid.updateGridItem(index);
        }
      }
    }
  },
  get currentPane() {
    let pane = 'quickdial';
    try {
      pane = NTabUtils.prefs.getCharPref('moa.ntab.view');
    } catch(e) {}
    if (['nav', 'quickdial', 'search', 'blank'].indexOf(pane) == -1) {
      pane = 'quickdial';
    }
    return pane;
  },
  set currentPane(aPane) {
    NTabUtils.prefs.setCharPref('moa.ntab.view', aPane);
    tracker.track({ type: 'view', action: 'switch', sid: aPane });
  },
  get hideSearch() {
    // pref migration, may be removed after two or three release cycle
    let show = 'moa.ntab.dial.showSearch';
    let hide = 'moa.ntab.dial.hideSearch';
    if (NTabUtils.prefs.prefHasUserValue(show)) {
      NTabUtils.prefs.setBoolPref(hide, !NTabUtils.prefs.getBoolPref(show));
      NTabUtils.prefs.clearUserPref(show);
    }
    // end pref migration
    return NTabUtils.prefs.getBoolPref(hide);
  },

  get body() {
    delete this.body;
    return this.body = document.body;
  },
  _paneInit: function Ntab__paneInit() {
    let self = this;
    [].forEach.call(document.querySelectorAll('#navpane > a'), function(anchor) {
      anchor.addEventListener('click', function(evt) {
        self.currentPane = evt.target.getAttribute('data-pane');
      }, false);
    });
    this.update(true);
  },
  _observerInit: function NTab__observerInit() {
    NTabUtils.prefs.addObserver('moa.ntab.', this.observer, true);
  },
  _observerUninit: function NTab__observerUninit() {
    NTabUtils.prefs.removeObserver('moa.ntab.', this.observer, true);
  },
  _updateSettingsDisplay: function NTab__updateSettingsDisplay() {
    [].forEach.call(document.querySelectorAll('#page-settings > fieldset > div > label > input[type="checkbox"]'), function(input) {
      input.checked = NTabUtils.prefs.getBoolPref(input.getAttribute('data-pref'));
    });
  },

  handleEvent: function NTab_handle(evt) {
    switch(evt.type) {
      case 'DOMContentLoaded':
        this.init();
        break;
      case 'unload':
        this.uninit();
        break;
    }
  },
  init: function NTab_init() {
    //display first, then action
    Background.init();
    Grid.init();
    QDTabs.init();
    this._paneInit();
    //needs resizing after being shown
    Grid.resize();
    this._observerInit();
    Footer.init();
    Launcher.init();
    DefaultBrowser.init();
    Promo.init();
    NTabUtils.chromeWindow.MOA.NTab.QuickDialData.update();
    NTabUtils.chromeWindow.MOA.NTab.PartnerBookmarks.update();
  },
  uninit: function NTab_uninit() {
    this._observerUninit();
  },
  update: function NTab_update(aInit) {
    this._updateSettingsDisplay();

    let pane = this.currentPane;
    this.body.className = pane;

    let openInNewTab = NTabUtils.prefs.getBoolPref('moa.ntab.openLinkInNewTab');
    let queryString = ['openInNewTab', openInNewTab].join('=');

    let iframe = document.getElementById(pane).querySelector('iframe');
    if (iframe) {
      let srcPrefKey = ['moa.ntab.view', pane, 'url'].join('.');
      let src_ = NTabUtils.prefs.getCharPref(srcPrefKey);
      src_ = src_.replace(/%QS%/, queryString);
      if (pane == 'quickdial' && this.hideSearch) {
        src_ = 'about:blank';
      }
      if (iframe.getAttribute('src') != src_) {
        NTabUtils.loadIFrame(iframe, src_);
      }
    }
    if (aInit) {
      tracker.track({ type: 'view', action: 'load', sid: pane });
    }

    let anchor = document.querySelector('footer > a');
    anchor.href = NTabUtils.prefs.getCharPref('moa.ntab.view.firefoxchina.url');
    if (openInNewTab) {
      anchor.setAttribute('target', '_blank');
    }
    Grid.resize();
  },
};

window.addEventListener('DOMContentLoaded', NTab, false);
window.addEventListener('unload', NTab, false);

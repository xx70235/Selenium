(function() {
    // Initial global object
    // This object can be access by: MOA.NTab.Snapshot
    var ns = MOA.ns('NTab.Snapshot');

    var Cc = Components.classes;
    var Ci = Components.interfaces;

    Components.utils['import']('resource://ntab/utils.jsm', ns);
    Components.utils['import']('resource://ntab/quickdial.jsm', ns);
    Components.utils['import']('resource://ntab/hash.jsm', ns);

    /**
     * Tell snapshot module to create a snapshot for a given url.
     *
     * @param url
     *         url of website
     *
     * @return
     *         no return.
     *         Snapshot module should call function back: MOA.NTab.TabLoader.snapshotDone()
     */
    ns.createSnapshot = function(url) {
        // Add url to global hash, indicate that the url is under processing.
        ns.hashModule.add(url, true);
        queue.push(url);
        processQueue();
    };

    // Array to store urls
    var queue = [];
    var MAX_CONNECTIONS = 3;
    var snapshots = [];
    var TIMEOUT_LOAD = 30000;
    var browserSize = {
                        small : {width : 512, height : 318},
                        normal : {width : 1024, height : 635},
                        cutArea : {width : 360, height : 220}
                      };
    function processQueue() {
        if (snapshots.length >= MAX_CONNECTIONS)
            return;

        if (queue.length == 0)
            return;

        MOA.debug('Start generate snapshot for url: ' + queue[0]);
        snapshots.push(new NTSnapshot(queue.shift()));
    }

    function _snapshotDone(snapshot) {
        MOA.debug('Snapshot is done for url: ' + snapshot.url);

        var tmp = [];
        for (var i = 0; i < snapshots.length; i++) {
            if (snapshot == snapshots[i])
                continue;
            tmp.push(snapshots[i]);
        }
        snapshots = tmp;
        processQueue();

        MOA.debug('Refresh dial related: ' + snapshot.url);
        // Remove url from global hash, indicate that the snapshot work has been done.
        ns.hashModule.remove(snapshot.url);
        ns.quickDialModule.snapshotDone(snapshot.url);
    }

    var NTSnapshot = function(url) {
        this.initialize(url);
    };

    NTSnapshot.prototype = {
        initialize: function(url) {
            this.url = url;
            var self = this;
            setTimeout(function() {
                self.load();
            }, 0);
        },

        load: function() {
            MOA.debug('Create hidden browser to load url: ' + this.url);
            this.browser = document.createElement('browser');
            this.browser.width = browserSize.small.width;
            this.browser.height = browserSize.small.height;
            this.browser.setAttribute('type', 'content');
            document.getElementById('nt-hidden-box').appendChild(this.browser);

            var self = this;
            var other = this;
            this.loadEvent = function() {
                // FIXME loaded twice.
                // alert(self.browser.contentWindow.document.location);
                MOA.debug('Timeout when loading url: ' + self.url);
                self.onload();
            };

            this.timeout = window.setTimeout(function() {
                MOA.debug('Page has been loaded: ' + self.url);
                self.onload();
            }, TIMEOUT_LOAD);

            this.browser.setAttribute('src', this.url);
            this.browser.addEventListener('load', this.loadEvent, true);
        },

        onload: function() {
            MOA.debug('Create canvas to draw window: ' + this.url);

            window.clearTimeout(this.timeout);
            this.browser.removeEventListener('load', this.loadEvent, true);

            //adapted from https://gist.github.com/1036506
            function isDominantByOneColor(context, width, height) {
              let colorCount = {};
              let maxCount = 0;
              let dominantColor = "";
              // data is an array of a series of 4 one-byte values representing the rgba values of each pixel
              let data = context.getImageData(0, 0, width, height).data;

              for (let i = 0; i < data.length; i += 4) {
                // ignore transparent pixels
                if (data[i+3] == 0)
                  continue;

                let color = data[i] + "," + data[i+1] + "," + data[i+2];

                colorCount[color] = colorCount[color] ? colorCount[color] + 1 : 1;

                // keep track of the color that appears the most times
                if (colorCount[color] > maxCount) {
                  maxCount = colorCount[color];
                  dominantColor = color;
                }
              }
               // 0.4 is defined by test, maybe have better value
                return  (maxCount / (data.length / 4)) > 0.45;
            }
            function drawImageSnapshot() {
                MOA.debug('Image has been loaded: height=' + this.height + '   width=' + this.width);
                if (this.height <= 113 || this.width <= 113) {
                    getNextURLSnapshot();
                } else {
                    var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
                    canvas.width = this.width;
                    canvas.height = this.height;
                    var context = canvas.getContext('2d');
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.fillStyle = "#FFFFFF";
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    if(this.height <= canvas.height) {
                        context.drawImage(this, Math.floor(0.5 * (canvas.width - this.width)), Math.floor(0.5 * (canvas.height - this.height)));
                    } else {
                    // image is square
                        context.drawImage(this, Math.floor(0.5 * (canvas.width - canvas.height)), 0, canvas.height, canvas.height);
                    }
                    var data = canvas.toDataURL('image/png');
                    var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
                    var uri = ioService.newURI(data, 'UTF8', null);
                    ns.utils.saveURIToProFile(['ntab', 'cache', [ns.utils.md5(self.url), 'png'].join('.')], uri, function() {
                        MOA.debug('Snapshot image has been saved: ' + self.url);
                        _snapshotDone(self);
                        self.destroy();
                    });
                }
            }
            function getNextURLSnapshot() {
                cutWebPageCorner();
            }
            var imageArray = [];
            var wnd = this.browser.contentWindow;
            var doc = wnd.document;
            // update title and favicon
            ns.quickDialModule.updateTitleIfEmpty(this.url, doc.title);

            // Settimeout to draw thumbnail, make sure that whole page is complete rendered.
            var self = this;
            function cutWebPageCorner() {
                var width = browserSize.cutArea.width;
                var height = browserSize.cutArea.height;

                var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
                // keep same scale of with / height
                canvas.width = 360;
                canvas.height = height * canvas.width / width;

                var context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.scale(canvas.width / width,
                            canvas.height / height);
                context.save();
                context.drawWindow(wnd, 0, 0, width, height, 'rgb(255,255,255)');
                if(!isDominantByOneColor(context, canvas.width, canvas.height)) {
                    var data = canvas.toDataURL('image/png');
                    var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
                    var uri = ioService.newURI(data, 'UTF8', null);
                    ns.utils.saveURIToProFile(['ntab', 'cache', [ns.utils.md5(self.url), 'png'].join('.')], uri, function() {
                        MOA.debug('Snapshot image has been saved: ' + self.url);
                        _snapshotDone(self);
                        self.destroy();
                    });
                } else {
                    width = browserSize.small.width;
                    height = browserSize.small.height;
                    canvas.width = 360;
                    canvas.height = height * canvas.width / width;
                    var context = canvas.getContext('2d');
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.scale(canvas.width / width,
                                canvas.height / height);
                    context.save();
                    context.drawWindow(wnd, 0, 0, width, height, 'rgb(255,255,255)');
                    var data = canvas.toDataURL('image/png');
                    var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
                    var uri = ioService.newURI(data, 'UTF8', null);
                    ns.utils.saveURIToProFile(['ntab', 'cache', [ns.utils.md5(self.url), 'png'].join('.')], uri, function() {
                        MOA.debug('Snapshot image has been saved: ' + self.url);
                        _snapshotDone(self);
                        self.destroy();
                    });
                }
            }
            getNextURLSnapshot();
//            cutWebPageCorner();
        },

        destroy: function() {
            window.clearTimeout(this.timeout);
            if (this.browser) {
                this.browser.removeEventListener('load', this.loadEvent, true);
                if (this.browser.parentNode) {
                    this.browser.parentNode.removeChild(this.browser);
                }
                delete this.browser;
            }
        }
    };

    window.addEventListener('unload', function(event) {
        while (snapshots.length > 0) {
            var snapshot = snapshots.shift();
            ns.hashModule.remove(snapshot.url);
            ns.destroy();
        }
    }, false);
})();

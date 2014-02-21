let Cu = Components.utils;
Cu.import('resource://ntab/Tracking.jsm');

var tracker = (function() {
  function _trace_link(link) {
    if (!link.href || (link.href.indexOf('http://') != 0 && link.href.indexOf('https://') != 0))
      return;

    if (!_identify(link))
      return;

    tracker.track({
      type: 'link',
      action: 'click',
      href: link.href,
      title: link.title
    });
  }

  function _identify(link) {
    while (link && link.classList) {
      if (link.classList.contains('no-link-trace')) {
        return false;
      }

      if (link.classList.contains('link-trace')) {
        return true;
      }

      link = link.parentNode;
    }

    return false;
  }

  return {
    track: function(option) {
      Tracking.track(option);
    },

    onclick: function(event) {
      var target = event.target;
      if (!(target instanceof HTMLAnchorElement) && target.parentNode && target.parentNode instanceof HTMLAnchorElement) {
        target = target.parentNode;
      }

      if (!(target instanceof HTMLAnchorElement))
        return;

      _trace_link(target);
    }
  }
})();

document.addEventListener('click', tracker.onclick, false);

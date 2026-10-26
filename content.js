(() => {
  'use strict';

  // Visually-hidden accessibility labels ("Location:") and icon wrappers inside #xDetDlgLoc
  const IGNORED_TEXT_SELECTOR = 'span.XuJrye, [aria-hidden="true"], [role="tooltip"], button';

  /**
   * Fast check if an anchor's href points to Google Maps.
   */
  function isMapsUrl(url) {
    if (!url || !url.includes('map')) return false;
    try {
      const parsed = new URL(url, window.location.origin);
      return (
        parsed.hostname.includes('maps.google.') ||
        parsed.hostname === 'maps.app.goo.gl' ||
        (parsed.hostname.includes('google.') && parsed.pathname.startsWith('/maps')) ||
        (parsed.hostname === 'goo.gl' && parsed.pathname.startsWith('/maps'))
      );
    } catch {
      return false;
    }
  }

  /**
   * Builds a Google Maps search URL for a plain-text location string.
   */
  function toMapsSearchUrl(query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  /**
   * Extracts the clean location string from Google Calendar's #xDetDlgLoc container.
   */
  function extractPopupLocationText(locEl) {
    // Google Calendar stores the verbatim location string in `data-text` on #xDetDlgLoc
    const fromData = (locEl.dataset?.text || locEl.getAttribute('data-text') || '').trim();
    if (fromData) return fromData;

    // Fallback: find the first visible leaf element holding the address text
    for (const el of locEl.querySelectorAll('*')) {
      if (el.childElementCount !== 0) continue;
      const text = (el.textContent || '').trim();
      if (!text) continue;
      if (el.closest(IGNORED_TEXT_SELECTOR)) continue;
      return text;
    }
    return '';
  }

  /**
   * Checks if the clicked target is a Google Calendar location trigger.
   * Designed to be O(1) (ancestor-only `.closest()` checks) on all non-matching clicks
   * so it adds zero overhead to Google Calendar.
   */
  function findMapsTarget(target) {
    if (!(target instanceof Element)) return null;

    // 1. Event details popover location row (#xDetDlgLoc).
    // Google Calendar renders this row without an <a> tag; the row itself has role="button"
    // and triggers the Maps side panel via Wiz `jsaction`.
    const locRow = target.closest('#xDetDlgLoc');
    if (locRow) {
      // Allow secondary action buttons inside the row (like "Copy location") to work normally
      const actionBtn = target.closest('button, [role="button"]');
      if (actionBtn && actionBtn !== locRow) {
        const label = (
          actionBtn.getAttribute('aria-label') ||
          actionBtn.getAttribute('data-tooltip') ||
          actionBtn.getAttribute('title') ||
          ''
        ).toLowerCase();
        if (label.includes('copy')) {
          return null;
        }
      }

      const query = extractPopupLocationText(locRow);
      if (query) {
        return { url: toMapsSearchUrl(query) };
      }
    }

    // 2. Direct click on an <a href="..."> pointing to Google Maps
    const anchor = target.closest('a[href]');
    if (anchor && isMapsUrl(anchor.href)) {
      return { url: anchor.href };
    }

    // 3. "Preview in Maps" / "Open in Maps" button (e.g. in the event editor)
    const mapsBtn = target.closest('[aria-label*="Maps" i], [data-tooltip*="Maps" i]');
    if (mapsBtn) {
      const label = (
        mapsBtn.getAttribute('aria-label') ||
        mapsBtn.getAttribute('data-tooltip') ||
        ''
      ).toLowerCase();

      if (label.includes('preview in maps') || label.includes('open in maps') || label.includes('open in google maps')) {
        const container = mapsBtn.closest('[role="dialog"], [role="main"], body');
        const input = container?.querySelector(
          'input[aria-label*="Location" i], input[placeholder*="location" i], [role="combobox"][aria-label*="Location" i]'
        );
        const query = (input?.value || input?.textContent || '').trim();
        if (query) {
          return { url: toMapsSearchUrl(query) };
        }
      }
    }

    return null;
  }

  // Block pointer/mouse events from reaching Google Calendar's `jsaction` handlers
  // when clicking a location, so Calendar cannot open the Maps sidebar on mousedown/mouseup.
  for (const eventType of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
    window.addEventListener(
      eventType,
      (event) => {
        if (event.button !== 0) return;
        if (!findMapsTarget(event.target)) return;
        event.stopPropagation();
        event.stopImmediatePropagation();
      },
      true
    );
  }

  // On click, block Google Calendar's handler and open Google Maps in a new tab.
  window.addEventListener(
    'click',
    (event) => {
      if (event.button !== 0) return;
      const match = findMapsTarget(event.target);
      if (!match) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      window.open(match.url, '_blank', 'noopener,noreferrer');
    },
    true
  );
})();

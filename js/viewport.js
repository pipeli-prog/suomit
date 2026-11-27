// Phone layout fixes: no zooming, and the practice screen (with its buttons) stays above the on-screen keyboard.

/** Height of the on-screen keyboard (iOS keeps the layout viewport and shrinks only the visual one). */
const keyboardOpen = vv => innerHeight - vv.height > 120;

export function initViewport() {
  // iOS Safari ignores user-scalable=no: block pinch zoom with its gesture events (double-tap zoom is off via
  // touch-action: manipulation in the CSS, which also removes the tap delay without swallowing quick taps)
  for (const t of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(t, e => e.preventDefault(), { passive: false });
  document.addEventListener('touchmove', e => { if (e.scale !== undefined && e.scale !== 1) e.preventDefault(); }, { passive: false });

  const vv = window.visualViewport;
  const session = document.getElementById('session');
  // While practising, the page behind the session is locked (body.in-session is position: fixed in the CSS), so
  // there is no page scroll for iOS to get out of sync with. Remember and restore where the page was.
  let savedY = 0, lastY = 0, shown = false;
  window.addEventListener('scroll', () => { if (session.hidden) lastY = scrollY; }, { passive: true }); // read before the lock zeroes it
  new MutationObserver(() => {
    const now = !session.hidden;
    if (now && !shown) savedY = lastY;
    if (!now && shown) requestAnimationFrame(() => window.scrollTo(0, savedY));
    shown = now;
  }).observe(session, { attributes: true, attributeFilter: ['hidden'] });
  if (!vv) return;
  let wasOpen = false;
  const fit = () => {
    const s = document.getElementById('session'), open = keyboardOpen(vv);
    document.documentElement.classList.toggle('kb-open', open);
    if (s && !s.hidden && open) {
      // pin the session to the visible area: its footer (Check / I don't know / Continue) sits right above the keyboard
      s.style.top = vv.offsetTop + 'px'; s.style.height = vv.height + 'px'; s.style.bottom = 'auto';
      const a = document.activeElement;
      if (a?.matches?.('input')) requestAnimationFrame(() => a.scrollIntoView({ block: 'nearest' }));
    } else if (s) { s.style.top = s.style.height = s.style.bottom = ''; }
    // iOS can leave the page scrolled after the keyboard closes, which shifts where taps land: put it back
    if (wasOpen && !open && s && !s.hidden) window.scrollTo(0, 0);
    wasOpen = open;
  };
  vv.addEventListener('resize', fit);
  vv.addEventListener('scroll', fit);
  new MutationObserver(fit).observe(session, { attributes: true, attributeFilter: ['hidden'] });
  // Coming back from another app, iOS can draw the page in one place while taps still land where it was
  // (you tap an answer and the one above it gets picked). Close the keyboard when leaving, and on return
  // reset the scroll, re-measure and force a fresh layout so drawing and tapping line up again.
  const resync = () => {
    if (!session.hidden) window.scrollTo(0, 0);
    else { const y = scrollY; window.scrollTo(0, y + 1); window.scrollTo(0, y); } // a scroll makes iOS redo hit-testing
    fit();
    requestAnimationFrame(fit);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (document.activeElement?.matches?.('input,textarea')) document.activeElement.blur(); }
    else resync();
  });
  window.addEventListener('pageshow', resync);
  window.addEventListener('focus', resync);
  window.addEventListener('orientationchange', () => setTimeout(resync, 300));
}

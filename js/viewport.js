// Phone layout fixes: no zooming, and the practice screen (with its buttons) stays above the on-screen keyboard.

/** Height of the on-screen keyboard (iOS keeps the layout viewport and shrinks only the visual one). */
const keyboardOpen = vv => innerHeight - vv.height > 120;

export function initViewport() {
  // iOS Safari ignores user-scalable=no: block pinch zoom with its gesture events (double-tap zoom is off via
  // touch-action: manipulation in the CSS, which also removes the tap delay without swallowing quick taps)
  for (const t of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(t, e => e.preventDefault(), { passive: false });
  document.addEventListener('touchmove', e => { if (e.scale !== undefined && e.scale !== 1) e.preventDefault(); }, { passive: false });

  const vv = window.visualViewport;
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
  // a new question re-renders the session: re-fit it if the keyboard is still up
  new MutationObserver(fit).observe(document.getElementById('session'), { attributes: true, attributeFilter: ['hidden'] });
}

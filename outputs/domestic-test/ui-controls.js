// A numeric field stays editable; dragging and wheel input are additional shortcuts.
export function setupNumberScrub(input, onValue) {
  const min = Number(input.min), max = Number(input.max), step = Number(input.step) || 1;
  let last = Number(input.value), drag = null, suppressClick = false;
  const clamp = value => Math.max(min, Math.min(max, Number((Math.round(value / step) * step).toFixed(4))));
  function commit(value, write = true) {
    if (!Number.isFinite(value)) return;
    const next = clamp(value);
    if (write) input.value = next;
    if (next !== last) { last = next; onValue(next); }
  }
  input.addEventListener('input', () => {
    if (input.value === '') return;
    const value = Number(input.value);
    commit(value, value < min || value > max);
  });
  input.addEventListener('change', () => commit(input.value === '' ? last : Number(input.value)));
  input.addEventListener('blur', () => commit(input.value === '' ? last : Number(input.value)));
  input.addEventListener('wheel', event => {
    if (input.disabled || input.matches(':disabled') || !event.deltaY) return;
    event.preventDefault();
    commit(Number(input.value || last) - Math.sign(event.deltaY) * (event.shiftKey ? 10 : step));
  }, { passive: false });
  input.addEventListener('pointerdown', event => {
    if (event.button !== 0 || input.matches(':disabled')) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, value: Number(input.value || last), active: false };
  });
  input.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = drag.y - event.clientY;
    if (!drag.active && Math.hypot(dx, dy) < 5) return;
    if (!drag.active) { drag.active = true; input.setPointerCapture(event.pointerId); input.classList.add('scrubbing'); }
    event.preventDefault();
    const distance = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
    commit(drag.value + Math.round(distance / 3) * step);
  });
  function finish() {
    if (!drag) return;
    suppressClick = drag.active;
    if (input.hasPointerCapture(drag.id)) input.releasePointerCapture(drag.id);
    drag = null; input.classList.remove('scrubbing');
  }
  input.addEventListener('pointerup', finish);
  input.addEventListener('pointercancel', finish);
  input.addEventListener('lostpointercapture', finish);
  window.addEventListener('pointerup', finish);
  window.addEventListener('blur', finish);
  input.addEventListener('click', event => { if (suppressClick) { event.preventDefault(); suppressClick = false; } });
  return value => { last = clamp(value); input.value = last; };
}

export function setupSettingsDialog(button, dialog, closeButton) {
  button.addEventListener('click', () => { dialog.showModal(); button.setAttribute('aria-expanded', 'true'); });
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { button.setAttribute('aria-expanded', 'false'); button.focus(); });
  // Only the backdrop closes the panel, not a drag ending outside its bounds.
  let backdrop = false;
  dialog.addEventListener('pointerdown', e => { backdrop = e.target === dialog; });
  dialog.addEventListener('click', e => { if (backdrop && e.target === dialog) dialog.close(); });
}

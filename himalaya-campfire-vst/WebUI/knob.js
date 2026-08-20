// Mando de "INTENSIDAD": se arrastra verticalmente (o con las flechas del
// teclado). En el plugin, app.js lo conecta con el parámetro automatizable
// del DAW mediante los callbacks onChange/onDragStart/onDragEnd, y empuja los
// cambios que llegan del DAW con setValue(..., {fromHost: true}).
const Knob = (() => {
  let value = 0.45; // 0..1
  let dragging = false;
  let dragStartY = 0;
  let dragStartValue = 0;
  let element;
  let pointerEl;
  let callbacks = {};

  const MIN_ANGLE = -135;
  const MAX_ANGLE = 135;

  function applyRotation() {
    const angle = MIN_ANGLE + value * (MAX_ANGLE - MIN_ANGLE);
    pointerEl.style.transform = `rotate(${angle}deg)`;
    element.setAttribute("aria-valuenow", Math.round(value * 100));
  }

  function setValue(v, { fromHost = false } = {}) {
    value = Math.min(1, Math.max(0, v));
    applyRotation();
    if (!fromHost && callbacks.onChange) callbacks.onChange(value);
  }

  function onPointerDown(e) {
    dragging = true;
    dragStartY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    dragStartValue = value;
    element.classList.add("active");
    if (callbacks.onDragStart) callbacks.onDragStart();
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? dragStartY;
    const delta = dragStartY - clientY;
    setValue(dragStartValue + delta / 160);
  }

  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    element.classList.remove("active");
    if (callbacks.onDragEnd) callbacks.onDragEnd();
  }

  function onKeyDown(e) {
    const step = 0.05;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      setValue(value + step);
      e.preventDefault();
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      setValue(value - step);
      e.preventDefault();
    }
  }

  function attach(knobElement, newCallbacks = {}) {
    element = knobElement;
    pointerEl = element.querySelector(".knob-pointer");
    callbacks = newCallbacks;

    element.addEventListener("mousedown", onPointerDown);
    element.addEventListener("touchstart", onPointerDown, { passive: false });
    element.addEventListener("keydown", onKeyDown);

    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchend", onPointerUp);

    applyRotation();
  }

  return {
    attach,
    setValue,
    get value() {
      return value;
    },
  };
})();

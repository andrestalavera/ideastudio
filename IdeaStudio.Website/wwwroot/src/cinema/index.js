// wwwroot/src/cinema/index.js
let state = null;

export async function initialize(canvas, dotNetRef) {
  state = { canvas, dotNetRef };
  console.info('[cinema] stub initialized');
}

export async function setScene(name, parameters) {
  console.info('[cinema] setScene', name, parameters);
}

export async function registerReveal(id, element, options) {}
export async function unregisterReveal(id) {}
export async function registerPinnedTimeline(container, track, cardCount) {}
export async function setCulture(cultureName) {}
export async function dispose() { state = null; }

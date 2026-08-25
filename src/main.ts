import { mount } from "svelte";
import App from "./App.svelte";
import { fetching, sending } from "./api/browser";
import "./app.css";

const target = document.querySelector("#app");

if (target === null) throw new Error("the page has no #app to mount into");

export default mount(App, {
  target,
  props: {
    at: globalThis.location.origin,
    store: globalThis.sessionStorage,
    sending,
    fetching,
  },
});

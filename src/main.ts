import { mount } from "svelte";
import App from "./App.svelte";
import "./app.css";

const target = document.querySelector("#app");

if (target === null) throw new Error("the page has no #app to mount into");

export default mount(App, { target });

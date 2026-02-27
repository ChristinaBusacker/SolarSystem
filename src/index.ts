import { Application } from "./application";
import "./styles/main.scss";

const APP = Application.getInstance();

APP.init();

APP.animate();

// On Purpose to access application via APP in console
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).app = APP;

export { APP };

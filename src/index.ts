import { Application } from "./application";

const APP = Application.getInstance();

APP.init();
APP.animate();

(window as any).app = APP

export { APP };
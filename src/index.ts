import { Application } from "./application";

const APP = Application.getInstance();
APP.init();
APP.animate();

export { APP };
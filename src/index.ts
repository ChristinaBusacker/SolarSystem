import { Application } from "./application";
import "./styles/main.scss";

const APP = Application.getInstance();

APP.init();

APP.animate();

(window as any).app = APP;

export { APP };

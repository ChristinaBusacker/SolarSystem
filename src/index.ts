import { Application } from "./application";
import "./styles/main.scss";
import { UiRenderer } from "./ui/ui-renderer";

const APP = Application.getInstance();

APP.init();

APP.animate();

(window as any).app = APP;

export { APP };

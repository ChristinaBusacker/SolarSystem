import { Application } from "./application";
import "./styles/main.scss";
import { UiRenderer } from "./ui/ui-renderer";

const APP = Application.getInstance();

APP.init();

// Start a frameworkless UI layer (sidebar, toggles, later: planet info + quizzes).
UiRenderer.getInstance(APP).init();

APP.animate();

(window as any).app = APP

export { APP };
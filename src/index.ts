import { Application } from "./application";

const APP = Application.getInstance();

APP.init();
APP.animate();

(window as any).app = APP

setTimeout(() => {
    APP.cameraManager.switchCamera('Io')
}, 1000)

export { APP };
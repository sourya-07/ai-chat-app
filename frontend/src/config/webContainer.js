import { webContainer } from "@webcontainer/api";

let webContainerInstance = null;

export const getwebContainerInstance = async () => {
    if(webContainerInstance === null) {
        webContainerInstance = await webContainer.boot();
    }
    return webContainerInstance;
}
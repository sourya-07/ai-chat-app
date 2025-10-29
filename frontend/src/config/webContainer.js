import { webContainer } from "@webcontainer/api";

let webContainerInstance = null;

export async function getWebContainer() {
    if (webContainerInstance === null) {
        webContainerInstance = new webContainer()
    }
    return webContainerInstance
}
/* eslint-disable no-unused-vars */
import { createApp, ref, watch } from "vue";
import App from "../view/popup.vue";
createApp(App).mount("#app");
var statusText = false;
var connectionPort;
var currentTab;
document.addEventListener("DOMContentLoaded", function () {
  chrome.windows.getCurrent(function (wind) {
    let currentWindow = wind;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      currentTab = tabs[0];
      chrome.tabs.sendMessage(
        currentTab.id,
        { connect: 1 },
        function (response) {
          if (typeof response !== "undefined") {
            if (typeof response.iamHere != "undefined") {
              connectionPort = chrome.tabs.connect(currentTab.id, {});
              connectionPort.postMessage({ command: "connect" });
              connectionPort.onMessage.addListener(function (response) {
                if (typeof response.data.statusText !== "undefined") {
                  statusText = response.data.statusText;
                }
                document.getElementById("myButton").checked = statusText;
              });
            }
          }
        }
      );
    });
  });
});

export function buttonClick(messageStart) {
  connectionPort.postMessage({
    command: "buttonClick",
    statusText: !statusText,
  });
  window.close();
}

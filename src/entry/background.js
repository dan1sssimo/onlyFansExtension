var tabId = 0;
chrome.runtime.onMessage.addListener(function (request, sender) {
  tabId = sender.tab.id;
  try {
    fetch(
      "https://raw.githubusercontent.com/DATAHOARDERS/dynamic-rules/main/onlyfans.json"
    )
      .then((response) => response.json())
      .then((data) => {
        chrome.tabs.sendMessage(
          tabId,
          { data: data, msg: "updateDynamicRules" },
          function () {
            // console.log(response);
          }
        );
      });
  } catch (e) {
    //
  }
});

chrome.action.onClicked.addListener((tab) => {
  // যখন ইউজার আইকনে ক্লিক করবে, তখন engine.js ফাইলটি ওয়েবসাইটের ভেতরে ইনজেক্ট হবে
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN", 
    files: ["engine.js"]
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeinfo) => {
    if (changeinfo.status === 'complete') {
        chrome.scripting.executeScript({
            target: { tabId },
            files: ['main.js'],
        });
    }
});

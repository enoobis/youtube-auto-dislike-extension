document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM loaded");
    const delayElement = document.getElementById('delay');
    const setDelayButton = document.getElementById('setDelay');  // Make sure this ID exists in your HTML
    const toggleEnable = document.getElementById('toggleEnable');

    // Get the version number from the manifest
    const manifestData = chrome.runtime.getManifest();
    const version = manifestData.version;

    // Display the version number in the popup
    const versionElement = document.getElementById('version');
    versionElement.textContent = 'Version: ' + version;

    chrome.storage.sync.get(['delay', 'enabled'], function (data) {
        if (chrome.runtime.lastError) {
            console.log("Runtime error: ", chrome.runtime.lastError);
        } else {
            console.log('Data retrieved from storage:', data);
            if (data.delay) {
                delayElement.value = data.delay / 1000;
            }
            if (typeof data.enabled !== 'undefined') {
                toggleEnable.checked = data.enabled;
            }
        }
    });

    setDelayButton.addEventListener('click', function () {
        console.log("Save button clicked");
        const delayValue = parseInt(delayElement.value, 10) * 1000;
        chrome.storage.sync.set({ 'delay': delayValue }, function () {
            if (chrome.runtime.lastError) {
                console.log("Runtime error: ", chrome.runtime.lastError);
            } else {
                console.log('Delay value saved:', delayValue);
            }
        });
        chrome.runtime.sendMessage({ type: 'updateDelay', value: delayValue });
    });

    toggleEnable.addEventListener('change', function () {
        console.log("Checkbox clicked");
        const isEnabled = toggleEnable.checked;
        chrome.storage.sync.set({ 'enabled': isEnabled }, function () {
            if (chrome.runtime.lastError) {
                console.log("Runtime error: ", chrome.runtime.lastError);
            } else {
                console.log('Enabled state saved:', isEnabled);
            }
        });
        chrome.runtime.sendMessage({ type: 'updateEnabled', value: isEnabled });
    });
});

let delay = 10000; // Default delay of 10 seconds
let isEnabled = true; // Default state
let isDebugMode = false; // Default debug mode state
let playbackTimer = 0;
let lastUrl = window.location.href;

// Establish a long-lived connection with the background script
const port = chrome.runtime.connect();

// Send error message to background script
const sendErrorMessage = (error) => {
    if (port) {
        try {
            port.postMessage({ type: 'error', error: error.toString() });
        } catch (e) {
            console.error("Error sending message to background script:", e);
        }
    } else {
        console.error("Port not available:", error);
    }
};

// Custom debug log function
const debugLog = (...messages) => {
    if (isDebugMode) {
        console.log(...messages);
    }
};

// Function to reload settings including debug mode
const reloadSettings = () => {
    chrome.storage.sync.get(['delay', 'enabled', 'debugMode'], function (data) {
        if (chrome.runtime.lastError) {
            console.error("Runtime error:", chrome.runtime.lastError);
            return;
        }

        if (data.delay) {
            delay = data.delay;
        }

        if (typeof data.enabled !== 'undefined') {
            isEnabled = data.enabled;
        }

        if (typeof data.debugMode !== 'undefined') {
            isDebugMode = data.debugMode;
        }

        debugLog("Settings reloaded: ", { delay, isEnabled, isDebugMode });
    });
};

// Call reloadSettings to load initial settings including debug mode
reloadSettings();

// Update settings when received from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateDelay') {
        delay = message.value;
    }
    if (message.type === 'updateEnabled') {
        isEnabled = message.value;
    }
    debugLog("Received message: ", message);
});

const dislikeFunction = () => {
    try {
        reloadSettings();

        if (!isEnabled) {
            debugLog("Feature is not enabled");
            return;
        }

        const adBadge = document.querySelector('.ytp-ad-simple-ad-badge');
        if (!adBadge) {
            debugLog("No ad badge found, proceeding with dislike button click");

            const likeButtonXpath = '//*[@id="top-level-buttons-computed"]/segmented-like-dislike-button-view-model/yt-smartimation/div/div/like-button-view-model/toggle-button-view-model/button';
            const likeButtonResult = document.evaluate(likeButtonXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const likeButton = likeButtonResult.singleNodeValue;

            const dislikeButtonXpath = '//*[@id="top-level-buttons-computed"]/segmented-like-dislike-button-view-model/yt-smartimation/div/div/dislike-button-view-model/toggle-button-view-model/button';
            const dislikeButtonResult = document.evaluate(dislikeButtonXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const dislikeButton = dislikeButtonResult.singleNodeValue;

            debugLog("Like Button:", likeButton);
            debugLog("Dislike Button:", dislikeButton);

            // Check if the video already has a like
            if (likeButton && likeButton.getAttribute('aria-pressed') === 'true') {
                debugLog("Video already liked, not clicking dislike button");
            } else if (dislikeButton && dislikeButton.getAttribute('aria-pressed') === 'false') {
                debugLog("Clicking dislike button");
                dislikeButton.click();
            } else {
                debugLog("Dislike button is already pressed or not found");
            }
        } else {
            debugLog("Ad badge is present, not clicking dislike button");
        }
    } catch (error) {
        sendErrorMessage(error);
        debugLog("Error in dislikeFunction:", error);
    }
};

const checkForUrlChange = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        debugLog("URL changed from", lastUrl, "to", currentUrl);
        lastUrl = currentUrl;
        playbackTimer = 0;
    }
};

window.addEventListener('popstate', () => {
    checkForUrlChange();
    debugLog("popstate event detected");
});

setInterval(() => {
    if (!isEnabled) {
        return;
    }

    checkForUrlChange();

    const videoElement = document.querySelector('video');
    if (videoElement && !videoElement.paused) {
        playbackTimer += 1000;
        if (playbackTimer >= delay) {
            debugLog("Triggering dislikeFunction after delay:", delay);
            dislikeFunction();
            playbackTimer = 0;
        }
    }
}, 1000);

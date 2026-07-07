
chrome.action.onClicked.addListener(async (tab) => {
    
    
    try {
        const storage = await chrome.storage.local.get(['am_license_key']);
        if (storage.am_license_key) {
            const PROJECT_ID = "audio-master-admin";
            const FB_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/licenses/${storage.am_license_key}`;
            
            const res = await fetch(FB_URL);
            if (res.status === 404) {
                
                await chrome.storage.local.remove(['am_license_key', 'am_plan', 'am_expiry_date', 'am_last_check']);
            } else {
                const data = await res.json();
                const status = data.fields?.status?.stringValue || '';
                
               
                if (status !== 'active') {
                    await chrome.storage.local.remove(['am_license_key', 'am_plan', 'am_expiry_date', 'am_last_check']);
                }
            }
        }
    } catch (e) {
        console.error("Instant Kick Check Error: ", e);
    }

   
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["auth.js"]
    }).catch(err => console.error("Auth Injection Error: ", err));
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "INJECT_ENGINE") {
        
        
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            world: "MAIN", 
            files: ["engine.js"]
        }).then(() => {
            console.log("Audio Master: Engine injected successfully (No CSP Error!).");
        }).catch(err => console.error("Engine Injection Error: ", err));
        
    }
});
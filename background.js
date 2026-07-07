// ১. ইউজার যখন এক্সটেনশন আইকনে ক্লিক করবে
chrome.action.onClicked.addListener(async (tab) => {
    
    // 🚫 INSTANT KICK/BLOCK CHECK: আইকনে ক্লিক করার সাথে সাথে লাইভ চেক করবে
    try {
        const storage = await chrome.storage.local.get(['am_license_key']);
        if (storage.am_license_key) {
            const PROJECT_ID = "audio-master-admin";
            const FB_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/licenses/${storage.am_license_key}`;
            
            const res = await fetch(FB_URL);
            if (res.status === 404) {
                // কি ডিলিট হয়ে গেলে মেমোরি ক্লিয়ার করবে
                await chrome.storage.local.remove(['am_license_key', 'am_plan', 'am_expiry_date', 'am_last_check']);
            } else {
                const data = await res.json();
                const status = data.fields?.status?.stringValue || '';
                
                // যদি অ্যাডমিন প্যানেল থেকে ব্লক বা কিক করা হয়, তবে মেমোরি মুছে লগআউট করে দেবে
                if (status !== 'active') {
                    await chrome.storage.local.remove(['am_license_key', 'am_plan', 'am_expiry_date', 'am_last_check']);
                }
            }
        }
    } catch (e) {
        console.error("Instant Kick Check Error: ", e);
    }

    // প্রথমে শুধু লাইসেন্স চেকিং ফাইলটি (auth.js) ইনজেক্ট করবে
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["auth.js"]
    }).catch(err => console.error("Auth Injection Error: ", err));
});

// ২. auth.js থেকে সিগন্যাল শোনার জন্য অপেক্ষা করবে
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "INJECT_ENGINE") {
        
        // লাইসেন্স ঠিক থাকলে এবার আসল অডিও ইঞ্জিন (engine.js) কে MAIN world-এ ইনজেক্ট করবে!
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            world: "MAIN", 
            files: ["engine.js"]
        }).then(() => {
            console.log("Audio Master: Engine injected successfully (No CSP Error!).");
        }).catch(err => console.error("Engine Injection Error: ", err));
        
    }
});
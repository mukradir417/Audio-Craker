(async () => {
    // যদি আগে থেকেই প্যানেল থাকে, তবে নতুন করে রান করবে না
    if (document.getElementById('am-auth-ui') || window.__MAC_MASTER_INJECTED) return;
    window.__MAC_MASTER_INJECTED = true;

    // ফায়ারবেস লিংক (আপনার প্রজেক্ট)
    const PROJECT_ID = "audio-master-admin";
    const FB_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/licenses/`;

    // গ্লোবাল মেমোরি থেকে ডাটা চেক করা (Smart Cache Added)
    let storage = await chrome.storage.local.get(['am_device_id', 'am_license_key', 'am_plan', 'am_expiry_date', 'am_last_check']);
    let deviceId = storage.am_device_id;
    
    // ডিভাইস আইডি না থাকলে নতুন তৈরি করে ব্রাউজারে সেভ করে রাখবে
    if (!deviceId) {
        deviceId = 'DEV-' + Math.random().toString(36).substr(2, 8).toUpperCase();
        await chrome.storage.local.set({ 'am_device_id': deviceId });
    }

    // লাইসেন্স চাওয়ার ড্যাশবোর্ড
    function showAuthUI(errorMsg = '') {
        let authContainer = document.getElementById('am-auth-ui');
        if (!authContainer) {
            authContainer = document.createElement('div');
            authContainer.id = 'am-auth-ui';
            authContainer.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 2147483647;
                background: linear-gradient(155deg, #111, #000); color: #fff;
                padding: 20px; border-radius: 14px; width: 280px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.9); font-family: 'Segoe UI', Tahoma, sans-serif;
                border: 1px solid rgba(255, 255, 255, 0.1);
            `;
            document.body.appendChild(authContainer);
        }
        
        authContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 15px;">
                <strong style="font-size: 16px;">🔐 Activation Required</strong>
                <button id="am-close-auth" style="background:transparent; border:none; color:#aaa; font-size:16px; cursor:pointer;">−</button>
            </div>
            ${errorMsg ? `<div style="background: #ef4444; color: white; padding: 8px; border-radius: 6px; font-size: 12px; margin-bottom: 15px; text-align: center; font-weight: bold;">${errorMsg}</div>` : ''}
            
            <div style="font-size: 12px; color: #aaa; margin-bottom: 8px; display: flex; justify-content: space-between;">
                <span>Your Device ID:</span> 
                <span style="color:#10b981; font-family: monospace; font-weight:bold;">${deviceId}</span>
            </div>
            
            <input type="text" id="am-key-input" placeholder="Enter License Key" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #444; background: #222; color: #fff; margin-bottom: 15px; outline: none; box-sizing: border-box; font-family: monospace; text-transform: uppercase;">
            <button id="am-activate-btn" style="width: 100%; padding: 12px; border-radius: 8px; border: none; background: #2563eb; color: white; font-weight: bold; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);">Verify & Activate</button>
        `;

        document.getElementById('am-close-auth').onclick = () => authContainer.style.display = 'none';
        document.getElementById('am-activate-btn').onclick = () => verifyLicense(document.getElementById('am-key-input').value.trim().toUpperCase());
    }

    // ফায়ারবেস থেকে লাইসেন্স যাচাই করা (Silent Mode Added for Background Check)
    async function verifyLicense(key, isSilent = false) {
        if (!key) return;
        const btn = document.getElementById('am-activate-btn');
        if(btn && !isSilent) btn.innerText = "Verifying...";

        try {
            const res = await fetch(FB_URL + key);
            if (res.status === 404) {
                await chrome.storage.local.remove(['am_license_key', 'am_plan', 'am_expiry_date', 'am_last_check']);
                if (!isSilent) return showAuthUI('❌ Invalid License Key!');
                return;
            }
            
            const data = await res.json();
            if(!data.fields) {
                if (!isSilent) return showAuthUI('❌ Server Error!');
                return;
            }

            const fields = data.fields;
            const status = fields.status?.stringValue || '';
            const expiresAt = fields.expiresAt?.stringValue || '';
            const dbDeviceId = fields.deviceId?.stringValue || '';
            const plan = fields.plan?.stringValue || 'Unknown';

            if (status !== 'active') {
                await chrome.storage.local.remove(['am_license_key', 'am_plan', 'am_expiry_date', 'am_last_check']);
                if (!isSilent) return showAuthUI('❌ License Blocked/Inactive!');
                return;
            }

            // Expiry Date Check
            const today = new Date();
            today.setHours(0,0,0,0);
            
            const expiryDate = new Date(expiresAt);
            expiryDate.setHours(23,59,59,999);
            
            if (expiryDate < new Date()) {
                await chrome.storage.local.remove(['am_license_key', 'am_plan', 'am_expiry_date', 'am_last_check']);
                if (!isSilent) return showAuthUI('❌ License Expired!');
                return;
            }

            if (dbDeviceId && dbDeviceId !== deviceId) {
                await chrome.storage.local.remove(['am_license_key', 'am_plan', 'am_expiry_date', 'am_last_check']);
                if (!isSilent) return showAuthUI('❌ Device Limit Reached!');
                return;
            }

            if (!dbDeviceId) {
                await fetch(`${FB_URL}${key}?updateMask.fieldPaths=deviceId`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fields: { deviceId: { stringValue: deviceId } } })
                });
            }

            await chrome.storage.local.set({ 
                'am_license_key': key,
                'am_plan': plan,
                'am_expiry_date': expiryDate.toISOString(),
                'am_last_check': Date.now()
            });

            if (!isSilent) {
                const authUi = document.getElementById('am-auth-ui');
                if (authUi) authUi.remove();
                launchEngine(plan, expiryDate.toISOString(), deviceId);
            }

        } catch (e) {
            if (!isSilent) showAuthUI('❌ Network Error. Try Again.');
        }
    }

    // 🔴 CSP ERROR FIX: ইনলাইন স্ক্রিপ্টের বদলে HTML5 Dataset ব্যবহার করে ডাটা পাস করা হয়েছে
    function launchEngine(plan, expiryDate, deviceId) {
        document.documentElement.dataset.amPlan = plan;
        document.documentElement.dataset.amExpiryDate = expiryDate;
        document.documentElement.dataset.amId = deviceId;

        // Background.js কে সিগন্যাল দেওয়া যাতে সে engine.js পুশ করে
        chrome.runtime.sendMessage({ action: "INJECT_ENGINE" });
    }

    // পেজ লোড হলেই চেক করবে আগে থেকে লাইসেন্স আছে কি না (Smart Auto-Check)
    const savedKey = storage.am_license_key;
    const savedPlan = storage.am_plan;
    const savedExpiry = storage.am_expiry_date;
    const lastCheck = storage.am_last_check || 0;
    const now = Date.now();

    if (savedKey) {
        if (savedPlan && savedExpiry) {
            if (new Date(savedExpiry) < new Date()) {
                await chrome.storage.local.remove(['am_license_key', 'am_plan', 'am_expiry_date', 'am_last_check']);
                showAuthUI('❌ License Expired!');
            } else {
                launchEngine(savedPlan, savedExpiry, deviceId);
                
                if ((now - lastCheck) > (2 * 60 * 60 * 1000)) {
                    verifyLicense(savedKey, true); // Silent background check
                }
            }
        } else {
            await verifyLicense(savedKey);
        }
    } else {
        showAuthUI();
    }
})();
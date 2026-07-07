(() => {
  // --- Toggle Logic: Icon click korle UI hide/show hobe ---
  if (window.__MAC_MASTER_INJECTED) {
      const mainUi = document.getElementById('am-main-ui');
      if (mainUi) {
          mainUi.style.display = mainUi.style.display === 'none' ? 'block' : 'none';
      }
      return;
  }
  window.__MAC_MASTER_INJECTED = true;

  console.log("🚀 Mitu YT Audio Engine: Full Capture, Smart Format, TURBO & LIVE COUNTDOWN Active!");

  // --- Auth Variables (From Background) ---
  const userPlan = document.documentElement.dataset.amPlan || window.__AM_PLAN || 'Premium';
  const userExpiry = document.documentElement.dataset.amExpiryDate || window.__AM_EXPIRY_DATE || '';
  const userId = document.documentElement.dataset.amId || window.__AM_ID || 'Verified';

  // --- State Variables ---
  let isRecording = false;
  let currentSpeed = 1; 
  let chunks = [];
  let totalBytes = 0;
  let downloadSerial = 1; 
  
  let activeSeconds = 0;
  let timerInterval = null;
  let idleTimeout = null;
  let lastChunkSignature = "";
  
  let pendingStopTimer = null; 
  let countdownTimer = null; 

  // ==============================================================
  // 🌟 1. UI DESIGN (MITU YT PREMIUM EDITION 10/10)
  // ==============================================================
  const ui = document.createElement('div');
  ui.id = 'am-main-ui'; 
  ui.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 2147483647;
    background: #09090b; color: #f8fafc;
    border-radius: 16px; width: 310px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05);
    font-family: 'Segoe UI', system-ui, sans-serif;
    user-select: none; overflow: hidden;
  `;
  
  ui.innerHTML = `
    <style>
      .am-header { padding: 16px 20px; background: linear-gradient(135deg, #18181b, #000); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
      .am-brand { font-size: 15px; font-weight: 800; letter-spacing: 0.5px; color: #fff; display: flex; flex-direction: column; gap: 2px;}
      .am-brand-sub { font-size: 10px; color: #dc2626; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;}
      .am-status-badge { background: #22c55e; color: #000; padding: 3px 8px; border-radius: 6px; font-size: 9px; font-weight: 800; letter-spacing: 1px; }
      
      .am-card { padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .am-plan-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
      .am-plan-title { font-size: 13px; font-weight: 700; color: #fbbf24; display: flex; align-items: center; gap: 5px; }
      .am-countdown { font-size: 12px; font-family: monospace; color: #38bdf8; font-weight: bold; background: rgba(56, 189, 248, 0.1); padding: 4px 8px; border-radius: 6px; }
      
      .am-progress-bg { height: 6px; background: #27272a; border-radius: 3px; overflow: hidden; position: relative; }
      .am-progress-fill { height: 100%; width: 100%; background: linear-gradient(90deg, #ef4444, #f59e0b); border-radius: 3px; animation: am-pulse 2s infinite alternate; }
      @keyframes am-pulse { 0% { opacity: 0.6; } 100% { opacity: 1; box-shadow: 0 0 10px #ef4444; } }
      
      .am-stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; gap: 8px; }
      .am-stat-box { background: rgba(255,255,255,0.03); padding: 12px 5px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.02); }
      .am-stat-lbl { font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; display: block; font-weight: 600;}
      .am-stat-val { font-size: 13px; font-weight: 800; font-family: monospace; color: #fff; }
      
      .am-controls { display: flex; flex-direction: column; gap: 8px; }
      .am-ctrl-row { display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.3); padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.03); }
      .am-ctrl-lbl { font-size: 11px; font-weight: 600; color: #cbd5e1; }
      
      .am-select { background: #18181b; color: #fff; border: 1px solid #3f3f46; padding: 4px 8px; border-radius: 6px; font-size: 11px; outline: none; font-weight: bold; cursor: pointer; }
      
      #am-turbo-btn { background: linear-gradient(90deg, #9333ea, #c084fc); color: white; border: none; padding: 5px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 2px 10px rgba(147,51,234,0.4); transition: 0.2s; }
      #am-turbo-btn:hover { filter: brightness(1.2); }
      
      #am-record { background: linear-gradient(to right, #dc2626, #b91c1c); color: white; width: 100%; padding: 14px; border: none; border-radius: 8px; font-size: 14px; font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);}
      #am-record:hover { filter: brightness(1.1); box-shadow: 0 6px 20px rgba(220, 38, 38, 0.6); }
      
      .am-action-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding-top: 12px; }
      .am-action-btn { background: #18181b; border: 1px solid #27272a; padding: 10px 5px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; flex-direction: column; align-items: center; gap: 4px; }
      .am-action-btn:hover { background: #27272a; }
      .am-action-btn:active { transform: scale(0.95); }
    </style>

    <div class="am-header">
      <div class="am-brand">🎧 Mitu YT Audio Pro <span class="am-brand-sub">Premium Edition</span></div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
          <button id="am-minimize" style="background: none; border: none; color: #71717a; font-size: 18px; cursor: pointer; padding: 0; line-height: 1; font-weight: bold;">−</button>
          <span id="am-status" class="am-status-badge" style="background: #27272a; color: #a1a1aa;">STANDBY</span>
      </div>
    </div>

    <div class="am-card">
      <div class="am-plan-row">
          <div class="am-plan-title">⭐ ${userPlan} Plan</div>
          <div class="am-countdown" id="am-live-countdown">Calculating...</div>
      </div>
      <div class="am-progress-bg"><div class="am-progress-fill"></div></div>
    </div>

    <div class="am-card">
      <div class="am-stats-grid">
          <div class="am-stat-box"><span class="am-stat-lbl">Size 📦</span><span id="am-size" class="am-stat-val">0 B</span></div>
          <div class="am-stat-box"><span class="am-stat-lbl">Chunks 📂</span><span id="am-count" class="am-stat-val" style="color: #4ade80;">0</span></div>
          <div class="am-stat-box"><span class="am-stat-lbl">Time ⏱</span><span id="am-time" class="am-stat-val" style="color: #60a5fa;">00:00</span></div>
      </div>
    </div>

    <div class="am-card">
      <div class="am-controls">
          <div class="am-ctrl-row">
              <span class="am-ctrl-lbl">Speed Multiplier</span>
              <select id="am-speed" class="am-select">
                  <option value="1">1x (Normal)</option>
                  <option value="5">5x (Fast)</option>
                  <option value="10">10x (Super)</option>
                  <option value="15">15x (Max)</option>
              </select>
          </div>
          <div class="am-ctrl-row">
              <span class="am-ctrl-lbl">Turbo Mode</span>
              <button id="am-turbo-btn">○───● ON</button>
          </div>
      </div>
    </div>

    <div class="am-card" style="border: none; padding-bottom: 20px;">
      <button id="am-record">▶ START CAPTURE</button>
      <div class="am-action-grid">
          <button class="am-action-btn" id="am-download" style="color: #34d399; border-color: rgba(52,211,153,0.2);"><span style="font-size:14px;">💾</span> Save (#1)</button>
          <button class="am-action-btn" id="am-clear" style="color: #fbbf24; border-color: rgba(251,191,36,0.2);"><span style="font-size:14px;">🗑</span> Clear</button>
          <button class="am-action-btn" id="am-reset" style="color: #f87171; border-color: rgba(248,113,113,0.2);"><span style="font-size:14px;">🔄</span> Reset</button>
      </div>
    </div>
  `;
  document.body.appendChild(ui);

  document.getElementById('am-minimize').addEventListener('click', () => {
      document.getElementById('am-main-ui').style.display = 'none';
  });

  // ==============================================================
  // 🌟 LIVE COUNTDOWN SYSTEM (Untouched Logic)
  // ==============================================================
  function startLiveCountdown() {
      const countdownEl = document.getElementById('am-live-countdown');
      if (!userExpiry) {
          countdownEl.innerText = "Lifetime"; return;
      }
      
      const expiryDate = new Date(userExpiry).getTime();

      function updateTimer() {
          const now = new Date().getTime();
          const distance = expiryDate - now;

          if (distance < 0) {
              countdownEl.innerText = "EXPIRED";
              countdownEl.style.color = "#ef4444";
              clearInterval(countdownTimer);
              return;
          }

          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);

          countdownEl.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      }

      updateTimer(); 
      countdownTimer = setInterval(updateTimer, 1000);
  }
  startLiveCountdown();

  // --- 2. Data Logic & Smart Stop System ---
  function formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function updateTimeDisplay() {
      const m = String(Math.floor(activeSeconds / 60)).padStart(2, '0');
      const s = String(activeSeconds % 60).padStart(2, '0');
      document.getElementById('am-time').innerText = `${m}:${s}`;
  }

  function getChunkSignature(bytes) {
      if(bytes.length < 10) return bytes.length.toString();
      return `${bytes[0]}-${bytes[5]}-${bytes[bytes.length-1]}-${bytes.length}`;
  }

  // 🔴 Mitu YT Red UI Color Sync
  function executeStop() {
      if (!isRecording) return;
      isRecording = false;
      
      if (pendingStopTimer) {
          clearTimeout(pendingStopTimer);
          pendingStopTimer = null;
      }
      
      const btnRecord = document.getElementById('am-record');
      if (btnRecord) {
          btnRecord.innerText = "▶ START CAPTURE";
          btnRecord.style.background = "linear-gradient(to right, #dc2626, #b91c1c)"; 
          btnRecord.style.boxShadow = "0 4px 15px rgba(220, 38, 38, 0.4)";
      }
      
      const statusBadge = document.getElementById('am-status');
      if (statusBadge) {
          statusBadge.innerText = "🛑 PAUSED/ENDED";
          statusBadge.style.background = "#ef4444";
          statusBadge.style.color = "#fff";
      }

      if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
      }
  }

  function stopRecordingAction(isManual = false) {
      if (!isRecording) return;
      if (isManual) {
          executeStop(); 
      } else {
          if (!pendingStopTimer) {
              pendingStopTimer = setTimeout(() => { executeStop(); }, 4000); 
          }
      }
  }

  function addAudioChunk(bytes) {
      if (!isRecording || !(bytes instanceof Uint8Array) || bytes.byteLength < 20) return;
      
      const signature = getChunkSignature(bytes);
      if (lastChunkSignature === signature) return; 
      lastChunkSignature = signature;

      if (pendingStopTimer) {
          clearTimeout(pendingStopTimer);
          pendingStopTimer = null;
      }

      chunks.push(bytes);
      totalBytes += bytes.byteLength;
      
      document.getElementById('am-count').innerText = chunks.length;
      document.getElementById('am-size').innerText = formatBytes(totalBytes);
      
      const statusBadge = document.getElementById('am-status');
      statusBadge.innerText = "🟢 RECEIVING...";
      statusBadge.style.background = "#10b981";
      statusBadge.style.color = "#000";

      if (!timerInterval) {
          timerInterval = setInterval(() => {
              activeSeconds++;
              updateTimeDisplay();
          }, 1000);
      }

      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
          if (isRecording) {
              statusBadge.innerText = "🟡 WAITING...";
              statusBadge.style.background = "#f59e0b";
              statusBadge.style.color = "#000";
              
              if (timerInterval) {
                  clearInterval(timerInterval);
                  timerInterval = null;
              }
          }
      }, 2500);
  }

  // ==============================================================
  // 🚀 ADVANCED CAPTURE LOGIC (Untouched Core Logic)
  // ==============================================================
  function decodeBase64(input) {
    if (typeof input !== "string") return null;
    let value = input.trim();
    const match = value.match(/^data:audio\/[^;]+;base64,(.+)$/i);
    if (match) value = match[1];
    value = value.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
    if (value.length < 40) return null; 
    while (value.length % 4) value += "=";
    try {
        const raw = atob(value);
        const arr = new Uint8Array(new ArrayBuffer(raw.length));
        for(let i=0; i<raw.length; i++) arr[i] = raw.charCodeAt(i);
        return arr;
    } catch { return null; }
  }

  function extractJSONAudio(payload) {
      try {
          const stringified = JSON.stringify(payload);
          const matches = stringified.match(/"(?:audio|audioContent|audio_data|audio_base64|data|base64)"\s*:\s*"([^"]+)"/gi);
          if (matches) {
              matches.forEach(m => {
                  const parts = m.split(/"\s*:\s*"/);
                  if(parts.length > 1) {
                      const base64 = parts[1].replace('"', '');
                      const bytes = decodeBase64(base64);
                      if (bytes) addAudioChunk(bytes);
                  }
              });
          }
      } catch(e) {}
  }

  const audioContexts = [window.AudioContext, window.webkitAudioContext].filter(Boolean);
  audioContexts.forEach(Context => {
      if (Context.prototype && !Context.prototype.__amDecodePatched) {
          const originalDecode = Context.prototype.decodeAudioData;
          Context.prototype.decodeAudioData = function(audioData) {
              try {
                  if (audioData instanceof ArrayBuffer) {
                      addAudioChunk(new Uint8Array(audioData.slice(0)));
                  }
              } catch(e) {}
              return originalDecode.apply(this, arguments);
          };
          Context.prototype.__amDecodePatched = true;
      }
  });

  if (window.SourceBuffer) {
      const originalAppend = SourceBuffer.prototype.appendBuffer;
      SourceBuffer.prototype.appendBuffer = function(source) {
          try {
              if (source instanceof ArrayBuffer) addAudioChunk(new Uint8Array(source.slice(0)));
              else if (source instanceof Uint8Array) addAudioChunk(source);
          } catch(e) {}
          return originalAppend.apply(this, arguments);
      };
  }

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = args[0] ? args[0].toString().toLowerCase() : "";
    const contentType = (response.headers.get("content-type") || "").toLowerCase();

    if (contentType.includes("audio") || contentType.includes("mpeg") || contentType.includes("octet-stream") || url.includes("elevenlabs") || url.includes("stream")) {
        const clone = response.clone();
        if (contentType.includes("json")) {
            clone.json().then(data => extractJSONAudio(data)).catch(e => {});
        } else {
            try {
                const reader = clone.body.getReader();
                const processStream = async () => {
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            if (value && value.byteLength > 0 && value[0] !== 60) addAudioChunk(value);
                        }
                    } catch (e) {}
                };
                processStream();
            } catch (e) {
                clone.blob().then(blob => {
                    blob.arrayBuffer().then(buffer => addAudioChunk(new Uint8Array(buffer)));
                }).catch(()=>{});
            }
        }
    }
    return response;
  };

  const XHR = window.XMLHttpRequest;
  const originalOpen = XHR.prototype.open;
  const originalSend = XHR.prototype.send;
  XHR.prototype.open = function(method, url) {
      this._am_url = url ? url.toString().toLowerCase() : '';
      return originalOpen.apply(this, arguments);
  };
  XHR.prototype.send = function() {
      this.addEventListener('load', function() {
          const contentType = (this.getResponseHeader('content-type') || '').toLowerCase();
          if (contentType.includes('audio') || contentType.includes('mpeg') || contentType.includes('octet-stream')) {
              if (this.responseType === 'arraybuffer' && this.response) {
                  addAudioChunk(new Uint8Array(this.response.slice(0)));
              }
          }
      });
      return originalSend.apply(this, arguments);
  };

  const NativeWebSocket = window.WebSocket;
  function HunterWebSocket(...args) {
    const socket = new NativeWebSocket(...args);
    socket.addEventListener("message", async (event) => {
      try {
        if (typeof event.data === "string") {
          try { extractJSONAudio(JSON.parse(event.data)); } catch (e) {}
        } else if (event.data instanceof Blob) {
            const buffer = await event.data.arrayBuffer();
            addAudioChunk(new Uint8Array(buffer));
        }
      } catch (e) {}
    });
    return socket;
  }
  HunterWebSocket.prototype = NativeWebSocket.prototype;
  window.WebSocket = HunterWebSocket;

  audioContexts.forEach(Context => {
    if (!Context.prototype.__amSpeedPatched) {
      const nativeCreate = Context.prototype.createBufferSource;
      Context.prototype.createBufferSource = function(...args) {
        const source = nativeCreate.apply(this, args);
        const nativeStart = source.start;
        const nativeStop = source.stop;

        source.start = function(...startArgs) {
          if (source.playbackRate) {
            try { source.playbackRate.value = currentSpeed; } catch (e) {}
          }
          return nativeStart.apply(this, startArgs);
        };
        
        if (nativeStop) {
            source.stop = function(...stopArgs) {
                stopRecordingAction(false);
                return nativeStop.apply(this, stopArgs);
            };
        }
        
        source.onended = function(e) { stopRecordingAction(false); };
        return source;
      };
      Context.prototype.__amSpeedPatched = true;
    }
  });

  setInterval(() => {
      document.querySelectorAll("audio, video").forEach(media => {
          let safeSpeed = currentSpeed > 16 ? 16 : currentSpeed;
          if (media.playbackRate !== safeSpeed) {
              try { media.playbackRate = safeSpeed; } catch (e) {}
          }
          
          if (!media.__amSyncPatched) {
              media.addEventListener('pause', () => stopRecordingAction(false));
              media.addEventListener('ended', () => stopRecordingAction(false));
              media.__amSyncPatched = true;
          }
      });
  }, 1000);

  // --- 6. Buttons & Actions ---
  const btnRecord = document.getElementById('am-record');
  const statusBadge = document.getElementById('am-status');
  const speedSelect = document.getElementById('am-speed');
  const turboBtn = document.getElementById('am-turbo-btn');

  speedSelect.addEventListener('change', (e) => {
      currentSpeed = parseFloat(e.target.value);
  });

  turboBtn.addEventListener('click', () => {
      currentSpeed = 15;
      speedSelect.value = "15"; 
      
      turboBtn.style.background = "#c084fc";
      setTimeout(() => { turboBtn.style.background = "linear-gradient(90deg, #9333ea, #c084fc)"; }, 300);
  });

  btnRecord.addEventListener('click', () => {
      if (!isRecording) {
          isRecording = true;
          btnRecord.innerText = "⏸ STOP CAPTURE";
          btnRecord.style.background = "#eab308"; 
          btnRecord.style.boxShadow = "0 4px 15px rgba(234, 179, 8, 0.4)";
          
          statusBadge.innerText = "🟢 ACTIVATED";
          statusBadge.style.background = "#10b981"; 
          statusBadge.style.color = "#000";
      } else {
          stopRecordingAction(true); 
      }
  });

  // ==============================================================
  // 🌟 SMART FORMAT DETECTOR
  // ==============================================================
  document.getElementById('am-download').addEventListener('click', () => {
    if (chunks.length === 0) {
        alert("এখনো কোনো ডেটা পাওয়া যায়নি! আগে 'START CAPTURE' করে অডিও প্লে করুন।"); return;
    }

    let ext = "mp3";
    let mimeType = "audio/mpeg";
    
    try {
        const firstChunk = chunks[0];
        if (firstChunk && firstChunk.length >= 4) {
            const hex = Array.from(firstChunk.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
            
            if (hex.startsWith("52494646")) { ext = "wav"; mimeType = "audio/wav"; } 
            else if (hex.startsWith("1A45DFA3")) { ext = "webm"; mimeType = "audio/webm"; } 
            else if (hex.startsWith("4F676753")) { ext = "ogg"; mimeType = "audio/ogg"; } 
            else if (hex.startsWith("000000")) { ext = "m4a"; mimeType = "audio/mp4"; } 
            else if (hex.startsWith("494433") || hex.startsWith("FFF") || hex.startsWith("FFE")) { ext = "mp3"; mimeType = "audio/mpeg"; } 
        }
    } catch(e) {}

    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    a.download = `Audio_Capture_${downloadSerial}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
    
    downloadSerial++;
    document.getElementById('am-download').innerHTML = `<span style="font-size:14px;">💾</span> Save (#${downloadSerial})`;
  });

  document.getElementById('am-clear').addEventListener('click', () => {
      chunks = []; 
      totalBytes = 0;
      activeSeconds = 0;
      lastChunkSignature = "";
      
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      clearTimeout(idleTimeout);
      
      document.getElementById('am-count').innerText = "0";
      document.getElementById('am-size').innerText = "0 B";
      document.getElementById('am-time').innerText = "00:00";
      
      if (isRecording) {
          statusBadge.innerText = "🟢 ACTIVATED";
          statusBadge.style.background = "#10b981";
      } else {
          statusBadge.innerText = "STANDBY";
          statusBadge.style.background = "#27272a";
      }
  });

  document.getElementById('am-reset').addEventListener('click', () => {
      stopRecordingAction(true); 
      
      statusBadge.innerText = "STANDBY";
      statusBadge.style.background = "#27272a";
      
      chunks = [];
      totalBytes = 0;
      activeSeconds = 0;
      lastChunkSignature = "";
      downloadSerial = 1; 
      
      currentSpeed = 1;
      document.getElementById('am-speed').value = "1";
      
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      clearTimeout(idleTimeout);
      if (pendingStopTimer) { clearTimeout(pendingStopTimer); pendingStopTimer = null; }
      
      document.getElementById('am-count').innerText = "0";
      document.getElementById('am-size').innerText = "0 B";
      document.getElementById('am-time').innerText = "00:00";
      document.getElementById('am-download').innerHTML = `<span style="font-size:14px;">💾</span> Save (#1)`; 
  });

})();
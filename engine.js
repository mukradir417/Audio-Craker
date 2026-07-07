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

  console.log("🚀 Audio Master Engine: Anti-Fake Pause, Full Capture & Smart Format + TURBO Active!");

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
  
  // NEW: Anti-Fake Pause Timer
  let pendingStopTimer = null; 

  // --- 1. UI Design ---
  const ui = document.createElement('div');
  ui.id = 'am-main-ui'; 
  ui.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 2147483647;
    background: linear-gradient(155deg, #111, #000); color: #fff; 
    padding: 18px; border-radius: 14px; width: 290px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.9); font-family: 'Segoe UI', Tahoma, sans-serif;
    border: 1px solid rgba(255, 255, 255, 0.1); user-select: none;
  `;
  ui.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
      <strong style="font-size: 16px; display: flex; align-items: center; gap: 8px;">
        <span style="background: #2563eb; padding: 4px 6px; border-radius: 6px; font-size: 12px;">🎧</span> Audio Master
      </strong>
      <div style="display: flex; align-items: center; gap: 8px;">
          <span id="am-status" style="font-size: 10px; font-weight: bold; background: #3f3f46; padding: 3px 6px; border-radius: 4px; color: #d1d5db;">STANDBY</span>
          <button id="am-minimize" style="background: transparent; color: #aaa; border: none; font-size: 18px; cursor: pointer; padding: 0 4px; line-height: 1; font-weight: bold;">−</button>
      </div>
    </div>
    
    <div id="am-body">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 15px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; text-align: center;">
          <div>
            <div style="font-size: 9px; color: #888; text-transform: uppercase;">Size</div>
            <div id="am-size" style="font-size: 13px; font-weight: bold; color: #fff; margin-top: 4px;">0 B</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #888; text-transform: uppercase;">Chunks</div>
            <div id="am-count" style="font-size: 13px; font-weight: bold; color: #4CAF50; margin-top: 4px;">0</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #888; text-transform: uppercase;">Time</div>
            <div id="am-time" style="font-size: 13px; font-weight: bold; color: #2196F3; margin-top: 4px;">00:00</div>
          </div>
        </div>

        <div style="margin-bottom: 12px; display: flex; gap: 8px; align-items: flex-end;">
          <div style="flex: 1;">
              <label style="font-size: 11px; color: #aaa; font-weight: bold;">⚡ Playback Speed:</label>
              <select id="am-speed" style="width: 100%; margin-top: 4px; padding: 8px; background: #222; color: #fff; border: 1px solid #444; border-radius: 6px; outline: none; cursor: pointer; font-weight: bold;">
                <option value="1">1x (Normal Speed)</option>
                <option value="5">5x (Fast)</option>
                <option value="10">10x (Super Fast)</option>
                <option value="15">15x (Max)</option>
              </select>
          </div>
          <button id="am-turbo-btn" style="background: #9333ea; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; height: 35px; transition: 0.2s; box-shadow: 0 4px 10px rgba(147, 51, 234, 0.3);">🚀 TURBO</button>
        </div>

        <button id="am-record" style="background: #2563eb; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold; margin-bottom: 10px; font-size: 13px; transition: 0.2s; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);">▶ START CAPTURE</button>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
            <button id="am-download" style="background: #10b981; color: white; border: none; padding: 10px 5px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold; font-size: 11px; transition: 0.2s;">⬇ Save (#1)</button>
            <button id="am-clear" style="background: #f97316; color: white; border: none; padding: 10px 5px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold; font-size: 11px;">🗑 Clear</button>
            <button id="am-reset" style="background: #ef4444; color: white; border: none; padding: 10px 5px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold; font-size: 11px;">🔄 Reset</button>
        </div>
    </div>
  `;
  document.body.appendChild(ui);

  document.getElementById('am-minimize').addEventListener('click', () => {
      document.getElementById('am-main-ui').style.display = 'none';
  });

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
          btnRecord.style.background = "#2563eb"; 
          btnRecord.style.boxShadow = "0 4px 15px rgba(37, 99, 235, 0.3)";
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
              pendingStopTimer = setTimeout(() => {
                  executeStop();
              }, 4000); 
          }
      }
  }

  function addAudioChunk(bytes) {
      if (!isRecording || !(bytes instanceof Uint8Array) || bytes.byteLength === 0) return;
      
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
              statusBadge.style.background = "#eab308";
              
              if (timerInterval) {
                  clearInterval(timerInterval);
                  timerInterval = null;
              }
          }
      }, 2500);
  }

  // --- 3. Decoders ---
  function decodeBase64(input) {
    if (typeof input !== "string") return null;
    let value = input.trim();
    const match = value.match(/^data:audio\/[^;]+;base64,(.+)$/i);
    if (match) value = match[1];
    value = value.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
    if (value.length < 40) return null; 
    while (value.length % 4) value += "=";
    try {
      return Uint8Array.from(atob(value), c => c.charCodeAt(0));
    } catch { return null; }
  }

  function extractJSONAudio(payload) {
      const stringified = JSON.stringify(payload);
      const matches = stringified.match(/"(?:audio|audio_base64)":"([^"]+)"/gi);
      if (matches) {
          matches.forEach(m => {
              const base64 = m.split('":"')[1].replace('"', '');
              const bytes = decodeBase64(base64);
              if (bytes) addAudioChunk(bytes);
          });
      }
  }

  // --- 4. Network Interceptors ---
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = args[0] ? args[0].toString().toLowerCase() : "";
    const contentType = (response.headers.get("content-type") || "").toLowerCase();

    if (contentType.includes("audio") || contentType.includes("mpeg") || url.includes("elevenlabs") || url.includes("stream")) {
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
                            if (value && value.byteLength > 0 && value[0] !== 60) { 
                                addAudioChunk(value);
                            }
                        }
                    } catch (e) {}
                };
                processStream();
            } catch (e) {
                clone.blob().then(blob => {
                    if (blob.type.includes("audio") || blob.type === "application/mpeg") {
                        blob.arrayBuffer().then(buffer => addAudioChunk(new Uint8Array(buffer)));
                    }
                }).catch(e=>{});
            }
        }
    }
    return response;
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

  // --- 5. Smart Sync & Speed Controller ---
  const contexts = [window.AudioContext, window.webkitAudioContext].filter(Boolean);
  contexts.forEach(Context => {
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
        
        source.onended = function(e) {
            stopRecordingAction(false); 
        };

        return source;
      };
      Context.prototype.__amSpeedPatched = true;
    }
  });

  setInterval(() => {
      document.querySelectorAll("audio, video").forEach(media => {
          if (media.playbackRate !== currentSpeed) media.playbackRate = currentSpeed;
          
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

  // Dropdown change event
  speedSelect.addEventListener('change', (e) => {
      currentSpeed = parseFloat(e.target.value);
  });

  // TURBO Button Action
  turboBtn.addEventListener('click', () => {
      currentSpeed = 15;
      speedSelect.value = "15"; // Dropdown 15x e auto select hoye jabe
      
      // Button ti ek second er jono halka color change korbe UX er jono
      turboBtn.style.background = "#c084fc";
      setTimeout(() => {
          turboBtn.style.background = "#9333ea";
      }, 300);
  });

  btnRecord.addEventListener('click', () => {
      if (!isRecording) {
          isRecording = true;
          btnRecord.innerText = "⏸ STOP CAPTURE";
          btnRecord.style.background = "#eab308"; 
          btnRecord.style.boxShadow = "0 4px 15px rgba(234, 179, 8, 0.3)";
          
          statusBadge.innerText = "🟢 ACTIVATED";
          statusBadge.style.background = "#10b981"; 
          statusBadge.style.color = "#fff";
      } else {
          stopRecordingAction(true); 
      }
  });

  // ==============================================================
  // 🌟 SMART FORMAT DETECTOR (UPGRADE APPLIED HERE) 
  // ==============================================================
  document.getElementById('am-download').addEventListener('click', () => {
    if (chunks.length === 0) {
        alert("এখনো কোনো ডেটা পাওয়া যায়নি! আগে 'START CAPTURE' করে অডিও প্লে করুন।"); return;
    }

    // Default Format (MP3)
    let ext = "mp3";
    let mimeType = "audio/mpeg";
    
    // Auto-detect real file format from Magic Bytes
    try {
        const firstChunk = chunks[0];
        if (firstChunk && firstChunk.length >= 4) {
            const hex = Array.from(firstChunk.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
            
            if (hex.startsWith("52494646")) { ext = "wav"; mimeType = "audio/wav"; } // RIFF/WAV
            else if (hex.startsWith("1A45DFA3")) { ext = "webm"; mimeType = "audio/webm"; } // WebM
            else if (hex.startsWith("4F676753")) { ext = "ogg"; mimeType = "audio/ogg"; } // Ogg
            else if (hex.startsWith("000000")) { ext = "m4a"; mimeType = "audio/mp4"; } // M4A/MP4 container
            else if (hex.startsWith("494433") || hex.startsWith("FFF") || hex.startsWith("FFE")) { ext = "mp3"; mimeType = "audio/mpeg"; } // MP3/ADTS
        }
    } catch(e) {}

    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    // Save file with auto-detected correct extension
    a.download = `Audio_Capture_${downloadSerial}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
    
    downloadSerial++;
    document.getElementById('am-download').innerText = `⬇ Save (#${downloadSerial})`;
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
          statusBadge.style.background = "#3f3f46";
      }
  });

  document.getElementById('am-reset').addEventListener('click', () => {
      stopRecordingAction(true); 
      
      statusBadge.innerText = "STANDBY";
      statusBadge.style.background = "#3f3f46";
      
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
      document.getElementById('am-download').innerText = `⬇ Save (#1)`; 
  });

})();
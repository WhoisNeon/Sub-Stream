import { showNotif } from './notif.js';

window.onload = function () {
    // --- DOM Elements ---
    const form = document.getElementById('fetchForm');
    const urlInput = document.getElementById('urlInput');
    const extractBtn = document.getElementById('extractBtn');
    const clearUrlInputBtn = document.getElementById('clearUrlInputBtn');
    const useCorsToggle = document.getElementById('useCorsToggle');
    const resultSection = document.getElementById('resultSection');
    const configList = document.getElementById('configList');
    const searchConfigInput = document.getElementById('searchConfigInput');
    const emptyState = document.getElementById('emptyState');
    const mainContent = document.getElementById('mainContent');

    // Header/Toolbar Actions
    const themeToggle = document.getElementById('themeToggle');
    const showSubQrBtn = document.getElementById('showSubQrBtn');
    const copyAllBtn = document.getElementById('copyAllBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');

    // Modal Elements
    const qrModal = document.getElementById('qrModal');
    const qrModalContent = document.getElementById('qrModalContent');
    const qrModalTitle = document.getElementById('qrModalTitle');
    const qrcodeContainer = document.getElementById('qrcode-container');

    // --- State ---
    let rawConfigs = [];
    let subscriptionUrl = '';
    let qrCodeInstance = null;

    // --- Theme Logic ---
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // --- QR Modal Logic ---
    function showQrCode(text, title) {
        qrcodeContainer.innerHTML = '';
        // FIX: Use innerHTML instead of textContent to allow flag emojis (wrapped in <span>) to render correctly.
        qrModalTitle.innerHTML = title || 'QR Code';
        if (qrCodeInstance) qrCodeInstance.clear();

        try {
            qrCodeInstance = new QRCode(qrcodeContainer, {
                text: text,
                width: 250,
                height: 250,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });

            qrModal.classList.remove('hidden');
            setTimeout(() => {
                qrModalContent.classList.remove('scale-95', 'opacity-0');
                qrModalContent.classList.add('scale-100', 'opacity-100');
            }, 10);
        } catch (e) {
            showNotif(`QR Error: ${e.message}`, 'error');
        }
    }

    window.hideModal = function () {
        qrModalContent.classList.remove('scale-100', 'opacity-100');
        qrModalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => { qrModal.classList.add('hidden'); }, 300);
    }

    // --- Helper Functions ---
    function safeB64Decode(str) {
        try {
            str = str.replace(/-/g, '+').replace(/_/g, '/');
            while (str.length % 4) { str += '='; }
            return atob(str);
        } catch (e) { return ''; }
    }

    const flagRegex = /([\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF])/g;
    function wrapFlags(name) {
        // Wraps flag emojis in a span with the special emoji font class
        return name.replace(flagRegex, (match) => `<span class="emoji-font">${match}</span>`);
    }

    function isLocalHost(host) {
        const privateIpRegex = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.|0\.|localhost$)/i;
        return privateIpRegex.test(host);
    }

    async function copyText(text, btnElement = null) {
        try {
            await navigator.clipboard.writeText(text);
            if (btnElement) {
                const icon = btnElement.querySelector('i');
                const originalClass = icon.className;
                // Temporarily change icon to a checkmark
                icon.className = `ph-bold ph-check text-brand-500`;
                btnElement.classList.add('text-brand-500');
                setTimeout(() => {
                    // Restore original icon
                    icon.className = originalClass;
                    btnElement.classList.remove('text-brand-500');
                }, 1500);
            } else {
                showNotif('Copied to clipboard!', 'success');
            }
        } catch (err) {
            showNotif('Failed to copy text.', 'error');
        }
    }

    // --- Parser ---
    function parseConfig(rawConfig) {
        let name = 'Unnamed';
        let address = 'Unknown';
        let port = '';
        let protocol = 'Unknown';
        let tags = [];

        if (!rawConfig) return { name, address, port, protocol, tags, raw: rawConfig };

        const match = rawConfig.match(/^(\w+):\/\//);
        if (match) protocol = match[1];

        try {
            if (protocol === 'vmess') {
                const b64 = rawConfig.substring(8);
                const json = JSON.parse(safeB64Decode(b64));
                name = json.ps || 'VMess';
                address = json.add;
                port = json.port;
                if (json.tls === 'tls') tags.push('TLS');
                if (json.net) tags.push(json.net.toUpperCase());
            } else {
                const url = new URL(rawConfig);
                address = url.hostname;
                port = url.port;

                if (url.hash) {
                    const hash = url.hash.substring(1);
                    name = safeB64Decode(hash) || decodeURIComponent(hash);
                } else {
                    name = protocol.toUpperCase();
                }

                if (url.searchParams.get('security') === 'tls') tags.push('TLS');
                if (url.searchParams.get('type') === 'grpc') tags.push('gRPC');
                if (url.searchParams.get('network') === 'ws') tags.push('WS');
            }
        } catch (e) {
            name = `${protocol} (Malformed)`;
        }

        tags = [...new Set(tags.map(t => t.toUpperCase()))].filter(t => t !== protocol.toUpperCase() && t !== 'NONE');
        return { name, address, port, protocol: protocol.toUpperCase(), tags, raw: rawConfig };
    }

    // --- Rendering ---
    function renderConfigs(configs, filterText = '') {
        configList.innerHTML = '';

        const parsed = configs.map(parseConfig);
        const lowerFilter = filterText.toLowerCase();

        const filtered = parsed.filter(c =>
            !filterText ||
            `${c.name} ${c.address} ${c.port} ${c.protocol} ${c.tags.join(' ')}`.toLowerCase().includes(lowerFilter)
        );

        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
        } else {
            emptyState.classList.add('hidden');
            emptyState.classList.remove('flex');
        }

        filtered.forEach((config, idx) => {
            const isLocal = isLocalHost(config.address);

            const card = document.createElement('div');
            card.className = 'group relative flex flex-col bg-white dark:bg-dark-800 border border-gray-200 dark:border-white/5 rounded-2xl p-5 hover:border-brand-500/30 transition-all duration-300 hover:shadow-xl dark:hover:shadow-brand-900/20 opacity-0';
            card.style.animation = `fadeInUp 0.4s ease forwards ${idx * 50}ms`;

            // Badge Colors
            let protoColor = 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20';
            if (config.protocol === 'VMESS') protoColor = 'text-pink-600 bg-pink-50 border-pink-200 dark:text-pink-400 dark:bg-pink-500/10 dark:border-pink-500/20';
            if (config.protocol === 'VLESS') protoColor = 'text-brand-600 bg-brand-50 border-brand-200 dark:text-brand-400 dark:bg-brand-500/10 dark:border-brand-500/20';
            if (config.protocol === 'SS') protoColor = 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20';

            const tagsHtml = config.tags.map(t =>
                `<span class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 uppercase border border-gray-200 dark:border-white/5">${t}</span>`
            ).join('');

            // Restored Analysis Links
            const analysisLinks = isLocal ? '' : `
                <div class="flex gap-1 ml-auto">
                    <a href="https://check-host.net/ip-info?host=${config.address}" target="_blank" 
                       class="p-1.5 rounded-lg text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-500/10 transition-colors" title="Open via Check-Host">
                        <i class="ph-bold ph-globe-hemisphere-west text-lg"></i>
                    </a>
                    <a href="https://linkirani.ir/?url=https://${config.address}" target="_blank" 
                       class="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-colors" title="Open via Linkirani">
                        <i class="ph-bold ph-link-simple text-lg"></i>
                    </a>
                </div>
            `;

            card.innerHTML = `
                <div class="mb-3">
                    <div class="flex justify-between items-center mb-3">
                        <span class="px-2.5 py-1 rounded-md text-xs font-bold border ${protoColor}">${config.protocol}</span>
                        ${analysisLinks}
                    </div>
                    
                    <h3 class="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight mb-1 truncate pr-2" title="${config.name}">
                        ${wrapFlags(config.name)}
                    </h3>
                </div>

                <div class="flex flex-col gap-2 mb-4">
                    <div class="flex items-center justify-between bg-gray-50 dark:bg-dark-900/50 rounded-lg px-3 py-2 border border-gray-100 dark:border-white/5 group/field">
                        <div class="flex flex-col overflow-hidden mr-2">
                            <span class="text-[10px] uppercase text-gray-400 font-semibold tracking-wider">Host</span>
                            <span class="text-xs font-mono text-gray-600 dark:text-gray-300 truncate" title="${config.address}">${config.address}</span>
                        </div>
                        <button class="btn-copy-host text-gray-400 hover:text-brand-500 transition-colors p-1" title="Copy Host">
                            <i class="ph-bold ph-copy"></i>
                        </button>
                    </div>

                    <div class="flex items-center justify-between bg-gray-50 dark:bg-dark-900/50 rounded-lg px-3 py-2 border border-gray-100 dark:border-white/5 group/field">
                        <div class="flex flex-col overflow-hidden mr-2">
                            <span class="text-[10px] uppercase text-gray-400 font-semibold tracking-wider">Port</span>
                            <span class="text-xs font-mono text-gray-600 dark:text-gray-300 truncate">${config.port || 'N/A'}</span>
                        </div>
                        <button class="btn-copy-port text-gray-400 hover:text-brand-500 transition-colors p-1" title="Copy Port">
                            <i class="ph-bold ph-copy"></i>
                        </button>
                    </div>
                </div>

                <div class="mt-auto">
                    <div class="flex flex-wrap gap-2 mb-4 h-6 overflow-hidden">
                        ${tagsHtml}
                    </div>

                    <div class="flex gap-2 border-t border-gray-100 dark:border-white/5 pt-3">
                        <button class="flex-1 h-9 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400 text-gray-500 dark:text-gray-400 text-sm font-medium transition-colors flex items-center justify-center gap-2 btn-copy-card shadow-sm border border-transparent hover:border-brand-200 dark:hover:border-brand-500/20">
                            <i class="ph-bold ph-copy"></i> Copy Config
                        </button>
                        <button class="h-9 w-9 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center btn-qr-card shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-white/10">
                            <i class="ph-bold ph-qr-code"></i>
                        </button>
                    </div>
                </div>
            `;

            // Event Listeners
            card.querySelector('.btn-copy-card').onclick = (e) => copyText(config.raw, e.currentTarget);
            // Calling showQrCode with the HTML-wrapped name
            card.querySelector('.btn-qr-card').onclick = () => showQrCode(config.raw, wrapFlags(config.name));
            card.querySelector('.btn-copy-host').onclick = (e) => copyText(config.address, e.currentTarget);
            card.querySelector('.btn-copy-port').onclick = (e) => copyText(config.port, e.currentTarget);

            configList.appendChild(card);
        });

        // Batch Action Listeners
        const allRaw = filtered.map(c => c.raw).join('\n');
        copyAllBtn.onclick = () => copyText(allRaw, copyAllBtn);
        showSubQrBtn.onclick = () => {
            // Subscription link name is plain text, so no wrapFlags needed here.
            if (subscriptionUrl) showQrCode(subscriptionUrl, "Subscription Link");
            else showNotif("No subscription URL active", "error");
        };
        downloadAllBtn.onclick = () => {
            const blob = new Blob([allRaw], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'SubStream_Configs.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showNotif('Download started!', 'success');
        };
    }

    // --- Core Logic ---
    urlInput.addEventListener('input', () => {
        const val = urlInput.value.trim();
        clearUrlInputBtn.classList.toggle('hidden', val === '');
        extractBtn.innerHTML = val === '' ? '<span>Paste & Extract</span><i class="ph-bold ph-clipboard-text"></i>' : '<span>Extract</span><i class="ph-bold ph-arrow-right transition-transform"></i>';

        // Logic for clearing configs and local storage when input is empty
        if (val === '') {
            localStorage.removeItem('subStreamUrl');

            // Clear configurations and hide results
            rawConfigs = [];
            configList.innerHTML = '';
            resultSection.classList.add('hidden');
            resultSection.classList.remove('flex');
            localStorage.removeItem('subStreamConfigs');
            if (mainContent) mainContent.classList.add('justify-center');
        }
    });

    clearUrlInputBtn.addEventListener('click', () => {
        urlInput.value = '';
        urlInput.focus();
        clearUrlInputBtn.classList.add('hidden');
        extractBtn.innerHTML = '<span>Paste & Extract</span><i class="ph-bold ph-clipboard-text"></i>';

        // Clear saved URL from localStorage when clear button is used
        localStorage.removeItem('subStreamUrl');

        // Clear configurations and hide results
        rawConfigs = [];
        configList.innerHTML = '';
        resultSection.classList.add('hidden');
        resultSection.classList.remove('flex');
        localStorage.removeItem('subStreamConfigs');
        if (mainContent) mainContent.classList.add('justify-center');
    });

    extractBtn.addEventListener('click', async (e) => {
        if (urlInput.value.trim() === '') {
            e.preventDefault();
            try {
                const text = await navigator.clipboard.readText();
                if (text && text.trim().startsWith('http')) {
                    urlInput.value = text.trim();
                    clearUrlInputBtn.classList.remove('hidden');
                    form.requestSubmit();
                } else {
                    showNotif('Clipboard does not contain a URL', 'error');
                }
            } catch {
                showNotif('Paste permission denied.<br>Please paste manually.', 'error');
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let url = urlInput.value.trim();
        if (!url) return;

        // CORS Proxy Logic
        if (useCorsToggle.checked) {
            // Using the full URL format for corsproxy.io
            url = 'https://corsproxy.io/?url=' + url;
        }

        showNotif('Fetching subscription...', 'info', 2);
        extractBtn.disabled = true;
        extractBtn.classList.add('opacity-75', 'cursor-not-allowed');

        try {
            subscriptionUrl = urlInput.value.trim(); // Save original URL

            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const text = await res.text();
            let decodedText = text;

            try {
                const decoded = safeB64Decode(text.trim());
                if (decoded && decoded.length > 10) decodedText = decoded;
            } catch { }

            const lines = decodedText.split(/\r?\n/);
            const prefixes = ["vless://", "vmess://", "hysteria2://", "ss://", "trojan://", "tuic://"];

            rawConfigs = lines.filter(l => prefixes.some(p => l.trim().startsWith(p)));

            if (rawConfigs.length > 0) {
                showNotif(`Successfully found ${rawConfigs.length} configs`, 'success');
                localStorage.setItem('subStreamConfigs', JSON.stringify(rawConfigs));
                localStorage.setItem('subStreamUrl', subscriptionUrl);

                resultSection.classList.remove('hidden');
                resultSection.classList.add('flex');
                // Remove vertical centering when results appear
                if (mainContent) mainContent.classList.remove('justify-center');

                setTimeout(() => {
                    const headerHeight = document.querySelector('header').offsetHeight;
                    const resultTop = resultSection.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
                    window.scrollTo({ top: resultTop, behavior: 'smooth' });
                }, 100);

                renderConfigs(rawConfigs);
                searchConfigInput.value = '';
            } else {
                showNotif('No compatible configs found in URL', 'warning');
                // Ensure vertical centering is present when no configs are found
                if (mainContent) mainContent.classList.add('justify-center');
            }

        } catch (err) {
            showNotif(`Fetch Error: ${err.message}`, 'error');
            // Ensure vertical centering is present on fetch error
            if (mainContent) mainContent.classList.add('justify-center');
        } finally {
            extractBtn.disabled = false;
            extractBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    });

    searchConfigInput.addEventListener('input', (e) => renderConfigs(rawConfigs, e.target.value));

    // Load Saved
    const savedConfigs = localStorage.getItem('subStreamConfigs');
    const savedUrl = localStorage.getItem('subStreamUrl');

    // If savedUrl exists, it means the URL was not cleared on the previous session
    if (savedUrl) {
        urlInput.value = savedUrl;
        clearUrlInputBtn.classList.remove('hidden');
        subscriptionUrl = savedUrl;
    }

    if (savedConfigs) {
        try {
            rawConfigs = JSON.parse(savedConfigs);
            if (rawConfigs.length > 0) {
                resultSection.classList.remove('hidden');
                resultSection.classList.add('flex');
                renderConfigs(rawConfigs);
                // Remove vertical centering when saved results appear
                if (mainContent) mainContent.classList.remove('justify-center');
            } else if (mainContent) {
                // Ensure vertical centering is present if savedConfigs exists but is empty
                mainContent.classList.add('justify-center');
            }
        } catch {
            // Ensure vertical centering is present if JSON parsing fails
            if (mainContent) mainContent.classList.add('justify-center');
        }
    } else if (mainContent) {
        // Ensure vertical centering is present on initial load if no configs are saved
        mainContent.classList.add('justify-center');
    }
}
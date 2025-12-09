<p align="center">
  <a href="https://substream.zeabur.app"><img src="https://img.shields.io/badge/Demo-Online-brightgreen?style=for-the-badge&logo=vercel" alt="Live Demo"></a>
  <a href="https://github.com/WhoisNeon/Sub-Stream/blob/master/LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/Tech-JS%20%7C%20Tailwind-blueviolet?style=for-the-badge&logo=javascript" alt="Tech Stack"></a>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Build-Client--Side-informational?style=for-the-badge" alt="Client Side Build"></a>
  <a href="https://github.com/WhoisNeon/Sub-Stream/commits/master"><img src="https://img.shields.io/github/last-commit/WhoisNeon/Sub-Stream?style=for-the-badge&color=gray" alt="Last Commit"></a>
</p>

## 📋 Table of Contents

- [Live Demo](#-live-demo)
- [Features](#-features)
- [Usage](#-usage)
- [Tech Stack](#-tech-stack)
- [File Structure](#-file-structure)
- [Protocol Parsing](#-protocol-parsing)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔴 Live Demo

Experience SubStream live in your browser: [![Live Demo](https://img.shields.io/badge/SubStream-Live%20Demo-2dd4bf?style=for-the-badge)](https://substream.zeabur.app)

---

## ✨ Features

* **Client-Side Privacy:** All extraction and parsing is performed locally in the browser, ensuring your subscription URL and config data never leave your device.
* **Universal Protocol Support:** Automatically detects and parses common VPN/proxy protocols, including `VMess`, `VLESS`, `Shadowsocks (SS)`, `Trojan`, `Hysteria2`, and `TUIC`.
* **Intelligent Parsing:** Decodes Base64-encoded subscription content and individual configs (like VMess) for clear display of protocol type, server name, host, port, and additional tags (e.g., `TLS`, `gRPC`, `WS`).
* **Robust Management Tools:**
    * **Filtering:** Real-time search across all configuration details.
    * **QR Code Generation:** Create QR codes for both individual raw configurations and the original subscription link.
    * **Batch Actions:** Copy all configurations or export them into a single `.txt` file.
* **Enhanced UX:** Features a **Dark Mode** toggle, **CORS Proxy** option for bypassing fetch restrictions, and saves the last used URL and configs via `localStorage`.

---

## 🚀 Usage

SubStream is a front-end application and requires only a web browser to run.

### Local Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/WhoisNeon/Sub-Stream.git](https://github.com/WhoisNeon/Sub-Stream.git)
    cd Sub-Stream
    ```
2.  **Open `index.html`:** Simply open the `index.html` file in your preferred web browser.

### Application Workflow

1.  **Input URL:** Paste your subscription URL into the input field.
2.  **Toggle CORS (Optional):** Enable **"Use CORS Proxy"** if you encounter network errors when fetching the subscription, which routes the request through a public proxy.
3.  **Extract:** Click the **"Extract"** button (or "Paste & Extract" if the field is empty, which uses clipboard detection).
4.  **Manage:** Use the search bar to filter, or use the toolbar buttons (Copy All, Export, Sub QR) for batch actions.

---

## 🛠️ Tech Stack

| Technology | Purpose | Icon |
| :--- | :--- | :--- |
| **HTML5** | Structure and Semantic Markup | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" alt="HTML5" width="30" height="30"/> |
| **Tailwind CSS 3.x** | Utility-first, responsive styling, and theming | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" alt="Tailwind CSS" width="30" height="30"/> |
| **Pure JavaScript (ES Modules)** | Core logic, fetching, parsing, and DOM manipulation | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="JavaScript" width="30" height="30"/> |
| **QRCode.js** | Client-side QR code generation | <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/QR_Code_Example.svg/500px-QR_Code_Example.svg.png?20111025115625" alt="QR Code" width="30" height="30"/> |
| **Phosphor Icons** | Clean and modern interface icons | <img src="https://phosphoricons.com/favicon-512.png" alt="Phosphor" width="30" height="30"/> |

---

## 📂 File Structure

The project maintains a flat, modular structure:

````
src/
├── assets/      # favicon, and other media assets
├── css/         # Stylesheets
│   ├── notif.css  # Styling for the animated notification system
│   └── style.css  # Custom scrollbar, animations (fadeInUp), and utility styles
├── js/          # JavaScript files
│    ├── notif.js  # Notification system module (showNotif export)
│    └── script.js # Main application logic, fetch handler, parser, and rendering
└── index.html   # Main entry point and UI structure
````

---

## 🧠 Protocol Parsing

The core logic resides in the `parseConfig` function within `script.js`. It handles the complexity of identifying the protocol and extracting necessary connection parameters:

### VMess Example

```javascript
// ... inside parseConfig(rawConfig)
if (protocol === 'vmess') {
    const b64 = rawConfig.substring(8); // Remove "vmess://"
    const json = JSON.parse(safeB64Decode(b64)); // Decode Base64 payload
    name = json.ps || 'VMess';
    address = json.add;
    port = json.port;
    if (json.tls === 'tls') tags.push('TLS');
    if (json.net) tags.push(json.net.toUpperCase());
}
// ... other protocols use URL class for parsing
````

The application uses `safeB64Decode` to correctly handle Base64 decoding, ensuring support for URL-safe characters (`-`, `_`) and automatic padding.

-----

## 🤝 Contributing

We welcome contributions\! If you have suggestions for new protocol support or logic improvements, please feel free to open an issue or submit a Pull Request.

1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/new-protocol`).
3.  Commit your Changes (`git commit -m 'feat: added TUIC support'`).
4.  Push to the Branch (`git push origin feature/new-protocol`).
5.  Open a Pull Request.

-----

## 📄 License

This project is licensed under the MIT License.
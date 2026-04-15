# VoidTube

> _"Silence the algorithm. Reclaim the signal."_

VoidTube is an alternative, independent YouTube client.  
No ads. No tracking. No algorithmic noise.  
A modular interface to the video netherworld — powered by `yt-dlp`, local memory, and minimal UI.

<a href="https://ibb.co/dwfvH6nF"><img src="https://i.ibb.co/cSy9stz0/Screenshot-20250625-115512.png" alt="Screenshot-20250625-115512" border="0"></a>

## ✦ Features

- 🎥 **Video playback** via `yt-dlp` (audio / video / background)
- 🔍 **Search interface** (local history & YouTube)
- 📜 **Watch history** with trace indexing and search
- 📂 **Local playlists** – creation, editing, ordering
- 📦 **YouTube playlist import**
- 🖥️ **Desktop mode** (Electron shell)

## ⚙️ Installation

Download latest release [here](https://github.com/wxn0brP/VoidTube/releases).

## 🛠 Build from source

VoidTube requires Node.js and Electron.

```bash
git clone https://github.com/wxn0brP/VoidTube.git
cd voidtube
npm install
cd front
npm install
npm run build
cd ..
npm run build
npm run start:client
#or npm run start:server for server without electron
````

📥 If `yt-dlp` is missing, VoidTube will summon it automatically

## 🛠 Stack

* **yt-dlp** – video/data extraction backend
* **Node.js / Electron** – runtime shell
* **SCSS** – styling layer
* **Custom local DB** – ValtheraDB (see [here](https://github.com/wxn0brP/ValtheraDB)) or any ValtheraCompatible storage
* **No telemetry** – no tracking, no Google pings

## 🧪 Roadmap

* [x] Core playback + UI
* [x] History + search
* [x] Playlists + import
* [x] Responsive layout
* [x] Local subscriptions

## 🧷 License

MIT. But remember — the Void doesn't ask for permission.

## 🤝 Contributing 

VoidTube is an open-source project in its prototype stage — any contribution, whether code, testing, feedback, or ideas, is warmly welcome. Feel free to fork, report issues, and submit pull requests! 

**Remember**: The Void grows stronger with every contribution.

--- 
> "The first step to silence is to cut off the algorithm's scream."

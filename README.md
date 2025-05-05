# VoidTube

> _"Silence the algorithm. Reclaim the signal."_

VoidTube is an alternative, independent YouTube client.  
No ads. No tracking. No algorithmic noise.  
A modular interface to the video netherworld — powered by `yt-dlp`, local memory, and minimal UI.

<img src="https://private-user-images.githubusercontent.com/105448874/440462178-217e228d-7ac7-4013-913d-bd3da920d592.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDY0NjQzNjksIm5iZiI6MTc0NjQ2NDA2OSwicGF0aCI6Ii8xMDU0NDg4NzQvNDQwNDYyMTc4LTIxN2UyMjhkLTdhYzctNDAxMy05MTNkLWJkM2RhOTIwZDU5Mi5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUwNTA1JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MDUwNVQxNjU0MjlaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1lZDZlNTU1NzAyNjczOGJkOTFkNjMwZjg5NmQ0MjNkYjhiMGZlMzQ0N2IwYjFjOGQzZjNkMmM3NWE5M2JiNjMzJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.qXECqr_UAfMNC_MsOshSKOtWN4SsI8ZYuPxx2EOdBtc">

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

VoidTube requires Node.js, `yt-dlp`, and front-end dependencies.

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
* **Vanilla CSS / Tailwind** – styling layer
* **Custom local DB** – ValtheraDB (see [here](https://github.com/wxn0brP/ValtheraDB)) or any ValtheraCompatible storage
* **No telemetry** – no tracking, no Google pings

## 🧪 Roadmap

* [x] Core playback + UI
* [x] History + search
* [x] Playlists + import
* [x] Responsive layout
* [ ] Local subscriptions
* [ ] Mobile shell (Mobile App)

## 🧷 License

MIT. But remember — the Void doesn't ask for permission.

## 🤝 Contributing 

VoidTube is an open-source project in its prototype stage — any contribution, whether code, testing, feedback, or ideas, is warmly welcome. Feel free to fork, report issues, and submit pull requests! 

**Remember**: The Void grows stronger with every contribution.

--- 
> "The first step to silence is to cut off the algorithm's scream."
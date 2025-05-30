# Scat (31) Multiplayer Card Game

A real-time, multiplayer card game built with React (frontend) and Node.js + Socket.IO (backend). Play Scat (31) with your friends online!

## Features

- Real-time multiplayer gameplay
- Modern React frontend
- Node.js + Socket.IO backend
- Automatic win detection (31)
- Round/life tracking
- Responsive UI

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   ```

2. **Install dependencies for both client and server:**
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   cd ..
   ```

### Running Locally

#### **Start the Backend (Socket.IO server):**
```bash
npm run server
```
or
```bash
cd server
npm run dev
```

#### **Start the Frontend (React app):**
```bash
cd client
npm start
```

- The React app will run on [http://localhost:3000](http://localhost:3000)
- The backend will run on [http://localhost:4000](http://localhost:4000) (or as configured)

### Environment Variables

- You can use a `.env` file in the `server` and/or `client` directories for custom configuration (e.g., ports, CORS).

### Deployment

- Deploy the backend to a Node.js-friendly host (Heroku, Render, DigitalOcean, etc.)
- Deploy the frontend to a static host (Netlify, Vercel, GitHub Pages, or your own server)
- Update the frontend's Socket.IO connection URL to point to your backend's public address

### Folder Structure

```
/client   # React frontend
/server   # Node.js + Socket.IO backend
```

### Customization

- Edit game rules, UI, or add features as you like!
- PRs and issues welcome.

## License

MIT

---

**Enjoy playing Scat (31) with your friends!** 
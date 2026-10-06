# Host Cascadia 99 online

The web game needs a running Node.js server with WebSocket support. Uploading only `index.html` to static hosting will not run multiplayer. Current work focuses on the web game; desktop builds are deferred.

## Render

[Render web services support incoming WebSocket connections](https://render.com/docs/websocket). The checked-in `render.yaml` configures a free Node web service for an initial trial.

1. Put the contents of the `panel-99` folder in a GitHub repository. Include the game source, `package.json`, `package-lock.json`, and `render.yaml`. Do not commit `node_modules/`, `release/`, `.desktop-smoke/`, or `.web-smoke/`; `.gitignore` already excludes them.
2. Sign into Render and choose **New → Blueprint**. Connect the repository and confirm the service described by `render.yaml`. This creates the service only when you do it; nothing has been deployed from this workspace.
3. Wait for the deployment, then open the service's HTTPS `onrender.com` address.
4. Create a room and share the game address and six-character code. Players open the address in a browser and join using the code.

If creating a **Web Service** manually instead of a Blueprint, use these settings:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root directory | Blank if this folder is the repository root; otherwise the path to `panel-99` |
| Build command | `npm ci --omit=dev` |
| Start command | `npm start` |
| Environment | `NODE_VERSION=24`, `HOST=0.0.0.0` |
| Health check | `/` |

Render sets `PORT` itself; the game reads it automatically. Do not configure a separate WebSocket port. The app uses the same origin and port for game assets and `/socket`. See [Render’s Node deployment guide](https://render.com/docs/deploy-node-express-app).

[Free Render services sleep after 15 minutes without incoming traffic](https://render.com/docs/free), so the first visit after inactivity can take time to start. They are suitable for trying the prototype. For regular sessions, choose an instance that stays running. The game stores rooms in memory: any restart or deployment ends active matches. Keep this prototype on one service instance; scaling across instances requires shared room storage and routing that are not implemented yet.

## Other Node.js hosts

Run `node server.mjs` with Node 22 or newer and expose the platform's assigned `PORT`. Put HTTPS in front of it and forward WebSocket upgrade requests to `/socket`. Keep every client in a room on the same server process. No database or desktop packaging dependencies are required to run the web game.

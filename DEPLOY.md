# Deploy for free (GitHub + MongoDB Atlas + Render + Vercel or Netlify)

This walkthrough hosts the **API** on [Render](https://render.com), the **React app** on [Vercel](https://vercel.com) or [Netlify](https://www.netlify.com), and the **database** on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). All have free tiers suitable for a demo or portfolio.

**Vercel cannot run this Express + MongoDB backend** — only the Vite frontend. Deploy the API on Render first.

Do things in this order: **Atlas → GitHub → Render (API) → seed → Vercel or Netlify (frontend)**.

---

## 1. Put the project on GitHub

From your project folder (parent of `backend` and `frontend`):

```bash
git init
git add .
git commit -m "Initial commit"
```

Create a new empty repository on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## 2. MongoDB Atlas

1. Sign up at [cloud.mongodb.com](https://www.mongodb.com/cloud/atlas).
2. Create a **free M0** cluster (any region).
3. **Database Access** → add a user (username + password). Save the password.
4. **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`) so Render’s servers can connect. (Fine for demos; use stricter rules for real production.)
5. **Database** → **Connect** → **Drivers** → copy the connection string. Replace `<password>` with your user’s password. Example shape:  
   `mongodb+srv://user:PASSWORD@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority`  
   This value is your **`MONGODB_URI`**.

---

## 3. Render (backend API)

**Option A — Blueprint (uses `render.yaml` in this repo)**  

1. In Render: **New** → **Blueprint**.  
2. Connect GitHub, select this repository.  
3. Apply the blueprint. It creates a **Web Service** for `backend/`.

**Option B — Manual Web Service**  

1. **New** → **Web Service**, connect the repo.  
2. **Root Directory:** `backend`  
3. **Build Command:** `npm install`  
4. **Start Command:** `npm start`  
5. **Instance type:** Free  

**Environment variables** (Render → your service → **Environment**):

| Key | Value |
|-----|--------|
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | Long random string (e.g. 32+ characters) |
| `NODE_ENV` | `production` |

`PORT` is set automatically by Render; the app already uses `process.env.PORT`.

Save and deploy. When the deploy succeeds, copy the service URL, e.g. `https://ecommerce-api-xxxx.onrender.com`.  
**No trailing slash** when you use it below.

**Load sample products (one time)**  

Render → your service → **Shell** (if available) or run locally with the **same** `MONGODB_URI`:

```bash
cd backend
export MONGODB_URI="your-atlas-connection-string"
npm run seed
```

---

## 4. Vercel (frontend) — recommended if you use Vercel

1. Sign up at [vercel.com](https://vercel.com) → **Add New** → **Project** → import GitHub repo **`mfron28/ECommerce`** (or your fork).
2. **Root Directory:** click **Edit** → set to **`frontend`** (important).
3. Framework Preset should detect **Vite** (uses `frontend/vercel.json`).
4. **Environment Variables** → add:

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | `https://YOUR-SERVICE.onrender.com` (Render API URL, **https**, no trailing slash) |

5. **Deploy**. Copy the site URL, e.g. `https://ecommerce-xyz.vercel.app`.

6. Use that URL for Playwright / Jenkins:

   ```bash
   PLAYWRIGHT_BASE_URL=https://ecommerce-xyz.vercel.app
   ```

**CLI (optional):** from the `frontend` folder after API is live:

```bash
cd frontend
npm install -g vercel   # or: npx vercel
vercel login
vercel --prod
# set VITE_API_URL in the Vercel dashboard, then redeploy
```

---

## 5. Netlify (frontend)

1. Sign up at [netlify.com](https://www.netlify.com) → **Add new site** → **Import an existing project** → GitHub → this repo.  
2. Netlify reads **`netlify.toml`**: base `frontend`, build `npm install && npm run build`, publish `dist`.  
3. **Site configuration → Environment variables → Add a variable:**  

   - **Key:** `VITE_API_URL`  
   - **Value:** `https://YOUR-SERVICE.onrender.com` (your Render API URL, **https**, no trailing slash)

4. **Trigger deploy** (Deploys → **Trigger deploy** → **Clear cache and deploy site**) so the build picks up `VITE_API_URL`.

Open the Netlify URL. The SPA fallback in `netlify.toml` keeps React Router working on refresh.

---

## 6. Checklist

- [ ] Atlas cluster up, user created, `0.0.0.0/0` allowed (for free hosting).  
- [ ] Render shows **Live** and `https://YOUR-API.onrender.com/api/health` returns JSON `{ "status": "ok" }`.  
- [ ] `npm run seed` ran against that Atlas DB.  
- [ ] Vercel or Netlify has `VITE_API_URL` exactly matching the Render API origin, site rebuilt after adding it.

---

## Free-tier notes

- Render **free** web services **spin down** after idle time; the first request after sleep can take **30–60+ seconds**.  
- Atlas M0 has size and connection limits; enough for learning.  
- If something fails, check Render **Logs** and the browser **Network** tab for failed `/api/...` calls (wrong `VITE_API_URL`, CORS, or API asleep).

---

## Without GitHub

You can still use **Render** and **Netlify** by deploying from the dashboard (upload/ZIP) or CLI, but Git-connected deploys are the easiest path for updates. This repo is set up for the GitHub flow above.

# Frontend Playwright check

Use this when you changed something a person can see.

Do not write a committed Playwright spec here. Lab 3 does that.

## 1. Boot local app

Treat `http://127.0.0.1:3000` as ready only if it returns HTML containing Throughline. This cross-platform Node 20 check should exit successfully:

```bash
node -e "fetch('http://127.0.0.1:3000').then(r=>r.text()).then(t=>{if(!t.includes('Throughline'))process.exit(1)}).catch(()=>process.exit(1))"
```

If it is not ready:

```bash
npm run dev
```

Wait until the terminal prints the local URL. If 3000 is busy, reuse it only when it is a healthy Throughline server. Stop an old broken Throughline terminal before restarting. If another app owns 3000:

```bash
npm run dev -- --port 3001
```

Use that URL instead.

## 2. Click the change

Use Playwright MCP browser tools. Open every route you changed. Exercise each frontend acceptance criterion. Click, type, and read the page. A screenshot alone is not enough.

Re-check one nearby path you did not mean to change.

Read console errors on the changed path.

## 3. If Playwright MCP is missing

Ask the person to click the same flow on localhost and confirm the acceptance criteria. Do not block the lab.

## 4. Record

Write the local URL, the flows you clicked, and pass or fail for each acceptance criterion.

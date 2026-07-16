Here is a clean, scannable summary of our conversation to copy and paste into your notebook:

---

## Next.js: Client vs. Server Components (TL;DR)

### 1. The Default & The "Importer" Rule

* **Default Behavior:** Any file with **no directive** is a **Server Component** by default. It executes only on the server, and its JS is never sent to the client.
* **The Importer Exception:** If a file with no directive is imported into a `'use client'` file, it gets pulled across the boundary and executes on the client.

---

### 2. The Directives

* **`'use client'` (The Client Boundary):**
* Marks a file and **all of its imports** to be sent to the browser.
* These components are still pre-rendered on the server (SSR) for fast loading, but they "hydrate" in the browser.
* **Can use:** `useState`, `useEffect`, `onClick`, and other browser-only APIs.


* **`'use server'` (Server Actions):**
* **Not** used to create Server Components.
* Used exclusively to mark async functions as **Server Actions** (code that runs securely on the server but can be called directly from client-side forms or buttons).



---

### 3. How They Behave on the Client

* **Client Components:** The server sends the HTML *and* the JavaScript. The browser takes over handling the logic and state.
* **Server Components:** The server runs the code, generates the UI, and sends it to the browser. **Zero JavaScript** is sent to the client for these components.
* Once they reach the browser, they are **completely inert (static/read-only)**.
* They cannot change their own state or listen to browser events.
* The only way they "update" is if you ask the server to re-render them (via navigation, `router.refresh()`, or Server Actions) and send down a fresh UI payload.



---

### Quick Cheat Sheet

| Directive | Default/Role | Runs On | Sent to Browser? | Can use Hooks/Events? |
| --- | --- | --- | --- | --- |
| **None** | Server Component | Server | No | No |
| **`'use client'`** | Client Boundary | Server (SSR) + Client | Yes (JS Bundle) | Yes |
| **`'use server'`** | Server Action (Function) | Server | No | No |
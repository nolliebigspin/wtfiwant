import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Keep server request semantics for Hono tests (Happy DOM strips Origin headers
// when body-limit rebuilds a Request). UI still uses Happy DOM's document.
const serverHttp = { Request, Response, Headers, fetch };
GlobalRegistrator.register();
Object.assign(globalThis, serverHttp);

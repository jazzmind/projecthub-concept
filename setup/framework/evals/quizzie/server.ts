import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Logging, SyncConcept } from "./engine/mod.js";
import { APIConcept } from "./concepts/api.js";
import { QuizConcept } from "./concepts/quiz.js";
import { ActivationConcept } from "./concepts/activation.js";
import { makeApiQuizSyncs } from "./syncs/api_quiz.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Concepts and sync engine
const Sync = new SyncConcept();
Sync.logging = Logging.TRACE;
const concepts = {
    API: new APIConcept(),
    Quiz: new QuizConcept(),
    Activation: new ActivationConcept(),
};
const { API, Quiz, Activation } = Sync.instrument(concepts);
Sync.register(makeApiQuizSyncs(API, Quiz, Activation));

// Very simple demo user. In production, use auth middleware
const DEMO_USER = { user: "demo-user", name: "Daniel" };

function normalize(req: express.Request) {
    const params = req.params || {};
    const input = {
        ...req.body,
        ...req.query,
        ...params,
        owner: DEMO_USER.user,
        user: DEMO_USER.user,
    };
    return input;
}

// Generic handler that funnels to API concept
async function handle(
    method: string,
    path: string,
    req: express.Request,
    res: express.Response,
) {
    const { request } = await API.request({
        method,
        path,
        ...normalize(req),
    });
    const output = await API._waitForResponse({ request });
    if (output === undefined) {
        res.status(500).json({ error: "No response" });
    } else {
        res.json(output);
    }
}

app.get("/api/quizzes", (req, res) => handle("GET", "/quizzes", req, res));
app.post("/api/quizzes", (req, res) => handle("POST", "/quizzes", req, res));
app.delete(
    "/api/quizzes/:quiz",
    (req, res) => handle("DELETE", "/quizzes/:quiz", req, res),
);

app.get(
    "/api/quizzes/:quiz",
    (req, res) => handle("GET", "/quizzes/:quiz", req, res),
);
app.post(
    "/api/quizzes/:quiz/questions",
    (req, res) => handle("POST", "/quizzes/:quiz/questions", req, res),
);

app.patch(
    "/api/questions/:question",
    (req, res) => handle("PATCH", "/questions/:question", req, res),
);
app.delete(
    "/api/questions/:question",
    (req, res) => handle("DELETE", "/questions/:question", req, res),
);

app.post(
    "/api/questions/:question/options",
    (req, res) => handle("POST", "/questions/:question/options", req, res),
);
app.patch(
    "/api/options/:option",
    (req, res) => handle("PATCH", "/options/:option", req, res),
);
app.delete(
    "/api/options/:option",
    (req, res) => handle("DELETE", "/options/:option", req, res),
);

app.post(
    "/api/questions/:question/activate",
    (req, res) => handle("POST", "/questions/:question/activate", req, res),
);
app.post(
    "/api/activations/:activation/deactivate",
    (req, res) =>
        handle("POST", "/activations/:activation/deactivate", req, res),
);
app.post(
    "/api/activations/:activation/show",
    (req, res) => handle("POST", "/activations/:activation/show", req, res),
);
app.post(
    "/api/activations/:activation/hide",
    (req, res) => handle("POST", "/activations/:activation/hide", req, res),
);
app.post(
    "/api/activations/:activation/choose",
    (req, res) => handle("POST", "/activations/:activation/choose", req, res),
);
app.get(
    "/api/activations/:activation",
    (req, res) => handle("GET", "/activations/:activation", req, res),
);
app.get(
    "/api/display/:quiz",
    (req, res) => handle("GET", "/display/:quiz", req, res),
);

// QR helper: generates PNG for a given url
import { generate as generateQR } from "@juit/qrcode";
app.get("/api/qr", async (req, res) => {
    try {
        const url = String(req.query.url || "");
        if (!url) return res.status(400).send("Missing url");
        const format = (req.query.format as string) || "svg"; // svg is crisp
        const image = await generateQR(url, format as any);
        if (format === "svg") {
            res.type("image/svg+xml").send(Buffer.from(image));
        } else {
            res.type("image/png").send(Buffer.from(image));
        }
    } catch (e) {
        res.status(500).send(String(e));
    }
});

// Static client
app.use(express.static(path.join(__dirname, "web")));

const PORT = process.env.PORT || 5173;
app.listen(
    PORT,
    () => console.log(`Quizzie running at http://localhost:${PORT}`),
);

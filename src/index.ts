import express, { Request, Response } from "express";
import path from "path";
import nunjucks from "nunjucks";
import { randomUUID } from "crypto";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import loggerMiddleware from "./middlewares/logger";
import sanitizeHtml from "sanitize-html";
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const PROJECT_ROOT = process.cwd();

const MESSAGES_DIR = path.join(PROJECT_ROOT, "messages");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const TEMPLATES_DIR = path.join(PROJECT_ROOT, "templates");

const MIN_MESSAGE_LENGTH = 1;
const MAX_MESSAGE_LENGTH = 1024;

// --- Middleware ---

app.use(loggerMiddleware);
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

// --- Template Engine  ---

nunjucks.configure(TEMPLATES_DIR, {
  autoescape: true,
  express: app,
});
app.set("view engine", "html");

// --- Routes ---

// Home
app.get("/", (req: Request, res: Response) => {
  res.render("index");
});

// Create a new message
app.post("/create", async (req: Request, res: Response) => {
  const { content } = req.body;

  if (
    !content ||
    content.length < MIN_MESSAGE_LENGTH ||
    content.length > MAX_MESSAGE_LENGTH
  ) {
    return res
      .status(400)
      .send(
        "Invalid message length. Please ensure your message is between 1 and 1024 characters.",
      );
  }

  const cleanContent = sanitizeHtml(content);
  const messageId = randomUUID();
  const filePath = path.join(MESSAGES_DIR, `${messageId}.txt`);

  try {
    await writeFile(filePath, cleanContent);
    const link = `${req.protocol}://${req.get("host")}/message/${messageId}`;
    // console.log(`Message saved with ID: ${link}`);
    res.render("link", { link });
  } catch (error) {
    console.error("Failed to write file:", error);
    res.status(500).send("Server error: Could not create the message.");
  }
});

// Display the message and then delete it
app.get("/message/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const filePath = path.join(MESSAGES_DIR, `${id}.txt`);

  try {
    const content = await readFile(filePath, "utf-8");
    // Burn the file after reading
    await unlink(filePath);
    res.render("message", { content });
  } catch (error) {
    res.status(404).render("404");
  }
});

// Catch-all route for 404 errors
app.use((req: Request, res: Response) => {
  res.status(404).render("404");
});

// --- Server starter ---
const startServer = async () => {
  try {
    await mkdir(MESSAGES_DIR, { recursive: true });

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

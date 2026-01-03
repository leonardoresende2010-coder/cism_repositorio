import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import mammoth from "mammoth";
import { GoogleGenAI } from "@google/genai";

import { storage, parseQuestionsFromText } from "./storage";

// ---------------------------------------------------------------------------
// Upload handling
// ---------------------------------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

function getExt(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
}

async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const ext = getExt(file.originalname);

  if (ext === ".txt") {
    return file.buffer.toString("utf8");
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value || "";
  }

  // NOTE: PDF parsing is intentionally not implemented here.
  // The project accepts PDF in the UI, but without a parser the backend can't
  // reliably extract question text. Prefer DOCX/TXT for now.
  if (ext === ".pdf") {
    throw new Error(
      "PDF upload is not supported yet. Please upload the DOCX or TXT version of the questions."
    );
  }

  throw new Error("Unsupported file type. Please upload DOCX, PDF, or TXT.");
}

// ---------------------------------------------------------------------------
// Gemini (divergence analysis)
// ---------------------------------------------------------------------------

function getGeminiApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "Missing Gemini API key. Set GEMINI_API_KEY (or GOOGLE_API_KEY) in the environment."
    );
  }
  return new GoogleGenAI({ apiKey });
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export async function registerRoutes(_httpServer: Server, app: Express) {
  // Health check (useful on Render)
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // Upload questions
  app.post(
    "/api/questions/upload",
    upload.single("file"),
    async (req, res) => {
      try {
        const file = req.file;
        if (!file) {
          return res.status(400).json({ message: "No file provided" });
        }

        const text = await extractTextFromFile(file);
        const { questions, blocks } = parseQuestionsFromText(text, file.originalname);

        if (!questions.length) {
          return res
            .status(400)
            .json({ message: "No questions found in the uploaded file" });
        }

        await storage.clearQuestions();
        await storage.addQuestions(questions, blocks);

        return res.json({ questions, blocks });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to process file";
        return res.status(400).json({ message });
      }
    }
  );

  // AI divergence analysis (on-demand)
  app.post("/api/analyze-divergence", async (req, res) => {
    try {
      const { correctAnswer, explanation, options, text: questionText } = req.body ?? {};

      if (!correctAnswer || !explanation || !Array.isArray(options)) {
        return res
          .status(400)
          .json({ isDivergent: false, explanationAnswer: null, message: "Invalid payload" });
      }

      const optionsText = options
        .map((o: any) => `${o.letter}) ${o.text}`)
        .join("\n");

      const ai = getGeminiClient();
      const model = ai.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { temperature: 0.1 },
      });

      const prompt = `AJA COMO UM AUDITOR TÉCNICO DE EXAMES.
Sua tarefa é ler a EXPLICAÇÃO abaixo e identificar qual das ALTERNATIVAS ela defende como correta.

QUESTÃO: "${questionText ?? ""}"
ALTERNATIVAS:
${optionsText}

EXPLICAÇÃO:
"${explanation}"

REGRAS:
1. Ignore qual letra o gabarito diz ser a certa. Foque na lógica do texto.
2. Se a explicação descreve a Letra B, responda que a letra identificada é B.
3. Responda APENAS com este JSON:
{"letraIdentificada": "A/B/C/D", "logica": "resumo curto"}`;

      const result = await model.generateContent(prompt);
      // The SDK returns a response object with .text()
      const aiText = result.response.text();

      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.json({
          isDivergent: false,
          explanationAnswer: null,
          message: "Could not parse model output",
        });
      }

      const aiResult = JSON.parse(jsonMatch[0]);
      const identifiedLetter = String(aiResult.letraIdentificada ?? "")
        .trim()
        .toUpperCase();
      const officialLetter = String(correctAnswer).trim().toUpperCase();

      const isDivergent =
        identifiedLetter.length === 1 &&
        /[ABCD]/.test(identifiedLetter) &&
        identifiedLetter !== officialLetter;

      return res.json({
        isDivergent,
        explanationAnswer:
          identifiedLetter.length === 1 && /[ABCD]/.test(identifiedLetter)
            ? identifiedLetter
            : null,
        reason: isDivergent
          ? `Divergência detectada! O gabarito indica ${officialLetter}, mas a explicação técnica descreve a alternativa ${identifiedLetter}.`
          : "A explicação é consistente com o gabarito oficial.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro na comunicação com Gemini";
      console.error("Erro detalhado na IA:", error);
      return res.status(500).json({ isDivergent: false, explanationAnswer: null, message });
    }
  });

  return app;
}

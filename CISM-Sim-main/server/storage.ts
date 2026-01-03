import type { Question, QuestionBlock, QuestionProgress, ExamState } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getQuestions(): Promise<Question[]>;
  getBlocks(): Promise<QuestionBlock[]>;
  addQuestions(questions: Question[], blocks: QuestionBlock[]): Promise<void>;
  clearQuestions(): Promise<void>;
}

export class MemStorage implements IStorage {
  private questions: Map<string, Question>;
  private blocks: Map<string, QuestionBlock>;

  constructor() {
    this.questions = new Map();
    this.blocks = new Map();
  }

  async getQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values()).sort((a, b) => a.number - b.number);
  }

  async getBlocks(): Promise<QuestionBlock[]> {
    return Array.from(this.blocks.values()).sort((a, b) => a.startIndex - b.startIndex);
  }

  async addQuestions(questions: Question[], blocks: QuestionBlock[]): Promise<void> {
    questions.forEach((q) => {
      this.questions.set(q.id, q);
    });
    blocks.forEach((b) => {
      this.blocks.set(b.id, b);
    });
  }

  async clearQuestions(): Promise<void> {
    this.questions.clear();
    this.blocks.clear();
  }
}

export const storage = new MemStorage();

export function parseQuestionsFromText(
  text: string,
  sourceFile: string
): { questions: Question[]; blocks: QuestionBlock[] } {
  const questions: Question[] = [];
  
  const questionPattern = /Question[:\s]*(\d+)\s*([\s\S]*?)(?=Question[:\s]*\d+|$)/gi;
  const matches = [...text.matchAll(questionPattern)];
  
  if (matches.length === 0) {
    const altPattern = /(\d+)\.\s*([\s\S]*?)(?=\d+\.\s|$)/g;
    const altMatches = [...text.matchAll(altPattern)];
    
    for (const match of altMatches) {
      const questionNumber = parseInt(match[1], 10);
      const content = match[2].trim();
      const parsed = parseQuestionContent(content, questionNumber, sourceFile);
      if (parsed) {
        questions.push(parsed);
      }
    }
  } else {
    for (const match of matches) {
      const questionNumber = parseInt(match[1], 10);
      const content = match[2].trim();
      const parsed = parseQuestionContent(content, questionNumber, sourceFile);
      if (parsed) {
        questions.push(parsed);
      }
    }
  }

  questions.sort((a, b) => a.number - b.number);

  const blocks: QuestionBlock[] = [];
  const blockSize = 50;
  
  for (let i = 0; i < questions.length; i += blockSize) {
    const blockQuestions = questions.slice(i, Math.min(i + blockSize, questions.length));
    const block: QuestionBlock = {
      id: randomUUID(),
      sourceFile,
      startIndex: i,
      endIndex: Math.min(i + blockSize, questions.length) - 1,
      questionIds: blockQuestions.map((q) => q.id),
    };
    blocks.push(block);
    
    blockQuestions.forEach((q, idx) => {
      q.blockIndex = blocks.length - 1;
    });
  }

  return { questions, blocks };
}

function parseQuestionContent(
  content: string,
  questionNumber: number,
  sourceFile: string
): Question | null {
  const options: { letter: string; text: string }[] = [];
  let questionText = "";
  let correctAnswer = "";
  let explanation = "";

  const optionPattern = /([A-D])[.):]\s*([^\n]+(?:\n(?![A-D][.):])(?!Answer|Explanation)[^\n]*)*)/gi;
  const answerPattern = /Answer[:\s]*([A-D])/i;
  const explanationPattern = /Explanation[:\s]*([\s\S]*?)(?=Question[:\s]*\d+|Reference|$)/i;

  const answerMatch = content.match(answerPattern);
  if (answerMatch) {
    correctAnswer = answerMatch[1].toUpperCase();
  }

  const explanationMatch = content.match(explanationPattern);
  if (explanationMatch) {
    explanation = explanationMatch[1].trim();
    explanation = explanation.replace(/\s+/g, " ").substring(0, 2000);
  }

  const optionMatches = [...content.matchAll(optionPattern)];
  for (const match of optionMatches) {
    const letter = match[1].toUpperCase();
    let text = match[2].trim();
    text = text.replace(/\s+/g, " ");
    
    if (!options.find((o) => o.letter === letter)) {
      options.push({ letter, text });
    }
  }

  const firstOptionIndex = content.search(/[A-D][.):]/i);
  if (firstOptionIndex > 0) {
    questionText = content.substring(0, firstOptionIndex).trim();
  } else {
    const lines = content.split("\n");
    questionText = lines[0].trim();
  }

  questionText = questionText.replace(/\s+/g, " ");

  if (!questionText || options.length < 2 || !correctAnswer) {
    return null;
  }

  options.sort((a, b) => a.letter.localeCompare(b.letter));

  const { isDivergent, explanationAnswer } = detectDivergence(
    correctAnswer,
    explanation,
    options
  );

  return {
    id: randomUUID(),
    number: questionNumber,
    text: questionText,
    options,
    correctAnswer,
    explanation: explanation || "No explanation provided.",
    sourceFile,
    blockIndex: 0,
    isDivergent,
    explanationAnswer,
  };
}

function detectDivergence(
  correctAnswer: string,
  explanation: string,
  options: { letter: string; text: string }[]
): { isDivergent: boolean; explanationAnswer: string | null } {
  if (!explanation || explanation === "No explanation provided.") {
    return { isDivergent: false, explanationAnswer: null };
  }

  const explLower = explanation.toLowerCase();
  
  const patterns = [
    /(?:the\s+)?correct\s+(?:answer|option|choice)\s+is\s+([A-D])/i,
    /(?:answer|option|choice)\s+([A-D])\s+is\s+(?:the\s+)?correct/i,
    /([A-D])\s+is\s+the\s+(?:correct|right|best)\s+(?:answer|option|choice)/i,
    /the\s+(?:best|right|correct)\s+(?:answer|option|choice)\s+is\s+([A-D])/i,
    /(?:therefore|thus|hence|so),?\s+([A-D])\s+is\s+(?:the\s+)?correct/i,
    /([A-D])\s+is\s+(?:the\s+)?(?:most\s+)?appropriate/i,
    /\banswer[:\s]+([A-D])\b/i,
    /\b([A-D])\s+is\s+(?:the\s+)?(?:right|correct|best)\b/i,
    /\bcorrect[:\s]+([A-D])\b/i,
    /\bthe\s+answer\s+is\s+([A-D])\b/i,
    /\b([A-D])\.\s+is\s+correct\b/i,
    /\boption\s+([A-D])\s+(?:is\s+)?correct\b/i,
    /\b([A-D])\s+should\s+be\s+(?:the\s+)?(?:correct|right)\b/i,
    /\bselect(?:ing)?\s+([A-D])\b/i,
    /\bchoose\s+([A-D])\b/i,
  ];

  let explanationAnswer: string | null = null;

  for (const pattern of patterns) {
    const match = explanation.match(pattern);
    if (match) {
      explanationAnswer = match[1].toUpperCase();
      break;
    }
  }

  if (!explanationAnswer && options.length > 0) {
    for (const option of options) {
      const optionTextLower = option.text.toLowerCase().substring(0, 50);
      if (
        explLower.includes(`${option.letter.toLowerCase()} is correct`) ||
        explLower.includes(`correct answer is ${option.letter.toLowerCase()}`) ||
        (explLower.includes("correct") && explLower.includes(optionTextLower.substring(0, 30)))
      ) {
        if (!explanationAnswer) {
          explanationAnswer = option.letter;
        }
      }
    }
  }

  if (explanationAnswer && explanationAnswer !== correctAnswer) {
    return { isDivergent: true, explanationAnswer };
  }

  return { isDivergent: false, explanationAnswer };
}

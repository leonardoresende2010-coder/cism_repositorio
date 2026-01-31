import { Question, QuizBlock } from '../types';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const parseContentToBlocks = (fileName: string, content: string, customTitle?: string): QuizBlock[] => {
  // Normalize whitespace and line breaks
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split by Question headers
  // Support: "QUESTÃO 1", "Question: 1", "1.", "1)", etc.
  // We use a lookahead for the header part, but consume the preceding newline if it exists.
  const rawBlocks = normalizedContent.split(/(?:\n+|^)(?=(?:QUESTÃO|QUESTAO|Question|Q)[\s:]*\d+|\b\d+[\.\-\)\s])/i);

  const questions: Question[] = [];

  const optionRegex = /(?:\n+|^)\s*([A-E])[\)\.:\s]\s+/g;
  const answerRegex = /(?:Resposta|Answer|Gabarito|Ans|Correct)\s*[:\.-]?\s*([A-E])/i;
  const explanationLabelRegex = /(?:Explanation|Explicação|Comentário|Justificativa)\s*[:\.]?/i;

  rawBlocks.forEach(block => {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) return;

    // 1. Remove the Question Header
    const headerMatch = trimmedBlock.match(/^(?:QUESTÃO|QUESTAO|Question|Q)?[\s:]*(\d+)/i);
    let remainingText = trimmedBlock;
    if (headerMatch) {
      remainingText = trimmedBlock.substring(headerMatch[0].length).trim();
      // Remove trailing punctuation from header if any
      remainingText = remainingText.replace(/^[:\.\-\)\s]+/, '');
    }

    // 2. Extract Answer and Explanation
    const answerMatch = remainingText.match(answerRegex);
    let answer: string | undefined;
    let explanation: string = "";
    let questionAndOptionsPart = remainingText;

    if (answerMatch) {
      answer = answerMatch[1].toUpperCase();
      const answerIndex = answerMatch.index!;
      questionAndOptionsPart = remainingText.substring(0, answerIndex).trim();

      const afterAnswer = remainingText.substring(answerIndex + answerMatch[0].length).trim();
      explanation = afterAnswer.replace(explanationLabelRegex, '').trim();
    } else {
      // Fallback: search for Answer at the very end if not found by label
      const lastChar = remainingText.trim().slice(-1).toUpperCase();
      if (['A', 'B', 'C', 'D', 'E'].includes(lastChar)) {
        // Check if it's likely an answer (preceded by Resposta: or similar, or just at the end of block)
        // If we have "Answer: A" at the very end, answerMatch should have caught it.
        // This is just a safety.
      }
    }

    // 3. Extract Options and Question Text
    const options: { label: string, text: string, id: string }[] = [];
    const optionMatches = Array.from(questionAndOptionsPart.matchAll(optionRegex));

    let questionText = questionAndOptionsPart;

    if (optionMatches.length > 0) {
      // The text before the first option is the question
      questionText = questionAndOptionsPart.substring(0, optionMatches[0].index).trim();

      for (let i = 0; i < optionMatches.length; i++) {
        const currentMatch = optionMatches[i];
        const label = currentMatch[1].toUpperCase();
        const start = currentMatch.index! + currentMatch[0].length;
        const end = (i + 1 < optionMatches.length) ? optionMatches[i + 1].index : questionAndOptionsPart.length;

        const optionText = questionAndOptionsPart.substring(start, end).trim();
        if (optionText) {
          options.push({
            id: generateUUID(),
            label,
            text: optionText
          });
        }
      }
    }

    if (questionText && options.length > 0 && answer) {
      questions.push({
        id: generateUUID(),
        text: questionText,
        options,
        correctAnswerLabel: answer,
        explanation: explanation || undefined
      });
    } else {
      console.warn(`Block rejected. Header: ${trimmedBlock.substring(0, 30)}... Options: ${options.length}, Answer: ${answer ? 'Yes' : 'No'}`);
    }
  });

  console.log(`Total questions successfully parsed: ${questions.length}`);

  // --- Chunking Logic (Max 100 per block) ---
  const CHUNK_SIZE = 100;
  const blocks: QuizBlock[] = [];

  if (questions.length === 0) {
    return [];
  }

  // Use custom title or clean filename for the title
  const baseName = customTitle || fileName
    .replace(/^Questoes\s+/i, '')
    .replace(/\d*\.txt$/i, '')
    .trim();

  for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
    const chunk = questions.slice(i, i + CHUNK_SIZE);
    const suffix = (questions.length > CHUNK_SIZE) ? ` - Parte ${Math.floor(i / CHUNK_SIZE) + 1}` : '';
    console.log(`Creating block ${Math.floor(i / CHUNK_SIZE) + 1} with ${chunk.length} questions`);
    blocks.push({
      id: generateUUID(),
      fileName,
      timestamp: Date.now(),
      title: `${baseName}${suffix}`,
      questions: chunk
    });
  }

  return blocks;
};
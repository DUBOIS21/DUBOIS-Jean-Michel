export enum Tab {
  GENERATOR = 'generator',
  EDITOR = 'editor',
  PROMPT_BUILDER = 'prompt-builder',
  VIDEO = 'video',
  EXAMPLES = 'examples',
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface GenerationSettings {
  prompt: string;
  negativePrompt: string;
  aspectRatio: AspectRatio;
  modelStyle?: string;
  inputImageUrls?: string[];
  numberOfImages: number;
  seed?: number;
}

export interface HistoryEntry extends GenerationSettings {
  id: string;
  timestamp: number;
  imageUrls?: string[];
}
// FIX: Add the VHistoryEntry type definition to resolve import errors.
export interface VHistoryEntry {
  id: string;
  timestamp: number;
  moduleId: string;
  userInput: string;
  finalPrompt: string;
  generatedImageUrl: string;
  baseImageUrl?: string;
}

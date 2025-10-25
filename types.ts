export enum Tab {
  GENERATOR = 'generator',
  EDITOR = 'editor',
  PROMPT_BUILDER = 'prompt-builder',
  V_STYLES = 'v-styles',
  V_TEXTE = 'v-texte',
  V_IMAGE = 'v-image',
  VIDEO = 'video',
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
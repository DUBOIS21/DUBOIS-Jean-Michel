import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { AspectRatio } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("Clé API manquante. Veuillez définir la variable d'environnement API_KEY.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

type VideoModel = 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
type VideoAspectRatio = '16:9' | '9:16';
type VideoResolution = '720p' | '1080p';

const handleApiError = (error: any): Error => {
    console.error("Erreur API Gemini:", JSON.stringify(error, null, 2));
    const errorMessage = JSON.stringify(error).toLowerCase();

    // Check for specific daily free generation limit (Imagen)
    if (errorMessage.includes('quota exceeded') && errorMessage.includes('limited free generations per day')) {
        const quotaError = new Error("Limite de génération quotidienne gratuite atteinte. L'indicateur a été synchronisé. Veuillez réessayer demain.");
        (quotaError as any).isQuotaError = true; // Flag for the UI to react
        return quotaError;
    }

    // Check for specific safety-related blocks
    if (error.response?.promptFeedback?.blockReason === 'SAFETY') {
        return new Error("Votre demande a été bloquée pour des raisons de sécurité. Évitez les prompts qui pourraient générer des images de personnes réelles, du contenu sensible ou enfreindre les politiques d'utilisation.");
    }
    
    // Check for general quota issues
    if (errorMessage.includes('quota') || errorMessage.includes('resource_exhausted') || errorMessage.includes('429')) {
        return new Error("Vous avez dépassé votre quota d'utilisation de l'API. Veuillez vérifier votre plan et vos détails de facturation.");
    }

    // Check for API key issues
    if (errorMessage.includes('permission_denied') || errorMessage.includes('api key not valid')) {
        return new Error("La clé API semble être invalide ou manquante. Veuillez vérifier sa configuration.");
    }

    // Generic fallback
    return new Error("Une erreur inattendue est survenue avec l'API. La console contient plus de détails techniques.");
}

export const enhancePrompt = async (prompt: string): Promise<string> => {
    try {
        const systemInstruction = "Vous êtes un ingénieur prompt expert pour un générateur d'images IA. Prenez l'idée simple de l'utilisateur et développez-la en un prompt riche, descriptif et artistique. Incluez des détails sur le style (ex: 'art numérique', 'peinture à l'huile', 'cinématographique'), l'éclairage (ex: 'lumière douce du matin', 'contre-jour dramatique'), et la composition (ex: 'gros plan', 'grand angle'). Répondez UNIQUEMENT avec le nouveau prompt, sans texte d'introduction.";

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        if (response.text) {
            return response.text.trim();
        }

        throw new Error("L'API n'a pas retourné de texte pour l'amélioration du prompt.");

    } catch (error) {
        throw handleApiError(error);
    }
};

export const generateImage = async (prompt: string, negativePrompt: string, aspectRatio: AspectRatio, numberOfImages: number, inputImages?: string[] | null, seed?: number): Promise<string[]> => {
  const fullPrompt = negativePrompt ? `${prompt}. Ne pas inclure : ${negativePrompt}` : prompt;
  
  if (!inputImages || inputImages.length === 0) {
    // Logique texte-vers-image existante
    try {
      const config: any = {
          numberOfImages: numberOfImages,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
      };
      if (seed && Number.isInteger(seed)) {
          config.seed = seed;
      }

      const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: fullPrompt,
          config,
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
      }
      throw new Error("Aucune image n'a été générée.");
    } catch (error) {
      throw handleApiError(error);
    }
  } else {
    // Nouvelle logique image(s)+texte-vers-image (génère une seule image)
    const imageParts = inputImages.map(imgStr => {
        const mimeType = imgStr.match(/data:(.*);base64,/)?.[1] || 'image/png';
        const base64Data = imgStr.split(',')[1];
        return {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        };
    });
    
    const textPart = {
      text: fullPrompt,
    };

    try {
        const config: any = {
            responseModalities: [Modality.IMAGE],
        };
        if (seed && Number.isInteger(seed)) {
            config.seed = seed;
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [...imageParts, textPart]
            },
            config,
          });
        
        let imageUrl: string | null = null;

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const base64ImageBytes: string = part.inlineData.data;
              imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
              break; // On a trouvé l'image, on arrête
            }
        }
        
        if (imageUrl) {
            return [imageUrl];
        }

        throw new Error("Aucune image n'a été retournée par l'API pour la génération avec image.");
    } catch (error) {
        throw handleApiError(error);
    }
  }
};


export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<{imageUrl: string}> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                      inlineData: {
                        data: base64Image,
                        mimeType: mimeType,
                      },
                    },
                    {
                      text: prompt,
                    },
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
          });
        
        let imageUrl: string | null = null;
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const base64ImageBytes: string = part.inlineData.data;
              imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
              break;
            }
        }
        
        if (imageUrl) {
            return { imageUrl };
        }

        throw new Error("Aucune image n'a été retournée par l'API d'édition.");
    } catch (error) {
        throw handleApiError(error);
    }
};

export const describeImage = async (base64Image: string, mimeType: string, customPrompt: string): Promise<string> => {
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };
        const textPart = {
            text: customPrompt,
        };
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });
        
        if (response.text) {
            return response.text;
        }
        
        throw new Error("La description de l'image n'a pas pu être générée.");
    } catch (error) {
        throw handleApiError(error);
    }
};

export const generateVideo = async (
    prompt: string,
    model: VideoModel,
    aspectRatio: VideoAspectRatio,
    resolution: VideoResolution,
): Promise<string> => {
    try {
        if (!API_KEY) throw new Error("Clé API manquante.");

        let operation = await ai.models.generateVideos({
            model: model,
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: resolution,
                aspectRatio: aspectRatio
            }
        });
        
        const pollInterval = 10000; // 10 seconds

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            // FIX: The polling API for long-running operations expects the entire operation object, not just its name.
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        if (operation.error) {
            const errorMessage = typeof operation.error === 'object' ? JSON.stringify(operation.error) : String(operation.error);
            throw new Error(`L'opération de génération vidéo a échoué: ${errorMessage}`);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Aucun lien de téléchargement de vidéo n'a été trouvé dans la réponse.");
        }

        const response = await fetch(`${downloadLink}&key=${API_KEY}`);
        
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Échec du téléchargement de la vidéo: ${response.statusText}. Détails: ${errorBody}`);
        }

        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        throw handleApiError(error);
    }
};
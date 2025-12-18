
import { GoogleGenAI, Type } from "@google/genai";
import { ArticleOutline, DraftAnalysis } from "../types";

export class SEOAIService {
  private static getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  private static cleanJsonResponse(text: string): string {
    if (!text) return "";
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return text.substring(firstBrace, lastBrace + 1);
    }
    return text.trim();
  }

  static async analyzeCompetitors(keywords: string, country: string, urls: string[]): Promise<ArticleOutline> {
    const ai = this.getClient();
    const prompt = `
      你是一位頂尖的 SEO 內容策略專家。深入分析以下競爭對手網址，並構建一份能超越他們的內容藍圖。
      [核心關鍵詞]: ${keywords}
      [目標地區]: ${country}
      [競爭對手網址]: ${urls.join('\n')}
      
      請輸出詳細的 JSON 數據：
      1. 標題建議 (suggestedTitles)
      2. H2/H3 結構 (structure): 包含層級、標題、內容描述、撰寫指南。
      3. 圖片策略 (imageStrategy): 
         - 建議總張數 (totalImages)
         - 具體安插位置與描述 (placements): 包含是在哪個章節後 (afterSection)、圖片內容描述 (description)、以及 AI 繪圖指令 (aiPrompt)。
      4. 字數建議 (targetWordCount)
      5. 必備 FAQ。
      
      語言：繁體中文。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
            structure: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  level: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  guidelines: { type: Type.STRING }
                },
                required: ["level", "title", "description", "guidelines"]
              }
            },
            imageStrategy: {
              type: Type.OBJECT,
              properties: {
                totalImages: { type: Type.INTEGER },
                placements: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      afterSection: { type: Type.STRING },
                      description: { type: Type.STRING },
                      aiPrompt: { type: Type.STRING }
                    },
                    required: ["afterSection", "description", "aiPrompt"]
                  }
                }
              },
              required: ["totalImages", "placements"]
            },
            targetWordCount: { type: Type.STRING },
            faqs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  rationale: { type: Type.STRING }
                },
                required: ["question", "answer", "rationale"]
              }
            }
          },
          required: ["suggestedTitles", "structure", "imageStrategy", "targetWordCount", "faqs"]
        }
      }
    });

    return JSON.parse(this.cleanJsonResponse(response.text));
  }

  static async analyzeDraft(outline: ArticleOutline, draft: string, keywords: string): Promise<DraftAnalysis> {
    const ai = this.getClient();
    const prompt = `
      請根據預定的 SEO 藍圖，分析使用者撰寫的草稿。
      [SEO 藍圖]: ${JSON.stringify(outline)}
      [草稿內容]: ${draft}
      [核心關鍵詞]: ${keywords}
      
      請評估草稿與藍圖的契合度，並指出不足之處。
      輸出 JSON 包含：
      1. 綜合評分 (0-100) (score)
      2. 缺失的章節或核心觀點 (missingSections)
      3. 關鍵詞分佈建議與缺失 (keywordGaps)
      4. 具體優化建議 (suggestions)
      5. 閱讀流暢度與專業度回饋 (readabilityFeedback)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            missingSections: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywordGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            readabilityFeedback: { type: Type.STRING }
          },
          required: ["score", "missingSections", "keywordGaps", "suggestions", "readabilityFeedback"]
        }
      }
    });

    return JSON.parse(this.cleanJsonResponse(response.text));
  }

  static async generateImage(prompt: string): Promise<string> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `${prompt}. Photorealistic, high quality, professional business style, 4k, soft cinematic lighting.` }]
      },
      config: {
        imageConfig: { aspectRatio: "16:9", imageSize: "1K" }
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("圖片生成失敗");
  }
}

import OpenAI from "openai";

export const analyzeResume = async (extractedText, jobDescription) => {
  try {
    const client = new OpenAI({
     baseURL: "https://router.huggingface.co/v1",
      apiKey: process.env.HUGGING_FACE_API_KEY,
      timeout: 60000, 
    });

    const prompt = `You are an ATS (Applicant Tracking System) Resume Analyzer. Compare the resume with the job description and analyze the match.

RESUME:
${extractedText}

JOB DESCRIPTION:
${jobDescription}

Analyze and return ONLY a valid JSON object with no additional text or markdown:
{
  "atsScore": <number between 0-100 representing match percentage>,
  "matchingSkills": <array of skills from the resume that match the job requirements>,
  "strength": <array of candidate's key strengths>,
  "missingSkills": <array of required skills not found in the resume>,
  "suggestions": <array of specific suggestions to improve the resume for this job>
}`;

    const response = await client.chat.completions.create({
      model: "Qwen/Qwen3-32B",
      messages: [
        {
          role: "system",
          content: "You are an expert ATS Resume Analyzer. Always return valid JSON only. No explanations, no markdown code blocks, just raw JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const content = response.choices[0].message.content;

    try {
      const cleanedContent = content.trim();
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return {
        atsScore: 0,
        matchingSkills: [],
        strength: [],
        missingSkills: [],
        suggestions: ["Unable to parse AI response"],
      };
    }
  } catch (error) {
    console.error("Resume Analysis Error:", error);
    return {
      atsScore: 0,
      matchingSkills: [],
      strength: [],
      missingSkills: [],
      suggestions: ["Analysis failed"],
    };
  }
};
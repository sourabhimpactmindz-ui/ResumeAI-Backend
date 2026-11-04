import OpenAI from "openai";

const EMPTY_RESULT = {
  atsScore: 0,
  matchingSkills: [],
  strength: [],
  missingSkills: [],
};

export const analyzeResume = async (extractedText, jobDescription) => {
  try {
    if (!jobDescription || jobDescription.trim().split(/\s+/).length < 10) {
      return { ...EMPTY_RESULT, suggestions: ["Please enter a complete job description."] };
    }

    if (!process.env.GEMINI_API_KEY ) {
      console.error("Missing env: GEMINI_API_KEY or GEMINI_MODEL");
      return { ...EMPTY_RESULT, suggestions: ["Server AI config missing"] };
    }

    const client = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: process.env.BASE_URL||"https://generativelanguage.googleapis.com/v1beta/openai/",
      timeout: 60000,
    });

    const prompt = `You are an ATS (Applicant Tracking System) Resume Analyzer. Compare the resume with the job description and analyze the match.

RESUME:
${extractedText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY a valid JSON object:
{
  "atsScore": <number 0-100>,
  "matchingSkills": <array of resume skills that match the job>,
  "strength": <array of candidate's key strengths>,
  "missingSkills": <array of required skills not found in the resume>,
  "suggestions": <array of specific suggestions to improve the resume for this job>
}`;

    const response = await client.chat.completions.create({
      model: "Antigravity",
      messages: [
        { role: "system", content: "You are an expert ATS Resume Analyzer. Return valid JSON only, no markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const raw = response.choices?.[0]?.message?.content || "";

    try {
      const match = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : raw);
      return {
        atsScore: Number(parsed.atsScore) || 0,
        matchingSkills: parsed.matchingSkills || [],
        strength: parsed.strength || [],
        missingSkills: parsed.missingSkills || [],
        suggestions: parsed.suggestions || [],
      };
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError.message, raw.slice(0, 300));
      return { ...EMPTY_RESULT, suggestions: ["Unable to parse AI response"] };
    }
  } catch (error) {
    console.error("Resume Analysis Error:", error.status, error.message);
    return { ...EMPTY_RESULT, suggestions: ["Analysis failed"] };
  }
};
import OpenAI from "openai";

export const analyzeResume = async (extractedText, jobDescription) => {
  try {
    if (
      !jobDescription ||
      jobDescription.trim().split(" ").length < 10
    ) {
      return {
        atsScore: 0,
        matchingSkills: [],
        strength: [],
        missingSkills: [],
        suggestions: [
          "Please enter a complete job description.",
        ],
      };
    }

    // Limit very large resumes
    const resumeText = extractedText?.slice(0, 8000) || "";

    const client = new OpenAI({
      baseURL: "https://router.huggingface.co/v1",
      apiKey: process.env.HUGGING_FACE_API_KEY,
      timeout: 60000,
    });

    const prompt = `
You are an ATS Resume Analyzer.

Compare the resume with the job description.

Return ONLY valid JSON.

Resume:
${resumeText}

Job Description:
${jobDescription}

Required JSON format:

{
  "atsScore": 0,
  "matchingSkills": [],
  "strength": [],
  "missingSkills": [],
  "suggestions": []
}
`;

    let response;

    // Retry up to 3 times
    for (let i = 0; i < 3; i++) {
      try {
        response = await client.chat.completions.create({
          model: "meta-llama/Llama-3.3-70B-Instruct",
          messages: [
            {
              role: "system",
              content:
                "You are an ATS Resume Analyzer. Return ONLY valid JSON. No markdown. No explanation. No code blocks.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 1000,
        });

        break;
      } catch (err) {
        console.error(`Retry ${i + 1} Failed:`, err.message);

        if (i === 2) throw err;

        await new Promise((resolve) =>
          setTimeout(resolve, 2000)
        );
      }
    }

    const content =
      response?.choices?.[0]?.message?.content || "";

    console.log("RAW AI RESPONSE:");
    console.log(content);

    try {
      const cleanedContent = content
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const jsonMatch =
        cleanedContent.match(/\{[\s\S]*\}/);

      const jsonString = jsonMatch
        ? jsonMatch[0]
        : cleanedContent;

      const parsed = JSON.parse(jsonString);

      return {
        atsScore: parsed.atsScore || 0,
        matchingSkills: parsed.matchingSkills || [],
        strength: parsed.strength || [],
        missingSkills: parsed.missingSkills || [],
        suggestions: parsed.suggestions || [],
      };
    } catch (parseError) {
      console.error(
        "JSON Parse Error:",
        parseError
      );

      console.log(
        "FAILED RESPONSE:",
        content
      );

      return {
        atsScore: 0,
        matchingSkills: [],
        strength: [],
        missingSkills: [],
        suggestions: [
          "AI returned invalid JSON",
        ],
      };
    }
  } catch (error) {
    console.error(
      "Resume Analysis Error:",
      error
    );

    return {
      atsScore: 0,
      matchingSkills: [],
      strength: [],
      missingSkills: [],
      suggestions: [
        error?.message ||
          "Analysis failed",
      ],
    };
  }
};
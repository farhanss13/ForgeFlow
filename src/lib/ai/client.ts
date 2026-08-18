interface GeneratedTask {
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
}

interface GeneratedMilestone {
  title: string;
  description: string | null;
  tasks: GeneratedTask[];
}

export interface GeneratedPlan {
  milestones: GeneratedMilestone[];
}

/**
 * Sends the user requirements to Google Gemini API requesting a structured JSON project plan.
 */
export async function generateProjectPlan(requirements: string): Promise<GeneratedPlan> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the server environment variables.");
  }

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const schema = {
    type: "OBJECT",
    properties: {
      milestones: {
        type: "ARRAY",
        description: "Roadmap milestones for the project",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "Short title of the milestone" },
            description: { type: "STRING", description: "Detailed description of the milestone goals" },
            tasks: {
              type: "ARRAY",
              description: "Tasks required to complete this milestone",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING", description: "Actionable title of the task" },
                  description: { type: "STRING", description: "Details of what is required to complete the task" },
                  priority: { 
                    type: "STRING", 
                    description: "Importance of the task",
                    enum: ["LOW", "MEDIUM", "HIGH"]
                  }
                },
                required: ["title", "priority"]
              }
            }
          },
          required: ["title", "tasks"]
        }
      }
    },
    required: ["milestones"]
  };

  const promptText = `Generate a structured software development project plan containing target milestones and actionable tasks for the following requirements:
"${requirements}"

Focus on technical requirements, setup tasks, design workflows, and concrete code requirements.`;

  const payload = {
    contents: [
      {
        parts: [
          { text: promptText }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", errorText);
    throw new Error("AI provider failed to generate the plan. Please check your prompt and API status.");
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Invalid response received from AI model.");
  }

  // Parse and validate structured output
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsedPlan: any;
  try {
    parsedPlan = JSON.parse(rawText);
  } catch {
    console.error("Failed to parse JSON text from model response:", rawText);
    throw new Error("AI model returned malformed JSON content.");
  }

  return validateAndCleanPlan(parsedPlan);
}

/**
 * Validates and normalizes the parsed plan object to ensure strict type compatibility and prevent injection of invalid fields.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateAndCleanPlan(plan: any): GeneratedPlan {
  if (!plan || typeof plan !== "object" || !Array.isArray(plan.milestones)) {
    throw new Error("AI output is missing the milestones list container.");
  }

  const cleanedMilestones: GeneratedMilestone[] = [];

  for (const m of plan.milestones) {
    if (!m || typeof m !== "object" || typeof m.title !== "string" || m.title.trim().length === 0) {
      continue; // Skip invalid milestone
    }

    const cleanedTasks: GeneratedTask[] = [];

    if (Array.isArray(m.tasks)) {
      for (const t of m.tasks) {
        if (!t || typeof t !== "object" || typeof t.title !== "string" || t.title.trim().length === 0) {
          continue; // Skip invalid task
        }

        // Validate priority enum
        let priority: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";
        if (["LOW", "MEDIUM", "HIGH"].includes(t.priority)) {
          priority = t.priority;
        }

        cleanedTasks.push({
          title: t.title.trim(),
          description: typeof t.description === "string" ? t.description.trim() : null,
          priority
        });
      }
    }

    cleanedMilestones.push({
      title: m.title.trim(),
      description: typeof m.description === "string" ? m.description.trim() : null,
      tasks: cleanedTasks
    });
  }

  if (cleanedMilestones.length === 0) {
    throw new Error("No valid milestones could be generated from the given description.");
  }

  return { milestones: cleanedMilestones };
}

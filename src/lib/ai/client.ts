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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

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

  console.log("URL called:", url);
  console.log("Payload sent:", JSON.stringify(payload, null, 2));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  console.log("Response status:", response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error body:", errorText);
    throw new Error(`AI provider failed to generate the plan (Status ${response.status}). Error: ${errorText}`);
  }

  const data = await response.json();
  console.log("Gemini API success response payload:", JSON.stringify(data, null, 2));
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Invalid response received from AI model. Candidates or text block is missing.");
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

export interface TaskSuggestion {
  improvedDescription: string;
  acceptanceCriteria: string[];
  subtasks: { title: string; description: string | null }[];
  technicalConsiderations: string[];
  edgeCases: string[];
}

/**
 * Sends task details and surrounding project/milestone context to Gemini API to request enhancement suggestions.
 */
export async function getTaskSuggestions(taskContext: {
  taskTitle: string;
  taskDescription?: string | null;
  projectName: string;
  projectDescription?: string | null;
  milestoneTitle?: string | null;
}): Promise<TaskSuggestion> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the server environment variables.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const schema = {
    type: "OBJECT",
    properties: {
      improvedDescription: { type: "STRING", description: "Claer and actionable refined task description" },
      acceptanceCriteria: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "Functional acceptance criteria checkboxes"
      },
      subtasks: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "Actionable title of the subtask" },
            description: { type: "STRING", description: "Short description of the subtask requirements" }
          },
          required: ["title"]
        },
        description: "Smaller tasks required to break this task down"
      },
      technicalConsiderations: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "Key technical considerations or guidelines"
      },
      edgeCases: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "Potential boundary conditions, errors, or security risks to handle"
      }
    },
    required: ["improvedDescription", "acceptanceCriteria", "subtasks", "technicalConsiderations", "edgeCases"]
  };

  const promptText = `As a Senior Software Architect, analyze the following task context and provide suggestions to refine and improve it.

Task Title: "${taskContext.taskTitle}"
Existing Description: "${taskContext.taskDescription || "None provided"}"
Milestone Context: "${taskContext.milestoneTitle || "None provided"}"
Project Context: "${taskContext.projectName} - ${taskContext.projectDescription || "No project description"}"

Focus on concrete, technical details. Do not invent requirements outside of the project scope.`;

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

  console.log("Task Assistant URL called:", url);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API Task Assistant error:", errorText);
    throw new Error(`AI model suggestions failed with status ${response.status}.`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("No suggestion text returned from AI model.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("AI returned malformed suggestion JSON output.");
  }

  return validateAndCleanTaskSuggestions(parsed);
}

/**
 * Validates and normalizes Gemini response into safe, typed TaskSuggestion parameters.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateAndCleanTaskSuggestions(data: any): TaskSuggestion {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid structure returned for task suggestions.");
  }

  const improvedDescription = typeof data.improvedDescription === "string" ? data.improvedDescription.trim() : "";
  
  const acceptanceCriteria: string[] = [];
  if (Array.isArray(data.acceptanceCriteria)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.acceptanceCriteria.forEach((item: any) => {
      if (typeof item === "string" && item.trim().length > 0) {
        acceptanceCriteria.push(item.trim());
      }
    });
  }

  const subtasks: { title: string; description: string | null }[] = [];
  if (Array.isArray(data.subtasks)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.subtasks.forEach((item: any) => {
      if (item && typeof item === "object" && typeof item.title === "string" && item.title.trim().length > 0) {
        subtasks.push({
          title: item.title.trim(),
          description: typeof item.description === "string" ? item.description.trim() : null
        });
      }
    });
  }

  const technicalConsiderations: string[] = [];
  if (Array.isArray(data.technicalConsiderations)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.technicalConsiderations.forEach((item: any) => {
      if (typeof item === "string" && item.trim().length > 0) {
        technicalConsiderations.push(item.trim());
      }
    });
  }

  const edgeCases: string[] = [];
  if (Array.isArray(data.edgeCases)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.edgeCases.forEach((item: any) => {
      if (typeof item === "string" && item.trim().length > 0) {
        edgeCases.push(item.trim());
      }
    });
  }

  return {
    improvedDescription,
    acceptanceCriteria,
    subtasks,
    technicalConsiderations,
    edgeCases
  };
}


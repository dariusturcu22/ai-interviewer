CREATE_INTERVIEW_PLAN_TOOL = {
    "name": "create_interview_plan",
    "description": (
        "Decide whether the requested interview topic is appropriate for a qualitative "
        "research interview, and if so, draft an interview plan for it."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "is_appropriate": {
                "type": "boolean",
                "description": (
                    "False if the topic is clearly inappropriate, harmful, or not something "
                    "a researcher could reasonably run an interview about."
                ),
            },
            "decline_reason": {
                "type": "string",
                "description": (
                    "A short, polite explanation shown to the user if is_appropriate is false. "
                    "Empty string if is_appropriate is true."
                ),
            },
            "strategy": {
                "type": "string",
                "description": (
                    "One or two sentences on the overall angle for this interview. "
                    "Empty string if is_appropriate is false."
                ),
            },
            "focus_areas": {
                "type": "array",
                "items": {"type": "string"},
                "description": (
                    "3 to 4 distinct focus areas this interview should explore. "
                    "Empty array if is_appropriate is false."
                ),
            },
        },
        "required": ["is_appropriate", "decline_reason", "strategy", "focus_areas"],
    },
}

ASK_QUESTION_TOOL = {
    "name": "ask_question",
    "description": "Ask the next adaptive question in an ongoing qualitative research interview.",
    "input_schema": {
        "type": "object",
        "properties": {
            "question": {
                "type": "string",
                "description": "The next question to ask.",
            },
            "focus_area": {
                "type": "string",
                "description": (
                    "Which plan focus area this question targets, or 'redirect' if this "
                    "question is steering the conversation back to the interview topic."
                ),
            },
            "is_redirect": {
                "type": "boolean",
                "description": (
                    "True only if this question is redirecting the conversation back to the "
                    "topic after an off-topic or manipulative response."
                ),
            },
        },
        "required": ["question", "focus_area", "is_redirect"],
    },
}

END_INTERVIEW_TOOL = {
    "name": "end_interview",
    "description": "End the interview now instead of asking another question.",
    "input_schema": {
        "type": "object",
        "properties": {
            "closing_message": {
                "type": "string",
                "description": "A short, warm, neutral closing message shown to the user.",
            },
        },
        "required": ["closing_message"],
    },
}

ANALYZE_INTERVIEW_TOOL = {
    "name": "analyze_interview",
    "description": (
        "Synthesize a completed qualitative research interview into a narrative summary, "
        "sentiment assessment, and key points. Identify themes across the whole conversation, "
        "do not just restate each answer."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
                "description": "A narrative summary of the interview, a few sentences long.",
            },
            "sentiment": {
                "type": "string",
                "enum": ["positive", "neutral", "negative", "mixed"],
            },
            "sentiment_note": {
                "type": "string",
                "description": "One sentence explaining the sentiment assessment.",
            },
            "key_points": {
                "type": "array",
                "items": {"type": "string"},
                "description": "3 to 4 distinct key points or themes from the interview.",
            },
        },
        "required": ["summary", "sentiment", "sentiment_note", "key_points"],
    },
}

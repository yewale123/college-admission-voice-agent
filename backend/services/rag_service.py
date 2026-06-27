import re
from langchain_groq import ChatGroq
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import (
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    ChatPromptTemplate,
)
from langchain.schema import HumanMessage, AIMessage
from services.vector_store import get_retriever
from config import settings
from typing import List, Dict


def detect_language(text: str) -> str:
    """Detect Hindi vs English by counting Devanagari characters."""
    devanagari = len(re.findall(r'[ऀ-ॿ]', text))
    return "hi" if devanagari > 2 else "en"


def get_llm():
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not set. Get free key at https://console.groq.com")
    return ChatGroq(
        model="llama-3.1-8b-instant",   # fastest model = minimum pause
        groq_api_key=settings.GROQ_API_KEY,
        temperature=0.55,
        max_tokens=250,                 # short = faster response + conversational
    )


def format_chat_history(messages: List[Dict]) -> List:
    history = []
    for msg in messages:
        if msg["role"] == "user":
            history.append(HumanMessage(content=msg["content"]))
        else:
            history.append(AIMessage(content=msg["content"]))
    return history


SYSTEM_TEMPLATE = """You are a knowledgeable and friendly College Admission Counselor at an Indian college.
You are professional but warm — like a helpful counselor who genuinely cares.

Your tone:
- Speak naturally, not like a textbook or FAQ page
- Use simple, clear language — avoid overly formal or robotic phrases
- Be empathetic: acknowledge the student's concern before answering
- Keep responses short and to the point — 2 to 4 sentences max per point
- End with a helpful nudge: "Let me know if you have more questions" or "Koi aur sawal ho toh zaroor poochhen"
- Do NOT use bullet points — speak in flowing sentences as if talking to a person

LANGUAGE RULE (MOST IMPORTANT):
{lang_instruction}

How to answer:
1. Briefly acknowledge the question (1 short line)
2. Give the answer from the context clearly and simply
3. If information is not in the context, say so honestly and give general guidance
4. Close warmly — invite further questions

Knowledge base context:
{context}"""


def ask_question(question: str, chat_history: List[Dict], language: str = "en") -> str:
    llm = get_llm()
    retriever = get_retriever(k=4)

    # Auto-detect language from the actual question text (overrides frontend hint)
    detected = detect_language(question)

    if detected == "hi":
        lang_instruction = (
            "The student asked in HINDI. You MUST reply in Hindi only. "
            "Use clear, simple Hindi. Do not switch to English mid-answer."
        )
    else:
        lang_instruction = (
            "The student asked in ENGLISH. You MUST reply in English only. "
            "Do not use Hindi words. Keep it professional and friendly."
        )

    system_filled = SYSTEM_TEMPLATE.replace("{lang_instruction}", lang_instruction)

    prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(system_filled),
        HumanMessagePromptTemplate.from_template(
            "Conversation history:\n{chat_history}\n\nStudent: {question}"
        ),
    ])

    formatted_history = format_chat_history(chat_history[-6:])

    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        combine_docs_chain_kwargs={"prompt": prompt},
        return_source_documents=False,
        verbose=False,
    )

    result = chain.invoke({
        "question": question,
        "chat_history": formatted_history,
    })

    answer = result.get("answer", "")
    if not answer:
        return "Yaar kuch technical issue aa gaya, ek baar phir poochho!"
    return answer

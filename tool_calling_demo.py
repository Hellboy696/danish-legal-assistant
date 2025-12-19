#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔧 TOOL CALLING DEMO
Показує як AI автоматично викликає search_danish_law()

Просте пояснення:
- AI бачить твоє питання
- AI розуміє що треба шукати в законах
- AI САМ викликає search_danish_law()
- AI пояснює тобі результат
"""

import sys
import json
from pathlib import Path
from typing import Dict, Any

# Fix encoding для Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Імпортуємо наш Danish Legal Assistant
from danish_legal_assistant import DanishLegalAssistant


# ============================================
# ЧАСТИНА 1: Визначаємо TOOLS для AI
# ============================================

# Це як "інструкція" для AI: які функції він може викликати
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_danish_law",
            "description": "Search Danish legal database for laws and regulations. Use this when user asks about Danish laws, work permits, taxes, labor rights, immigration, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query (e.g., 'work permit requirements', 'tax rate', 'vacation days')"
                    },
                    "category": {
                        "type": "string",
                        "enum": ["immigration", "tax", "labor"],
                        "description": "Category of law to search in. Use 'immigration' for work permits/visas, 'tax' for taxes, 'labor' for employment rights. Optional."
                    },
                    "top_k": {
                        "type": "integer",
                        "description": "Number of results to return (default: 3)",
                        "default": 3
                    }
                },
                "required": ["query"]
            }
        }
    }
]


# ============================================
# ЧАСТИНА 2: Симуляція AI Tool Calling
# ============================================

def simulate_ai_tool_calling(user_question: str, assistant: DanishLegalAssistant):
    """
    Симулює як AI викликає search_danish_law()

    Просто:
    - У реальності тут був би GPT-4 або Qwen
    - Але для demo ми "прикидаємось" AI
    - Показуємо що відбувається всередині
    """

    print("\n" + "="*70)
    print("🤖 AI TOOL CALLING SIMULATION")
    print("="*70)

    print(f"\n👤 КОРИСТУВАЧ: {user_question}\n")

    # Крок 1: AI "думає" яку функцію викликати
    print("🤔 AI ДУМАЄ:")
    print("   'Питання про датські закони...'")
    print("   'Треба викликати search_danish_law()'")
    print("   'Визначаю параметри...'\n")

    # Крок 2: AI визначає параметри
    # (У реальності це робить GPT-4/Qwen, але ми симулюємо)
    if "work" in user_question.lower() or "permit" in user_question.lower():
        category = "immigration"
        query = "work permit requirements"
    elif "tax" in user_question.lower():
        category = "tax"
        query = "tax rate"
    elif "vacation" in user_question.lower() or "holiday" in user_question.lower():
        category = "labor"
        query = "vacation days"
    else:
        category = None
        query = user_question

    print("📞 AI ВИКЛИКАЄ ФУНКЦІЮ:")
    print(f"   search_danish_law(")
    print(f"       query='{query}',")
    print(f"       category='{category}',")
    print(f"       top_k=2")
    print(f"   )\n")

    # Крок 3: Викликаємо реальну функцію
    result = assistant.search_danish_law(
        query=query,
        category=category,
        top_k=2
    )

    # Крок 4: AI генерує відповідь на основі результатів
    print("💭 AI ГЕНЕРУЄ ВІДПОВІДЬ:\n")

    answer = generate_ai_answer(user_question, result)
    print(answer)

    return result


def generate_ai_answer(question: str, search_result: Dict) -> str:
    """
    Генерує відповідь на основі результатів пошуку

    Просто:
    - Бере результати з search_danish_law()
    - Формує зрозумілу відповідь людині
    - У реальності це робив би GPT-4/Qwen
    """

    # Беремо перший (найкращий) результат
    if not search_result['results']:
        return "⚠️ На жаль, не знайшов інформації в базі даних."

    best_result = search_result['results'][0]

    # Формуємо відповідь
    answer = f"""
╔════════════════════════════════════════════════════════════════════╗
║  🤖 AI ASSISTANT ВІДПОВІДЬ                                         ║
╚════════════════════════════════════════════════════════════════════╝

❓ Ваше питання: {question}

💡 ВІДПОВІДЬ:

На основі Danish законодавства:

{best_result['content'][:400]}...

📖 ДЖЕРЕЛО:
• {best_result['law_reference']}: {best_result['title']}

🔍 ЗНАЙДЕНО ЗА: {search_result['search_time_ms']:.2f}ms

✅ Інформація актуальна станом на 2025 рік.
"""

    return answer


# ============================================
# ЧАСТИНА 3: Демонстрація з реальним AI (GPT-4)
# ============================================

def real_ai_tool_calling_demo(user_question: str, assistant: DanishLegalAssistant):
    """
    Демонстрація з РЕАЛЬНИМ AI (GPT-4)

    УВАГА: Потребує OPENAI_API_KEY!

    Якщо у тебе є API key - розкоментуй код нижче
    """

    print("\n" + "="*70)
    print("🚀 REAL AI TOOL CALLING (GPT-4)")
    print("="*70)

    print("\n⚠️ Для цього треба:")
    print("   1. pip install openai")
    print("   2. export OPENAI_API_KEY='твій-ключ'")
    print("   3. Розкоментуй код в функції real_ai_tool_calling_demo()\n")

    # РОЗКОМЕНТУЙ ЦЕ ЯКЩО МАЄ API KEY:
    """
    import os
    from openai import OpenAI

    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    # GPT-4 бачить tools
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a Danish legal assistant."},
            {"role": "user", "content": user_question}
        ],
        tools=TOOLS,
        tool_choice="auto"  # GPT-4 САМ вирішує викликати чи ні
    )

    message = response.choices[0].message

    # Якщо GPT-4 викликав функцію
    if message.tool_calls:
        for tool_call in message.tool_calls:
            function_name = tool_call.function.name
            arguments = json.loads(tool_call.function.arguments)

            print(f"🤖 GPT-4 викликав: {function_name}({arguments})")

            # Викликаємо реальну функцію
            if function_name == "search_danish_law":
                result = assistant.search_danish_law(**arguments)
                print(assistant.format_search_results(result))

    else:
        print("GPT-4 відповів текстом (без функції):")
        print(message.content)
    """

    pass


# ============================================
# MAIN: Запускаємо демо
# ============================================

def main():
    """Головна функція для тестування"""

    print("="*70)
    print("🔧 TOOL CALLING DEMO - Danish Legal Assistant")
    print("="*70)

    # Ініціалізуємо асистента
    assistant = DanishLegalAssistant()
    laws_path = Path(__file__).parent / "data" / "danish_laws.json"
    assistant.initialize(str(laws_path))

    # Тестові питання
    test_questions = [
        "Can Ukrainian citizens work in Denmark?",
        "What is the income tax rate in Denmark?",
        "How many vacation days do I get per year?"
    ]

    # Демонструємо tool calling для кожного питання
    for question in test_questions:
        simulate_ai_tool_calling(question, assistant)
        print("\n" + "="*70 + "\n")

    # Показуємо як було б з реальним AI
    print("\n📚 НАСТУПНИЙ КРОК: Інтеграція з GPT-4")
    real_ai_tool_calling_demo(test_questions[0], assistant)

    print("\n" + "="*70)
    print("✅ TOOL CALLING DEMO ЗАВЕРШЕНО!")
    print("="*70)
    print("\n💡 ЩО ТИ НАВЧИВСЯ:")
    print("   1. Як AI розуміє коли викликати функцію")
    print("   2. Як AI визначає параметри функції")
    print("   3. Як AI генерує відповідь на основі результатів")
    print("   4. Як інтегрувати з GPT-4 (коли є API key)\n")


if __name__ == "__main__":
    main()

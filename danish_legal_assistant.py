#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🏛️ DANISH LEGAL ASSISTANT MVP
Backend з LanceDB + Tool Calling

Просте пояснення:
- Це як розумний юрист-помічник
- Він знає всі датські закони
- Можеш запитати щоб він швидко знайшов потрібну інформацію
"""

import json
import sys
import time
from pathlib import Path
from typing import List, Dict, Any, Optional

# Fix encoding для Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Бібліотеки
try:
    from sentence_transformers import SentenceTransformer
    EMBEDDINGS_AVAILABLE = True
except ImportError:
    print("⚠️ Встанови: pip install sentence-transformers")
    EMBEDDINGS_AVAILABLE = False

try:
    import lancedb
    LANCEDB_AVAILABLE = True
except ImportError:
    print("⚠️ Встанови: pip install lancedb")
    LANCEDB_AVAILABLE = False


# ============================================
# ЧАСТИНА 1: SEARCH_DANISH_LAW() - Головна функція пошуку
# ============================================

class DanishLegalAssistant:
    """
    Головний клас Danish Legal Assistant

    Простими словами:
    - Це наш "розумний юрист"
    - Він вміє шукати закони (search)
    - Він вміє пояснювати (generate answer)
    """

    def __init__(self, db_path: str = "./database/danish_legal_db"):
        """
        Ініціалізація системи

        Просто:
        - Створюємо нашого "юриста"
        - Завантажуємо модель для пошуку (як мозок юриста)
        - Підключаємо базу даних (бібліотеку законів)
        """
        print("🏛️ Запускаю Danish Legal Assistant...")

        self.db_path = db_path

        # Завантажуємо модель для embeddings
        # Просто: це як "мозок" що розуміє значення слів
        print("📥 Завантажую AI модель...")
        self.embedder = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        print("✅ Модель готова!")

        # База даних (буде створена пізніше)
        self.db = None
        self.table = None

    def load_laws_from_json(self, json_path: str) -> List[Dict[str, Any]]:
        """
        Завантажує закони з JSON файлу

        Просто:
        - Читаємо файл з законами (наші 10 PDF "книжок")
        - Повертаємо список законів
        """
        print(f"📚 Читаю закони з {json_path}...")

        with open(json_path, 'r', encoding='utf-8') as f:
            laws = json.load(f)

        print(f"✅ Завантажено {len(laws)} законів")
        return laws

    def create_embeddings(self, laws: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Створює embeddings для законів

        Просто:
        - Перетворюємо текст законів в числа (вектори)
        - Комп'ютер краще розуміє числа ніж текст
        - Це як "номери на полицях" в бібліотеці
        """
        print("🔢 Створюю embeddings (це займе ~30 секунд)...")

        # Комбінуємо title + content для кращого пошуку
        # Просто: з'єднуємо назву і текст закону в одне речення
        texts = [f"{law['title']} {law['content']}" for law in laws]

        # Генеруємо embeddings
        # Просто: AI перетворює текст в числа
        embeddings = self.embedder.encode(texts, show_progress_bar=True)

        # Додаємо embeddings до кожного закону
        data = []
        for law, embedding in zip(laws, embeddings):
            data.append({
                'id': law['id'],
                'category': law['category'],
                'title': law['title'],
                'law_reference': law['law_reference'],
                'content': law['content'],
                'keywords': ', '.join(law['keywords']),  # З'єднуємо keywords в текст
                'vector': embedding.tolist()  # Вектор (числа для пошуку)
            })

        print(f"✅ Embeddings готові!")
        return data

    def index_in_lancedb(self, data: List[Dict[str, Any]]):
        """
        Індексує закони в LanceDB

        Просто:
        - Кладемо всі закони в "бібліотеку" (LanceDB)
        - Тепер можна швидко шукати потрібний закон
        """
        print("💾 Зберігаю в LanceDB...")

        # Створюємо/підключаємось до бази даних
        self.db = lancedb.connect(self.db_path)

        # Видаляємо стару таблицю якщо є
        try:
            self.db.drop_table("danish_laws")
            print("  ↳ Видалив стару базу даних")
        except:
            pass

        # Створюємо нову таблицю
        self.table = self.db.create_table("danish_laws", data=data)

        print(f"✅ Збережено {len(data)} законів в базі!")

    def search_danish_law(
        self,
        query: str,
        category: Optional[str] = None,
        top_k: int = 3
    ) -> Dict[str, Any]:
        """
        🔍 ГОЛОВНА ФУНКЦІЯ ПОШУКУ

        Це найважливіша функція! Вона шукає закони.

        Просто:
        - Ти даєш їй питання (query)
        - Вона шукає в базі даних
        - Повертає найкращі відповіді

        Параметри:
        - query: питання (наприклад "Can I work in Denmark?")
        - category: категорія (immigration, tax, labor) - OPTIONAL
        - top_k: скільки результатів повернути (за замовчуванням 3)

        Повертає:
        {
            'query': твоє питання,
            'results': знайдені закони,
            'search_time_ms': час пошуку,
            'category': категорія
        }
        """
        if not self.table:
            raise ValueError("База даних не готова! Спочатку запусти initialize()")

        print(f"\n🔍 Шукаю: '{query}'")
        if category:
            print(f"  📁 Категорія: {category}")

        start_time = time.time()

        # Крок 1: Перетворюємо питання в вектор (числа)
        # Просто: AI розуміє що ти питаєш
        query_embedding = self.embedder.encode(query)

        # Крок 2: Шукаємо схожі закони в LanceDB
        # Просто: знаходимо закони, які "схожі" на твоє питання
        results = self.table.search(query_embedding.tolist()).limit(top_k).to_list()

        # Крок 3 (опціонально): Фільтруємо по категорії
        # Просто: якщо ти сказав "тільки immigration", показуємо тільки їх
        if category:
            results = [r for r in results if r['category'] == category]

        search_time = (time.time() - start_time) * 1000  # в мілісекундах

        print(f"✅ Знайдено {len(results)} результатів за {search_time:.2f}ms")

        return {
            'query': query,
            'category': category,
            'results': results,
            'search_time_ms': search_time,
            'top_k': top_k
        }

    def format_search_results(self, search_result: Dict[str, Any]) -> str:
        """
        Форматує результати пошуку для читання

        Просто:
        - Бере результати пошуку
        - Робить їх гарними для читання
        """
        output = "\n" + "="*70 + "\n"
        output += "🏛️ DANISH LEGAL ASSISTANT - РЕЗУЛЬТАТИ ПОШУКУ\n"
        output += "="*70 + "\n\n"

        output += f"❓ ПИТАННЯ: {search_result['query']}\n"
        if search_result['category']:
            output += f"📁 КАТЕГОРІЯ: {search_result['category']}\n"
        output += f"⏱️  ЧАС ПОШУКУ: {search_result['search_time_ms']:.2f}ms\n"
        output += f"📊 ЗНАЙДЕНО: {len(search_result['results'])} результатів\n\n"

        output += "📚 РЕЗУЛЬТАТИ:\n"
        output += "-" * 70 + "\n\n"

        for i, result in enumerate(search_result['results'], 1):
            output += f"📄 РЕЗУЛЬТАТ #{i}\n"
            output += f"   Назва: {result['title']}\n"
            output += f"   Закон: {result['law_reference']}\n"
            output += f"   Категорія: {result['category']}\n"
            output += f"   \n"
            output += f"   📖 Текст:\n"
            output += f"   {result['content'][:300]}...\n\n"
            output += f"   🔑 Ключові слова: {result['keywords']}\n"
            output += "-" * 70 + "\n\n"

        return output

    def initialize(self, laws_json_path: str):
        """
        Ініціалізує всю систему

        Просто:
        - Завантажує закони
        - Створює embeddings
        - Зберігає в LanceDB
        - Готово до роботи!
        """
        print("\n" + "="*70)
        print("🚀 ІНІЦІАЛІЗАЦІЯ DANISH LEGAL ASSISTANT")
        print("="*70 + "\n")

        # Крок 1: Завантажити закони
        laws = self.load_laws_from_json(laws_json_path)

        # Крок 2: Створити embeddings
        data = self.create_embeddings(laws)

        # Крок 3: Зберегти в LanceDB
        self.index_in_lancedb(data)

        print("\n" + "="*70)
        print("✅ СИСТЕМА ГОТОВА ДО РОБОТИ!")
        print("="*70 + "\n")


# ============================================
# ЧАСТИНА 2: TOOL CALLING (буде в наступному кроці)
# ============================================

# TODO: Додамо функцію для tool calling з AI


# ============================================
# ТЕСТУВАННЯ
# ============================================

def test_search():
    """Тестує search_danish_law()"""

    # Створюємо асистента
    assistant = DanishLegalAssistant()

    # Ініціалізуємо (завантажуємо закони)
    laws_path = Path(__file__).parent / "data" / "danish_laws.json"
    assistant.initialize(str(laws_path))

    # Тестові питання
    print("\n" + "="*70)
    print("🎯 ТЕСТУВАННЯ SEARCH_DANISH_LAW()")
    print("="*70)

    # Тест 1: Загальне питання
    print("\n📝 ТЕСТ 1: Загальне питання")
    result1 = assistant.search_danish_law(
        query="Can I work in Denmark with Ukrainian passport?",
        top_k=2
    )
    print(assistant.format_search_results(result1))

    # Тест 2: Питання з категорією
    print("\n📝 ТЕСТ 2: Питання з категорією")
    result2 = assistant.search_danish_law(
        query="What is the tax rate?",
        category="tax",
        top_k=2
    )
    print(assistant.format_search_results(result2))

    # Тест 3: Питання про відпустку
    print("\n📝 ТЕСТ 3: Питання про vacation")
    result3 = assistant.search_danish_law(
        query="How many vacation days do I get?",
        category="labor",
        top_k=1
    )
    print(assistant.format_search_results(result3))

    print("\n" + "="*70)
    print("✅ ВСІ ТЕСТИ ПРОЙШЛИ!")
    print("="*70)


if __name__ == "__main__":
    """
    Просто:
    - Коли запускаєш цей файл
    - Він тестує search_danish_law()
    """

    if not EMBEDDINGS_AVAILABLE or not LANCEDB_AVAILABLE:
        print("\n❌ Встанови бібліотеки:")
        print("   pip install sentence-transformers lancedb")
    else:
        test_search()

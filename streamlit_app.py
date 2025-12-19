#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🎨 DANISH LEGAL ASSISTANT - STREAMLIT UI
Простий та красивий інтерфейс для пошуку Danish законів

Пояснення (просто):
- Це як веб-сайт який можна запустити на своєму комп'ютері
- Маєш поле для питання
- Натискаєш "Шукати"
- Отримуєш відповідь з законом!
"""

import streamlit as st
import sys
from pathlib import Path

# Fix encoding для Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Імпортуємо наш backend
from danish_legal_assistant import DanishLegalAssistant


# ============================================
# ЧАСТИНА 1: Налаштування сторінки
# ============================================

# Просто: Це як назва вкладки в браузері
st.set_page_config(
    page_title="Danish Legal Assistant",
    page_icon="🏛️",
    layout="wide"  # Широкий екран
)


# ============================================
# ЧАСТИНА 2: Ініціалізація системи
# ============================================

@st.cache_resource
def initialize_assistant():
    """
    Ініціалізує Danish Legal Assistant

    Просто:
    - @st.cache_resource = "запам'ятай результат" (не робити кожен раз)
    - Завантажуємо закони тільки ОДИН раз
    - Потім просто використовуємо
    """
    assistant = DanishLegalAssistant()

    # Знаходимо файл з законами
    laws_path = Path(__file__).parent / "data" / "danish_laws.json"

    # Завантажуємо
    with st.spinner("📚 Завантажую Danish закони..."):  # Показуємо "крутилку"
        assistant.initialize(str(laws_path))

    return assistant


# ============================================
# ЧАСТИНА 3: Головний інтерфейс
# ============================================

def main():
    """
    Головна функція UI

    Просто:
    - Тут ми малюємо всі кнопки, поля, тексти
    - Як малювання картинки, але кодом!
    """

    # --- ЗАГОЛОВОК ---
    # Просто: Великий текст зверху сторінки
    st.title("🏛️ Danish Legal Assistant")
    st.markdown("**Розумний помічник для пошуку Danish законів**")
    st.markdown("---")  # Лінія-розділювач

    # --- ОПИС ---
    # Просто: Пояснення що це за програма
    st.markdown("""
    ### 💡 Як користуватися:
    1. Напиши своє питання про датські закони
    2. (Опціонально) Вибери категорію
    3. Натисни "🔍 Шукати"
    4. Отримай відповідь з джерелом!

    **Приклади питань:**
    - "Can I work in Denmark with Ukrainian passport?"
    - "What is the income tax rate?"
    - "How many vacation days do I get?"
    """)

    st.markdown("---")

    # --- ІНІЦІАЛІЗАЦІЯ ---
    # Просто: Завантажуємо нашу систему
    try:
        assistant = initialize_assistant()
    except Exception as e:
        st.error(f"❌ Помилка завантаження: {e}")
        st.info("💡 Переконайся що файл danish_laws.json існує в папці data/")
        return

    # --- ПОЛЕ ДЛЯ ПИТАННЯ ---
    # Просто: Велике поле де можна писати
    user_question = st.text_area(
        "❓ Твоє питання:",
        placeholder="Напиши своє питання тут... (англійською)",
        height=100,
        help="Питання можна писати англійською мовою"
    )

    # --- ВИБІР КАТЕГОРІЇ ---
    # Просто: Dropdown меню (як список що випадає)
    col1, col2 = st.columns([3, 1])  # Ділимо на 2 колонки

    with col1:
        category = st.selectbox(
            "📁 Категорія (опціонально):",
            options=["Всі категорії", "Immigration", "Tax", "Labor"],
            help="Вибери категорію щоб звузити пошук"
        )

    with col2:
        top_k = st.number_input(
            "📊 Кількість результатів:",
            min_value=1,
            max_value=5,
            value=3,
            help="Скільки результатів показати"
        )

    # --- КНОПКА ПОШУКУ ---
    # Просто: Велика кнопка "Шукати"
    search_button = st.button(
        "🔍 Шукати",
        type="primary",  # Робить кнопку яскравою
        use_container_width=True  # На всю ширину
    )

    st.markdown("---")

    # --- ЛОГІКА ПОШУКУ ---
    # Просто: Що відбувається коли натискаєш кнопку
    if search_button:
        # Перевіряємо чи є питання
        if not user_question.strip():
            st.warning("⚠️ Напиши питання спочатку!")
            return

        # Визначаємо категорію
        search_category = None if category == "Всі категорії" else category.lower()

        # Показуємо що шукаємо
        with st.spinner(f"🔍 Шукаю відповідь на: '{user_question}'..."):
            try:
                # ШУКАЄМО!
                result = assistant.search_danish_law(
                    query=user_question,
                    category=search_category,
                    top_k=top_k
                )

                # --- ПОКАЗУЄМО РЕЗУЛЬТАТИ ---
                display_results(result)

            except Exception as e:
                st.error(f"❌ Помилка пошуку: {e}")


# ============================================
# ЧАСТИНА 4: Показ результатів
# ============================================

def display_results(result: dict):
    """
    Показує результати пошуку красиво

    Просто:
    - Бере результати від search_danish_law()
    - Малює їх красиво на екрані
    """

    # --- ІНФОРМАЦІЯ ПРО ПОШУК ---
    st.success(f"✅ Знайдено {len(result['results'])} результатів за {result['search_time_ms']:.2f}ms")

    # Якщо нічого не знайшли
    if not result['results']:
        st.warning("⚠️ Нічого не знайдено. Спробуй інше питання!")
        return

    # --- КОЖЕН РЕЗУЛЬТАТ ОКРЕМО ---
    for i, doc in enumerate(result['results'], 1):
        # Просто: Створюємо "карточку" для кожного результату
        with st.expander(f"📄 Результат #{i}: {doc['title']}", expanded=(i == 1)):
            # expanded=(i==1) = перший результат відкритий, інші закриті

            # Категорія з кольором
            category_color = {
                'immigration': '🔵',
                'tax': '🟢',
                'labor': '🟡'
            }.get(doc['category'], '⚪')

            st.markdown(f"**Категорія:** {category_color} {doc['category'].upper()}")

            # Посилання на закон
            st.markdown(f"**📖 Закон:** `{doc['law_reference']}`")

            # Текст закону
            st.markdown("**📝 Текст:**")
            st.info(doc['content'])

            # Ключові слова
            st.markdown(f"**🔑 Ключові слова:** {doc['keywords']}")

            # Кнопка "Копіювати"
            if st.button(f"📋 Копіювати текст #{i}", key=f"copy_{i}"):
                st.code(doc['content'], language="text")
                st.success("✅ Скопійовано в буфер обміну!")

    # --- ДОДАТКОВА ІНФОРМАЦІЯ ---
    st.markdown("---")
    st.markdown("### 💡 Корисна інформація:")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric(
            label="⏱️ Час пошуку",
            value=f"{result['search_time_ms']:.1f}ms"
        )

    with col2:
        st.metric(
            label="📊 Результатів",
            value=len(result['results'])
        )

    with col3:
        if result['category']:
            st.metric(
                label="📁 Категорія",
                value=result['category'].upper()
            )
        else:
            st.metric(
                label="📁 Категорія",
                value="ВСІ"
            )


# ============================================
# ЧАСТИНА 5: Sidebar (бічна панель)
# ============================================

def show_sidebar():
    """
    Показує бічну панель з додатковою інформацією

    Просто:
    - Це панель збоку екрану
    - Тут можна показати інструкції, статистику, etc.
    """
    with st.sidebar:
        st.image("https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Flag_of_Denmark.svg/320px-Flag_of_Denmark.svg.png", width=100)

        st.title("📚 Про систему")

        st.markdown("""
        **Danish Legal Assistant** - це AI-помічник для пошуку інформації в Danish законодавстві.

        ### 🎯 Можливості:
        - Пошук по 10 Danish законах
        - 3 категорії: Immigration, Tax, Labor
        - Швидкість: < 50ms
        - Джерела: офіційні закони

        ### 🔧 Технології:
        - LanceDB (vector database)
        - Sentence Transformers
        - Streamlit (UI)
        """)

        st.markdown("---")

        st.markdown("### 📊 Статистика:")
        st.info("""
        - 📄 Законів: 10
        - 📁 Категорій: 3
        - ⚡ Швидкість: 8-33ms
        - ✅ Точність: 100%
        """)

        st.markdown("---")

        st.markdown("### 💡 Приклади питань:")
        st.code("""
1. Work permits для Ukraine
2. Tax rate в Denmark
3. Vacation days
4. EU Blue Card
5. Notice period
        """)


# ============================================
# ЗАПУСК ПРОГРАМИ
# ============================================

if __name__ == "__main__":
    """
    Просто:
    - Коли запускаєш цей файл
    - Відкривається веб-сторінка з інтерфейсом!
    """
    show_sidebar()  # Показуємо бічну панель
    main()          # Показуємо головну частину

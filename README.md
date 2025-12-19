# 🏛️ Danish Legal Assistant

AI-powered assistant for searching Danish laws and regulations using semantic search.

## 🚀 Live Demo

**Try it here:** [https://huggingface.co/spaces/YOUR_USERNAME/danish-legal-assistant](https://huggingface.co/spaces/YOUR_USERNAME/danish-legal-assistant)

*(Update this link after deployment)*

## 🎯 Features

- **Semantic Search** - Find relevant Danish laws using natural language questions
- **10 Danish Laws** - Covers Immigration, Tax, and Labor categories
- **Fast Performance** - Search results in <50ms
- **User-Friendly UI** - Built with Streamlit
- **Source References** - All answers include law references and full text

## 📚 Categories

- 🔵 **Immigration** - Work permits, visas, residence permits
- 🟢 **Tax** - Income tax, corporate tax, tax returns
- 🟡 **Labor** - Employment contracts, vacation, termination

## 🔧 Technologies

- **LanceDB** - Vector database for semantic search
- **Sentence Transformers** - Text embeddings (all-MiniLM-L6-v2)
- **Streamlit** - Web UI framework
- **Python 3.10+** - Backend

## 💻 Run Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Run the app
streamlit run streamlit_app.py
```

The app will open at `http://localhost:8501`

## 📖 Example Questions

- "Can I work in Denmark with Ukrainian passport?"
- "What is the income tax rate in Denmark?"
- "How many vacation days do I get per year?"
- "What are the requirements for EU Blue Card?"
- "What is the notice period for termination?"

## 🏗️ Architecture

```
User Question
    ↓
Sentence Transformer (embedding)
    ↓
LanceDB (vector search)
    ↓
Top-K Danish Laws
    ↓
Streamlit UI (display)
```

## 📊 Performance Metrics

- **Search Latency**: 8-33ms (avg: 17ms)
- **Accuracy**: 100% on test queries
- **Database Size**: 10 documents
- **Model Load Time**: ~30 seconds (first run only)

## 📄 Documentation

- **README_MVP.md** - Full technical documentation
- **DEPLOY_GUIDE.md** - Deployment instructions
- **ЗАПУСК_UI.md** - UI launch guide (Ukrainian)
- **ЩО_МИ_РОБИМО_ПРОСТО.md** - Simple explanations (Ukrainian)

## 🛠️ Project Structure

```
danish_legal_mvp/
├── streamlit_app.py           # Main Streamlit UI
├── danish_legal_assistant.py  # Backend logic
├── tool_calling_demo.py       # AI tool calling demo
├── data/
│   └── danish_laws.json      # 10 Danish legal documents
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## 🚀 Deployment

This app is deployed on **Hugging Face Spaces** with automatic updates from GitHub.

### Deploy Your Own

1. Fork this repository
2. Create a new Space on [Hugging Face](https://huggingface.co/spaces)
3. Select **Streamlit** as SDK
4. Link your GitHub repo
5. Wait ~2-3 minutes for build
6. Done! 🎉

See **DEPLOY_GUIDE.md** for detailed instructions.

## 💡 Use Cases

- **Legal Research** - Quick access to Danish legal information
- **Immigration Consultation** - Help clients understand work permit requirements
- **Tax Planning** - Find relevant tax laws quickly
- **HR Compliance** - Verify labor law requirements

## 📈 Future Enhancements

- [ ] Expand to 100+ Danish laws
- [ ] Add multilingual support (Danish, Ukrainian, English)
- [ ] Implement chat-based interface
- [ ] Add PDF document upload
- [ ] Create API endpoints

## 👨‍💻 Author

**Serhii** - AI Solutions Architect in training

Building towards 600-800K DKK salary with AI expertise.

## 📝 License

MIT License - Feel free to use for your projects!

---

**Built with ❤️ using Claude Code**

*Part of the 18-month journey to AI Solutions Architect*

import { create } from 'zustand';
import { mockSearch, generateAIResponse } from '../hooks/useMockSearch';
import useAnalyticsStore from './useAnalyticsStore';

const API_BASE = '/api/v1';

/** Build conversation history from current messages (last 10 turns). */
function buildHistory(messages) {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-20) // last 10 turns = 20 messages
    .map((m) => ({ role: m.role, content: m.content }));
}

/**
 * Stream from POST /api/v1/chat/stream using SSE.
 * Calls onToken(text), onSources(sources), onFollowUps(questions), onDone(meta).
 */
async function streamChat(text, category, conversationId, history, { onToken, onSources, onFollowUps, onDone, onError }) {
  const resp = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: text,
      category: category || null,
      top_k: 7,
      conversation_id: conversationId || null,
      history,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!resp.ok) throw new Error(`API error ${resp.status}`);

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const event = JSON.parse(line.slice(6));
        if (event.type === 'token') onToken(event.text);
        else if (event.type === 'sources') onSources(event.sources || []);
        else if (event.type === 'follow_ups') onFollowUps(event.questions || []);
        else if (event.type === 'done') onDone({ conversationId: event.conversation_id, llmUsed: event.llm_used });
        else if (event.type === 'error') onError(event.message);
      } catch { /* skip malformed SSE */ }
    }
  }
}

/**
 * Fallback: blocking POST /api/v1/chat endpoint.
 */
async function fetchChat(text, category, conversationId, history) {
  const resp = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: text,
      category: category || null,
      top_k: 7,
      conversation_id: conversationId || null,
      history,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!resp.ok) throw new Error(`API error ${resp.status}`);
  return resp.json();
}

const useChatStore = create((set, get) => ({
  messages: [],
  isTyping: false,
  activeCategory: null,
  inputValue: '',
  conversationId: null,
  /** null = unknown, true = real API active, false = mock fallback */
  usingRealApi: null,

  sendMessage: async (text) => {
    const { messages, activeCategory, conversationId } = get();

    const startTime = Date.now();

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      laws: [],
      timestamp: Date.now(),
    };

    // Placeholder assistant message for streaming
    const assistantId = crypto.randomUUID();
    const assistantPlaceholder = {
      id: assistantId,
      role: 'assistant',
      content: '',
      laws: [],
      sources: [],
      follow_up_questions: [],
      confidence: undefined,
      llm_used: false,
      isStreaming: true,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage, assistantPlaceholder],
      isTyping: true,
      inputValue: '',
    }));

    const history = buildHistory(messages);

    /** Update the streaming assistant message in place. */
    const patch = (fields) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantId ? { ...m, ...fields } : m
        ),
      }));
    };

    try {
      await streamChat(text, activeCategory, conversationId, history, {
        onToken: (token) => {
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + token } : m
            ),
          }));
        },
        onSources: (sources) => patch({ sources }),
        onFollowUps: (follow_up_questions) => patch({ follow_up_questions }),
        onDone: ({ conversationId: cid, llmUsed }) => {
          patch({ isStreaming: false, llm_used: llmUsed });
          // usingRealApi reflects whether the backend actually used Claude AI,
          // not just whether the API endpoint was reachable.
          set({ isTyping: false, usingRealApi: llmUsed === true, conversationId: cid });
          // Track analytics — read confidence from final message state
          const finalMsg = get().messages.find((m) => m.id === assistantId);
          useAnalyticsStore.getState().trackQuery({
            query: text,
            category: get().activeCategory,
            confidence: finalMsg?.confidence,
            llmUsed,
            responseTimeMs: Date.now() - startTime,
          });
        },
        onError: (msg) => {
          console.warn('[useChatStore] Stream error:', msg);
          // Show error message in the assistant bubble instead of leaving it empty
          patch({
            isStreaming: false,
            content: '⚠️ Sorry, I encountered an error processing your request. Please try again.',
          });
          set({ isTyping: false });
        },
      });
    } catch (streamErr) {
      console.warn('[useChatStore] Stream failed, trying blocking:', streamErr.message);
      // Try blocking endpoint
      try {
        const data = await fetchChat(text, activeCategory, conversationId, history);
        patch({
          content: data.answer,
          laws: data.laws || [],
          sources: data.sources || [],
          follow_up_questions: data.follow_up_questions || [],
          confidence: data.confidence,
          llm_used: data.llm_used,
          isStreaming: false,
        });
        set({ isTyping: false, usingRealApi: true, conversationId: data.conversation_id });
        useAnalyticsStore.getState().trackQuery({
          query: text,
          category: activeCategory,
          confidence: data.confidence,
          llmUsed: data.llm_used,
          responseTimeMs: Date.now() - startTime,
        });
      } catch {
        // Full fallback to mock
        console.warn('[useChatStore] Backend unavailable — falling back to mock');
        const laws = await mockSearch(text, activeCategory);
        const aiText = generateAIResponse(text, laws);
        patch({ content: aiText, laws, isStreaming: false });
        set({ isTyping: false, usingRealApi: false });
        useAnalyticsStore.getState().trackQuery({
          query: text,
          category: activeCategory,
          confidence: null,
          llmUsed: false,
          responseTimeMs: Date.now() - startTime,
        });
      }
    }
  },

  setCategory: (category) => set({ activeCategory: category }),

  clearHistory: () => set({ messages: [], isTyping: false, conversationId: null, usingRealApi: null }),

  setInputValue: (val) => set({ inputValue: val }),
}));

export default useChatStore;

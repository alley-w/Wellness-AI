import { useEffect, useState } from 'react';
import ChatBox from '../components/ChatBox.jsx';
import { DEFAULT_USER_ID, getMemory, sendChatMessage } from '../services/api.js';

const starterMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Hi, I am here to help you notice what supports your wellness over time. What would you like to talk through?',
  },
];

const CHAT_DRAFT_KEY = 'wellbeeingChatDraft';

function readChatDraft() {
  try {
    return JSON.parse(localStorage.getItem(CHAT_DRAFT_KEY)) || {};
  } catch {
    return {};
  }
}

export default function AIChatPage() {
  const draft = readChatDraft();
  const [messages, setMessages] = useState(draft.messages || starterMessages);
  const [input, setInputState] = useState(draft.input || '');
  const [sending, setSending] = useState(false);
  const [memory, setMemory] = useState(null);

  useEffect(() => {
    getMemory(DEFAULT_USER_ID).then(setMemory);
  }, []);

  function saveChatDraft(nextMessages = messages, nextInput = input) {
    localStorage.setItem(CHAT_DRAFT_KEY, JSON.stringify({ messages: nextMessages, input: nextInput }));
  }

  function setInput(value) {
    setInputState(value);
    saveChatDraft(messages, value);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text) {
      return;
    }

    const userMessage = { id: `user-${Date.now()}`, role: 'user', text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    saveChatDraft(nextMessages, '');
    setInputState('');
    setSending(true);

    const response = await sendChatMessage(DEFAULT_USER_ID, text);
    setMessages((current) => {
      const updatedMessages = [
        ...current,
        { id: `assistant-${Date.now()}`, role: 'assistant', text: response.reply || response.message || 'I am here with you.' },
      ];
      saveChatDraft(updatedMessages, '');
      return updatedMessages;
    });
    setSending(false);
  }

  const memoryChips = [
    ...(memory?.rememberedPreferences || []).slice(0, 2),
    ...(memory?.rememberedGoals || []).slice(0, 2),
    ...(memory?.rememberedPatterns || []).slice(0, 1),
  ];
  const recentInsight = memory?.recentInsights?.[0] || 'Loading your saved wellness context...';

  return (
    <div className="page chat-layout">
      <ChatBox messages={messages} input={input} setInput={setInput} onSend={handleSend} sending={sending} />
      <aside className="panel memory-card">
        <div>
          <p className="eyebrow">Memory Snapshot</p>
          <h2>I remember</h2>
        </div>
        <div className="memory-chips">
          {(memoryChips.length ? memoryChips : ['Loading...']).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="memory-insight">
          <strong>Recent insight</strong>
          <p>{recentInsight}</p>
        </div>
      </aside>
    </div>
  );
}

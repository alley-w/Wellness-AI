import { useEffect, useState } from 'react';
import ChatBox from '../components/ChatBox.jsx';
import { getMemory, sendChatMessage } from '../services/api.js';
import { useSession } from '../context/SessionProvider.jsx';
import { getStoredChatMessages, setStoredChatMessages } from '../services/wellmemorySession.js';

const starterMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Hi, I am here to help you notice what supports your wellness over time. What would you like to talk through?',
  },
];

export default function AIChatPage() {
  const { userId } = useSession();
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInputState] = useState('');
  const [sending, setSending] = useState(false);
  const [memory, setMemory] = useState(null);
  const [chatReady, setChatReady] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }
    const stored = getStoredChatMessages(userId);
    setMessages(stored.length ? stored : starterMessages);
    setChatReady(true);
  }, [userId]);

  useEffect(() => {
    if (!userId || !chatReady) {
      return;
    }
    setStoredChatMessages(userId, messages);
  }, [userId, messages, chatReady]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    getMemory(userId).then(setMemory);
  }, [userId]);

  async function handleSend() {
    const text = input.trim();
    if (!text) {
      return;
    }

    const userMessage = { id: `user-${Date.now()}`, role: 'user', text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputState('');
    setSending(true);

    const response = await sendChatMessage(userId, text);
    const assistantTurn = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      text: response.reply || response.message || 'I am here with you.',
    };
    setMessages((current) => [...current, assistantTurn]);

    setSending(false);
  }

  const memoryChips = [
    ...(memory?.rememberedPreferences || []).slice(0, 2),
    ...(memory?.rememberedGoals || []).slice(0, 2),
    ...(memory?.rememberedPatterns || []).slice(0, 1),
  ];
  const recentInsight = memory?.recentInsights?.[0] || 'Loading your saved wellness context...';

  if (!userId || !chatReady) {
    return (
      <div className="page chat-layout">
        <p className="soft-note">Loading chat…</p>
      </div>
    );
  }

  return (
    <div className="page chat-layout">
      <ChatBox
        messages={messages}
        input={input}
        setInput={setInputState}
        onSend={handleSend}
        sending={sending}
      />
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

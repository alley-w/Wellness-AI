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

export default function AIChatPage() {
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [memory, setMemory] = useState(null);

  useEffect(() => {
    getMemory(DEFAULT_USER_ID).then(setMemory);
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text) {
      return;
    }

    const userMessage = { id: `user-${Date.now()}`, role: 'user', text };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setSending(true);

    const response = await sendChatMessage(DEFAULT_USER_ID, text);
    setMessages((current) => [
      ...current,
      { id: `assistant-${Date.now()}`, role: 'assistant', text: response.reply || response.message || 'I am here with you.' },
    ]);
    setSending(false);
  }

  const memorySections = [
    ['Remembered preferences', memory?.rememberedPreferences],
    ['Remembered goals', memory?.rememberedGoals],
    ['Remembered patterns', memory?.rememberedPatterns],
    ['Recent insights', memory?.recentInsights],
  ];

  return (
    <div className="page chat-layout">
      <ChatBox messages={messages} input={input} setInput={setInput} onSend={handleSend} sending={sending} />
      <aside className="panel memory-card">
        <p className="eyebrow">What I Remember About You</p>
        <h2>Personal context</h2>
        {memorySections.map(([title, items]) => (
          <div key={title} className="memory-section">
            <h3>{title}</h3>
            <ul>
              {(items || ['Loading...']).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
    </div>
  );
}

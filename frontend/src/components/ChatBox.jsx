export default function ChatBox({ messages, input, setInput, onSend, sending }) {
  function handleSubmit(event) {
    event.preventDefault();
    onSend();
  }

  return (
    <section className="panel chat-panel">
      <div>
        <p className="eyebrow">WellBeeing Chat</p>
        <h1>Talk through your day</h1>
      </div>
      <div className="message-list">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <p>{message.text}</p>
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about meals, movement, energy, or patterns..."
        />
        <button type="submit" disabled={sending || !input.trim()}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </section>
  );
}

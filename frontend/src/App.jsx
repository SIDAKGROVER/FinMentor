 
import React, { useState } from "react";
import AgoraAudio from "./AgoraAudio";
import axios from "axios";
import "./styles.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function App() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi — I'm FinMentor. I help you with clear, actionable saving and budgeting tips. Ask me a specific savings question to get started." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = React.useRef(null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fm_user')) || null;
    } catch { return null; }
  });
  const [authMode, setAuthMode] = useState(null); // 'login' | 'signup' | null
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // home | voice | chat | contact
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null); // filename under /notes/
  const [backendStatus, setBackendStatus] = useState(null);
  const agoraSectionRef = React.useRef(null);
  const chatSectionRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check backend debug status to show helpful banner when Mongo is disconnected
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${BACKEND}/api/debug/status`);
        if (!mounted) return;
        if (res.ok) {
          const j = await res.json();
          setBackendStatus(j);
        }
      } catch (e) {
        // ignore network errors for now
      }
    })();
    return () => { mounted = false; };
  }, []);

  function saveUser(u) {
    setUser(u);
    if (u) {
      localStorage.setItem('fm_user', JSON.stringify(u));
    } else {
      localStorage.removeItem('fm_user');
      // ensure auth controls reappear and any auth modal is closed
      setAuthMode(null);
      setActiveTab('home');
    }
  }

  async function signup(name, email, password) {
    setAuthLoading(true);
    try {
      const res = await axios.post(`${BACKEND}/api/auth/signup`, { name, email, password });
      saveUser(res.data);
      setAuthMode(null);
    } catch (err) {
      console.error('Signup failed:', err?.response?.data || err.message);
      // Show server-provided error details when available
      const serverErr = err?.response?.data;
      const message = serverErr?.error || serverErr?.details || 'Signup failed';
      alert(message);
    } finally { setAuthLoading(false); }
  }

  async function login(email, password) {
    setAuthLoading(true);
    try {
      const res = await axios.post(`${BACKEND}/api/auth/login`, { email, password });
      saveUser(res.data);
      setAuthMode(null);
    } catch (err) {
      console.error('Login failed:', err?.response?.data || err.message);
      const serverErr = err?.response?.data;
      const message = serverErr?.error || serverErr?.details || 'Login failed';
      alert(message);
    } finally { setAuthLoading(false); }
  }

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(m => [...m, { from: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      // Send last 8 messages as history for context
      const history = messages.slice(-8);
      const res = await axios.post(`${BACKEND}/api/ai/chat`, { message: userMsg, history });
      const botText = res.data.reply;

      setMessages(m => [...m, { from: "bot", text: botText }]);

      // Speak reply
      try {
        const utterance = new SpeechSynthesisUtterance(botText);
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      } catch (err) {
        console.log("TTS not available:", err.message);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(m => [...m, { 
        from: "bot", 
        text: "Sorry, I couldn't process that. Please try again." 
      }]);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick tip clicked
  function onQuickTip(tip) {
    if (!user) {
      // require signup/login first
      setAuthMode('signup');
      return;
    }
    setInput(tip);
    // optional: auto-send
    setTimeout(() => sendMessage(), 200);
  }

  function gotoSection(ref, tabName) {
    setActiveTab(tabName);
    try { ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* ignore */ }
  }

  return (
    <>
      <nav className="top-nav">
        <div className="nav-left">
          <div className="brand">💰 FinMentor</div>
        </div>
        <div className="nav-center">
            <button className={`nav-item ${activeTab==='home' ? 'active' : ''}`} onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</button>
            <button className={`nav-item ${activeTab==='voice' ? 'active' : ''}`} onClick={() => { gotoSection(agoraSectionRef, 'voice'); setMobileMenuOpen(false); }}>Voice Chat</button>
            <button className={`nav-item ${activeTab==='chat' ? 'active' : ''}`} onClick={() => { gotoSection(chatSectionRef, 'chat'); setMobileMenuOpen(false); }}>Chatbot</button>
            <button className={`nav-item ${activeTab==='notes' ? 'active' : ''}`} onClick={() => { setActiveTab('notes'); setMobileMenuOpen(false); }}>Finance Notes</button>
            <button className={`nav-item ${activeTab==='contact' ? 'active' : ''}`} onClick={() => { setActiveTab('contact'); setMobileMenuOpen(false); window.alert('Contact us at support@example.com'); }}>Contact Us</button>
        </div>
          {/* Mobile menu toggle */}
          <button className="nav-hamburger" aria-label="Menu" onClick={() => setMobileMenuOpen(v => !v)}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        <div className="nav-right">
          {!user ? (
            <>
              <button className="nav-auth" onClick={() => setAuthMode('login')}>Login</button>
              <button className="nav-auth" onClick={() => setAuthMode('signup')}>Sign up</button>
            </>
          ) : (
            <div className="nav-user">
              <span>{user.name}</span>
              <button onClick={() => saveUser(null)}>Logout</button>
            </div>
          )}
        </div>
        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="mobile-menu" onClick={() => setMobileMenuOpen(false)}>
            <div className="mobile-menu-inner" onClick={e => e.stopPropagation()}>
              <button className={`mobile-item ${activeTab==='home' ? 'active' : ''}`} onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</button>
              <button className={`mobile-item ${activeTab==='voice' ? 'active' : ''}`} onClick={() => { gotoSection(agoraSectionRef, 'voice'); setMobileMenuOpen(false); }}>Voice Chat</button>
              <button className={`mobile-item ${activeTab==='chat' ? 'active' : ''}`} onClick={() => { gotoSection(chatSectionRef, 'chat'); setMobileMenuOpen(false); }}>Chatbot</button>
              <button className={`mobile-item ${activeTab==='notes' ? 'active' : ''}`} onClick={() => { setActiveTab('notes'); setMobileMenuOpen(false); }}>Finance Notes</button>
              {!user ? (
                <>
                  <button className="mobile-item" onClick={() => { setAuthMode('login'); setMobileMenuOpen(false); }}>Login</button>
                  <button className="mobile-item" onClick={() => { setAuthMode('signup'); setMobileMenuOpen(false); }}>Sign up</button>
                </>
              ) : (
                <button className="mobile-item" onClick={() => { saveUser(null); setMobileMenuOpen(false); }}>Logout</button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Backend status banner: visible when Mongo not connected to explain signup/login behavior */}
      {backendStatus && backendStatus.mongoReadyStateText !== 'connected' && (
        <div style={{ background: '#fff3cd', color: '#856404', padding: '8px 12px', textAlign: 'center' }}>
          Demo mode: the backend database is not connected ({backendStatus.mongoReadyStateText}). Signups are ephemeral and may not persist — to enable persistent accounts, configure MongoDB on the server.
        </div>
      )}

      <div className="app">
      <div className="sidebar">
        <div className="logo">
          <h1>💰 FinMentor</h1>
          <p className="subtitle">Financial Education AI</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          {!user && (
            <div className="auth-actions">
              <button onClick={() => setAuthMode('login')}>Login</button>
              <button onClick={() => setAuthMode('signup')}>Sign up</button>
            </div>
          )}
        </div>

        <div ref={agoraSectionRef}>
          <AgoraAudio />
        </div>

            <div className="quick-tips">
          <h4>💡 Quick Tips</h4>
          <ul>
            <li onClick={() => onQuickTip('How do I make a budget?')}>Ask about budgeting</li>
            <li onClick={() => onQuickTip('How do I start investing?')}>Learn about investments</li>
            <li onClick={() => onQuickTip('Explain compound interest with an example')}>Understand compound interest</li>
                <li onClick={() => onQuickTip('How can I save ₹2000 per month?')}>Savings strategies</li>
          </ul>
        </div>
      </div>

      {/* top-right user box removed — user details shown in top nav */}

      <div className="chat-container" ref={chatSectionRef}>
        {activeTab === 'notes' && (
          <div className="notes-container">
            <h2>Finance Notes — Basics</h2>
            <p>Topic-wise notes. Click a title to open the note in an overlay.</p>
            <ul className="notes-list">
              <li><button className="note-link" onClick={() => setSelectedNote('budgeting.html')}>How to Build a Simple Budget</button></li>
              <li><button className="note-link" onClick={() => setSelectedNote('emergency-fund.html')}>Saving Strategies & Emergency Fund</button></li>
              <li><button className="note-link" onClick={() => setSelectedNote('compound_interest.html')}>Compound Interest Explained</button></li>
              <li><button className="note-link" onClick={() => setSelectedNote('investing-basics.html')}>Investing Basics for Beginners</button></li>
              <li><button className="note-link" onClick={() => setSelectedNote('debt-repayment.html')}>Debt Management & Credit Basics</button></li>
              <li><button className="note-link" onClick={() => setSelectedNote('taxes-basics.html')}>Taxes Basics & Recordkeeping</button></li>
            </ul>
            <p style={{marginTop:12}}>Notes open in an overlay — you can download them from the overlay using your browser's Save/Print controls.</p>
          </div>
        )}

        {selectedNote && (
          <div className="notes-modal" onClick={() => setSelectedNote(null)}>
            <div className="notes-modal-inner" onClick={(e) => e.stopPropagation()}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                <strong style={{fontSize:16}}>Finance Note</strong>
                <button onClick={() => setSelectedNote(null)} style={{background:'transparent',border:'none',fontSize:20,cursor:'pointer'}}>✕</button>
              </div>
              <iframe title="note" className="notes-iframe" src={`/notes/${selectedNote}`} />
            </div>
          </div>
        )}
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.from}`}>
              <div className="avatar">{m.from === "user" ? "👤" : "🤖"}</div>
              <div className="bubble">{m.text}</div>
            </div>
          ))}
          {loading && (
            <div className="message bot">
              <div className="avatar">🤖</div>
              <div className="bubble loading">Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about finance, budgeting, savings..."
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}>
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
      {/* Auth modal / inline form */}
      {authMode && (
        <div className="auth-modal">
          <div className="auth-card">
            <h3>{authMode === 'signup' ? 'Sign Up' : 'Login'}</h3>
            {authMode === 'signup' ? (
              <SignUpForm onCancel={() => setAuthMode(null)} onSubmit={signup} loading={authLoading} />
            ) : (
              <LoginForm onCancel={() => setAuthMode(null)} onSubmit={login} loading={authLoading} />
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function SignUpForm({ onSubmit, onCancel, loading }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div>
      <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => onSubmit(name, email, password)} disabled={loading}>Create</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function LoginForm({ onSubmit, onCancel, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => onSubmit(email, password)} disabled={loading}>Login</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

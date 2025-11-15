 
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
  const didMountRef = React.useRef(false);
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
    // Avoid auto-scrolling on initial mount (so the user sees the top/home)
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    scrollToBottom();
  }, [messages]);

  // Ensure the page opens at the top (hero) on first load
  React.useEffect(() => {
    try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { /* ignore */ }
  }, []);

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
        {activeTab === 'home' && (
          <div className="home-hero">
            <h2 className="hero-title">ChatBot & Voice Chat</h2>
            <p className="hero-sub">Get quick personal finance help — type to chat or join a live voice session.</p>
            <div className="hero-actions">
              <button className="hero-btn" onClick={() => { setActiveTab('chat'); setMobileMenuOpen(false); setTimeout(()=> gotoSection(chatSectionRef, 'chat'), 100); }}>Chatbot</button>
              <button className="hero-btn ghost" onClick={() => { setActiveTab('voice'); setMobileMenuOpen(false); setTimeout(()=> gotoSection(agoraSectionRef, 'voice'), 100); }}>Voice Chat</button>
            </div>
          </div>
        )}
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
    
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-left">© Coding Ninja — All rights reserved</div>
        <div className="footer-right">
          <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="social-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.2"/><circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.2"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/></svg>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="social-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 5.8c-.6.3-1.2.5-1.9.6.7-.4 1.2-1 1.4-1.8-.7.4-1.5.6-2.3.8C18.6 4.6 17.8 4 16.9 4c-1.5 0-2.6 1.2-2.6 2.7 0 .2 0 .4.1.6C11 7.1 8.1 5.8 6 3.8c-.3.5-.5 1-.5 1.7 0 1.1.6 2 1.6 2.6-.5 0-1-.2-1.5-.4 0 1.6 1.1 3 2.6 3.3-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.2 1.6 2.1 3 2.1C9 15 7.8 15.6 6.5 15.6c-.4 0-.8 0-1.2-.1C5.4 16.6 7 17.4 8.8 17.4c5.3 0 8.2-4.4 8.2-8.2v-.4c.6-.4 1.2-1 1.7-1.6-.5.2-1 .3-1.6.4z" stroke="currentColor" strokeWidth="0.6" fill="currentColor"/></svg>
          </a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="social-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 2h-3a4 4 0 00-4 4v3H8v4h3v8h4v-8h3l1-4h-4V6a1 1 0 011-1h3V2z" fill="currentColor"/></svg>
          </a>
        </div>
      </div>
    </footer>
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

// ChatWindow.jsx
import "./ChatWindow.css";
import { MyContext } from './MyContext.jsx';
import { useContext, useState, useEffect } from "react";
import { ScaleLoader } from 'react-spinners';
import Chat from "./Chat.jsx"; // <- make sure Chat.jsx exists in same folder

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

function ChatWindow() {
  const {
    prompt, setPrompt,
    reply, setReply,
    currThreadId,
    prevChats, setPrevChats,
    setNewChat
  } = useContext(MyContext);

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const getReply = async () => {
    if (!prompt?.trim()) return; // don't send empty messages
    setLoading(true);
    setNewChat(false);

    try {
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          threadId: currThreadId,
        }),
      };

      const response = await fetch(`${API_BASE}/api/chat`, options);

      if (!response.ok) {
        // try to read body for more info, but it's optional
        let text = await response.text().catch(()=>null);
        throw new Error(`Server error ${response.status}${text ? ': ' + text : ''}`);
      }

      // If server returns no content (204) avoid calling json()
      const contentType = response.headers.get('content-type') || '';
      let res = null;
      if (contentType.includes('application/json')) {
        res = await response.json();
      } else {
        // fallback: try parse text
        const txt = await response.text().catch(()=>null);
        res = txt ? { reply: txt } : { reply: '' };
      }

      console.log(res);
      setReply(res?.reply ?? '');
    } catch (error) {
      console.error("Error fetching reply:", error);
      setReply(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Append new chat to prevChats when reply changes
  useEffect(() => {
    if (prompt && reply) {
      setPrevChats((pc) => ([
        ...pc,
        { role: 'user', content: prompt },
        { role: 'assistant', content: reply }
      ]));
      setPrompt("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reply]); // intentional: runs when reply updates

  const handleProfileClick = () => setIsOpen((s) => !s);

  return (
    <div className="chatWindow">
      <div className="navbar">
        <span>AlphaGPT &nbsp; <i className="fa-solid fa-chevron-down"></i></span>

        <div className="userIconDiv" onClick={handleProfileClick} role="button" tabIndex={0}>
          <span className="userIcon"><i className="fa-solid fa-user"></i></span>
        </div>
      </div>

      {isOpen && (
        <div className="dropDown">
          <div className="dropDownItem"><i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan</div>
          <div className="dropDownItem"><i className="fa-solid fa-gear"></i> Settings</div>
          <div className="dropDownItem"><i className="fa-solid fa-right-from-bracket"></i> Log out</div>
        </div>
      )}

      <Chat />

      {/* loader */}
      {loading && (
        <div className="loaderWrapper" aria-live="polite">
          <ScaleLoader loading={loading} />
        </div>
      )}

      <div className="chatInput">
        <div className="inputBox">
          <input
            type="text"
            placeholder="Ask anything"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') getReply(); }}
            disabled={loading}
            aria-label="Message input"
          />
          <div id="submit" onClick={() => !loading && getReply()} role="button" tabIndex={0} aria-disabled={loading}>
            <i className="fa-solid fa-paper-plane"></i>
          </div>
        </div>

        <p className="info">
          AlphaGPT can make mistakes. Check important info. See Cookie Preferences.
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;

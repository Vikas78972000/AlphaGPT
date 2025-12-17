// ChatWindow.jsx
import "./ChatWindow.css";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect } from "react";
import { ScaleLoader } from "react-spinners";
import Chat from "./Chat.jsx";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function ChatWindow({ onToggleSidebar }) {
  const {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setPrevChats,
    setNewChat,
  } = useContext(MyContext);

  const [loading, setLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  /* ---------------- Fetch reply ---------------- */
  const getReply = async () => {
    if (!prompt?.trim() || loading) return;

    setLoading(true);
    setNewChat(false);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          threadId: currThreadId,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Server error ${response.status} ${text}`);
      }

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { reply: await response.text() };

      setReply(data?.reply ?? "");
    } catch (err) {
      console.error(err);
      setReply(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Update chat history ---------------- */
  useEffect(() => {
    if (prompt && reply) {
      setPrevChats((prev) => [
        ...prev,
        { role: "user", content: prompt },
        { role: "assistant", content: reply },
      ]);
      setPrompt("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reply]);

  return (
    <div className="chatWindow">
      {/* ================= NAVBAR ================= */}
      <div className="navbar">
        {/* Mobile sidebar toggle */}
        <span
          className="menuBtn"
          onClick={onToggleSidebar}
          role="button"
          aria-label="Toggle sidebar"
        >
          ☰
        </span>

        <span className="title">
          AlphaGPT <i className="fa-solid fa-chevron-down"></i>
        </span>

        <div
          className="userIconDiv"
          onClick={() => setIsProfileOpen((p) => !p)}
          role="button"
          tabIndex={0}
        >
          <span className="userIcon">
            <i className="fa-solid fa-user"></i>
          </span>
        </div>
      </div>

      {/* ================= PROFILE DROPDOWN ================= */}
      {isProfileOpen && (
        <div className="dropDown">
          <div className="dropDownItem">
            <i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan
          </div>
          <div className="dropDownItem">
            <i className="fa-solid fa-gear"></i> Settings
          </div>
          <div className="dropDownItem">
            <i className="fa-solid fa-right-from-bracket"></i> Log out
          </div>
        </div>
      )}

      {/* ================= CHAT BODY ================= */}
      <Chat />

      {/* ================= LOADER ================= */}
      {loading && (
        <div className="loaderWrapper" aria-live="polite">
          <ScaleLoader />
        </div>
      )}

      {/* ================= INPUT ================= */}
      <div className="chatInput">
        <div className="inputBox">
          <input
            type="text"
            placeholder="Ask anything…"
            value={prompt}
            disabled={loading}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && getReply()}
            aria-label="Message input"
          />

          <div
            id="submit"
            onClick={getReply}
            role="button"
            aria-disabled={loading}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </div>
        </div>

        <p className="info">
          AlphaGPT can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;

// Sidebar.jsx
import "./Sidebar.css";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext";
import { v4 as uuidv4 } from "uuid";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function Sidebar({ open, onClose }) {
  const {
    allThreads,
    setAllThreads,
    setCurrThreadId,
    currThreadId,
    setNewChat,
    setPrompt,
    setReply,
    setPrevChats,
  } = useContext(MyContext);

  /* ---------------- Fetch threads ---------------- */
  useEffect(() => {
    let mounted = true;

    const fetchThreads = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/thread`);
        if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
        const data = await res.json();

        if (mounted) {
          setAllThreads(
            data.map((t) => ({
              threadId: t.threadId,
              title: t.title || "Untitled",
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching threads:", err);
      }
    };

    fetchThreads();
    return () => {
      mounted = false;
    };
  }, [setAllThreads]);

  /* ---------------- New chat ---------------- */
  const createNewChat = () => {
    setNewChat(true);
    setPrompt("");
    setReply(null);
    setCurrThreadId(uuidv4());
    setPrevChats([]);
    onClose?.(); // close sidebar on mobile
  };

  /* ---------------- Change thread ---------------- */
  const changeThread = async (threadId) => {
    setCurrThreadId(threadId);

    try {
      const res = await fetch(`${API_BASE}/api/thread/${threadId}`);
      if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
      const data = await res.json();

      setPrevChats(data);
      setNewChat(false);
      setReply(null);
      onClose?.(); // close sidebar on mobile
    } catch (err) {
      console.error("Error changing thread:", err);
    }
  };

  /* ---------------- Delete thread ---------------- */
  const deleteThread = async (threadId) => {
    try {
      const res = await fetch(`${API_BASE}/api/thread/${threadId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

      setAllThreads((prev) =>
        prev.filter((t) => t.threadId !== threadId)
      );

      if (currThreadId === threadId) {
        createNewChat();
      }
    } catch (err) {
      console.error("Error deleting thread:", err);
    }
  };

  return (
    <>
      {/* overlay for mobile */}
      {open && <div className="sidebarOverlay" onClick={onClose}></div>}

      <aside className={`sidebar ${open ? "open" : ""}`}>
        {/* ---------- New Chat ---------- */}
        <button onClick={createNewChat}>
          <img src="/logo.png" alt="logo" className="logo" />
          <span>
            <i className="fa-solid fa-pen-to-square"></i>
          </span>
        </button>

        {/* ---------- History ---------- */}
        <ul className="history">
          {allThreads?.map((thread) => (
            <li
              key={thread.threadId}
              onClick={() => changeThread(thread.threadId)}
              className={
                thread.threadId === currThreadId ? "highlighted" : ""
              }
            >
              {thread.title}
              <i
                className="fa-solid fa-trash"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteThread(thread.threadId);
                }}
              ></i>
            </li>
          ))}
        </ul>

        {/* ---------- Footer ---------- */}
        <div className="sign">
          <p>By PixelPirates ♥</p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

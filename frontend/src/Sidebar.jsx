// Sidebar.jsx
import './Sidebar.css';
import { useContext, useEffect } from 'react';
import { MyContext } from './MyContext';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

function Sidebar() {
  const { allThreads, setAllThreads, setCurrThreadId, currThreadId, setNewChat, setPrompt, setReply, setPrevChats } =
    useContext(MyContext);

  useEffect(() => {
    let mounted = true;
    async function fetchThreads() {
      try {
        const response = await fetch(`${API_BASE}/api/thread`);
        if (!response.ok) throw new Error(`Fetch error: ${response.status}`);
        const res = await response.json();
        const filteredData = res.map((thread) => ({
          threadId: thread.threadId,
          title: thread.title || 'Untitled',
        }));
        if (mounted) setAllThreads(filteredData);
      } catch (error) {
        console.error('Error fetching threads:', error);
      }
    }
    fetchThreads();
    return () => {
      mounted = false;
    };
  }, [setAllThreads]);

  const createNewChat = () => {
    setNewChat(true);
    setPrompt('');
    setReply(null);
    setCurrThreadId(uuidv4());
    setPrevChats([]);
  };

  const changeThread = async (newThreadId) => {
    setCurrThreadId(newThreadId);
    try {
      const response = await fetch(`${API_BASE}/api/thread/${newThreadId}`);
      if (!response.ok) throw new Error(`Fetch error: ${response.status}`);
      const res = await response.json();
      setPrevChats(res);
      setNewChat(false);
      setReply(null);
    } catch (err) {
      console.error('Error changing thread:', err);
    }
  };

  const deleteThread = async (threadId) => {
    try {
      const response = await fetch(`${API_BASE}/api/thread/${threadId}`, {
        method: 'DELETE',
      });
      // handle both JSON and no-content responses
      if (!response.ok) throw new Error(`Delete failed: ${response.status}`);
      let resData = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        resData = await response.json();
        console.log(resData);
      } else {
        console.log('Delete success (no JSON body).');
      }

      setAllThreads((prev) => prev.filter((t) => t.threadId !== threadId));
      if (currThreadId === threadId) {
        createNewChat();
      }
    } catch (err) {
      console.error('Error deleting thread:', err);
    }
  };

  return (
    <section className="sidebar">
      {/* new chat button */}
      <button onClick={createNewChat}>
        <img src="/logo.png" alt="gpt-logo" className="logo" />
        <span>
          <i className="fa-solid fa-pen-to-square"></i>
        </span>
      </button>

      {/* history */}
      <ul className="history">
        {allThreads?.map((thread) => (
          <li
            key={thread.threadId}
            onClick={() => changeThread(thread.threadId)}
            className={thread.threadId === currThreadId ? 'highlighted' : ''}
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

      {/* sign */}
      <div className="sign">
        <p>By PixelPirates &hearts;</p>
      </div>
    </section>
  );
}

export default Sidebar;

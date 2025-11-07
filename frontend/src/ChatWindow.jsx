import Chat from "./Chat.jsx";
import "./ChatWindow.css";
import { MyContext } from './MyContext.jsx';
import { useContext, useState, useEffect } from "react";
import { ScaleLoader } from 'react-spinners';
function ChatWindow() {
    const { prompt, setPrompt, reply, setReply, currThreadId, prevChats, setPrevChats , setNewChat } = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const getReply = async () => {
        setLoading(true);
        setNewChat(false);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: prompt,
                threadId: currThreadId,
            })

        };
        try {
            const response = await fetch('https://alpha-gpt-backend.vercel.app/api/chat', options);
            const res = await response.json();
            console.log(res);
            setReply(res.reply);
        } catch (error) {
            console.error("Error fetching reply:", error);
        }
        setLoading(false);
    }

    //Append new chat to prevChats
    useEffect(() => {
        if (prompt && reply) {
            setPrevChats(prevChats => (
                [...prevChats, {
                    role: 'user',
                    content: prompt
                }, {
                    role: 'assistant',
                    content: reply,
                }]
            ))
        }
        setPrompt("");
    }, [reply]);

    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    }

    return (
        <div className="chatWindow">
            <div className="navbar">
                <span>AlphaGPT &nbsp; <i className="fa-solid fa-chevron-down"></i></span>

                <div className="userIconDiv" onClick={handleProfileClick}>
                    <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                </div>
            </div>

            {
                isOpen && 
                <div className="dropDown">
                    <div className="dropDownItem"><i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan</div>
                    <div className="dropDownItem"><i className="fa-solid fa-gear"></i> Settings</div>
                    <div className="dropDownItem"><i className="fa-solid fa-right-from-bracket"></i>Log out</div>
                    </div>
            }
            <Chat></Chat>
            <ScaleLoader color="#fff" loading={loading} >

            </ScaleLoader>
            <div className="chatInput">
                <div className="inputBox">
                    <input type="text" placeholder="Ask anything"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' ? getReply() : ''}
                    >

                    </input>
                    <div id="submit" onClick={getReply}><i className="fa-solid fa-paper-plane"></i></div>
                </div>
                <p className="info">
                    AlphaGPT can make mistakes.Check important info. See Cookie Preferences.
                </p>
            </div>
        </div>
    );
}
import { stringify } from "uuid";

export default ChatWindow;
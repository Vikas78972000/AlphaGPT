import './Sidebar.css';
import { useContext, useEffect } from 'react';
import { MyContext } from './MyContext';
import {v4 as uuidv4} from 'uuid';


function Sidebar() {
    const { allThreads, setAllThreads, setCurrThreadId, currThreadId , setNewChat,setPrompt,setReply,setPrevChats} = useContext(MyContext);

    const getAllThreads = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/thread');
            const res = await response.json();
            const filteredData = res.map(thread => ({
                threadId: thread.threadId,
                title: thread.title
            }));
            console.log(filteredData);
            setAllThreads(filteredData);
        } catch (error) {
            console.error("Error fetching threads:", error);
        }
    };

    useEffect(() => {
        getAllThreads();
    }, []);

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv4());
        setPrevChats([]);
    }

    const changeThread = async(newThreadId) => {
        setCurrThreadId(newThreadId);
        try{
            const response = await fetch(`http://localhost:8080/api/thread/${newThreadId}`);
            const res = await response.json();
            setPrevChats(res);
            setNewChat(false);
            setReply(null);
        }catch(err){
            console.error("Error changing thread:", err);
        }
    }

    const deleteThread = async(threadId) => {
        try{
            const response = await fetch(`http://localhost:8080/api/thread/${threadId}`,{
                method: 'DELETE',
            });
            const res = await response.json();
            console.log(res);

            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));
            if(currThreadId === threadId){
                createNewChat();
            }
        } catch(err){
            console.error("Error deleting thread:", err);
        }
    }
    return (
        <section className="sidebar">
            {/* new chat button */}
            <button onClick={createNewChat}>
                <img src="src/assets/logo.png" alt="gpt-logo" className="logo" />
                <span><i className="fa-solid fa-pen-to-square"></i></span>
            </button>

            {/* history */}
            <ul className='history'>
                {
                    allThreads?.map((thread, idx) => (
                        <li key={idx}
                           onClick={(e) => changeThread(thread.threadId)}
                           className={thread.threadId === currThreadId ? 'highlighted' : ''}
                        >{thread.title}
                         <i className="fa-solid fa-trash"
                            onClick={(e)=>{
                                e.stopPropagation();
                                deleteThread(thread.threadId);
                            }}
                         ></i>
                        </li>
                    ))
                }
            </ul>

            {/* sign */}
            <div className="sign">
                <p>By PixelPirates &hearts;</p>
            </div>
        </section>
    );
}

export default Sidebar;

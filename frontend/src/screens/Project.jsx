import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js'
import { getWebContainer } from '../config/webContainer.js'


function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)
            ref.current.removeAttribute('data-highlighted')
        }
    }, [props.className, props.children])

    return <code {...props} ref={ref} />
}


const Project = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState(new Set())
    const [project, setProject] = useState(location.state.project)
    const [message, setMessage] = useState('')
    const { user } = useContext(UserContext)
    const messageBox = useRef(null)

    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [fileTree, setFileTree] = useState({})

    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])

    const [webContainer, setWebContainer] = useState(null)
    const [iframeUrl, setIframeUrl] = useState(null)

    const [runProcess, setRunProcess] = useState(null)

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId)
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id)
            } else {
                newSelectedUserId.add(id)
            }
            return newSelectedUserId
        })
    }

    function addCollaborators() {
        axios.put("/projects/add-user", {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data)
            setIsModalOpen(false)
        }).catch(err => {
            console.log(err)
        })
    }

    const send = () => {
        if (!message.trim()) return

        const messageData = {
            message,
            sender: {
                _id: user._id,
                email: user.email
            }
        }

        sendMessage('project-message', messageData)
        
        // Add to local state immediately
        setMessages(prevMessages => [...prevMessages, messageData])
        setMessage("")
        
        setTimeout(scrollToBottom, 100)
    }

    function WriteAiMessage(message) {
        const messageObject = JSON.parse(message)

        return (
            <div className='overflow-auto bg-slate-950 text-white rounded-sm p-2 max-h-96'>
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>
        )
    }

    useEffect(() => {
        initializeSocket(project._id)

        // Initialize webContainer
        getWebContainer().then(container => {
            setWebContainer(container)
            console.log("WebContainer started successfully")
        }).catch(err => {
            console.error("Failed to start WebContainer:", err)
        })

        receiveMessage('project-message', data => {
            console.log("Received message:", data)
            
            if (data.sender._id === 'ai') {
                try {
                    const parsedMessage = JSON.parse(data.message)
                    console.log("Parsed AI message:", parsedMessage)

                    if (parsedMessage.fileTree) {
                        const formattedFileTree = parsedMessage.fileTree
                        setFileTree(formattedFileTree)
                        
                        // Mount to webContainer if available
                        if (webContainer) {
                            webContainer.mount(formattedFileTree).then(() => {
                                console.log("File tree mounted successfully")
                            }).catch(err => {
                                console.error("Failed to mount file tree:", err)
                            })
                        }
                    }
                } catch (err) {
                    console.error("Error parsing AI message:", err)
                }
            }
            
            setMessages(prevMessages => [...prevMessages, data])
            setTimeout(scrollToBottom, 100)
        })

        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {
            console.log("Project loaded:", res.data.project)
            setProject(res.data.project)
            setFileTree(res.data.project.fileTree || {})
        }).catch(err => {
            console.error("Failed to load project:", err)
        })

        axios.get('/users/all').then(res => {
            setUsers(res.data.users)
        }).catch(err => {
            console.log(err)
        })

        return () => {
            
        }
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log("File tree saved:", res.data)
        }).catch(err => {
            console.error("Failed to save file tree:", err)
        })
    }

    function scrollToBottom() {
        if (messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send()
        }
    }

    return (
        <main className='h-screen w-screen flex bg-slate-900 overflow-hidden'>
            <section className="left relative flex flex-col h-screen min-w-96 max-w-96 bg-slate-800 border-r border-slate-700">
                <header className='flex justify-between items-center p-2 px-4 w-full bg-slate-900 absolute z-10 top-0 border-b border-slate-700'>
                    <button className='flex gap-2 text-blue-400 hover:text-blue-300 transition-colors' onClick={() => setIsModalOpen(true)}>
                        <i className="ri-add-fill mr-1"></i>
                        <p>Add collaborator</p>
                    </button>
                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2 text-slate-400 hover:text-slate-300'>
                        <i className="ri-group-fill"></i>
                    </button>
                </header>
                
                <div className="conversation-area pt-14 flex-grow flex flex-col h-full overflow-hidden">
                    <div
                        ref={messageBox}
                        className="message-box p-2 flex-grow flex flex-col gap-2 overflow-y-auto">
                        {messages.map((msg, index) => {

                            const isSentByCurrentUser = msg.sender._id === user._id;
                            
                            return (
                                <div 
                                    key={`msg-${index}-${msg.sender._id}-${Date.now()}`} 
                                    className={`message flex w-full ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`${isSentByCurrentUser ? 'max-w-[85%] bg-blue-600 border-blue-500' : 'max-w-[90%] bg-slate-700 border-slate-600'} p-2 rounded-md border`}>
                                        <small className='opacity-65 text-xs text-slate-300 block mb-1'>
                                            {msg.sender.email}
                                        </small>
                                        <div className='text-sm text-white break-words'>
                                            {msg.sender._id === 'ai' ?
                                                WriteAiMessage(msg.message)
                                                : <p className='whitespace-pre-wrap'>{msg.message}</p>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="inputField w-full flex border-t border-slate-700 bg-slate-900">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className='p-2 px-4 border-none outline-none flex-grow bg-slate-900 text-white placeholder-slate-500' 
                            type="text" 
                            placeholder='Enter message' />
                        <button
                            onClick={send}
                            className='px-5 bg-blue-600 hover:bg-blue-700 text-white transition-colors'>
                            <i className="ri-send-plane-fill"></i>
                        </button>
                    </div>
                </div>

                <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-slate-800 absolute transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0 border-r border-slate-700 z-20`}>
                    <header className='flex justify-between items-center px-4 p-2 bg-slate-900 border-b border-slate-700'>
                        <h1 className='font-semibold text-lg text-white'>Collaborators</h1>
                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2 text-slate-400 hover:text-slate-300'>
                            <i className="ri-close-fill"></i>
                        </button>
                    </header>
                    <div className="users flex flex-col gap-2 overflow-y-auto p-2">
                        {project.users && project.users.map((user, idx) => {
                            return (
                                <div key={`collab-${user._id || idx}`} className="user cursor-pointer hover:bg-slate-700 p-2 flex gap-2 items-center transition-colors rounded">
                                    <div className='aspect-square rounded-full w-10 h-10 flex items-center justify-center text-white bg-slate-600'>
                                        <i className="ri-user-fill"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg text-white'>{user.email}</h1>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            <section className="right bg-slate-900 flex-grow h-full flex overflow-hidden">
                <div className="explorer h-full max-w-64 min-w-52 bg-slate-800 border-r border-slate-700 overflow-y-auto">
                    <div className="file-tree w-full">
                        {Object.keys(fileTree).map((file, index) => (
                            <button
                                key={`file-${file}-${index}`}
                                onClick={() => {
                                    setCurrentFile(file)
                                    setOpenFiles([...new Set([...openFiles, file])])
                                }}
                                className="tree-element cursor-pointer p-2 px-4 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 w-full border-b border-slate-700 transition-colors">
                                <i className="ri-file-code-line text-slate-400"></i>
                                <p className='font-semibold text-sm text-slate-300'>{file}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="code-editor flex flex-col flex-grow h-full overflow-hidden">
                    <div className="top flex justify-between w-full bg-slate-800 border-b border-slate-700 overflow-x-auto">
                        <div className="files flex">
                            {openFiles.map((file, index) => (
                                <button
                                    key={`open-${file}-${index}`}
                                    onClick={() => setCurrentFile(file)}
                                    className={`open-file cursor-pointer p-2 px-4 flex items-center w-fit gap-2 border-r border-slate-700 transition-colors ${currentFile === file ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-300'}`}>
                                    <p className='font-semibold text-sm whitespace-nowrap'>{file}</p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setOpenFiles(openFiles.filter(f => f !== file))
                                            if (currentFile === file) {
                                                setCurrentFile(openFiles[0] || null)
                                            }
                                        }}
                                        className='text-slate-500 hover:text-slate-300'>
                                        <i className="ri-close-line"></i>
                                    </button>
                                </button>
                            ))}
                        </div>

                        <div className="actions flex gap-2">
                            <button
                                onClick={async () => {
                                    try {
                                        if (!webContainer) {
                                            console.error("WebContainer not initialized")
                                            alert("WebContainer not ready. Please wait.")
                                            return
                                        }

                                        console.log("Mounting file tree:", fileTree)
                                        await webContainer.mount(fileTree)

                                        console.log("Running npm install...")
                                        const installProcess = await webContainer.spawn("npm", ["install"])

                                        installProcess.output.pipeTo(new WritableStream({
                                            write(chunk) {
                                                console.log("Install:", chunk)
                                            }
                                        }))

                                        await installProcess.exit

                                        if (runProcess) {
                                            console.log("Killing previous process")
                                            runProcess.kill()
                                        }

                                        console.log("Running npm start...")
                                        let tempRunProcess = await webContainer.spawn("npm", ["start"])

                                        tempRunProcess.output.pipeTo(new WritableStream({
                                            write(chunk) {
                                                console.log("Run:", chunk)
                                            }
                                        }))

                                        setRunProcess(tempRunProcess)

                                        webContainer.on('server-ready', (port, url) => {
                                            console.log("Server ready on port:", port, "URL:", url)
                                            setIframeUrl(url)
                                        })
                                    } catch (err) {
                                        console.error("Error running project:", err)
                                        alert("Failed to run project: " + err.message)
                                    }
                                }}
                                className='p-2 px-4 bg-blue-600 hover:bg-blue-700 text-white transition-colors m-1 rounded flex items-center gap-2'>
                                <i className="ri-play-fill"></i>
                                Run
                            </button>
                        </div>
                    </div>

                    <div className="bottom flex flex-grow overflow-hidden">
                        {fileTree[currentFile] && (
                            <div className="code-editor-area h-full w-full overflow-auto bg-slate-950">
                                <pre className="hljs h-full w-full">
                                    <code
                                        className="hljs h-full outline-none block"
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const updatedContent = e.target.innerText
                                            const ft = {
                                                ...fileTree,
                                                [currentFile]: {
                                                    file: {
                                                        contents: updatedContent
                                                    }
                                                }
                                            }
                                            setFileTree(ft)
                                            saveFileTree(ft)
                                        }}
                                        dangerouslySetInnerHTML={{ 
                                            __html: hljs.highlight(
                                                fileTree[currentFile].file.contents,
                                                { language: 'javascript' }
                                            ).value 
                                        }}
                                        style={{
                                            whiteSpace: 'pre-wrap',
                                            padding: '1rem',
                                            minHeight: '100%'
                                        }}
                                    />
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

                {iframeUrl && webContainer && (
                    <div className="flex min-w-96 flex-col h-full border-l border-slate-700">
                        <div className="address-bar bg-slate-800 border-b border-slate-700">
                            <input 
                                type="text"
                                onChange={(e) => setIframeUrl(e.target.value)}
                                value={iframeUrl} 
                                className="w-full p-2 px-4 bg-slate-900 text-white border-none outline-none" />
                        </div>
                        <iframe src={iframeUrl} className="w-full h-full bg-white"></iframe>
                    </div>
                )}
            </section>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-4 rounded-lg w-96 max-w-full relative border border-slate-700">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold text-white'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2 text-slate-400 hover:text-slate-300'>
                                <i className="ri-close-fill"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
                            {users.map((usr, idx) => (
                                <div 
                                    key={usr._id || `user-${idx}`} 
                                    className={`user cursor-pointer hover:bg-slate-700 ${Array.from(selectedUserId).indexOf(usr._id) !== -1 ? 'bg-slate-700' : ""} p-2 flex gap-2 items-center rounded transition-colors`} 
                                    onClick={() => handleUserClick(usr._id)}>
                                    <div className='aspect-square relative rounded-full w-10 h-10 flex items-center justify-center text-white bg-slate-600'>
                                        <i className="ri-user-fill"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg text-white'>{usr.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors'>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Project
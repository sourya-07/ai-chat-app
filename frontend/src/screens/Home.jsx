import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'

const Home = () => {

    const { user } = useContext(UserContext)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ projectName, setProjectName ] = useState(null)
    const [ project, setProject ] = useState([])

    const navigate = useNavigate()

    function createProject(e) {
        e.preventDefault()
        console.log({ projectName })

        axios.post('/projects/create', {
            name: projectName,
        })
            .then((res) => {
                console.log(res)
                setIsModalOpen(false)
            })
            .catch((error) => {
                console.log(error)
            })
    }

    useEffect(() => {
        axios.get('/projects/all').then((res) => {
            setProject(res.data.projects)

        }).catch(err => {
            console.log(err)
        })

    }, [])

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#0d1117] via-[#171e29] to-[#23272e] flex flex-col sm:flex-row h-screen">
            {/* Sidebar */}
            <aside className="w-full sm:w-72 bg-[#161b22] border-r border-[#23272e] p-4 flex flex-col gap-3 min-h-0">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="project w-full p-4 mb-2 text-white bg-blue-700 border-0 rounded-xl shadow-md font-semibold flex items-center gap-2 hover:bg-blue-600 hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-sky-400 transition-all outline-none"
                >
                    New Chat
                    <i className="ri-add-line text-xl ml-2"></i>
                </button>
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-[#23272e]/60 scrollbar-track-transparent pr-1">
                    {project.map((project) => (
                        <div
                            key={project._id}
                            onClick={() => {
                                navigate(`/project`, { state: { project } })
                            }}
                            className="project w-full flex flex-col gap-2 cursor-pointer p-4 mb-2 bg-[#171e29] border border-[#23272e] rounded-lg shadow-sm text-white hover:bg-[#202c3b] hover:border-blue-700 hover:shadow-md hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-blue-700 active:scale-95 transition-all duration-150 outline-none"
                            tabIndex={0}
                        >
                            <h2 className="font-bold text-base text-white truncate tracking-wide">{project.name}</h2>
                            <div className="flex gap-2 items-center text-slate-400 text-xs">
                                <i className="ri-user-line"></i>
                                <span>{project.users.length} Collaborator{project.users.length !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>
            {/* Main area */}
            <section className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                <div className="text-slate-300 text-2xl font-light text-center">
                    Select a chat to view details...
                </div>
            </section>
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-30 animate-fadein">
                    <div className="bg-[#23272e] p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 relative">
                        <h2 className="text-2xl mb-6 font-semibold text-white text-center">Create New Chat</h2>
                        <form onSubmit={createProject}>
                            <div className="mb-5">
                                <label className="block text-slate-300 text-sm mb-2">Chat Name</label>
                                <input
                                    onChange={(e) => setProjectName(e.target.value)}
                                    value={projectName}
                                    type="text"
                                    className="mt-1 block w-full p-3 rounded-md border border-slate-600 bg-[#171e29] text-slate-100 placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-900/40 outline-none"
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <button type="button" className="mr-2 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-md font-semibold transition">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Home
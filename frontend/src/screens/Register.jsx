import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'

const Register = () => {

    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')

    const { setUser } = useContext(UserContext)

    const navigate = useNavigate()


    function submitHandler(e) {

        e.preventDefault()

        axios.post('/users/register', {
            email,
            password
        }).then((res) => {
            console.log(res.data)
            localStorage.setItem('token', res.data.token)
            setUser(res.data.user)
            navigate('/')
        }).catch((err) => {
            console.log(err.response.data)
        })
    }


    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d1117] via-[#171e29] to-[#23272e]">
            <div
                tabIndex={0}
                className="bg-[#171e29] rounded-xl shadow-lg border border-[#23272e] px-8 py-10 w-full max-w-md outline-none transition-transform transition-shadow duration-200
                hover:shadow-2xl hover:scale-[1.025] hover:ring-2 hover:ring-blue-900
                focus-within:shadow-2xl focus-within:scale-[1.025] focus-within:ring-2 focus-within:ring-blue-900
                active:scale-95 active:shadow-md cursor-pointer"
            >
                <h2 className="text-2xl font-semibold text-white mb-8 text-center">Create account</h2>
                <form onSubmit={submitHandler}>
                    <div className="mb-6">
                        <label className="block text-slate-300 text-sm mb-2" htmlFor="email">Email</label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            id="email"
                            className="w-full p-3 rounded-md border border-slate-700 bg-[#23272e] text-slate-50 focus:border-blue-700 focus:ring-2 focus:ring-blue-900/50 outline-none transition placeholder:text-slate-400"
                            placeholder="Enter your email"
                            autoComplete="off"
                        />
                    </div>
                    <div className="mb-8">
                        <label className="block text-slate-300 text-sm mb-2" htmlFor="password">Password</label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="password"
                            className="w-full p-3 rounded-md border border-slate-700 bg-[#23272e] text-slate-50 focus:border-blue-700 focus:ring-2 focus:ring-blue-900/50 outline-none transition placeholder:text-slate-400"
                            placeholder="Enter your password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full p-3 rounded-md bg-blue-700 hover:bg-blue-600 text-white font-semibold shadow-sm transition"
                    >
                        Register
                    </button>
                </form>
                <p className="text-slate-400 mt-7 text-center text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-sky-400 hover:underline font-medium">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default Register
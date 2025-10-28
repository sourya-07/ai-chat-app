import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY)

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `You are an expert in MERN and Development, you always write code in modular and break the code in the possible way follow best practices, You use understandable comments in the code, You create files as needed, You write code while maintaining the working of previous code, You always write code that is scalable and maintainable, In your code you always handle the errors and exceptions.`
})

export const generateResult = async(prompt) => {
    const result = await model.generateContent(prompt)
    return result.response.text()
}
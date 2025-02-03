"use client";
import { useState, useRef, useEffect } from "react";
import { Paperclip, Mic, CornerDownLeft } from "lucide-react";
import { chatSession } from "./GeminiAIModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import cpp from "highlight.js/lib/languages/cpp";
import java from "highlight.js/lib/languages/java";
import csharp from "highlight.js/lib/languages/csharp";
import go from "highlight.js/lib/languages/go";
import "highlight.js/styles/monokai.css";
import { TextShimmer } from "./TextShimmer"; 
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("java", java);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("go", go);


const isCodingProblem = (message) => {
  const trimmed = message.trim();
  const words = trimmed.split(/\s+/);
  if (words.length === 1) {
    const bannedWords = new Set(["hi", "hello", "hey", "thanks", "bye", "goodbye", "please"]);
    if (bannedWords.has(trimmed.toLowerCase())) {
      return false;
    }
    return true;
  }
  const codingKeywords = /\b(function|array|loop|algorithm|sort|search|data structure|linked list|tree|graph|time complexity|space complexity|brute force|optimal|code|problem|program|coding|fibonacci)\b/i;
  return codingKeywords.test(trimmed);
};

const generatePrompt = (problemStatement, language) => {
  return `Provide the following information for the given coding problem statement, specifically in ${language}:

Problem Statement: ${problemStatement}

1. Brute Force Approach:
   - Code implementation (if possible, otherwise describe the approach)
   - Explanation
   - Time and Space Complexity
   - Dry run (show the execution steps with example input)

2. Better Approach:
   - Code implementation (if possible, otherwise describe the approach)
   - Explanation
   - Time and Space Complexity
   - Dry run (show the execution steps with example input)

3. Optimal Approach:
   - Code implementation (if possible, otherwise describe the approach)
   - Explanation
   - Time and Space Complexity
   - Dry run (show the execution steps with example input)

4. Edge Cases to Remember:
   - List any edge cases or special considerations for this problem.

Respond in a clear and structured format. Use code blocks (\`\`\`${language} ... \`\`\`) for code implementations, matching the selected language. If a code implementation is not possible, clearly explain the approach. Ensure the code is directly copyable. Return code in separate code blocks from explanations.`;
};

export default function Page() {
  const [messages, setMessages] = useState([
    { id: 1, content: "Hello! Please provide a coding problem statement.", sender: "ai" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const messageContainerRef = useRef(null);
  const recognitionRef = useRef(null);


  useEffect(() => {
    if (typeof window !== "undefined" && messageContainerRef.current) {
      messageContainerRef.current.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  }, [messages]);


  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + " " + transcript);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleSendMessage = async () => {
    const userMessage = input.trim();
    if (!userMessage) return;

    setMessages((prevMessages) => [
      ...prevMessages,
      { id: prevMessages.length + 1, content: userMessage, sender: "user" },
    ]);
    setInput("");

    if (!isCodingProblem(userMessage)) {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, content: "Invalid input. Please provide a coding problem statement.", sender: "ai" },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const prompt = generatePrompt(userMessage, selectedLanguage);
      const result = await chatSession.sendMessage(prompt);
      const aiResponse = await result.response.text();
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: prevMessages.length + 1, content: aiResponse, sender: "ai" },
      ]);
    } catch (error) {
      console.error("Error processing request:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: prevMessages.length + 1, content: "Error: Could not process the request.", sender: "ai" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      if (isRecording) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
      setIsRecording(!isRecording);
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#1c1c1c",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        margin: 0,
        padding: 0,
      }}
    >
      
      <nav
        style={{
          height: "60px",
          backgroundColor: "#2d2d2d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.5)",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#007bff", margin: 0 }}>CodeGenAI</h1>
      </nav>

      
      <div
        ref={messageContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "80px 20px 120px", // top padding increased to account for navbar height
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              alignSelf: message.sender === "user" ? "flex-end" : "flex-start",
              backgroundColor: message.sender === "user" ? "#007bff" : "#333",
              color: "#fff",
              padding: "12px",
              borderRadius: "12px",
              maxWidth: "70%",
              wordWrap: "break-word",
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        ))}
        {isLoading && (
          <div
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#333",
              color: "#fff",
              padding: "12px",
              borderRadius: "12px",
              maxWidth: "70%",
              wordWrap: "break-word",
            }}
          >
            <TextShimmer duration={1} spread={2}>
              Generating code...
            </TextShimmer>
          </div>
        )}
      </div>

      
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "90%",
          padding: "12px 18px",
          backgroundColor: "#2d2d2d",
          borderRadius: "30px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)",
        }}
      >
        

        <input
          type="text"
          placeholder="Type a coding problem statement..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          style={{
            flex: 1,
            padding: "12px",
            backgroundColor: "#333",
            color: "white",
            borderRadius: "20px",
            border: "none",
            fontSize: "16px",
            outline: "none",
          }}
        />

        <button
          onClick={handleSendMessage}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "50%",
            padding: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
          }}
        >
          {isLoading ? "..." : <CornerDownLeft size={22} />}
        </button>

        <button
          onClick={handleVoiceInput}
          style={{
            background: "none",
            border: "none",
            color: isRecording ? "#ff4d4d" : "#999",
            cursor: "pointer",
          }}
        >
          <Mic size={20} />
        </button>

        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "5px",
            backgroundColor: "#333",
            color: "white",
            border: "none",
          }}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="csharp">C#</option>
          <option value="go">Go</option>
        </select>
      </div>
    </div>
  );
}

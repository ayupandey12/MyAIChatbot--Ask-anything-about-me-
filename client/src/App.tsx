import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import heroImg from './assets/hero.png'
import './App.css'

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

const apiUrl = import.meta.env.VITE_API_URL 

const suggestions = [
  'What does Ayush specialize in?',
  'Tell me about his projects',
  'What technologies does he use?',
]

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const conversationRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    conversationRef.current?.scrollTo({
      top: conversationRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  const startNewChat = () => {
    requestIdRef.current += 1
    abortRef.current?.abort()
    abortRef.current = null
    setMessages([])
    setInput('')
    setError('')
    setIsLoading(false)
    textareaRef.current?.focus()
  }

  const sendMessage = async (messageText = input) => {
    const content = messageText.trim()
    if (!content || isLoading) return

    const requestId = ++requestIdRef.current
    const controller = new AbortController()
    abortRef.current = controller
    const userMessage: ChatMessage = {
      id: `${requestId}-user`,
      role: 'user',
      content,
    }
    const assistantId = `${requestId}-assistant`
    const conversation: ChatMessage[] = [...messages, userMessage]

    setInput('')
    setError('')
    setIsLoading(true)
    setMessages([
      ...conversation,
      { id: assistantId, role: 'assistant', content: '' },
    ])

    try {
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          messages: conversation.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const detail = await response.text()
        throw new Error(detail || `The server returned ${response.status}.`)
      }
      if (!response.body) {
        throw new Error('The server did not return a response stream.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let receivedOutput = false
      let eventBuffer = ''

      const appendEvent = (event: string) => {
        const data = event
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n')

        if (!data) return

        const chunk: unknown = JSON.parse(data)
        if (typeof chunk !== 'string') {
          throw new Error('The server returned an invalid stream event.')
        }

        receivedOutput = true
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + chunk }
              : message,
          ),
        )
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          eventBuffer += decoder.decode()
          break
        }

        eventBuffer += decoder.decode(value, { stream: true })
        const events = eventBuffer.split(/\r?\n\r?\n/)
        eventBuffer = events.pop() ?? ''
        if (requestIdRef.current === requestId) {
          events.forEach(appendEvent)
        }
      }

      if (eventBuffer.trim() && requestIdRef.current === requestId) {
        appendEvent(eventBuffer)
      }
      if (!receivedOutput) {
        throw new Error('The server returned an empty response.')
      }
    } catch (caught) {
      if (controller.signal.aborted || requestIdRef.current !== requestId) return
      setMessages((current) =>
        current.filter(
          (message) => message.id !== assistantId && message.id !== userMessage.id,
        ),
      )
      setInput(content)
      setError(
        caught instanceof Error
          ? `Couldn't get a response. ${caught.message}`
          : "Couldn't get a response. Please try again.",
      )
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false)
        abortRef.current = null
      }
    }
  }

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage()
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  return (
    <main className="chat-app">
      <aside className="sidebar" aria-label="Chat options">
        <a className="brand" href="/" aria-label="Ayush AI home">
          <img src={heroImg} alt="" className="brand-mark" />
          <span>ayush<span className="brand-dot">.</span></span>
        </a>

        <button className="new-chat-button" onClick={startNewChat} type="button">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>New chat</span>
        </button>

        <div className="sidebar-caption">YOUR ASSISTANT</div>
        <div className="assistant-card">
          <span className="assistant-avatar">A</span>
          <span className="assistant-card-copy">
            <strong>Ayush’s AI</strong>
            <small>Ask me anything about Ayush</small>
          </span>
          <span className="online-indicator" aria-label="Online" />
        </div>

        <div className="sidebar-footer">
          <span className="footer-avatar">AP</span>
          <span className="footer-copy">
            <strong>Ayush Pandey</strong>
            <small>Personal portfolio</small>
          </span>
          <svg className="footer-menu" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="5" cy="12" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
          </svg>
        </div>
      </aside>

      <section className="chat-panel">
        <header className="topbar">
          <div className="topbar-title">
            <span>Ayush’s AI</span>
            <span className="topbar-badge">About Ayush</span>
          </div>
          <button
            className="topbar-new-chat"
            onClick={startNewChat}
            type="button"
            aria-label="Start a new chat"
            title="Start a new chat"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </header>

        <div className="conversation" ref={conversationRef} aria-live="polite">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-mark">
                <img src={heroImg} alt="" />
              </div>
              <span className="eyebrow">YOUR CURIOSITY, ANSWERED</span>
              <h1>Get to know Ayush.</h1>
              <p>
                Ask me about his experience, projects, skills, or anything else
                you’re curious about.
              </p>
              <div className="suggestions" aria-label="Suggested questions">
                {suggestions.map((suggestion) => (
                  <button
                    className="suggestion"
                    key={suggestion}
                    onClick={() => void sendMessage(suggestion)}
                    type="button"
                    disabled={isLoading}
                  >
                    <span>{suggestion}</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7 17 17 7M7 7h10v10" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message) => (
                <article className={`message message-${message.role}`} key={message.id}>
                  {message.role === 'assistant' && (
                    <span className="message-avatar" aria-hidden="true">A</span>
                  )}
                  <div className="message-content">
                    {message.role === 'assistant' && (
                      <span className="message-label">Ayush’s AI</span>
                    )}
                    {message.content ? (
                      <p>{message.content}</p>
                    ) : (
                      <span className="typing-indicator" aria-label="Ayush’s AI is typing">
                        <i /><i /><i />
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="composer-area">
          {error && (
            <div className="error-message" role="alert">
              <span>{error}</span>
              <button onClick={() => setError('')} type="button" aria-label="Dismiss error">
                ×
              </button>
            </div>
          )}
          <form className="composer" onSubmit={submitMessage}>
            <textarea
              aria-label="Message Ayush's AI"
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Ask anything about Ayush..."
              rows={1}
              disabled={isLoading}
            />
            <div className="composer-bottom">
              <span className="composer-hint">
                <span className="sparkle">✳</span>
                Grounded in Ayush’s real experience
              </span>
              <button
                className="send-button"
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                {isLoading ? (
                  <span className="send-loading" />
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                )}
              </button>
            </div>
          </form>
          <p className="disclaimer">
            AI can make mistakes. Please verify important information.
          </p>
        </div>
      </section>
    </main>
  )
}

export default App

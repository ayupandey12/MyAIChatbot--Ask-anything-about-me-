## Personal AI chatbot API

The FastAPI app is in `index.py` alongside the existing chatbot setup. It
accepts questions about Ayush and streams the Groq answer as plain text.

### Run locally

From the `server` directory, install the project dependencies:

```sh
uv sync
```

Create a `.env` file containing:

```env
GROQ_API_KEY=your_groq_api_key
```

Start the API with:

```sh
uv run uvicorn index:app --reload
```

The API is available at `http://localhost:8000`. Interactive API docs are at
`http://localhost:8000/docs`.

### Stream a response

Send a JSON request to `POST /chat`:

```json
{"question": "What projects has Ayush worked on?"}
```

The response body is streamed as plain text. A browser frontend can read it
incrementally:

```js
const response = await fetch("http://localhost:8000/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ question }),
});

if (!response.ok || !response.body) {
  throw new Error(`Chat request failed: ${response.status}`);
}

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  onAnswerChunk(decoder.decode(value, { stream: true }));
}
```

For a deployed frontend on a different origin, set `FRONTEND_ORIGINS` in the
server environment to a comma-separated list of allowed origins. It defaults
to `*` for this public, unauthenticated chatbot API.
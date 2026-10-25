from groq import Groq
from dotenv import load_dotenv
from pypdf import PdfReader
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator, model_validator
import os
import json
from collections.abc import Iterator
from typing import Literal

file_path='./ayushresumemain-1.pdf'
if not os.path.exists(file_path):
      raise FileNotFoundError(f"File not found at: {file_path}")
w=PdfReader(file_path)
aboutme="";
for page in w.pages:
       aboutme=aboutme+page.extract_text()

aboutme +=""" 
   additional i have done leetcode and i have contest ranking about 1590 . in leetcode i solved 650 questions .I done my 10th form svm inter college and i got 78.33 percentage in 2018.
   I made a app name autotweet which tweets on behalf of user in their tweeter account, it uses bullmq,redis,next.js,node.js,express.js as tech stack.
   linkdein url:-"https://www.linkedin.com/in/ayush-pandey-351509263/",
   github url:-"https://github.com/ayupandey12",
   portfolio url:-" https://portfolio-phi-sable-56.vercel.app/"
   paynow projecturl:-"https://github.com/ayupandey12/Paynow",
   blogbook projecturl:-"https://blogbook-eight.vercel.app/",
   gupshup projecturl:-"https://gupshup-web.vercel.app/",
   resume -" https://drive.google.com/file/d/1xj6Wk6oBZkrUSkikjTWngRy0lXfQjl5s/view?usp=drive_link",
   twitter url:-" https://x.com/ayu_dev1"
"""
load_dotenv()
my_apikey =os.getenv("GROQ_API_KEY")
if not my_apikey:
    raise ValueError("key is not find")
client=Groq(api_key=my_apikey)
model="openai/gpt-oss-120b"
system_prompt=f"""
ROLE: you are my personal AIchat bot , who knows everthing about me which is in ${aboutme}. you have to read all thing which is in ${aboutme} and then if someone ask anything about me then you have to ans him from this ${aboutme}.
     don't add any thing by your self and don't lie someone about me .

TASK: Anyone ask you about me or my work , tech stack all things so you have to ans him but don't add anything by your self . just give him true knowledge from ${aboutme}.

CONSTRAINT: Any one ask about my technicall thing which can help him to know about me for the role he is looking for . if someask anything other which is not related/personal details as mother name ,father name,height etc  to me don't ans him just say it is not allowed.

OUTPUT FORMAT: Give them about that from ${aboutme} in two ,one liner, don't use *,#or other which is not usefull.

ONE SHOT: example - someone ask what ayush know in frontend so read the thing form ${aboutme} and then answer react,js,next.js .
          example - someone ask who is shivansh so answer it is not about ayush , ask me any thing only about ayush.

FALLBACK: Ask only about ayush , i am his AICHATBOT.
"""

app = FastAPI(title="Ayush's Personal AI Chatbot")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("FRONTEND_ORIGINS", "*").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, content: str) -> str:
        content = content.strip()
        if not content:
            raise ValueError("Message content must not be blank.")
        return content


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)

    @model_validator(mode="after")
    def last_message_must_be_from_user(self) -> "ChatRequest":
        if self.messages[-1].role != "user":
            raise ValueError("The last message must be from the user.")
        return self


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/chat")
def chat(request: ChatRequest) -> StreamingResponse:
    completion_stream = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            *[
                {"role": message.role, "content": message.content}
                for message in request.messages
            ],
        ],
        model=model,
        stream=True,
    )

    def response_chunks() -> Iterator[str]:
        try:
            for chunk in completion_stream:
                if not chunk.choices:
                    continue
                content = chunk.choices[0].delta.content
                if content:
                    yield f"data: {json.dumps(content, ensure_ascii=False)}\n\n"
        finally:
            completion_stream.close()

    return StreamingResponse(
        response_chunks(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    )

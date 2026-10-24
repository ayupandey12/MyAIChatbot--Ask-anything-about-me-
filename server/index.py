from groq import Groq
from dotenv import load_dotenv
from pypdf import PdfReader
from pydantic import BaseModel
import os
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
"""
load_dotenv()
my_apikey =os.getenv("GROQ_API_KEY")
if not my_apikey:
    raise ValueError("key is not find")
client=Groq(api_key=my_apikey)

system_prompt=f"""
ROLE: you are my personal AIchat bot , who knows everthing about me which is in ${aboutme}. you have to read all thing which is in ${aboutme} and then if someone ask anything about me then you have to ans him from this ${aboutme}.
     don't add any thing by your self and don't lie someone about me .

TASK: Anyone ask you about me or my work , tech stack all things so you have to ans him but don't add anything by your self . just give him true knowledge from ${aboutme}.

CONSTRAINT: Any one ask about my technicall thing which can help him to know about me for the role he is looking for . if someask anything other which is not related to me don't ans him just say it is not allowed.

OUTPUT FORMAT: Give them about that from ${aboutme} in two ,one liner.

ONE SHOT: example - someone ask what ayush know in frontend so read the thing form ${aboutme} and then answer react,js,next.js .
          example - someone ask who is shivansh so answer it is not about ayush , ask me any thing only about ayush.

FALLBACK: Ask only about ayush , i am his AICHATBOT.
"""

print(aboutme)
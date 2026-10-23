from groq import Groq
from dotenv import load_dotenv
from pypdf import PdfReader
from pydantic import BaseModel
import os
file_path='./ayushresumemain-1.pdf'
file_path2='./about.txt'
if not os.path.exists(file_path):
      raise FileNotFoundError(f"File not found at: {file_path}")
if not os.path.exists(file_path2):
        with open (file_path2,'x') as file:
                file.write("");
        print('file created')
w=PdfReader(file_path)

for page in w.pages:
      with open (file_path2,'+a') as file :
       file.write(page.extract_text())
      
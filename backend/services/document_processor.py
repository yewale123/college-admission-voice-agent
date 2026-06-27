import os
from pathlib import Path
from typing import List
from langchain.schema import Document
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter


text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""],
)


def load_document(file_path: str, filename: str) -> List[Document]:
    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        loader = PyPDFLoader(file_path)
    elif ext in (".docx", ".doc"):
        loader = Docx2txtLoader(file_path)
    elif ext == ".txt":
        loader = TextLoader(file_path, encoding="utf-8")
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    docs = loader.load()
    for doc in docs:
        doc.metadata["source_file"] = filename
    return docs


def split_documents(docs: List[Document]) -> List[Document]:
    return text_splitter.split_documents(docs)


def process_file(file_path: str, filename: str) -> List[Document]:
    docs = load_document(file_path, filename)
    chunks = split_documents(docs)
    return chunks

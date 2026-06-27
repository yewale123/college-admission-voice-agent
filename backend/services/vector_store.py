import os
from typing import List, Optional
from langchain.schema import Document
from langchain_chroma import Chroma
from langchain_community.embeddings import FastEmbedEmbeddings
from config import settings

_vector_store: Optional[Chroma] = None
_embeddings = None


def _get_embeddings():
    global _embeddings
    if _embeddings is None:
        # FastEmbed uses ONNX — no PyTorch or GPU needed
        _embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    return _embeddings


def get_vector_store() -> Chroma:
    global _vector_store
    if _vector_store is None:
        os.makedirs(settings.CHROMA_DIR, exist_ok=True)
        _vector_store = Chroma(
            collection_name="college_admission_docs",
            embedding_function=_get_embeddings(),
            persist_directory=settings.CHROMA_DIR,
        )
    return _vector_store


def add_documents(chunks: List[Document], document_id: int) -> int:
    store = get_vector_store()
    for chunk in chunks:
        chunk.metadata["document_id"] = document_id
    store.add_documents(chunks)
    return len(chunks)


def delete_document_chunks(document_id: int):
    store = get_vector_store()
    results = store.get(where={"document_id": document_id})
    if results and results.get("ids"):
        store.delete(ids=results["ids"])


def search_similar(query: str, k: int = 5) -> List[Document]:
    store = get_vector_store()
    return store.similarity_search(query, k=k)


def get_retriever(k: int = 5):
    store = get_vector_store()
    return store.as_retriever(search_kwargs={"k": k})

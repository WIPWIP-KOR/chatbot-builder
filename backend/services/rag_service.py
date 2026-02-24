import os
import chromadb
from pypdf import PdfReader
from docx import Document as DocxDocument
from typing import List


UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads"))
CHROMA_DIR = os.getenv("CHROMA_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db"))

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CHROMA_DIR, exist_ok=True)

chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)


def _get_collection_name(chatbot_id: int) -> str:
    return f"chatbot_{chatbot_id}"


def parse_pdf(file_path: str) -> str:
    """Extract text from a PDF file."""
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text


def parse_docx(file_path: str) -> str:
    """Extract text from a Word document."""
    doc = DocxDocument(file_path)
    text = ""
    for paragraph in doc.paragraphs:
        if paragraph.text.strip():
            text += paragraph.text + "\n"
    return text


def parse_txt(file_path: str) -> str:
    """Read a plain text file."""
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def parse_document(file_path: str, file_type: str) -> str:
    """Parse document based on its type."""
    parsers = {
        "pdf": parse_pdf,
        "docx": parse_docx,
        "txt": parse_txt,
    }
    parser = parsers.get(file_type)
    if not parser:
        raise ValueError(f"Unsupported file type: {file_type}")
    return parser(file_path)


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk.strip())
        start = end - overlap
    return chunks


def add_document_to_vectordb(chatbot_id: int, document_id: int, text: str) -> int:
    """Add document chunks to ChromaDB and return chunk count."""
    collection = chroma_client.get_or_create_collection(
        name=_get_collection_name(chatbot_id)
    )

    chunks = chunk_text(text)
    if not chunks:
        return 0

    ids = [f"doc_{document_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"document_id": document_id, "chunk_index": i} for i in range(len(chunks))]

    collection.add(
        documents=chunks,
        ids=ids,
        metadatas=metadatas,
    )

    return len(chunks)


def query_vectordb(chatbot_id: int, query: str, n_results: int = 5) -> List[str]:
    """Query ChromaDB and return relevant document chunks."""
    collection_name = _get_collection_name(chatbot_id)

    try:
        collection = chroma_client.get_collection(name=collection_name)
    except Exception:
        return []

    if collection.count() == 0:
        return []

    results = collection.query(
        query_texts=[query],
        n_results=min(n_results, collection.count()),
    )

    if results and results["documents"]:
        return results["documents"][0]
    return []


def delete_document_from_vectordb(chatbot_id: int, document_id: int):
    """Remove all chunks of a document from ChromaDB."""
    collection_name = _get_collection_name(chatbot_id)

    try:
        collection = chroma_client.get_collection(name=collection_name)
        # Get all IDs that belong to this document
        all_data = collection.get(
            where={"document_id": document_id}
        )
        if all_data["ids"]:
            collection.delete(ids=all_data["ids"])
    except Exception:
        pass


def delete_chatbot_collection(chatbot_id: int):
    """Delete entire collection for a chatbot."""
    collection_name = _get_collection_name(chatbot_id)
    try:
        chroma_client.delete_collection(name=collection_name)
    except Exception:
        pass

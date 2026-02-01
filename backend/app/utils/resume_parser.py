"""
Resume Text Extraction Utilities
"""

import os
from typing import Optional, Dict, Any
import PyPDF2
import docx


def extract_pdf_text(file_path: str) -> str:
    """Extract text from PDF."""
    text = []
    try:
        with open(file_path, "rb") as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text.append(page_text)
        return "\n".join(text)
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""


def extract_docx_text(file_path: str) -> str:
    """Extract text from DOCX."""
    try:
        doc = docx.Document(file_path)
        paragraphs = [
            paragraph.text for paragraph in doc.paragraphs if paragraph.text.strip()
        ]
        return "\n".join(paragraphs)
    except Exception as e:
        print(f"DOCX extraction error: {e}")
        return ""


# CHANGE: Remove async - make it synchronous
def extract_resume_text(file_path: str) -> Optional[str]:
    """
    Extract text from PDF or DOCX resume.

    Args:
        file_path: Path to the resume file

    Returns:
        Extracted text or None if extraction fails
    """
    try:
        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".pdf":
            return extract_pdf_text(file_path)
        elif ext in [".docx", ".doc"]:
            return extract_docx_text(file_path)
        else:
            print(f"Unsupported file format: {ext}")
            return None

    except Exception as e:
        print(f"Resume text extraction failed: {e}")
        return None


# CHANGE: Remove async - make it synchronous
def parse_resume_content(file_path: str) -> Dict[str, Any]:
    """
    Parse resume and extract structured content.

    This is a wrapper around extract_resume_text that returns
    a dictionary with parsed data.

    Args:
        file_path: Path to the resume file

    Returns:
        Dictionary with parsed resume data
    """
    try:
        # Extract raw text (now synchronous)
        text = extract_resume_text(file_path)

        if not text:
            return {
                "success": False,
                "text": None,
                "error": "Could not extract text from resume",
            }

        return {
            "success": True,
            "text": text,
            "file_path": file_path,
            "file_type": os.path.splitext(file_path)[1].lower(),
            "error": None,
        }

    except Exception as e:
        return {"success": False, "text": None, "error": str(e)}

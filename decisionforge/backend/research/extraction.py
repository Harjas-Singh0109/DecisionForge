import logging
import httpx
from typing import Optional, Dict, Any
from bs4 import BeautifulSoup

try:
    import trafilatura
    TRAFILATURA_AVAILABLE = True
except ImportError:
    TRAFILATURA_AVAILABLE = False

logger = logging.getLogger("decisionforge.extraction")

def extract_article_content(url: str, html_content: Optional[str] = None) -> Dict[str, Any]:
    """
    Extracts text, title, and metadata from URL or raw HTML using Trafilatura or BeautifulSoup.
    """
    if not html_content:
        try:
            with httpx.Client(timeout=1.5, follow_redirects=True, headers={"User-Agent": "DECISIONFORGE/1.0"}) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    html_content = resp.text
        except Exception as e:
            logger.debug(f"Could not fetch {url}: {e}")
            return {
                "title": "",
                "text": "",
                "author": None,
                "date": None,
                "error": str(e)
            }

    if not html_content:
        return {"title": "", "text": "", "author": None, "date": None, "error": "No content"}

    # Attempt Trafilatura extraction
    if TRAFILATURA_AVAILABLE:
        try:
            extracted_text = trafilatura.extract(html_content, include_comments=False, include_tables=True)
            metadata = trafilatura.extract_metadata(html_content)
            title = metadata.title if metadata and metadata.title else None
            date = metadata.date if metadata and metadata.date else None
            author = metadata.author if metadata and metadata.author else None

            if extracted_text and len(extracted_text.strip()) > 50:
                return {
                    "title": title or "Source Document",
                    "text": extracted_text[:8000],  # Keep reasonable size
                    "author": author,
                    "date": date,
                    "error": None
                }
        except Exception as e:
            logger.debug(f"Trafilatura failed, falling back: {e}")

    # Fallback to BeautifulSoup
    try:
        soup = BeautifulSoup(html_content, "html.parser")
        title_el = soup.find("title")
        title = title_el.get_text().strip() if title_el else "Source Document"

        # Remove scripts and styles
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
            tag.decompose()

        paragraphs = [p.get_text().strip() for p in soup.find_all("p") if len(p.get_text().strip()) > 30]
        text = "\n\n".join(paragraphs)

        return {
            "title": title,
            "text": text[:8000],
            "author": None,
            "date": None,
            "error": None
        }
    except Exception as e:
        return {
            "title": "Document",
            "text": "",
            "author": None,
            "date": None,
            "error": str(e)
        }

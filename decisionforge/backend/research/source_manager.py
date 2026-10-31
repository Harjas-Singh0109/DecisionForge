import logging
from typing import List, Dict, Any, Optional
from backend.database import crud
from backend.research.search import search_sources
from backend.research.extraction import extract_article_content

logger = logging.getLogger("decisionforge.source_manager")

class SourceManager:
    def __init__(self, investigation_id: str):
        self.inv_id = investigation_id
        self._cache: Dict[str, str] = {}

    def search_and_ingest(self, query: str, agent_type: str = "general", max_sources: int = 4) -> List[Dict[str, Any]]:
        raw_sources = search_sources(query, agent_type=agent_type, max_results=max_sources)
        ingested = []

        for item in raw_sources:
            url = item.get("url", "")
            title = item.get("title", "Untitled Reference")
            publisher = item.get("publisher", "Independent Source")
            pub_date = item.get("publication_date")
            content = item.get("content")
            source_type = item.get("source_type", "web")
            reliability = item.get("reliability_score", 0.85)

            # If content not already present (e.g. from GDELT), fetch and extract with Trafilatura
            if not content and url.startswith("http"):
                try:
                    extracted = extract_article_content(url)
                    content = extracted.get("text")
                    if extracted.get("title") and title == "News Article":
                        title = extracted["title"]
                    if extracted.get("date") and not pub_date:
                        pub_date = extracted["date"]
                except Exception as e:
                    logger.debug(f"Extraction failed for {url}: {e}")
                    content = f"Summary report from {publisher}: {title}"

            if not content:
                content = f"Source summary: {title} published by {publisher} ({pub_date or 'Recent'})."

            # Ingest into SQLite with URL deduplication
            source_id = crud.add_source(
                inv_id=self.inv_id,
                title=title,
                url=url,
                publisher=publisher,
                pub_date=pub_date,
                content=content,
                source_type=source_type,
                reliability=reliability
            )

            ingested.append({
                "id": source_id,
                "title": title,
                "url": url,
                "publisher": publisher,
                "publication_date": pub_date,
                "content": content,
                "source_type": source_type,
                "reliability_score": reliability
            })

        return ingested

    def get_all_sources(self) -> List[Dict[str, Any]]:
        return crud.get_sources(self.inv_id)

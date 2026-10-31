import sqlite3
import json
import uuid
from typing import List, Dict, Any, Optional
from backend.database.db import get_connection

def create_investigation(
    question: str,
    topic: Optional[str] = None,
    geographical_scope: Optional[str] = None,
    time_horizon: Optional[str] = None,
    investigation_id: Optional[str] = None
) -> str:
    inv_id = investigation_id or str(uuid.uuid4())
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO investigations (id, question, topic, geographical_scope, time_horizon, status)
        VALUES (?, ?, ?, ?, ?, 'draft')
    """, (inv_id, question, topic, geographical_scope, time_horizon))
    conn.commit()
    conn.close()
    return inv_id

def get_investigation(inv_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM investigations WHERE id = ?", (inv_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)

def list_investigations() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT i.*, 
               (SELECT COUNT(*) FROM sources WHERE investigation_id = i.id) as source_count,
               (SELECT COUNT(*) FROM claims WHERE investigation_id = i.id) as claim_count,
               (SELECT COUNT(*) FROM claims WHERE investigation_id = i.id AND evidence_quality = 'Verified support') as verified_claim_count
        FROM investigations i
        ORDER BY i.created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_investigation_status(inv_id: str, status: str, summary: Optional[str] = None, recommendation: Optional[str] = None, reasoning: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    if summary is not None and recommendation is not None:
        cursor.execute("""
            UPDATE investigations 
            SET status = ?, summary = ?, recommendation = ?, recommendation_reasoning = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (status, summary, recommendation, reasoning, inv_id))
    else:
        cursor.execute("""
            UPDATE investigations 
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (status, inv_id))
    conn.commit()
    conn.close()

def delete_investigation(inv_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM investigations WHERE id = ?", (inv_id,))
    conn.commit()
    conn.close()
    return True

# --- Alternatives ---
def add_alternative(inv_id: str, name: str, description: Optional[str] = None, alt_id: Optional[str] = None) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    # Dedup: return existing ID if the same (investigation_id, name) already exists
    cursor.execute(
        "SELECT id FROM alternatives WHERE investigation_id = ? AND name = ?",
        (inv_id, name)
    )
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return existing["id"]
    a_id = alt_id or str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO alternatives (id, investigation_id, name, description)
        VALUES (?, ?, ?, ?)
    """, (a_id, inv_id, name, description))
    conn.commit()
    conn.close()
    return a_id

def clear_alternatives(inv_id: str):
    """Remove all alternatives for an investigation (used before re-running agents)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM alternatives WHERE investigation_id = ?", (inv_id,))
    conn.commit()
    conn.close()

def get_alternatives(inv_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alternatives WHERE investigation_id = ?", (inv_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# --- Agents ---
def init_agents_for_investigation(inv_id: str):
    agent_names = [
        "Research Planner",
        "Literature Research Agent",
        "Data Research Agent",
        "Market Research Agent",
        "Impact Research Agent",
        "Critic Agent",
        "Evidence Verification Agent",
        "Contradiction Finder",
        "Decision Engine"
    ]
    conn = get_connection()
    cursor = conn.cursor()
    for name in agent_names:
        cursor.execute("""
            INSERT OR IGNORE INTO agents (id, investigation_id, agent_name, status, current_task, findings_count)
            VALUES (?, ?, ?, 'waiting', 'Pending initialization', 0)
        """, (f"{inv_id}_{name.lower().replace(' ', '_')}", inv_id, name))
    conn.commit()
    conn.close()

def update_agent_status(inv_id: str, agent_name: str, status: str, current_task: Optional[str] = None, output: Optional[str] = None, findings_count: Optional[int] = None):
    conn = get_connection()
    cursor = conn.cursor()
    agent_id = f"{inv_id}_{agent_name.lower().replace(' ', '_')}"
    
    query = "UPDATE agents SET status = ?"
    params = [status]
    
    if current_task is not None:
        query += ", current_task = ?"
        params.append(current_task)
    if output is not None:
        query += ", output = ?"
        params.append(output)
    if findings_count is not None:
        query += ", findings_count = ?"
        params.append(findings_count)
    if status == 'in_progress':
        query += ", started_at = CURRENT_TIMESTAMP"
    elif status in ['completed', 'failed']:
        query += ", completed_at = CURRENT_TIMESTAMP"
        
    query += " WHERE id = ?"
    params.append(agent_id)
    
    cursor.execute(query, tuple(params))
    conn.commit()
    conn.close()

def get_agents(inv_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM agents WHERE investigation_id = ? ORDER BY rowid ASC", (inv_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# --- Sources ---
def add_source(inv_id: str, title: str, url: str, publisher: Optional[str] = None, 
               pub_date: Optional[str] = None, content: Optional[str] = None, 
               source_type: str = "web", reliability: float = 0.85, source_id: Optional[str] = None) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    
    # Deduplicate by url in the same investigation
    cursor.execute("SELECT id FROM sources WHERE investigation_id = ? AND url = ?", (inv_id, url))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return existing[0]

    s_id = source_id or str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO sources (id, investigation_id, title, url, publisher, publication_date, extracted_content, source_type, reliability_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (s_id, inv_id, title, url, publisher, pub_date, content, source_type, reliability))
    conn.commit()
    conn.close()
    return s_id

def get_sources(inv_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sources WHERE investigation_id = ? ORDER BY retrieved_at DESC", (inv_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# --- Claims & Evidence ---
def add_claim(inv_id: str, claim_text: str, alternative_id: Optional[str] = None, 
              quality: str = "Unverified source", verification_status: str = "pending", 
              explanation: Optional[str] = None, agent_origin: Optional[str] = None,
              claim_id: Optional[str] = None) -> str:
    c_id = claim_id or str(uuid.uuid4())
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO claims (id, investigation_id, alternative_id, claim_text, evidence_quality, verification_status, explanation, agent_origin)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (c_id, inv_id, alternative_id, claim_text, quality, verification_status, explanation, agent_origin))
    conn.commit()
    conn.close()
    return c_id

def update_claim_verification(claim_id: str, quality: str, verification_status: str, explanation: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE claims 
        SET evidence_quality = ?, verification_status = ?, explanation = COALESCE(?, explanation)
        WHERE id = ?
    """, (quality, verification_status, explanation, claim_id))
    conn.commit()
    conn.close()

def add_evidence(claim_id: str, source_id: str, relationship_type: str = "supporting", 
                 supporting_excerpt: Optional[str] = None, verification_notes: Optional[str] = None,
                 evidence_id: Optional[str] = None) -> str:
    e_id = evidence_id or str(uuid.uuid4())
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO evidence (id, claim_id, source_id, relationship_type, supporting_excerpt, verification_notes)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (e_id, claim_id, source_id, relationship_type, supporting_excerpt, verification_notes))
    conn.commit()
    conn.close()
    return e_id

def get_evidence_network(inv_id: str) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get alternatives
    cursor.execute("SELECT * FROM alternatives WHERE investigation_id = ?", (inv_id,))
    alternatives = [dict(r) for r in cursor.fetchall()]
    
    # Get claims
    cursor.execute("SELECT * FROM claims WHERE investigation_id = ?", (inv_id,))
    claims = [dict(r) for r in cursor.fetchall()]
    
    # Get sources
    cursor.execute("SELECT * FROM sources WHERE investigation_id = ?", (inv_id,))
    sources = [dict(r) for r in cursor.fetchall()]
    
    # Get evidence edges
    cursor.execute("""
        SELECT e.*, c.investigation_id 
        FROM evidence e 
        JOIN claims c ON e.claim_id = c.id 
        WHERE c.investigation_id = ?
    """, (inv_id,))
    evidence_links = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    return {
        "alternatives": alternatives,
        "claims": claims,
        "sources": sources,
        "evidence_links": evidence_links
    }

# --- Scores ---
def save_score(inv_id: str, alt_id: str, criterion: str, raw_score: float, weight: float, weighted_score: float, explanation: str):
    conn = get_connection()
    cursor = conn.cursor()
    s_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO scores (id, investigation_id, alternative_id, criterion, raw_score, criterion_weight, weighted_score, explanation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (s_id, inv_id, alt_id, criterion, raw_score, weight, weighted_score, explanation))
    conn.commit()
    conn.close()

def get_scores(inv_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.*, a.name as alternative_name 
        FROM scores s
        JOIN alternatives a ON s.alternative_id = a.id
        WHERE s.investigation_id = ?
        ORDER BY s.criterion ASC, a.name ASC
    """, (inv_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def clear_scores(inv_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM scores WHERE investigation_id = ?", (inv_id,))
    conn.commit()
    conn.close()

# --- Scenarios ---
def save_scenario(inv_id: str, scenario_name: str, assumptions: Dict[str, Any], results: Dict[str, Any], scenario_id: Optional[str] = None) -> str:
    s_id = scenario_id or str(uuid.uuid4())
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO scenarios (id, investigation_id, scenario_name, assumptions, calculated_results)
        VALUES (?, ?, ?, ?, ?)
    """, (s_id, inv_id, scenario_name, json.dumps(assumptions), json.dumps(results)))
    conn.commit()
    conn.close()
    return s_id

def get_scenarios(inv_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scenarios WHERE investigation_id = ? ORDER BY created_at DESC", (inv_id,))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        item = dict(r)
        item["assumptions"] = json.loads(item["assumptions"])
        item["calculated_results"] = json.loads(item["calculated_results"])
        result.append(item)
    return result

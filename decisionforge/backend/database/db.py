import sqlite3
import json
from pathlib import Path
from typing import Generator
from backend.config import DB_PATH

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS investigations (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        topic TEXT,
        geographical_scope TEXT,
        time_horizon TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        summary TEXT,
        recommendation TEXT,
        recommendation_reasoning TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alternatives (
        id TEXT PRIMARY KEY,
        investigation_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        investigation_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'waiting',
        current_task TEXT,
        output TEXT,
        findings_count INTEGER DEFAULT 0,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        investigation_id TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        publisher TEXT,
        publication_date TEXT,
        retrieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        extracted_content TEXT,
        source_type TEXT DEFAULT 'web',
        reliability_score REAL DEFAULT 0.85,
        FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        investigation_id TEXT NOT NULL,
        alternative_id TEXT,
        claim_text TEXT NOT NULL,
        evidence_quality TEXT NOT NULL DEFAULT 'Unverified source',
        verification_status TEXT NOT NULL DEFAULT 'pending',
        explanation TEXT,
        agent_origin TEXT,
        FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
        FOREIGN KEY (alternative_id) REFERENCES alternatives(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS evidence (
        id TEXT PRIMARY KEY,
        claim_id TEXT NOT NULL,
        source_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL DEFAULT 'supporting',
        supporting_excerpt TEXT,
        verification_notes TEXT,
        FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
        FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scores (
        id TEXT PRIMARY KEY,
        investigation_id TEXT NOT NULL,
        alternative_id TEXT NOT NULL,
        criterion TEXT NOT NULL,
        raw_score REAL NOT NULL,
        criterion_weight REAL NOT NULL,
        weighted_score REAL NOT NULL,
        explanation TEXT,
        FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
        FOREIGN KEY (alternative_id) REFERENCES alternatives(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scenarios (
        id TEXT PRIMARY KEY,
        investigation_id TEXT NOT NULL,
        scenario_name TEXT NOT NULL,
        assumptions TEXT NOT NULL,
        calculated_results TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    conn.close()

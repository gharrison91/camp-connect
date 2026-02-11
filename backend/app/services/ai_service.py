"""
Camp Connect - AI Insights Service
Bullet-proof Claude integration: introspects the LIVE database schema,
generates SQL, executes read-only queries, and summarises results.
"""

from __future__ import annotations

import json
import re
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

# ---------------------------------------------------------------------------
# Schema cache — refreshed at most every 10 minutes
# ---------------------------------------------------------------------------

_schema_cache: Optional[str] = None
_schema_cache_ts: float = 0.0
_SCHEMA_TTL = 600  # seconds


async def _introspect_schema(db: AsyncSession) -> str:
    """
    Query information_schema to build an accurate, up-to-date description
    of every public table, its columns, types, nullability, and foreign keys.
    This is what Claude will use to write SQL — it can never reference a
    column that doesn't actually exist.
    """
    global _schema_cache, _schema_cache_ts

    now = time.time()
    if _schema_cache and (now - _schema_cache_ts) < _SCHEMA_TTL:
        return _schema_cache

    # 1. Columns
    col_rows = await db.execute(text("""
        SELECT table_name, column_name, data_type, is_nullable,
               column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name NOT IN ('alembic_version', 'schema_migrations')
        ORDER BY table_name, ordinal_position
    """))
    columns = col_rows.fetchall()

    # 2. Primary keys
    pk_rows = await db.execute(text("""
        SELECT kcu.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
    """))
    pks = {}
    for row in pk_rows.fetchall():
        pks.setdefault(row[0], set()).add(row[1])

    # 3. Foreign keys
    fk_rows = await db.execute(text("""
        SELECT
            kcu.table_name AS from_table,
            kcu.column_name AS from_column,
            ccu.table_name AS to_table,
            ccu.column_name AS to_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
          AND tc.table_schema = ccu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
    """))
    fks = {}
    for row in fk_rows.fetchall():
        fks.setdefault(row[0], {})[row[1]] = f"{row[2]}.{row[3]}"

    # Build human-readable schema text
    lines = [
        "-- PostgreSQL schema for Camp Connect (multi-tenant camp management).",
        "-- Every table uses UUID primary keys. Most tables are scoped by organization_id.",
        "-- Tables with is_deleted or deleted_at support soft-delete.",
        "",
    ]

    current_table = None
    table_cols: List[str] = []

    def _flush_table():
        nonlocal table_cols
        if current_table and table_cols:
            lines.append(f"TABLE {current_table} (")
            for c in table_cols:
                lines.append(f"  {c}")
            lines.append(")")
            lines.append("")
            table_cols = []

    for col_row in columns:
        tname, cname, dtype, nullable, default = col_row

        if tname != current_table:
            _flush_table()
            current_table = tname

        # Build column description
        parts = [cname]

        # Simplify type names
        type_map = {
            "uuid": "UUID",
            "character varying": "VARCHAR",
            "text": "TEXT",
            "boolean": "BOOL",
            "integer": "INT",
            "bigint": "BIGINT",
            "smallint": "SMALLINT",
            "numeric": "NUMERIC",
            "double precision": "FLOAT",
            "real": "FLOAT",
            "date": "DATE",
            "time without time zone": "TIME",
            "time with time zone": "TIMETZ",
            "timestamp without time zone": "TIMESTAMP",
            "timestamp with time zone": "TIMESTAMPTZ",
            "jsonb": "JSONB",
            "json": "JSON",
            "ARRAY": "ARRAY",
        }
        display_type = type_map.get(dtype, dtype.upper())
        parts.append(display_type)

        # PK?
        if cname in pks.get(tname, set()):
            parts.append("PK")

        # FK?
        fk_target = fks.get(tname, {}).get(cname)
        if fk_target:
            parts.append(f"FK->{fk_target}")

        # Nullable?
        if nullable == "NO" and cname not in pks.get(tname, set()):
            parts.append("NOT NULL")

        table_cols.append(" ".join(parts))

    _flush_table()  # flush last table

    schema_text = "\n".join(lines)

    # Cache it
    _schema_cache = schema_text
    _schema_cache_ts = now
    print(f"[AI] Schema introspected: {len(columns)} columns across {len(set(c[0] for c in columns))} tables ({len(schema_text)} chars)")

    return schema_text


# ---------------------------------------------------------------------------
# SQL safety validation
# ---------------------------------------------------------------------------

def validate_sql(sql: str) -> Tuple[bool, str]:
    """
    Validate that the generated SQL is safe to execute.
    Returns (is_valid, error_message).
    """
    if not sql or not sql.strip():
        return False, "Empty SQL query"

    cleaned = sql.strip().rstrip(";").strip()
    upper = cleaned.upper()

    # Must start with SELECT or WITH (CTE)
    if not (upper.startswith("SELECT") or upper.startswith("WITH")):
        return False, "Only SELECT queries are allowed"

    # Check for dangerous statement-level keywords
    dangerous_starters = [
        "INSERT", "UPDATE", "DROP", "ALTER", "TRUNCATE", "CREATE",
        "GRANT", "REVOKE", "EXECUTE", "COPY", "VACUUM", "REINDEX",
    ]
    for kw in dangerous_starters:
        if re.search(rf"(?:^|;)\s*{kw}\b", upper):
            return False, f"Forbidden keyword detected: {kw}"

    # Must not contain multiple statements
    if ";" in cleaned:
        return False, "Multiple statements are not allowed"

    return True, ""


# ---------------------------------------------------------------------------
# SQL extraction and cleanup
# ---------------------------------------------------------------------------

def _extract_sql(raw: str) -> str:
    """
    Extract and clean SQL from Claude's response.
    Handles: markdown fences, extra explanation text, trailing semicolons.
    This is the most critical function — it must reliably extract JUST the SQL.
    """
    text_val = raw.strip()

    # Strategy 1: If wrapped in markdown code fences, extract from there
    fence_match = re.search(r"```(?:sql)?\s*\n(.*?)```", text_val, re.DOTALL | re.IGNORECASE)
    if fence_match:
        text_val = fence_match.group(1).strip()
    else:
        # Strategy 2: If starts with ``` without closing, strip opening fence
        if text_val.startswith("```"):
            first_newline = text_val.find("\n")
            if first_newline != -1:
                text_val = text_val[first_newline + 1:]
            if text_val.rstrip().endswith("```"):
                text_val = text_val.rstrip()[:-3]
            text_val = text_val.strip()

    # Strategy 3: If there's extra text before the SQL, find the SELECT/WITH
    upper = text_val.upper()
    if not (upper.startswith("SELECT") or upper.startswith("WITH")
            or upper.startswith("NO_SQL_NEEDED") or upper.startswith("REFUSED")):
        # Try to find where the SQL starts
        select_match = re.search(r"(?:^|\n)((?:SELECT|WITH)\b.*)", text_val, re.DOTALL | re.IGNORECASE)
        if select_match:
            text_val = select_match.group(1).strip()

    # Strategy 4: If there's extra text AFTER the SQL (explanation after LIMIT),
    # find the last LIMIT clause and trim after it
    limit_match = re.search(r"(LIMIT\s+\d+)\s*;?\s*\n", text_val, re.IGNORECASE)
    if limit_match:
        # Keep everything up to and including the LIMIT clause
        end_pos = limit_match.end(1)
        text_val = text_val[:end_pos].strip()

    # Final cleanup
    text_val = text_val.strip().rstrip(";").strip()
    return text_val


# ---------------------------------------------------------------------------
# Suggested prompts
# ---------------------------------------------------------------------------

SUGGESTED_PROMPTS = [
    {"title": "Campers per event", "prompt": "How many campers are registered for each event?", "icon": "users"},
    {"title": "Total revenue", "prompt": "What is the total revenue from all payments?", "icon": "dollar-sign"},
    {"title": "Outstanding balances", "prompt": "Which families have outstanding invoice balances?", "icon": "alert-circle"},
    {"title": "Age breakdown", "prompt": "What is the age distribution of all campers?", "icon": "bar-chart"},
    {"title": "Registration status", "prompt": "Show me a breakdown of registration statuses across all events.", "icon": "clipboard"},
    {"title": "Staff overview", "prompt": "How many active staff members are there by department?", "icon": "briefcase"},
    {"title": "Bunk occupancy", "prompt": "What is the current bunk occupancy rate for each event?", "icon": "home"},
    {"title": "Recent activity", "prompt": "What registrations were created in the last 7 days?", "icon": "clock"},
    {"title": "Health form status", "prompt": "How many health forms are pending vs submitted vs reviewed?", "icon": "heart"},
    {"title": "Popular activities", "prompt": "Which activities have the most schedule assignments?", "icon": "star"},
    {"title": "Buddy requests", "prompt": "Show me all pending bunk buddy requests with mutual matches.", "icon": "heart"},
    {"title": "Waitlist summary", "prompt": "How many campers are on the waitlist for each event?", "icon": "list"},
]


# ---------------------------------------------------------------------------
# Entity type mapping — tells the frontend what kind of link each ID is
# ---------------------------------------------------------------------------

# Maps column alias patterns to entity types for clickable links
ENTITY_LINK_MAP = {
    "camper_id": "campers",
    "contact_id": "contacts",
    "family_id": "families",
    "event_id": "events",
    "staff_id": "staff",
    "registration_id": "registrations",
    "activity_id": "activities",
    "user_id": "staff",
}


# ---------------------------------------------------------------------------
# Core AI chat handler
# ---------------------------------------------------------------------------

async def chat(
    db: AsyncSession,
    organization_id: uuid.UUID,
    messages: List[Dict[str, str]],
    user_name: str = "User",
) -> Dict[str, Any]:
    """
    Main AI chat endpoint.

    Phase 0 — Introspect the live database schema.
    Phase 1 — Ask Claude to generate a SQL query from the user's question.
    Phase 2 — Execute the query (read-only, scoped to org, row-limited).
    Phase 2b — If query fails, retry once with the error message.
    Phase 3 — Ask Claude to summarise the results in natural language.
    """
    import anthropic

    if not settings.anthropic_api_key:
        return {
            "response": "AI Insights is not configured. Please set the ANTHROPIC_API_KEY environment variable.",
            "sql": None,
            "data": None,
            "error": "no_api_key",
        }

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    org_id_str = str(organization_id)

    # Phase 0: Get the live schema
    try:
        live_schema = await _introspect_schema(db)
    except Exception as e:
        print(f"[AI] Schema introspection failed: {e}")
        return {
            "response": "Sorry, I couldn't read the database schema. Please try again in a moment.",
            "sql": None,
            "data": None,
            "error": "schema_introspection_failed",
        }

    # Build system prompt with live schema
    system_prompt_sql = f"""You are an expert PostgreSQL analyst for Camp Connect, a camp management platform.
Convert the user's natural language question into a single PostgreSQL SELECT query.

YOUR OUTPUT MUST BE ONLY THE SQL QUERY. Nothing else. No explanation, no markdown, no comments.

CRITICAL RULES:
1. OUTPUT ONLY RAW SQL. No markdown fences (```). No text before or after the query. Just the SQL.
2. ONLY SELECT queries. Never INSERT, UPDATE, DELETE, DROP, or any mutation.
3. EVERY query MUST filter by organization: WHERE <table>.organization_id = :org_id
   Use the parameter placeholder :org_id — never hardcode a UUID.
4. Soft-delete filtering:
   - For tables with is_deleted column: add AND is_deleted = false
   - For tables with deleted_at column: add AND deleted_at IS NULL
5. Always end with LIMIT 500.
6. Use readable column aliases (e.g., AS total_revenue, AS camper_count).
7. For age from date_of_birth: EXTRACT(YEAR FROM AGE(date_of_birth))
8. For current date: CURRENT_DATE
9. Use COALESCE for nullable numeric fields in aggregates.

IMPORTANT — ALWAYS INCLUDE ENTITY IDs:
When the query returns individual records (campers, contacts, families, staff, events, etc.),
ALWAYS include the primary key ID column with a clear alias:
- For campers: include c.id AS camper_id
- For contacts: include co.id AS contact_id
- For families: include f.id AS family_id
- For events: include e.id AS event_id
- For staff/users: include u.id AS staff_id
- For registrations: include r.id AS registration_id
This is required so the UI can link to the detail pages.

FUZZY TEXT MATCHING:
When the user searches for names, schools, locations, or other text fields,
ALWAYS use ILIKE with %wildcards% for fuzzy matching. Examples:
- "kids from briarcrest" → WHERE c.school ILIKE '%briarcrest%'
- "camper named emma" → WHERE c.first_name ILIKE '%emma%'
- "families named johnson" → WHERE f.family_name ILIKE '%johnson%'
Never use = for text searches. Always use ILIKE '%term%'.

SPECIAL RESPONSES (output these EXACT strings with no other text):
- If the question cannot be answered with SQL: NO_SQL_NEEDED
- If the question asks to change data: REFUSED

DATABASE SCHEMA (live from the actual database):
{live_schema}

Parameter: :org_id (the user's organization UUID — always use this placeholder)

REMEMBER: Your entire response must be a single SQL query. Nothing else."""

    # Prepare user messages for Claude
    claude_messages = [{"role": m["role"], "content": m["content"]} for m in messages]

    # Phase 1: Generate SQL
    raw_sql, sql, stop_reason = await _generate_sql(client, system_prompt_sql, claude_messages)

    if raw_sql is None:
        return {
            "response": "Sorry, I encountered an error generating the query. Please try again.",
            "sql": None,
            "data": None,
            "error": "sql_generation_failed",
        }

    # Handle non-SQL responses (check both raw and cleaned)
    raw_upper = raw_sql.strip().upper()
    if raw_upper.startswith("REFUSED") or raw_upper == "REFUSED":
        return await _handle_non_sql(client, "REFUSED", claude_messages, user_name)
    if raw_upper.startswith("NO_SQL_NEEDED") or raw_upper == "NO_SQL_NEEDED":
        return await _handle_non_sql(client, "NO_SQL_NEEDED", claude_messages, user_name)

    # Validate
    is_valid, error_msg = validate_sql(sql)
    if not is_valid:
        return {
            "response": f"I generated a query but it didn't pass safety validation: {error_msg}. Please try rephrasing.",
            "sql": sql,
            "data": None,
            "error": "validation_failed",
        }

    if ":org_id" not in sql:
        return {
            "response": "I generated a query but it was missing the required organization filter. Please try rephrasing.",
            "sql": sql,
            "data": None,
            "error": "missing_org_filter",
        }

    # Phase 2: Execute the SQL
    exec_sql = sql if re.search(r"\bLIMIT\b", sql, re.IGNORECASE) else sql + "\nLIMIT 500"

    data, columns, exec_error = await _execute_query(db, exec_sql, org_id_str)

    # Phase 2b: If query failed, retry once — tell Claude the error and ask it to fix
    if exec_error:
        print(f"[AI] First query failed: {exec_error[:300]}")
        print(f"[AI] Failed SQL:\n{exec_sql[:500]}")
        print(f"[AI] Retrying with error context...")

        retry_messages = claude_messages + [
            {"role": "assistant", "content": sql},
            {"role": "user", "content": f"That query failed with this PostgreSQL error:\n\n{exec_error[:500]}\n\nPlease fix the SQL query. Output ONLY the corrected SQL. No explanation."},
        ]

        raw_sql2, sql2, _ = await _generate_sql(client, system_prompt_sql, retry_messages)

        if sql2 and ":org_id" in sql2:
            is_valid2, _ = validate_sql(sql2)
            if is_valid2:
                exec_sql2 = sql2 if re.search(r"\bLIMIT\b", sql2, re.IGNORECASE) else sql2 + "\nLIMIT 500"
                data, columns, exec_error2 = await _execute_query(db, exec_sql2, org_id_str)
                if not exec_error2:
                    sql = sql2
                    exec_error = None
                    print(f"[AI] Retry succeeded!")
                else:
                    print(f"[AI] Retry also failed: {exec_error2[:200]}")

    if exec_error:
        return {
            "response": f"I tried to query your data but encountered a database error. Please try rephrasing your question.\n\nTechnical detail: {exec_error[:300]}",
            "sql": sql,
            "data": None,
            "error": "query_execution_failed",
        }

    # Detect entity types in the result columns for clickable links
    entity_links = _detect_entity_links(columns)

    # Phase 3: Summarise results
    row_count = len(data)
    data_summary = json.dumps(data[:100], default=str)

    system_prompt_summary = f"""You are a helpful AI insights assistant for Camp Connect, a camp management platform.
You just looked up information and got results. Summarise them clearly.

RULES:
1. Be concise but thorough. Use bullet points, tables, or numbered lists as appropriate.
2. Format numbers nicely (commas for thousands, 2 decimal places for currency).
3. Highlight key insights or notable patterns.
4. If the data is empty, say so clearly and suggest why.
5. Don't mention SQL, databases, or queries — you simply "looked up" the information.
6. Use markdown formatting.
7. You are speaking to {user_name}.
8. Total rows: {row_count}. Data below may be truncated to first 100 rows."""

    summary_messages = [
        *claude_messages,
        {"role": "assistant", "content": "Let me look that up for you."},
        {"role": "user", "content": f"Here are the results ({row_count} rows):\n\n{data_summary}"},
    ]

    try:
        summary_response = client.messages.create(
            model=settings.ai_model,
            max_tokens=settings.ai_max_tokens,
            system=system_prompt_summary,
            messages=summary_messages,
        )
        response_text = summary_response.content[0].text
    except Exception:
        response_text = f"Here are the results ({row_count} rows). I wasn't able to generate a summary."

    return {
        "response": response_text,
        "sql": sql,
        "data": data[:200],
        "row_count": row_count,
        "entity_links": entity_links,
        "error": None,
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _generate_sql(
    client: Any,
    system_prompt: str,
    messages: List[Dict[str, str]],
) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Call Claude to generate SQL. Returns (raw_output, cleaned_sql, stop_reason)."""
    try:
        resp = client.messages.create(
            model=settings.ai_model,
            max_tokens=2048,
            system=system_prompt,
            messages=messages,
        )
        raw = resp.content[0].text.strip()
        stop_reason = resp.stop_reason
        print(f"[AI] SQL gen: stop_reason={stop_reason}, len={len(raw)}")

        if stop_reason == "max_tokens":
            print(f"[AI] WARNING: output truncated by max_tokens!")
            return None, None, stop_reason

        cleaned = _extract_sql(raw)
        print(f"[AI] Raw output ({len(raw)} chars):\n{raw[:400]}")
        print(f"[AI] Extracted SQL ({len(cleaned)} chars):\n{cleaned[:400]}")
        return raw, cleaned, stop_reason

    except Exception as e:
        print(f"[AI] SQL generation error: {type(e).__name__}: {e}")
        return None, None, None


async def _execute_query(
    db: AsyncSession,
    sql: str,
    org_id_str: str,
) -> Tuple[List[Dict[str, Any]], List[str], Optional[str]]:
    """Execute a read-only SQL query. Returns (data, columns, error_str_or_None)."""
    try:
        result = await db.execute(text(sql), {"org_id": org_id_str})
        rows = result.fetchall()
        columns = list(result.keys())

        data = []
        for row in rows[:500]:
            row_dict = {}
            for i, col in enumerate(columns):
                val = row[i]
                if isinstance(val, uuid.UUID):
                    val = str(val)
                elif hasattr(val, "isoformat"):
                    val = val.isoformat()
                elif isinstance(val, bytes):
                    val = val.decode("utf-8", errors="replace")
                elif isinstance(val, dict) or isinstance(val, list):
                    pass  # Keep JSONB as-is
                row_dict[col] = val
            data.append(row_dict)

        return data, columns, None

    except Exception as e:
        # Rollback the failed transaction so the session is still usable
        await db.rollback()
        return [], [], str(e)


def _detect_entity_links(columns: List[str]) -> Dict[str, str]:
    """
    Detect which columns in the result set are entity IDs that should become
    clickable links. Returns a mapping of column_name -> entity_type.
    e.g. {"camper_id": "campers", "contact_id": "contacts"}
    """
    links = {}
    for col in columns:
        col_lower = col.lower()
        for pattern, entity_type in ENTITY_LINK_MAP.items():
            if col_lower == pattern or col_lower.endswith(f"_{pattern}"):
                links[col] = entity_type
                break
    return links


async def _handle_non_sql(
    client: Any,
    response_type: str,
    claude_messages: List[Dict[str, str]],
    user_name: str,
) -> Dict[str, Any]:
    """Handle REFUSED or NO_SQL_NEEDED responses."""
    if response_type == "REFUSED":
        return {
            "response": "I can only answer questions about your data. I cannot modify, delete, or update any records. Please ask a read-only question.",
            "sql": None,
            "data": None,
            "error": None,
        }

    # NO_SQL_NEEDED — answer conversationally
    try:
        conversational = client.messages.create(
            model=settings.ai_model,
            max_tokens=settings.ai_max_tokens,
            system=f"""You are a helpful AI assistant for Camp Connect, a camp management platform.
The user asked a question that doesn't require database queries.
Answer helpfully and concisely. You are speaking to {user_name}.""",
            messages=claude_messages,
        )
        return {
            "response": conversational.content[0].text,
            "sql": None,
            "data": None,
            "error": None,
        }
    except Exception as e:
        return {
            "response": f"Sorry, I encountered an error: {str(e)}",
            "sql": None,
            "data": None,
            "error": "conversational_failed",
        }


def get_suggested_prompts() -> List[Dict[str, str]]:
    """Return the curated list of suggested prompts."""
    return SUGGESTED_PROMPTS

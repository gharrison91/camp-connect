"""
Camp Connect - AI Insights Service
Two-phase Claude integration: (1) generate SQL from natural language,
(2) summarise results in a human-friendly response.
Read-only queries only; all queries scoped to the user's organization.
"""

from __future__ import annotations

import json
import re
import time
import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

# ---------------------------------------------------------------------------
# Database schema reference (given to Claude so it can write correct SQL)
# ---------------------------------------------------------------------------

DATABASE_SCHEMA = """
-- Multi-tenant camp management platform. Every table is scoped by organization_id.

-- Organizations (top-level tenant)
organizations (id UUID PK, name, slug, logo_url, domain, subscription_tier, settings JSONB, enabled_modules JSONB, created_at, updated_at)

-- Users / Staff
users (id UUID PK, organization_id FK, supabase_user_id, role_id FK, email, first_name, last_name, phone, avatar_url, department, job_title_id FK, staff_category, onboarding_status, is_active, seasonal_access_start, seasonal_access_end, created_at, updated_at, is_deleted, deleted_at)

-- Roles & Permissions
roles (id UUID PK, organization_id FK, name, description, is_system, created_at)
role_permissions (id UUID PK, role_id FK, permission, created_at)

-- Job Titles
job_titles (id UUID PK, organization_id FK, name, description, is_system, created_at)

-- Locations
locations (id UUID PK, organization_id FK, name, address, city, state, zip_code, phone, is_primary, created_at)

-- Families
families (id UUID PK, organization_id FK, family_name, created_at)

-- Contacts (parents / guardians)
contacts (id UUID PK, organization_id FK, first_name, last_name, email, phone, address, city, state, zip_code, relationship_type, communication_preference, account_status, family_id FK, portal_access BOOL, created_at, updated_at, is_deleted, deleted_at)

-- Campers
campers (id UUID PK, organization_id FK, first_name, last_name, date_of_birth DATE, gender, school, grade, city, state, allergies JSONB, dietary_restrictions JSONB, custom_fields JSONB, family_id FK, created_at, updated_at, is_deleted, deleted_at)

-- Camper-Contact links
camper_contacts (id UUID PK, camper_id FK, contact_id FK, relationship_type, is_primary BOOL, is_emergency BOOL, is_authorized_pickup BOOL)

-- Contact-to-Contact associations
contact_associations (id UUID PK, organization_id FK, contact_id FK, related_contact_id FK, relationship_type, notes)

-- Events (camp sessions / programmes)
events (id UUID PK, organization_id FK, location_id FK, name, description, start_date DATE, end_date DATE, capacity INT, enrolled_count INT, waitlist_count INT, min_age INT, max_age INT, gender_restriction, price NUMERIC, deposit_amount NUMERIC, status, registration_open_date, registration_close_date, created_at, updated_at, is_deleted, deleted_at)

-- Registrations
registrations (id UUID PK, organization_id FK, camper_id FK, event_id FK, registered_by FK, status, payment_status, activity_requests JSONB, special_requests, registered_at, created_at, is_deleted, deleted_at)

-- Invoices
invoices (id UUID PK, organization_id FK, family_id FK, contact_id FK, registration_ids JSONB, line_items JSONB, subtotal NUMERIC, tax NUMERIC, total NUMERIC, status, due_date DATE, paid_at, stripe_invoice_id, notes, created_at, is_deleted, deleted_at)

-- Payments
payments (id UUID PK, organization_id FK, invoice_id FK, registration_id FK, contact_id FK, amount NUMERIC, currency, payment_method, status, paid_at, refund_amount NUMERIC, created_at)

-- Activities
activities (id UUID PK, organization_id FK, name, description, category, location, capacity INT, min_age INT, max_age INT, duration_minutes INT, staff_required INT, is_active BOOL, created_at)

-- Schedules
schedules (id UUID PK, organization_id FK, event_id FK, activity_id FK, date DATE, start_time TIME, end_time TIME, location, max_capacity INT, notes, is_cancelled BOOL, created_at)

-- Schedule Assignments
schedule_assignments (id UUID PK, organization_id FK, schedule_id FK, camper_id FK, bunk_id FK, assigned_by FK, created_at)

-- Bunks
bunks (id UUID PK, organization_id FK, name, capacity INT, gender_restriction, min_age INT, max_age INT, location, counselor_user_id FK, created_at)

-- Bunk Assignments
bunk_assignments (id UUID PK, bunk_id FK, camper_id FK, event_id FK, bed_number, start_date DATE, end_date DATE, created_at)

-- Bunk Buddy Requests
bunk_buddy_requests (id UUID PK, organization_id FK, event_id FK, requester_camper_id FK, requested_camper_id FK, status, submitted_by_contact_id FK, admin_notes, reviewed_by FK, reviewed_at, created_at)

-- Event Bunk Configs
event_bunk_configs (id UUID PK, organization_id FK, event_id FK, bunk_id FK, is_active BOOL, event_capacity INT, counselor_user_ids JSONB, notes, created_at)

-- Photos
photos (id UUID PK, organization_id FK, uploaded_by FK, category, entity_id, event_id FK, activity_id FK, file_name, file_path, file_size INT, mime_type, caption, tags JSONB, is_profile_photo BOOL, created_at, is_deleted, deleted_at)

-- Photo Face Tags
photo_face_tags (id UUID PK, organization_id FK, photo_id FK, camper_id FK, face_id, confidence FLOAT, similarity FLOAT, created_at)

-- Messages (email / SMS)
messages (id UUID PK, organization_id FK, channel, direction, status, from_address, to_address, subject, body, template_id, recipient_type, recipient_id, sent_at, delivered_at, created_at, is_deleted, deleted_at)

-- Message Templates
message_templates (id UUID PK, organization_id FK, name, channel, subject, body, html_body, category, is_system BOOL, is_active BOOL, created_at)

-- Notification Configs
notification_configs (id UUID PK, organization_id FK, trigger_type, channel, is_active BOOL, template_id FK, config JSONB, created_at)

-- Health Form Templates
health_form_templates (id UUID PK, organization_id FK, name, description, category, fields JSONB, is_system BOOL, is_active BOOL, required_for_registration BOOL, created_at)

-- Health Forms (instances)
health_forms (id UUID PK, organization_id FK, template_id FK, camper_id FK, event_id FK, status, submitted_at, reviewed_by FK, reviewed_at, due_date DATE, created_at, is_deleted, deleted_at)

-- Health Form Submissions
health_form_submissions (id UUID PK, organization_id FK, form_id FK, submitted_by FK, data JSONB, signature, signed_at, created_at)

-- Staff Onboarding
staff_onboardings (id UUID PK, organization_id FK, user_id FK, status, current_step, personal_info_completed BOOL, emergency_contacts_completed BOOL, certifications_completed BOOL, completed_at, created_at)

-- Staff Certifications (from onboarding)
staff_certifications (id UUID PK, onboarding_id FK, organization_id FK, name, issuing_authority, certificate_number, issued_date DATE, expiry_date DATE, status, created_at)

-- Staff Certification Records (ongoing tracking)
staff_certification_records (id UUID PK, organization_id FK, user_id FK, certification_type_id FK, status, issued_date DATE, expiry_date DATE, document_url, notes, verified_by FK, created_at)

-- Certification Types (catalogue)
certification_types (id UUID PK, organization_id FK, name, description, is_required BOOL, expiry_days INT, created_at)

-- Waitlist
waitlist (id UUID PK, organization_id FK, event_id FK, camper_id FK, contact_id FK, position INT, status, notified_at, created_at)

-- Form Templates (custom forms)
form_templates (id UUID PK, organization_id FK, name, description, category, status, fields JSONB, settings JSONB, require_signature BOOL, version INT, created_by FK, created_at, deleted_at)

-- Form Submissions
form_submissions (id UUID PK, organization_id FK, template_id FK, submitted_by_user_id FK, submitted_by_contact_id FK, answers JSONB, status, submitted_at, created_at)

-- Saved Lists
saved_lists (id UUID PK, organization_id FK, name, description, list_type, entity_type, filter_criteria JSONB, member_count INT, created_by, created_at, is_deleted, deleted_at)

-- Saved List Members
saved_list_members (id UUID PK, list_id FK, entity_type, entity_id, added_at, added_by)

-- Store Items
store_items (id UUID PK, organization_id FK, name, description, category, price NUMERIC, quantity_in_stock INT, image_url, is_active BOOL, created_at)

-- Store Transactions
store_transactions (id UUID PK, organization_id FK, camper_id FK, item_id FK, quantity INT, unit_price NUMERIC, total NUMERIC, transaction_date, recorded_by FK, created_at)

-- Spending Accounts
spending_accounts (id UUID PK, organization_id FK, camper_id FK, balance NUMERIC, daily_limit NUMERIC, created_at)

-- Workflows
workflows (id UUID PK, organization_id FK, name, description, status, trigger JSONB, steps JSONB, enrollment_type, total_enrolled INT, total_completed INT, created_by FK, created_at, deleted_at)

-- Workflow Executions
workflow_executions (id UUID PK, organization_id FK, workflow_id FK, entity_type, entity_id, status, current_step_id, context JSONB, started_at, completed_at)

-- Audit Log
audit_log (id UUID PK, organization_id, user_id, action, resource_type, resource_id, details JSONB, ip_address, created_at)
"""

# ---------------------------------------------------------------------------
# SQL safety validation
# ---------------------------------------------------------------------------

_FORBIDDEN_KEYWORDS = [
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "TRUNCATE",
    "CREATE",
    "GRANT",
    "REVOKE",
    "EXEC",
    "EXECUTE",
    "CALL",
    "SET ",
    "COPY",
    "VACUUM",
    "REINDEX",
    "COMMENT",
    "LOCK",
    "LISTEN",
    "NOTIFY",
    "PREPARE",
    "DEALLOCATE",
]


def validate_sql(sql: str) -> tuple[bool, str]:
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

    # Check for forbidden mutation keywords
    for kw in _FORBIDDEN_KEYWORDS:
        # Use word boundary check to avoid false positives like "SELECTED"
        pattern = rf"\b{kw}\b"
        if re.search(pattern, upper):
            return False, f"Forbidden keyword detected: {kw.strip()}"

    # Must not contain multiple statements
    # Simple check: no semicolons in the middle
    if ";" in cleaned:
        return False, "Multiple statements are not allowed"

    return True, ""


def ensure_org_filter(sql: str, organization_id: str) -> str:
    """
    Best-effort check that organization_id is referenced.
    We inject it as a parameter, so the SQL must use :org_id.
    """
    if ":org_id" not in sql:
        return ""  # Signal to caller that SQL is missing org scope
    return sql


# ---------------------------------------------------------------------------
# Suggested prompts
# ---------------------------------------------------------------------------

SUGGESTED_PROMPTS = [
    {
        "title": "Campers per event",
        "prompt": "How many campers are registered for each event?",
        "icon": "users",
    },
    {
        "title": "Total revenue",
        "prompt": "What is the total revenue from all payments?",
        "icon": "dollar-sign",
    },
    {
        "title": "Outstanding balances",
        "prompt": "Which families have outstanding invoice balances?",
        "icon": "alert-circle",
    },
    {
        "title": "Age breakdown",
        "prompt": "What is the age distribution of all campers?",
        "icon": "bar-chart",
    },
    {
        "title": "Registration status",
        "prompt": "Show me a breakdown of registration statuses across all events.",
        "icon": "clipboard",
    },
    {
        "title": "Staff overview",
        "prompt": "How many active staff members are there by department?",
        "icon": "briefcase",
    },
    {
        "title": "Bunk occupancy",
        "prompt": "What is the current bunk occupancy rate for each event?",
        "icon": "home",
    },
    {
        "title": "Recent activity",
        "prompt": "What registrations were created in the last 7 days?",
        "icon": "clock",
    },
    {
        "title": "Health form status",
        "prompt": "How many health forms are pending vs submitted vs reviewed?",
        "icon": "heart",
    },
    {
        "title": "Popular activities",
        "prompt": "Which activities have the most schedule assignments?",
        "icon": "star",
    },
    {
        "title": "Buddy requests",
        "prompt": "Show me all pending bunk buddy requests with mutual matches.",
        "icon": "heart",
    },
    {
        "title": "Waitlist summary",
        "prompt": "How many campers are on the waitlist for each event?",
        "icon": "list",
    },
]


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

    Phase 1 — Ask Claude to generate a SQL query from the user's question.
    Phase 2 — Execute the query (read-only, scoped to org, row-limited).
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

    # Build conversation for Phase 1 (SQL generation)
    system_prompt_sql = f"""You are an expert SQL analyst for Camp Connect, a camp management platform.
Your job is to convert the user's natural language question into a PostgreSQL SELECT query.

IMPORTANT RULES:
1. ONLY generate SELECT queries. Never generate INSERT, UPDATE, DELETE, or any data-modifying statements.
2. EVERY query MUST filter by organization_id = :org_id to ensure data isolation.
3. Use proper JOINs — the schema uses UUID foreign keys throughout.
4. Always handle soft-deleted records by adding "is_deleted = false" or "deleted_at IS NULL" where the column exists.
5. Limit results to 500 rows maximum (add LIMIT 500 if not already limited).
6. Use meaningful column aliases so results are human-readable.
7. For date calculations use CURRENT_DATE.
8. For age calculations from date_of_birth: EXTRACT(YEAR FROM AGE(date_of_birth)).
9. Use COALESCE for nullable fields when needed.
10. Return ONLY the SQL query, no explanation, no markdown code fences, no comments.
11. If the question cannot be answered with the available schema, respond with exactly: NO_SQL_NEEDED
12. If the question asks to modify data, respond with exactly: REFUSED

Here is the database schema:
{DATABASE_SCHEMA}

The user's organization_id parameter is :org_id — always use this placeholder, never hardcode a UUID."""

    # Prepare user messages for Claude
    claude_messages = []
    for msg in messages:
        claude_messages.append({
            "role": msg["role"],
            "content": msg["content"],
        })

    # Phase 1: Generate SQL
    try:
        sql_response = client.messages.create(
            model=settings.ai_model,
            max_tokens=2048,
            system=system_prompt_sql,
            messages=claude_messages,
        )
        raw_sql = sql_response.content[0].text.strip()
    except Exception as e:
        return {
            "response": f"Sorry, I encountered an error generating the query: {str(e)}",
            "sql": None,
            "data": None,
            "error": "sql_generation_failed",
        }

    # Handle non-SQL responses
    if raw_sql == "REFUSED":
        return {
            "response": "I can only answer questions about your data. I cannot modify, delete, or update any records. Please ask a read-only question about your camp data.",
            "sql": None,
            "data": None,
            "error": None,
        }

    if raw_sql == "NO_SQL_NEEDED":
        # Phase 3 without data — just answer conversationally
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

    # Clean up SQL (remove markdown fences if Claude added them)
    sql = raw_sql
    if sql.startswith("```"):
        sql = re.sub(r"^```(?:sql)?\n?", "", sql)
        sql = re.sub(r"\n?```$", "", sql)
    sql = sql.strip().rstrip(";")

    # Validate the SQL
    is_valid, error_msg = validate_sql(sql)
    if not is_valid:
        return {
            "response": f"I generated a query but it didn't pass safety validation: {error_msg}. Please try rephrasing your question.",
            "sql": sql,
            "data": None,
            "error": "validation_failed",
        }

    # Ensure organization_id filter is present
    if ":org_id" not in sql:
        return {
            "response": "I generated a query but it was missing the required organization filter. Please try rephrasing your question.",
            "sql": sql,
            "data": None,
            "error": "missing_org_filter",
        }

    # Phase 2: Execute the SQL query
    try:
        result = await db.execute(
            text(sql + " LIMIT 500"),
            {"org_id": org_id_str},
        )
        rows = result.fetchall()
        columns = list(result.keys())

        # Convert to list of dicts
        data = []
        for row in rows[:500]:
            row_dict = {}
            for i, col in enumerate(columns):
                val = row[i]
                # Convert UUIDs and dates to strings for JSON serialisation
                if isinstance(val, uuid.UUID):
                    val = str(val)
                elif hasattr(val, "isoformat"):
                    val = val.isoformat()
                elif isinstance(val, bytes):
                    val = val.decode("utf-8", errors="replace")
                row_dict[col] = val
            data.append(row_dict)

    except Exception as e:
        error_str = str(e)
        # Try to give a helpful error
        return {
            "response": f"I tried to query your data but encountered a database error. This usually means I referenced a column incorrectly. Please try rephrasing your question.\n\nTechnical detail: {error_str[:200]}",
            "sql": sql,
            "data": None,
            "error": "query_execution_failed",
        }

    # Phase 3: Summarise results with Claude
    data_summary = json.dumps(data[:100], default=str)  # Limit context size
    row_count = len(data)

    system_prompt_summary = f"""You are a helpful AI insights assistant for Camp Connect, a camp management platform.
You just ran a database query and got results. Summarise the results in a clear, human-friendly way.

RULES:
1. Be concise but thorough. Use bullet points, tables, or numbered lists when appropriate.
2. Format numbers nicely (commas for thousands, 2 decimal places for currency).
3. Highlight key insights or notable patterns in the data.
4. If the data is empty, say so clearly and suggest why it might be empty.
5. Don't mention SQL, databases, or queries — speak as if you simply "looked up" the information.
6. Use markdown formatting for readability.
7. You are speaking to {user_name}.
8. Total rows returned: {row_count}. Data shown below may be truncated to first 100 rows."""

    summary_messages = [
        *claude_messages,
        {
            "role": "assistant",
            "content": f"Let me look that up for you.",
        },
        {
            "role": "user",
            "content": f"Here are the query results ({row_count} rows):\n\n{data_summary}",
        },
    ]

    try:
        summary_response = client.messages.create(
            model=settings.ai_model,
            max_tokens=settings.ai_max_tokens,
            system=system_prompt_summary,
            messages=summary_messages,
        )
        response_text = summary_response.content[0].text
    except Exception as e:
        # Fallback: just return the raw data
        response_text = f"Here are the results ({row_count} rows). I wasn't able to generate a summary."

    return {
        "response": response_text,
        "sql": sql,
        "data": data[:200],  # Cap at 200 rows for the response payload
        "row_count": row_count,
        "error": None,
    }


def get_suggested_prompts() -> List[Dict[str, str]]:
    """Return the curated list of suggested prompts."""
    return SUGGESTED_PROMPTS

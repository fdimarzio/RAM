-- =====================================================================
-- RAM (Relationship Agentic Management) — Core Schema
-- Schema: ram
-- Source: Define Core Business Entities doc (7 entities)
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS ram;

-- ---------------------------------------------------------------------
-- 1. COMPANIES
-- ---------------------------------------------------------------------
CREATE TABLE ram.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text,
  website text,
  address text,
  description text,
  status text DEFAULT 'active',
  parent_company_id uuid REFERENCES ram.companies(id) ON DELETE SET NULL,
  relationship_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE ram.companies IS 'Organizations with which users maintain a relationship.';

-- ---------------------------------------------------------------------
-- 2. PEOPLE
-- ---------------------------------------------------------------------
CREATE TABLE ram.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  title text,
  email text,
  phone text,
  company_id uuid REFERENCES ram.companies(id) ON DELETE SET NULL,
  department text,
  reporting_manager_id uuid REFERENCES ram.people(id) ON DELETE SET NULL,
  relationship_type text,
  relationship_status text DEFAULT 'active',
  personal_notes text,
  communication_preferences text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE ram.people IS 'Individuals associated with companies or organizations.';

-- ---------------------------------------------------------------------
-- 3. PRODUCTS & SERVICES
-- ---------------------------------------------------------------------
CREATE TABLE ram.products_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  description text,
  status text DEFAULT 'active',
  pricing_info text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE ram.products_services IS 'Products, services, solutions, or offerings being discussed, proposed, or delivered.';

-- ---------------------------------------------------------------------
-- 4. OPPORTUNITIES
-- ---------------------------------------------------------------------
CREATE TABLE ram.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  opportunity_type text,
  stage text DEFAULT 'new',
  status text DEFAULT 'open',
  company_id uuid REFERENCES ram.companies(id) ON DELETE SET NULL,
  person_id uuid REFERENCES ram.people(id) ON DELETE SET NULL,
  estimated_value numeric(14,2),
  expected_close_date date,
  probability integer CHECK (probability >= 0 AND probability <= 100),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE ram.opportunities IS 'Potential revenue-generating or strategic opportunities.';

-- Join table: Opportunities <-> Products/Services (many-to-many)
CREATE TABLE ram.opportunity_products (
  opportunity_id uuid REFERENCES ram.opportunities(id) ON DELETE CASCADE,
  product_service_id uuid REFERENCES ram.products_services(id) ON DELETE CASCADE,
  PRIMARY KEY (opportunity_id, product_service_id)
);

-- ---------------------------------------------------------------------
-- 5. EVENTS & MEETINGS
-- ---------------------------------------------------------------------
CREATE TABLE ram.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text,
  event_date timestamptz NOT NULL,
  time_zone text DEFAULT 'America/New_York',
  company_id uuid REFERENCES ram.companies(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES ram.opportunities(id) ON DELETE SET NULL,
  meeting_notes text,
  discussion_topics text,
  commitments_made text,
  action_items text,
  follow_up_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE ram.events IS 'Interactions between users and relationships.';

-- Join table: Events <-> People (many-to-many, since multiple people may attend)
CREATE TABLE ram.event_participants (
  event_id uuid REFERENCES ram.events(id) ON DELETE CASCADE,
  person_id uuid REFERENCES ram.people(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, person_id)
);

-- ---------------------------------------------------------------------
-- 6. CASES
-- ---------------------------------------------------------------------
CREATE TABLE ram.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  case_type text,
  description text,
  status text DEFAULT 'open',
  start_date date DEFAULT CURRENT_DATE,
  target_completion_date date,
  notes text,
  related_documents text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE ram.cases IS 'Longer-running relationship matters, initiatives, projects, or discussion threads.';

-- Join tables: Cases <-> People, Cases <-> Companies, Cases <-> Opportunities
CREATE TABLE ram.case_people (
  case_id uuid REFERENCES ram.cases(id) ON DELETE CASCADE,
  person_id uuid REFERENCES ram.people(id) ON DELETE CASCADE,
  PRIMARY KEY (case_id, person_id)
);

CREATE TABLE ram.case_companies (
  case_id uuid REFERENCES ram.cases(id) ON DELETE CASCADE,
  company_id uuid REFERENCES ram.companies(id) ON DELETE CASCADE,
  PRIMARY KEY (case_id, company_id)
);

CREATE TABLE ram.case_opportunities (
  case_id uuid REFERENCES ram.cases(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES ram.opportunities(id) ON DELETE CASCADE,
  PRIMARY KEY (case_id, opportunity_id)
);

-- ---------------------------------------------------------------------
-- 7. TASKS & FOLLOW-UP ACTIONS
-- ---------------------------------------------------------------------
CREATE TABLE ram.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  due_date date,
  priority text DEFAULT 'medium',
  status text DEFAULT 'pending',
  owner text DEFAULT 'Unassigned',
  completion_date date,
  person_id uuid REFERENCES ram.people(id) ON DELETE SET NULL,
  company_id uuid REFERENCES ram.companies(id) ON DELETE SET NULL,
  event_id uuid REFERENCES ram.events(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES ram.opportunities(id) ON DELETE SET NULL,
  case_id uuid REFERENCES ram.cases(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE ram.tasks IS 'Commitments, reminders, action items, and next steps.';

-- ---------------------------------------------------------------------
-- 8. NOTES (polymorphic — attachable to Companies, People, Opportunities, Tasks)
-- ---------------------------------------------------------------------
CREATE TABLE ram.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('company', 'person', 'opportunity', 'task')),
  entity_id uuid NOT NULL,
  body text NOT NULL,
  author text DEFAULT 'Unassigned',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE ram.notes IS 'Timestamped, attributable notes attachable to companies, people, opportunities, or tasks. entity_type + entity_id form a polymorphic reference (no FK constraint, validated at app layer).';

-- =====================================================================
-- INDEXES for common lookups / foreign keys
-- =====================================================================
CREATE INDEX idx_ram_people_company ON ram.people(company_id);
CREATE INDEX idx_ram_people_manager ON ram.people(reporting_manager_id);
CREATE INDEX idx_ram_opportunities_company ON ram.opportunities(company_id);
CREATE INDEX idx_ram_opportunities_person ON ram.opportunities(person_id);
CREATE INDEX idx_ram_events_company ON ram.events(company_id);
CREATE INDEX idx_ram_events_opportunity ON ram.events(opportunity_id);
CREATE INDEX idx_ram_tasks_person ON ram.tasks(person_id);
CREATE INDEX idx_ram_tasks_company ON ram.tasks(company_id);
CREATE INDEX idx_ram_tasks_due_date ON ram.tasks(due_date);
CREATE INDEX idx_ram_tasks_status ON ram.tasks(status);
CREATE INDEX idx_ram_companies_parent ON ram.companies(parent_company_id);
CREATE INDEX idx_ram_notes_entity ON ram.notes(entity_type, entity_id);

-- =====================================================================
-- ROW LEVEL SECURITY — basic "authenticated users only" policy
-- =====================================================================
ALTER TABLE ram.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ram.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE ram.products_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE ram.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ram.opportunity_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ram.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ram.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ram.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ram.case_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE ram.case_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ram.case_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ram.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ram.notes ENABLE ROW LEVEL SECURITY;

-- Authenticated-only policy, applied per table (read + write for any logged-in user)
CREATE POLICY "Authenticated users full access" ON ram.companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON ram.people FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON ram.products_services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON ram.opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON ram.opportunity_products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON ram.events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON ram.event_participants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON ram.cases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON ram.case_people FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON ram.case_companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON ram.case_opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON ram.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON ram.notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant schema usage to the standard Supabase roles so PostgREST can see it
GRANT USAGE ON SCHEMA ram TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA ram TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA ram TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA ram GRANT ALL ON TABLES TO authenticated, service_role;

-- =====================================================================
-- Person <-> Person social graph (ISSUE-011 / FR-1)
-- =====================================================================

CREATE TABLE ram.person_relationships (
  person_id uuid REFERENCES ram.people(id) ON DELETE CASCADE,
  related_person_id uuid REFERENCES ram.people(id) ON DELETE CASCADE,
  relationship_type text,
  PRIMARY KEY (person_id, related_person_id)
);

ALTER TABLE ram.person_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access" ON ram.person_relationships
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON ram.person_relationships TO authenticated, service_role;
GRANT SELECT ON ram.person_relationships TO anon;

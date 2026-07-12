-- =====================================================================
-- Widen ram.notes.entity_type to also allow case/event/product (ISSUE-016)
-- =====================================================================

ALTER TABLE ram.notes DROP CONSTRAINT IF EXISTS notes_entity_type_check;
ALTER TABLE ram.notes ADD CONSTRAINT notes_entity_type_check
  CHECK (entity_type IN ('company','person','opportunity','task','case','event','product'));

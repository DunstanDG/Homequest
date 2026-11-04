-- OPTIONAL for HomeQuest. The table from schema.sql already works unchanged.
--
-- HomeQuest pulls every event for the family (not one learner at a time), ordered by seq. This index matches that
-- query exactly. With a few thousand rows you will not notice the difference; it just keeps pulls cheap as the
-- family log grows over the years. Safe to run more than once.

create index if not exists events_family_seq_only on public.events (family_key, seq);

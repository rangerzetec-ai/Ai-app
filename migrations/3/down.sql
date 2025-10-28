
-- Remove added fields from appointments
ALTER TABLE appointments DROP COLUMN technician_notes;
ALTER TABLE appointments DROP COLUMN pier_placements;
ALTER TABLE appointments DROP COLUMN generated_model_data;
ALTER TABLE appointments DROP COLUMN improvement_sketch_filename;
ALTER TABLE appointments DROP COLUMN improvement_sketch_url;
ALTER TABLE appointments DROP COLUMN site_photos;

-- Remove added fields from leads
ALTER TABLE leads DROP COLUMN improvement_sketch_filename;
ALTER TABLE leads DROP COLUMN improvement_sketch_url;
ALTER TABLE leads DROP COLUMN site_photos;

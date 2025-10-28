
-- Add fields for site photos and improvement sketches to appointments
ALTER TABLE appointments ADD COLUMN site_photos TEXT;
ALTER TABLE appointments ADD COLUMN improvement_sketch_url TEXT;
ALTER TABLE appointments ADD COLUMN improvement_sketch_filename TEXT;
ALTER TABLE appointments ADD COLUMN generated_model_data TEXT;
ALTER TABLE appointments ADD COLUMN pier_placements TEXT;
ALTER TABLE appointments ADD COLUMN technician_notes TEXT;

-- Add fields for site photos and improvement sketches to leads  
ALTER TABLE leads ADD COLUMN site_photos TEXT;
ALTER TABLE leads ADD COLUMN improvement_sketch_url TEXT;
ALTER TABLE leads ADD COLUMN improvement_sketch_filename TEXT;


CREATE TABLE appointment_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_id INTEGER NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL,
  filename TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointment_photos_appointment_id ON appointment_photos(appointment_id);
CREATE INDEX idx_appointment_photos_type ON appointment_photos(photo_type);

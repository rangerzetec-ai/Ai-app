
CREATE TABLE sales_people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sales_people (first_name, last_name, email, phone) VALUES
('Kris', 'Johnson', 'kris@pierpr.com', '555-0101'),
('Alex', 'Rodriguez', 'alex@pierpr.com', '555-0102'),
('Jimmy', 'Chen', 'jimmy@pierpr.com', '555-0103'),
('JJ', 'Thompson', 'jj@pierpr.com', '555-0104');

ALTER TABLE leads ADD COLUMN assigned_sales_person_id INTEGER;
ALTER TABLE appointments ADD COLUMN assigned_sales_person_id INTEGER;

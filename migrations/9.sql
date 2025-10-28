
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE engineers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_type TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  workflow_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  assigned_engineer_id INTEGER,
  engineer_response_received_at DATETIME,
  notification_sent_at DATETIME,
  texas_811_ticket_number TEXT,
  texas_811_submitted_at DATETIME,
  assumption_letter_url TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO app_settings (setting_key, setting_value, description) VALUES 
('sms_notification_enabled', 'true', 'Enable SMS notifications for project workflows'),
('email_notification_enabled', 'true', 'Enable email notifications for engineers'),
('auto_start_workflows', 'true', 'Automatically start workflows when project is created');

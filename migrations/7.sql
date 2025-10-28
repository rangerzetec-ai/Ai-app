
CREATE TABLE project_financials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  total_estimated_cost REAL,
  total_actual_cost REAL,
  total_revenue REAL,
  profit_margin REAL,
  payment_status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expense_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  is_billable BOOLEAN DEFAULT TRUE,
  vendor_name TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_revenues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  revenue_date DATE NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  invoice_number TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_financials_project_id ON project_financials(project_id);
CREATE INDEX idx_project_expenses_project_id ON project_expenses(project_id);
CREATE INDEX idx_project_expenses_category_id ON project_expenses(category_id);
CREATE INDEX idx_project_revenues_project_id ON project_revenues(project_id);

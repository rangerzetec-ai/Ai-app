
DELETE FROM expense_categories WHERE name IN (
  'Materials', 'Labor', 'Equipment', 'Transportation', 'Permits', 
  'Insurance', 'Utilities', 'Administrative', 'Miscellaneous'
);

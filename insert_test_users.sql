INSERT INTO users ("uniqueId", "fullName", email, phone) 
VALUES 
  ('student001', 'John Doe', 'john@example.com', '9876543210'),
  ('student002', 'Jane Smith', 'jane@example.com', '9876543211'),
  ('student003', 'Bob Wilson', 'bob@example.com', '9876543212')
ON CONFLICT ("uniqueId") DO NOTHING;

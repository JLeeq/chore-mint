-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Families table
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children table
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  pin TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to generate family code
CREATE OR REPLACE FUNCTION generate_family_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
    code := UPPER(
      SUBSTRING(
        MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6
      )
    );
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM families WHERE family_code = code) INTO exists_check;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to create family on first login (called via RPC)
CREATE OR REPLACE FUNCTION ensure_family_exists(user_id UUID)
RETURNS UUID AS $$
DECLARE
  family_uuid UUID;
  family_code_value TEXT;
BEGIN
  -- Check if family already exists
  SELECT id INTO family_uuid
  FROM families
  WHERE parent_id = user_id
  LIMIT 1;
  
  -- If family doesn't exist, create one
  IF family_uuid IS NULL THEN
    family_code_value := generate_family_code();
    
    INSERT INTO families (parent_id, family_code)
    VALUES (user_id, family_code_value)
    RETURNING id INTO family_uuid;
  END IF;
  
  RETURN family_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add points when submission is approved
CREATE OR REPLACE FUNCTION update_child_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update points when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE children
    SET points = points + 10
    WHERE id = NEW.child_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update points on approval
CREATE TRIGGER on_submission_approved
  AFTER UPDATE ON submissions
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
  EXECUTE FUNCTION update_child_points();

-- Enable Row Level Security
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for families
-- Parents can view and manage their own family
CREATE POLICY "Parents can view their own family"
  ON families FOR SELECT
  USING (auth.uid() = parent_id);

-- Allow anyone to view family by family_code (for child login)
CREATE POLICY "Anyone can view family by family_code"
  ON families FOR SELECT
  USING (true); -- Allow public read for login purposes

CREATE POLICY "Parents can insert their own family"
  ON families FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

-- RLS Policies for children
-- Allow children to view children by PIN within a family (for login)
CREATE POLICY "Allow children view by PIN"
  ON children FOR SELECT
  USING (true); -- Allow public read for PIN-based login

-- Parents can view children in their family
CREATE POLICY "Parents can view children in their family"
  ON children FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = children.family_id
      AND families.parent_id = auth.uid()
    )
  );

-- Parents can insert children in their family
CREATE POLICY "Parents can insert children in their family"
  ON children FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = children.family_id
      AND families.parent_id = auth.uid()
    )
  );

-- Parents can update children in their family
CREATE POLICY "Parents can update children in their family"
  ON children FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = children.family_id
      AND families.parent_id = auth.uid()
    )
  );

-- Children can view their own data (by PIN lookup in application code)
-- Note: PIN-based access is handled in application logic, not RLS

-- RLS Policies for submissions
-- Parents can view submissions in their family
CREATE POLICY "Parents can view submissions in their family"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = submissions.family_id
      AND families.parent_id = auth.uid()
    )
  );

-- Anyone can insert submissions (children use PIN-based auth)
-- For security, we'll allow inserts but restrict to existing family_id
CREATE POLICY "Allow submission inserts for valid families"
  ON submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = submissions.family_id
    )
  );

-- Parents can update submissions in their family
CREATE POLICY "Parents can update submissions in their family"
  ON submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = submissions.family_id
      AND families.parent_id = auth.uid()
    )
  );

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for photos bucket
-- Allow public read access
CREATE POLICY "Public can view photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

-- Allow authenticated users to upload (or anyone via PIN-based flow)
-- For simplicity, allow public uploads (you may want to restrict this)
CREATE POLICY "Public can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photos');

-- Allow authenticated users to delete photos
CREATE POLICY "Authenticated users can delete photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'photos' AND auth.role() = 'authenticated');


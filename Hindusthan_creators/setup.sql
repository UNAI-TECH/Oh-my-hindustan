-- Create the videos table
CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  duration TEXT NOT NULL,
  views TEXT NOT NULL,
  comments_count INTEGER DEFAULT 0,
  likes_percentage INTEGER DEFAULT 0,
  likes_count TEXT NOT NULL,
  visibility TEXT CHECK (visibility IN ('Public', 'Private', 'Unlisted')) DEFAULT 'Public',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Basic RLS Policy (Enable public read access for demo)
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON videos FOR SELECT USING (true);

-- Seed Data
INSERT INTO videos (title, thumbnail_url, duration, views, comments_count, likes_percentage, likes_count, visibility, category)
VALUES 
('Building a Modern Dashboard with React & Tailwind CSS', 'https://picsum.photos/seed/vid1/320/180', '12:34', '11.4K', 332, 97, '1.1K', 'Public', 'React Tutorial'),
('10 UI Design Tips for Better Dashboards', 'https://picsum.photos/seed/vid2/320/180', '08:15', '10.4K', 322, 96, '1.0K', 'Public', 'Design'),
('How to use AI to generate code faster', 'https://picsum.photos/seed/vid3/320/180', '15:45', '9.4K', 312, 95, '0.9K', 'Public', 'AI');

-- Unsplash removed this photo (404); swap in a working one.
UPDATE room_type_images
SET image_url = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200'
WHERE image_url = 'https://images.unsplash.com/photo-1590073242678-70ee3fc28f8e?w=1200';

-- First, clear existing data to start fresh
DELETE FROM checkout_field_options;
DELETE FROM checkout_fields;

-- Insert all checkout fields with proper types (using gen_random_uuid())
INSERT INTO checkout_fields (label_uz, label_ru, field_type, icon, is_required, is_active, sort_order) VALUES
  ('To''liq ism', 'Полное имя', 'text', 'User', true, true, 0),
  ('Telefon raqam', 'Номер телефона', 'phone', 'Phone', true, true, 1),
  ('Uyingiz holati', 'Состояние дома', 'radio', 'Home', true, true, 2),
  ('Qo''ng''iroq uchun qulay vaqt', 'Удобное время для звонка', 'text', 'Clock', false, true, 3),
  ('Qo''shimcha izoh', 'Дополнительный комментарий', 'textarea', 'MessageSquare', false, true, 4);

-- Insert options for the house status radio field
INSERT INTO checkout_field_options (field_id, label_uz, label_ru, value, is_active, sort_order)
SELECT 
  cf.id,
  v.label_uz,
  v.label_ru,
  v.value,
  true,
  v.sort_order
FROM checkout_fields cf
CROSS JOIN (
  VALUES 
    ('Uy to''liq tayyor', 'Дом полностью готов', 'ready', 0),
    ('Remont jarayonida', 'Ремонт в процессе', 'in_progress', 1),
    ('Remontni boshlashni rejalashtirmoqdaman', 'Планирую начать ремонт', 'planning', 2)
) AS v(label_uz, label_ru, value, sort_order)
WHERE cf.field_type = 'radio' AND cf.label_uz = 'Uyingiz holati';
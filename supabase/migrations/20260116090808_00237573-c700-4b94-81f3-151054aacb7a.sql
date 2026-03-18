-- Allow anyone to insert default themes (for initial seeding only)
-- This is safe because themes table is just configuration data
CREATE POLICY "Anyone can insert themes for seeding" 
ON public.themes 
FOR INSERT 
WITH CHECK (true);

-- Also let's insert default themes directly so the app works immediately
INSERT INTO public.themes (name, slug, is_active, is_dark, color_palette, typography, component_styles, layout_settings) 
VALUES 
(
  'Warm Furniture',
  'warm-furniture',
  true,
  false,
  '{"background":"45 30% 98%","foreground":"30 25% 15%","card":"40 35% 96%","cardForeground":"30 25% 15%","popover":"40 35% 96%","popoverForeground":"30 25% 15%","primary":"28 65% 45%","primaryForeground":"45 30% 98%","secondary":"35 25% 88%","secondaryForeground":"30 25% 25%","muted":"35 20% 92%","mutedForeground":"30 15% 45%","accent":"28 55% 55%","accentForeground":"45 30% 98%","destructive":"0 65% 50%","destructiveForeground":"45 30% 98%","border":"35 20% 85%","input":"35 20% 85%","ring":"28 65% 45%"}'::jsonb,
  '{"fontSans":"Inter, system-ui, sans-serif","fontSerif":"Playfair Display, Georgia, serif","fontHeading":"Playfair Display, Georgia, serif"}'::jsonb,
  '{"borderRadius":"0.75rem","buttonRadius":"0.5rem","cardRadius":"1rem","shadowSm":"0 1px 3px 0 rgb(0 0 0 / 0.08)","shadowMd":"0 4px 12px -2px rgb(0 0 0 / 0.1)","shadowLg":"0 12px 40px -8px rgb(0 0 0 / 0.15)"}'::jsonb,
  '{"containerMaxWidth":"1400px","sectionSpacing":"4rem","cardPadding":"1.5rem"}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
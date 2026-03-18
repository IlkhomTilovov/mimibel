-- Remove the overly permissive INSERT policy for security
DROP POLICY IF EXISTS "Anyone can insert themes for seeding" ON public.themes;

-- Insert remaining default themes directly (these won't need client-side seeding)
INSERT INTO public.themes (name, slug, is_active, is_dark, color_palette, typography, component_styles, layout_settings) 
VALUES 
(
  'Modern Light',
  'modern-light',
  false,
  false,
  '{"background":"0 0% 100%","foreground":"240 10% 4%","card":"0 0% 98%","cardForeground":"240 10% 4%","popover":"0 0% 98%","popoverForeground":"240 10% 4%","primary":"240 6% 10%","primaryForeground":"0 0% 98%","secondary":"240 5% 92%","secondaryForeground":"240 6% 10%","muted":"240 5% 96%","mutedForeground":"240 4% 46%","accent":"240 5% 90%","accentForeground":"240 6% 10%","destructive":"0 84% 60%","destructiveForeground":"0 0% 98%","border":"240 6% 90%","input":"240 6% 90%","ring":"240 6% 10%"}'::jsonb,
  '{"fontSans":"Inter, system-ui, sans-serif","fontSerif":"Georgia, serif","fontHeading":"Inter, system-ui, sans-serif"}'::jsonb,
  '{"borderRadius":"0.5rem","buttonRadius":"0.375rem","cardRadius":"0.75rem","shadowSm":"0 1px 2px 0 rgb(0 0 0 / 0.05)","shadowMd":"0 4px 6px -1px rgb(0 0 0 / 0.1)","shadowLg":"0 10px 15px -3px rgb(0 0 0 / 0.1)"}'::jsonb,
  '{"containerMaxWidth":"1280px","sectionSpacing":"3rem","cardPadding":"1.5rem"}'::jsonb
),
(
  'Modern Dark',
  'modern-dark',
  false,
  true,
  '{"background":"240 10% 4%","foreground":"0 0% 98%","card":"240 10% 8%","cardForeground":"0 0% 98%","popover":"240 10% 8%","popoverForeground":"0 0% 98%","primary":"0 0% 98%","primaryForeground":"240 6% 10%","secondary":"240 5% 18%","secondaryForeground":"0 0% 98%","muted":"240 5% 18%","mutedForeground":"240 5% 65%","accent":"240 5% 22%","accentForeground":"0 0% 98%","destructive":"0 62% 50%","destructiveForeground":"0 0% 98%","border":"240 5% 18%","input":"240 5% 18%","ring":"0 0% 98%"}'::jsonb,
  '{"fontSans":"Inter, system-ui, sans-serif","fontSerif":"Georgia, serif","fontHeading":"Inter, system-ui, sans-serif"}'::jsonb,
  '{"borderRadius":"0.5rem","buttonRadius":"0.375rem","cardRadius":"0.75rem","shadowSm":"0 1px 3px 0 rgb(0 0 0 / 0.3)","shadowMd":"0 4px 6px -1px rgb(0 0 0 / 0.4)","shadowLg":"0 10px 15px -3px rgb(0 0 0 / 0.5)"}'::jsonb,
  '{"containerMaxWidth":"1280px","sectionSpacing":"3rem","cardPadding":"1.5rem"}'::jsonb
),
(
  'Bold Modern',
  'bold-modern',
  false,
  false,
  '{"background":"0 0% 100%","foreground":"222 47% 11%","card":"210 40% 98%","cardForeground":"222 47% 11%","popover":"210 40% 98%","popoverForeground":"222 47% 11%","primary":"221 83% 53%","primaryForeground":"210 40% 98%","secondary":"210 40% 93%","secondaryForeground":"222 47% 11%","muted":"210 40% 96%","mutedForeground":"215 16% 47%","accent":"199 89% 48%","accentForeground":"222 47% 11%","destructive":"0 84% 60%","destructiveForeground":"0 0% 98%","border":"214 32% 91%","input":"214 32% 91%","ring":"221 83% 53%"}'::jsonb,
  '{"fontSans":"Inter, system-ui, sans-serif","fontSerif":"Merriweather, Georgia, serif","fontHeading":"Inter, system-ui, sans-serif"}'::jsonb,
  '{"borderRadius":"0.375rem","buttonRadius":"0.25rem","cardRadius":"0.5rem","shadowSm":"0 1px 2px 0 rgb(0 0 0 / 0.05)","shadowMd":"0 4px 6px -1px rgb(0 0 0 / 0.1)","shadowLg":"0 10px 15px -3px rgb(0 0 0 / 0.1)"}'::jsonb,
  '{"containerMaxWidth":"1400px","sectionSpacing":"4rem","cardPadding":"2rem"}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
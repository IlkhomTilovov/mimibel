INSERT INTO public.themes (name, slug, is_active, is_dark, color_palette, typography, component_styles, layout_settings)
VALUES (
  'Default',
  'default',
  true,
  false,
  '{"background":"0 0% 100%","foreground":"240 10% 3.9%","card":"0 0% 100%","cardForeground":"240 10% 3.9%","popover":"0 0% 100%","popoverForeground":"240 10% 3.9%","primary":"24 95% 53%","primaryForeground":"0 0% 100%","secondary":"60 4.8% 95.9%","secondaryForeground":"24 9.8% 10%","muted":"60 4.8% 95.9%","mutedForeground":"25 5.3% 44.7%","accent":"60 4.8% 95.9%","accentForeground":"24 9.8% 10%","destructive":"0 84.2% 60.2%","destructiveForeground":"0 0% 98%","border":"20 5.9% 90%","input":"20 5.9% 90%","ring":"24 95% 53%"}'::jsonb,
  '{"fontSans":"Inter, sans-serif","fontSerif":"Playfair Display, serif","fontHeading":"Playfair Display, serif"}'::jsonb,
  '{"borderRadius":"0.75rem","buttonRadius":"0.75rem","cardRadius":"1rem","shadowSm":"0 1px 2px 0 rgb(0 0 0 / 0.05)","shadowMd":"0 4px 6px -1px rgb(0 0 0 / 0.1)","shadowLg":"0 10px 15px -3px rgb(0 0 0 / 0.1)"}'::jsonb,
  '{"containerMaxWidth":"1280px","sectionSpacing":"4rem","cardPadding":"1.5rem"}'::jsonb
);
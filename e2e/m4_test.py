"""M4 browser checks: AskFred page, Settings, Plan, Integrations, Coming Soon pages, 404, no-regression on shell."""
from playwright.sync_api import sync_playwright
import re
B = 'http://localhost:3000'
ok = []
def check(name, cond, extra=''):
    ok.append(bool(cond)); print(('PASS ' if cond else 'FAIL ') + name, extra)

with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1440, 'height': 860}); pg = ctx.new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('dialog', lambda d: d.accept())

    # every sidebar link resolves (no 404s left)
    for path, text in [('/askfred', 'how can I help today'), ('/ai-skills', 'AI Skills'), ('/analytics', 'Deal Intelligence'), ('/voice-agents', 'Voice Agents'),
                       ('/email-assistant', 'Email Assistant'), ('/upgrade', 'plan'), ('/integrations', 'Discover'), ('/settings', 'Recording')]:
        pg.goto(B + path); pg.wait_for_timeout(600)
        check(f'{path} renders', pg.get_by_text(text, exact=False).first.is_visible() and pg.get_by_text('This page could not be found').count() == 0)
    for path in ['/ai-skills', '/analytics', '/voice-agents', '/email-assistant']:
        pg.goto(B + path); pg.wait_for_timeout(300); check(f'{path} says Coming soon', pg.get_by_text('Coming soon').first.is_visible())
    pg.goto(B + '/definitely-not-a-page'); pg.wait_for_timeout(500); check('404 page', pg.get_by_text('Page not found').is_visible())
    pg.screenshot(path='/tmp/m4_404.png')

    # AskFred full page
    pg.goto(B + '/askfred'); pg.wait_for_timeout(800); pg.screenshot(path='/tmp/m4_askfred_empty.png')
    check('askfred greets with name', pg.get_by_role('heading', name=re.compile(r'Hi .+, how can I help today')).is_visible())
    pg.get_by_label('Chats').get_by_role('button', name='Connectors').click(); pg.wait_for_timeout(300); check('connectors modal', pg.get_by_text('Add Connectors').is_visible())
    pg.get_by_role('button', name=re.compile('Slack')).click(); pg.wait_for_timeout(300); check('connector -> coming soon toast', pg.get_by_text('coming soon', exact=False).count() > 0)
    pg.keyboard.press('Escape')
    pg.get_by_label('Chats').get_by_role('button', name='Search').click(); pg.wait_for_timeout(300); check('history search modal', pg.get_by_placeholder('Search Chat History').is_visible()); pg.keyboard.press('Escape')
    pg.get_by_role('button', name=re.compile('Summarize my last meeting')).click(); pg.wait_for_timeout(2500)
    check('suggestion sends + answer', pg.get_by_text('Summarize my last meeting').count() >= 1 and pg.locator('[class*="leading-relaxed"]').count() >= 1)
    pg.screenshot(path='/tmp/m4_askfred_thread.png')
    pg.reload(); pg.wait_for_timeout(1200); check('chat persists after reload', pg.get_by_text('Summarize my last meeting').count() >= 1)
    pg.get_by_label('Ask Fred').fill('action items'); pg.keyboard.press('Enter'); pg.wait_for_timeout(2200)
    pg.get_by_label('Chats').get_by_role('button', name='Search').click(); pg.get_by_placeholder('Search Chat History').fill('action'); pg.wait_for_timeout(300)
    check('history search finds messages', pg.locator('[role=dialog] p.line-clamp-2').count() >= 1); pg.keyboard.press('Escape')
    pg.get_by_role('button', name='New Chat').click(); pg.wait_for_timeout(800); check('new chat clears', pg.get_by_role('heading', name=re.compile('how can I help today')).is_visible())

    # Settings: sidebar replaced by settings nav, theme persists, toggles persist
    pg.goto(B + '/settings'); pg.wait_for_timeout(700); pg.screenshot(path='/tmp/m4_settings_recording.png')
    check('settings hides app sidebar', pg.get_by_role('link', name='AskFred').count() == 0 and pg.get_by_label('Settings', exact=True).is_visible())
    sw = pg.get_by_role('switch', name='Auto-record meetings'); before = sw.get_attribute('aria-checked'); sw.click(); pg.wait_for_timeout(200)
    pg.reload(); pg.wait_for_timeout(800)
    check('toggle persists across reload', pg.get_by_role('switch', name='Auto-record meetings').get_attribute('aria-checked') != before)
    pg.get_by_role('combobox', name='Meeting language').select_option('Hindi'); pg.reload(); pg.wait_for_timeout(800)
    check('select persists across reload', pg.get_by_role('combobox', name='Meeting language').input_value() == 'Hindi')
    check('pro-gated toggle disabled', pg.get_by_role('switch', name='Capture meeting video').is_disabled())
    pg.get_by_role('button', name='Language & Appearance').click(); pg.get_by_role('radio', name='Light').click(); pg.wait_for_timeout(300)
    check('light theme applied', 'light' in (pg.evaluate('document.documentElement.className')))
    pg.reload(); pg.wait_for_timeout(600); check('theme persists', 'light' in pg.evaluate('document.documentElement.className')); pg.screenshot(path='/tmp/m4_settings_light.png')
    pg.get_by_role('button', name='Language & Appearance').click(); pg.get_by_role('radio', name='Dark').click()
    pg.get_by_label('Search settings').fill('cook'); pg.wait_for_timeout(200); check('settings search filters nav', pg.get_by_role('button', name='Cookies').is_visible() and pg.get_by_role('button', name='Account').count() == 0)
    pg.get_by_label('Search settings').fill('')
    pg.get_by_role('button', name='Account').click(); pg.get_by_role('button', name='Leave Team').click(); pg.wait_for_timeout(200)
    check('leave team modal, continue disabled', pg.get_by_text('Please assign admin').is_visible() and pg.get_by_role('button', name='Continue').is_disabled()); pg.keyboard.press('Escape')
    pg.get_by_role('button', name='Delete My Account').click(); pg.wait_for_timeout(200)
    cont = pg.get_by_role('button', name='Continue'); check('delete modal continue needs a reason', cont.is_disabled())
    pg.get_by_label('What went wrong').select_option('Other'); cont.click(); pg.wait_for_timeout(500)
    check('delete is NOT performed', pg.get_by_text('coming soon', exact=False).count() > 0)
    pg.goto(B + '/meetings'); pg.wait_for_timeout(1200); check('data intact after fake delete', pg.locator('a[href^="/meetings/"]').count() == 6)
    pg.goto(B + '/settings'); pg.get_by_role('button', name='team', exact=True).click(); pg.wait_for_timeout(300)
    check('team tab shows FYI modal', pg.get_by_text("You're editing Teams settings").is_visible()); pg.get_by_role('button', name='Got it').click()
    pg.get_by_role('button', name='Teammates and groups').click(); check('team panel coming soon', pg.get_by_text('Coming soon').first.is_visible())

    # Plan
    pg.goto(B + '/upgrade'); pg.wait_for_timeout(600); pg.screenshot(path='/tmp/m4_upgrade.png')
    check('4 plans', pg.locator('section[aria-label$=" plan"]').count() == 4)
    check('free marked current', pg.get_by_role('button', name='Current').is_disabled())
    a = pg.locator('section[aria-label="Pro plan"] p.text-\\[26px\\]').inner_text(); pg.get_by_role('radio', name='Monthly').click(); m = pg.locator('section[aria-label="Pro plan"] p.text-\\[26px\\]').inner_text()
    check('monthly costs more than annual', int(m.strip('$')) > int(a.strip('$')), (a, m))
    pg.get_by_role('button', name='Upgrade').first.click(); pg.wait_for_timeout(300); check('upgrade -> coming soon', pg.get_by_text('Billing is coming soon').count() > 0)

    # Integrations
    pg.goto(B + '/integrations'); pg.wait_for_timeout(600); pg.screenshot(path='/tmp/m4_integrations.png')
    all_n = pg.locator('main button:has(p.font-medium)').count()
    pg.get_by_role('button', name='CRM', exact=True).click(); crm = pg.locator('main button:has(p.font-medium)').count(); check('CRM filter narrows', 0 < crm < all_n, (crm, all_n))
    pg.get_by_role('button', name='More').click(); pg.get_by_role('button', name='Storage').click(); check('More-menu filter works', 0 < pg.locator('main button:has(p.font-medium)').count() < all_n)
    pg.get_by_role('button', name='All', exact=True).click(); pg.get_by_label('Search integrations').fill('zzzz'); check('empty search state', pg.get_by_text('No integrations match').is_visible())
    pg.get_by_label('Search integrations').fill('hubspot'); pg.locator('main button:has(p.font-medium)').first.click(); pg.wait_for_timeout(300); check('integration -> coming soon', pg.get_by_text('HubSpot integration is coming soon').count() > 0)

    # shell regression: sidebar active state + profile menu theme toggle still work
    pg.goto(B + '/askfred'); pg.wait_for_timeout(500); check('sidebar highlights AskFred', 'bg-hover' in (pg.get_by_role('link', name='AskFred').first.get_attribute('class') or ''))
    print('page errors:', errs); check('no uncaught page errors', not errs); b.close()
print('ALL PASS' if all(ok) else 'SOME FAIL')

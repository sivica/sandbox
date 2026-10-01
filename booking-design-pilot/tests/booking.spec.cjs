const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const btn = (p, name) => p.getByRole('button', { name, exact: true });
const field = (p, name) => p.getByLabel(new RegExp('^' + name));
async function open(p) { await p.goto('/'); await expect(p.getByRole('heading', {level:1})).toHaveText('Feel like yourself, again.'); }
async function time(p) { await p.getByRole('button', {name:/SIGNATURE FACIAL.*The reset/}).click(); await btn(p,'Choose a time →').click(); }
async function form(p) { await time(p); await expect(btn(p,'Continue →')).toBeDisabled(); await btn(p,'09:30').click(); await btn(p,'Continue →').click(); }
async function valid(p) { await field(p,'Full name').fill('PixelTester'); await field(p,'Email address').fill('tester@example.com'); }
async function layout(p) { expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1)).toBeTruthy(); }
async function audit(p) { await expect(p.locator('.screen')).toHaveCSS('opacity', '1'); expect((await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]); await layout(p); }
async function step(p,n,label) { await expect(p.getByRole('status')).toHaveText(`Step ${n} of 5: ${label}`); await expect(p.getByRole('heading',{level:1})).toBeFocused(); await audit(p); }
test.beforeEach(async ({page}) => open(page));
test('five screens: focus, step status, axe and overflow', async ({page:p}, info) => {
 await step(p,1,'Services');
 await p.getByRole('button',{name:/SIGNATURE FACIAL.*The reset/}).click(); await step(p,2,'Service details');
 await btn(p,'Choose a time →').click(); await step(p,3,'Choose a time');
 await btn(p,'09:30').click(); await btn(p,'Continue →').click(); await step(p,4,'Your details');
 for (const control of await p.locator('.field input, .field textarea').all()) {
  await expect(control).toHaveCSS('font-size', '16px');
 }
 await valid(p); await btn(p,'Confirm demo booking →').click();
 await expect(p.getByRole('heading',{level:1})).toHaveText('A moment just for you.'); await step(p,5,'Confirmation'); await p.screenshot({path:info.outputPath('confirmation.png'),fullPage:true});
 await btn(p,'Go back').click(); await expect(field(p,'Full name')).toHaveValue('PixelTester');
});
test('email error description exists at focus time', async ({page:p}) => {
 await form(p); await valid(p); await field(p,'Email address').fill('alex@studio/.com');
 await btn(p,'Confirm demo booking →').focus();
 await p.evaluate(() => { window.focusEvidence=[]; document.querySelector('input[type=email]').addEventListener('focus', e => { const id=e.target.getAttribute('aria-describedby'); window.focusEvidence.push(id && document.getElementById(id)?.textContent); }); });
 await btn(p,'Confirm demo booking →').click(); await expect(field(p,'Email address')).toBeFocused();
 await expect(p.getByText('Enter a valid email address.',{exact:true})).toBeVisible();
 expect(await p.evaluate(() => window.focusEvidence)).toEqual(['Enter a valid email address.']);
});
test('empty, repeated malformed email and correction', async ({page:p}) => {
 await form(p); await btn(p,'Confirm demo booking →').click(); await expect(field(p,'Full name')).toBeFocused();
 await expect(field(p,'Full name')).toHaveAttribute('aria-invalid','true');
 await field(p,'Full name').fill('PixelTester'); await field(p,'Email address').fill('alex@studio/.com');
 for(let i=0;i<2;i++){ await btn(p,'Confirm demo booking →').click(); await expect(field(p,'Email address')).toBeFocused(); await expect(field(p,'Email address')).toHaveAttribute('aria-describedby','email-error'); }
 await field(p,'Email address').fill('tester@example.com'); await btn(p,'Confirm demo booking →').click(); await expect(p.getByRole('heading',{level:1})).toHaveText('A moment just for you.');
});
test('pending locks controls, error retains data and retry succeeds', async ({page:p}) => {
 await form(p); await valid(p); await field(p,'Demo state').selectOption('error'); await btn(p,'Confirm demo booking →').click();
 await expect(btn(p,'Confirming…')).toBeDisabled(); await expect(field(p,'Full name')).toBeDisabled(); await expect(btn(p,'Go back')).toBeDisabled();
 await expect(p.getByText(/We couldn’t complete the demo booking/)).toBeVisible(); await expect(field(p,'Email address')).toHaveValue('tester@example.com');
 await field(p,'Demo state').selectOption('normal'); await btn(p,'Confirm demo booking →').click(); await expect(p.getByRole('heading',{level:1})).toHaveText('A moment just for you.');
});
test('unavailable recovery and changing day clears selection', async ({page:p}) => {
 await time(p); await field(p,'Demo state').selectOption('unavailable'); await expect(p.getByText('No appointments available',{exact:true})).toBeVisible(); await expect(btn(p,'Continue →')).toBeDisabled();
 await btn(p,'Show sample availability').click(); await btn(p,'09:30').click(); await expect(btn(p,'Continue →')).toBeEnabled(); await btn(p,'In 2 days').click(); await expect(btn(p,'Continue →')).toBeDisabled();
});
test('loading and empty menu restoration', async ({page:p}) => {
 await field(p,'Demo state').selectOption('loading'); await expect(p.getByText('Loading treatments…',{exact:true})).toBeVisible(); await field(p,'Demo state').selectOption('empty'); await expect(p.getByText('Our menu is being refreshed',{exact:true})).toBeVisible(); await btn(p,'Show sample menu').click(); await expect(p.getByRole('button',{name:/SIGNATURE FACIAL.*The reset/})).toBeVisible();
});
test('200 percent text size has no horizontal overflow', async ({page:p}, info) => {
 await p.addStyleTag({content:'html { font-size: 200% !important; }'}); await expect(p.locator('h1')).toHaveCSS('font-size', '62px'); await layout(p); await time(p); await layout(p); await btn(p,'09:30').click(); await btn(p,'Continue →').click(); await layout(p); await valid(p); await btn(p,'Confirm demo booking →').click(); await expect(p.getByRole('heading',{level:1})).toHaveText('A moment just for you.'); await layout(p); await p.screenshot({path:info.outputPath('enlarged-confirmation.png'),fullPage:true});
});

test('keyboard traversal and Enter submission', async ({page:p, browserName}) => {
 await form(p); await field(p,'Full name').focus(); await p.keyboard.type('Keyboard Tester');
 await p.keyboard.press('Tab'); await expect(field(p,'Email address')).toBeFocused(); await p.keyboard.type('keyboard@example.com');
 await p.keyboard.press('Tab'); await expect(p.getByPlaceholder('Preferences or accessibility needs')).toBeFocused();
 // WebKit default keyboard policy needs Option+Tab to include buttons.
 await p.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab'); await expect(btn(p,'Confirm demo booking →')).toBeFocused(); await p.keyboard.press('Enter');
 await expect(p.getByRole('heading',{level:1})).toHaveText('A moment just for you.'); await expect(p.getByRole('heading',{level:1})).toBeFocused();
});
test('axe checks validation, failed submission and unavailable states', async ({page:p}) => {
 await form(p); await btn(p,'Confirm demo booking →').click(); await audit(p); await valid(p);
 await field(p,'Demo state').selectOption('error'); await btn(p,'Confirm demo booking →').click(); await expect(p.getByText(/We couldn’t complete the demo booking/)).toBeVisible(); await audit(p);
 await btn(p,'Go back').click(); await field(p,'Demo state').selectOption('unavailable'); await expect(p.getByText('No appointments available',{exact:true})).toBeVisible(); await audit(p);
});

test('axe checks loading and empty states', async ({page:p}) => {
 await field(p,'Demo state').selectOption('loading'); await expect(p.getByText('Loading treatments…',{exact:true})).toBeVisible(); await audit(p);
 await field(p,'Demo state').selectOption('empty'); await expect(p.getByText('Our menu is being refreshed',{exact:true})).toBeVisible(); await audit(p);
});
async function contentFits(p) {
 const clipped = await p.evaluate(() => {
  const box = document.querySelector('.phone').getBoundingClientRect();
  const walker = document.createTreeWalker(document.querySelector('.phone'), NodeFilter.SHOW_TEXT);
  const clipped=[]; let node;
  while (node = walker.nextNode()) {
   if (!node.textContent.trim() || node.parentElement.closest('[aria-hidden=true], .sr-only, option')) continue;
   const range=document.createRange(); range.selectNodeContents(node);
   for (const rect of range.getClientRects()) if (rect.width && (rect.left < box.left-2 || rect.right > box.right+2)) clipped.push(node.textContent.trim());
  }
  return [...new Set(clipped)];
 });
 expect(clipped, 'visible text must fit inside the phone container').toEqual([]);
 for (const b of await p.locator('.phone button:visible').all()) {
  const box=await b.boundingBox(); expect(box.height).toBeGreaterThanOrEqual(48); expect(box.width).toBeGreaterThanOrEqual(24);
 }
}
test('200 percent text remains inside phone and buttons retain target size', async ({page:p}, info) => {
 await p.addStyleTag({content:'html { font-size: 200% !important; }'});
 await contentFits(p); await p.screenshot({path:info.outputPath('enlarged-services.png'),fullPage:true});
 await p.getByRole('button',{name:/SIGNATURE FACIAL.*The reset/}).click(); await contentFits(p);
 await btn(p,'Choose a time →').click(); await contentFits(p);
 await btn(p,'09:30').click(); await btn(p,'Continue →').click(); await contentFits(p);
 await valid(p); await btn(p,'Confirm demo booking →').click(); await expect(p.getByRole('heading',{level:1})).toHaveText('A moment just for you.'); await contentFits(p);
});

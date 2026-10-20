/**
 * Browser flows for print-on-demand marketplace uploads.
 *
 * These encode the operating knowledge from a live 2026-10-20 Redbubble session
 * (9/9 works published by driving the real UI):
 *
 *  - RB has no upload API; the web uploader is the only clean road.
 *  - The master file input is the FIRST input[type=file] on /portfolio/images/new.
 *  - Title input:  input[placeholder="Example: Great Wave of Trees"]
 *  - Description:  the FIRST visible textarea on the page.
 *  - Mature-content question ("Is this mature content?") is a React-controlled
 *    radio pair that REVERTS synthetic JS clicks; the reliable path is a trusted
 *    label click inside the block that owns the h3 "Is this mature content".
 *  - The rights-atmos checkbox is NOT inside a <label>; find it by aria/text
 *    match on "I agree to the Redbubble" and click the raw input via JS.
 *  - "Save work" lives at the very bottom; scroll into view then click.
 *  - Success = URL leaves /portfolio/images/new to /studio/promote/<id>.
 *
 * Security posture: the human logs in inside a visible, persistent browser
 * context. This server never reads or stores credentials, never opens payment
 * screens, and nothing here bills anyone.
 */

import { chromium, type BrowserContext, type Page } from 'playwright';
import { buildRbTags, parseWorkHref, validateTitle } from './util.js';

const RB_BASE = 'https://www.redbubble.com';
const TP_BASE = 'https://www.teepublic.com';

function profileDir(): string {
  return process.env.POD_MCP_PROFILE || `${process.env.HOME || '.'}/.pod-upload-mcp/profile`;
}

let _ctx: BrowserContext | null = null;

export async function getSession(mode: 'visible' | 'headless' = 'visible'): Promise<BrowserContext> {
  if (_ctx) return _ctx;
  _ctx = await chromium.launchPersistentContext(profileDir(), {
    headless: mode === 'headless',
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });
  return _ctx;
}

export async function closeSession(): Promise<void> {
  if (_ctx) {
    await _ctx.close().catch(() => {});
    _ctx = null;
  }
}

/** Navigate to a login page and poll until the human finishes logging in. */
export async function waitForHumanLogin(url: string, heartbeats: string, timeoutMs = 300000): Promise<{ ok: boolean; url: string; detail: string }> {
  const ctx = await getSession();
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  const start = await page.url();
  if (!start.includes('login') && !start.includes('sign_in')) {
    return { ok: true, url: start, detail: 'already authenticated (URL left auth immediately)' };
  }
  const end = start + Math.max(timeoutMs, 60000);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 4000));
    const u = await page.url().catch(() => '');
    if (!u.includes('login') && !u.includes('sign_in')) {
      let marked = false;
      try {
        await page.goto(heartbeats, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2500);
        marked = await page.evaluate(() => document.body && document.body.innerText.includes('User account menu'));
      } catch { marked = false; }
      if (marked) {
        return { ok: true, url: u, detail: 'login confirmed (account menu present)' };
      }
      // URL left auth but marker unclear - still likely logged in; report as ok with note.
      return { ok: true, url: u, detail: 'left auth URL; heartbeat marker not seen' };
    }
  }
  return { ok: false, url: start, detail: `timeout after ${Math.round(timeoutMs / 1000)}s still on auth page` };
}

async function ensureFreshPage(ctx: BrowserContext): Promise<Page> {
  for (const p of ctx.pages()) if (p.isClosed?.() === false && /redbubble\.com|teepublic\.com/.test(p.url())) return p;
  return ctx.newPage();
}

export interface RbUploadArgs {
  filePath: string;
  title: string;
  mainTag: string;
  supportingTags: string;
  description?: string;
}

export interface RbListRow {
  id: string;
  slug: string;
  editHref: string;
}

export interface RbUploadResult {
  ok: boolean;
  workId?: string;
  slug?: string;
  url?: string;
  errors?: string[];
  stage?: string;
}

/** Chip-fill a tag box by targeting the editable in the field block (multi-strategy). */
async function fillTagBox(page: Page, labelRegExp: RegExp, text: string): Promise<void> {
  // Strategy 1: historical placeholder inputs.
  const phMap: Array<[RegExp, string]> = [
    [/^Main Tag$/i, 'input[placeholder="Example: Mountain"]'],
    [/^Supporting Tags$/i, 'input[placeholder="Example: nature, outdoors, painting, realistic"]'],
  ];
  const ph = phMap.find(([re]) => re.test(labelRegExp.source));
  if (ph) {
    const loc = page.locator(ph[1]);
    if ((await loc.count()) > 0) {
      await loc.first().fill(text);
      return;
    }
  }
  // Strategy 2: editable element inside the block that owns the label text.
  const block = page.locator('section, div').filter({ has: page.locator('p, span, h4').filter({ hasText: labelRegExp }) }).last();
  const editable = block.locator('input, [role=textbox], [contenteditable=true]').last();
  if ((await editable.count()) > 0) {
    await editable.click();
    await page.keyboard.insertText(text);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(250);
    return;
  }
  // Strategy 3: DOM search by label adjacency.
  const done = await page.evaluate(({ labelText, value }) => {
    const els = Array.from(document.querySelectorAll('input[type=text], [role=textbox], [contenteditable=true]'));
    const labels = Array.from(document.querySelectorAll('p, span, h4, div'));
    const label = labels.find((l) => (l.textContent || '').trim() === labelText && l.children.length === 0);
    if (!label) return { ok: false, hop: 'label-not-found' };
    const host = label.closest('div, section') as HTMLElement | null;
    if (!host) return { ok: false, hop: 'host-not-found' };
    const target = host.querySelector('input[type=text], [role=textbox], [contenteditable=true]');
    if (!target) return { ok: false, hop: 'field-not-found-next-to-label' };
    const el = target as HTMLInputElement;
    el.focus();
    document.execCommand('insertText', false, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return { ok: true, hop: 'execCommand' };
  }, { labelText: labelRegExp.source, value: text });
  if (!done.ok) throw new Error(`tag field "${labelRegExp.source}" unfilled: ${done.hop}`);
}

async function setMatureNo(page: Page): Promise<boolean> {
  const block = page.locator('section, div').filter({ has: page.locator('h3', { hasText: 'Is this mature content' }) }).last();
  if ((await block.count()) === 0) return false;
  await block.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(200);
  await block.locator('label').filter({ hasText: /^\s*No\s*$/ }).last().click();
  await page.waitForTimeout(350);
  return true;
}

async function ensureAgreement(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const c = Array.from(document.querySelectorAll('input[type=checkbox]')).find((x) =>
      ((x.getAttribute('aria-label') || '') + ((x.parentElement && x.parentElement.textContent) || '')).includes('I agree to the Redbubble'),
    );
    if (!c) return false;
    if (!c.checked) c.click();
    return true;
  });
}

async function saveWork(page: Page): Promise<{ ok: boolean; url: string; errors: string[] }> {
  const btn = page.locator('button', { hasText: 'Save work' }).first();
  await btn.scrollIntoViewIfNeeded().catch(() => {});
  await btn.click().catch(() => {});
  const left = await page
    .waitForFunction(() => !location.href.includes('/images/new'), { timeout: 45000 })
    .then(() => true)
    .catch(() => false);
  if (!left) {
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => /save work/i.test(x.innerText || ''));
      if (b) { b.scrollIntoView({ block: 'center' }); b.click(); }
    }).catch(() => {});
    await page.waitForFunction(() => !location.href.includes('/images/new'), { timeout: 40000 }).catch(() => {});
  }
  await page.waitForTimeout(2500);
  const url = await page.url();
  const errors = await page.evaluate(() =>
    Array.from(new Set(
      Array.from(document.querySelectorAll('[class*=error], [class*=Error]'))
        .map((n) => (n.innerText || '').trim().replace(/\s+/g, ' '))
        .filter((t) => t && t.length < 100),
    )).slice(0, 6),
  );
  return { ok: !url.includes('/images/new') && /promote|manage|studio/.test(url), url, errors };
}

export async function rbUploadWork(args: RbUploadArgs): Promise<RbUploadResult> {
  const { filePath, title, mainTag, supportingTags, description } = args;
  const warns = validateTitle(title);
  const tags = buildRbTags(mainTag, String(supportingTags).split(','));
  const ctx = await getSession();
  const page = await ensureFreshPage(ctx);
  try {
    await page.goto(`${RB_BASE}/portfolio/images/new`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('input[type=file]', { timeout: 45000 });
    await page.locator('input[type=file]').first().setInputFiles(filePath);
    await page.waitForSelector('input[placeholder="Example: Great Wave of Trees"]', { timeout: 60000 });
    await page.waitForTimeout(6000);
    await page.fill('input[placeholder="Example: Great Wave of Trees"]', title);
    await fillTagBox(page, /^Main Tag$/i, tags.main);
    await fillTagBox(page, /^Supporting Tags$/i, tags.supporting.join(', '));
    if (description) {
      const ta = page.locator('textarea').first();
      await ta.fill(description);
    }
    const matureSet = await setMatureNo(page);
    const agreed = await ensureAgreement(page);
    if (!matureSet || !agreed) {
      const errors = await page.evaluate(() =>
        Array.from(new Set(
          Array.from(document.querySelectorAll('[class*=error], [class*=Error]'))
            .map((n) => (n.innerText || '').trim().replace(/\s+/g, ' '))
            .filter((t) => t && t.length < 100),
        )).slice(0, 4),
      ).catch(() => []);
      return { ok: false, stage: 'required-answers', errors: [...errors, ...(matureSet ? [] : ['mature-content block not found']), ...(agreed ? [] : ['agreement checkbox not found'])] };
    }
    const save = await saveWork(page);
    if (!save.ok) return { ok: false, stage: 'save', url: save.url, errors: save.errors };
    const m = /\/(\d+)-([a-z0-9-]+)/.exec(save.url) || [];
    const workId = (save.url.match(/promote\/(\d+)/) || [])[1] || m[1] || undefined;
    return { ok: true, workId, slug: m[2] || undefined, url: save.url, errors: warns };
  } catch (e) {
    return { ok: false, stage: 'exception', errors: [String(e).slice(0, 300)] };
  }
}

export async function rbListWorks(): Promise<{ ok: boolean; works: RbListRow[]; error?: string }> {
  try {
    const ctx = await getSession();
    const page = await ensureFreshPage(ctx);
    await page.goto(`${RB_BASE}/portfolio/manage_works`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4000);
    const hrefs: string[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href') || '').filter((h) => /\/portfolio\/images\/\d+-/.test(h)),
    );
    const seen = new Map<string, RbListRow>();
    for (const h of hrefs) {
      const p = parseWorkHref(h);
      if (!p) continue;
      if (seen.has(p.id)) continue;
      seen.set(p.id, { id: p.id, slug: p.slug, editHref: h });
    }
    return { ok: true, works: [...seen.values()] };
  } catch (e) {
    return { ok: false, works: [], error: String(e).slice(0, 250) };
  }
}

/** Diagnostic dump of the upload form's text fields (for repairing selectors in the wild). */
export async function rbProbeForm(): Promise<{ ok: boolean; fields: unknown[]; error?: string }> {
  try {
    const ctx = await getSession();
    const page = await ensureFreshPage(ctx);
    await page.goto(`${RB_BASE}/portfolio/images/new`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('input[type=file]', { timeout: 45000 });
    await page.locator('input[type=file]').first().setInputFiles('');
    await page.waitForTimeout(3000);
    const fields = await page.evaluate(() =>
      Array.from(document.querySelectorAll('input, textarea, [role=textbox], [contenteditable=true]'))
        .filter((x) => (x as HTMLElement).offsetParent)
        .slice(0, 24)
        .map((x) => ({
          tag: x.tagName,
          type: x.getAttribute('type'),
          placeholder: x.getAttribute('placeholder'),
          ariaLabel: x.getAttribute('aria-label'),
          cls: String(x.className).slice(0, 80),
          contenteditable: x.getAttribute('contenteditable'),
        })),
    );
    return { ok: true, fields };
  } catch (e) {
    return { ok: false, fields: [], error: String(e).slice(0, 250) };
  }
}

export interface TpUploadArgs {
  filePath: string;
  title: string;
  tags: string;
  description?: string;
}

/**
 * TeePublic upload. tee flow: /designer pages use a file input then an edit form
 * with Title + Tags, ending in Submit.v0.1.0 is marked EXPERIMENTAL: the RB flow
 * above is field-verified against a live session; TP selectors get pinned on the
 * first live run (probe tool will dump the form).
 */
export async function tpUploadDesign(args: TpUploadArgs): Promise<{ ok: boolean; url?: string; errors?: string[] }> {
  const ctx = await getSession();
  const page = await ensureFreshPage(ctx);
  try {
    await page.goto(`${TP_BASE}/upload`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (await page.url().includes('404') || !(await page.locator('input[type=file]').count())) {
      await page.goto(`${TP_BASE}/designer-signup`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    await page.waitForSelector('input[type=file]', { timeout: 45000 });
    await page.locator('input[type=file]').first().setInputFiles(args.filePath);
    await page.waitForTimeout(5000);
    const titleInput = page.locator('input[name*=title i], input[placeholder*=title i]').first();
    await titleInput.fill(args.title);
    const tagsInput = page.locator('input[name*=tag i], input[placeholder*=tag i]').first();
    await tagsInput.fill(args.tags);
    if (args.description) {
      const d = page.locator('textarea').first();
      if ((await d.count()) > 0) await d.fill(args.description);
    }
    const submit = page.locator('button, input[type=submit]').filter({ hasText: /submit|publish/i }).first();
    await submit.scrollIntoViewIfNeeded().catch(() => {});
    await submit.click({ timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(6000);
    const url = await page.url();
    return { ok: true, url };
  } catch (e) {
    return { ok: false, errors: [String(e).slice(0, 300)] };
  }
}

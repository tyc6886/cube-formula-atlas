import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const shots = path.join(root, 'test-results', 'screenshots');
await mkdir(shots, { recursive: true });
const server = spawn(process.execPath, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4173'], { cwd: root, stdio: 'pipe', shell: false });
let browser;
const errors = [];
const notFound = [];
const checks = [];

async function waitServer() {
  for (let i = 0; i < 60; i++) {
    try { const response = await fetch('http://127.0.0.1:4173/'); if (response.ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Preview server did not start');
}

async function shot(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);
  const file = path.join(shots, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  const size = await stat(file);
  checks.push(`screenshot ${name}: ${size.size} bytes`);
}

async function waitFor3D(page, selector) {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'visible', timeout: 60000 });
  await locator.scrollIntoViewIfNeeded();
  await page.waitForFunction(async (query) => {
    const player = document.querySelector(query);
    if (!player) return false;
    const canvases = await player.experimentalCurrentCanvases();
    return canvases.some((canvas) => canvas.width > 0 && canvas.height > 0);
  }, selector, { timeout: 60000 });
  await page.waitForTimeout(500);
}

async function waitForCard3D(page) {
  await page.locator('.case-cube-model[data-state="player"] twisty-player').first().waitFor({ state: 'visible', timeout: 60000 });
  await page.waitForFunction(async () => {
    const models = Array.from(document.querySelectorAll('.case-cube-model')).filter((model) => {
      const rect = model.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < innerHeight;
    });
    if (!models.length || models.some((model) => model.dataset.state !== 'player')) return false;
    const players = models.map((model) => model.querySelector('twisty-player'));
    if (players.some((player) => !player)) return false;
    const canvasGroups = await Promise.all(players.map((player) => player.experimentalCurrentCanvases()));
    return canvasGroups.every((canvases) => canvases.some((canvas) => canvas.width > 0 && canvas.height > 0));
  }, null, { timeout: 60000 });
  await page.waitForTimeout(500);
}

async function readPlayerPattern(locator) {
  return locator.evaluate(async (player) => (await player.experimentalModel.currentPattern.get()).toJSON().patternData);
}

try {
  await waitServer();
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => { if (response.status() === 404) notFound.push(response.url()); });

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await waitFor3D(page, '.hero-player-wrap twisty-player');
  checks.push('home 3D canvas visible');
  await shot(page, 'home-desktop');

  await page.getByRole('link', { name: '开始浏览公式' }).click();
  await page.locator('.case-card').first().waitFor();
  checks.push(`F2L cards: ${await page.locator('.case-card').count()}`);
  await waitForCard3D(page);
  const f2lPlayers = page.locator('.case-cube-model[data-state="player"] twisty-player');
  if (await f2lPlayers.count() < 4) throw new Error('Fewer than four visible F2L players');
  const f2lPatterns = [];
  for (let index = 0; index < 4; index++) f2lPatterns.push(JSON.stringify(await readPlayerPattern(f2lPlayers.nth(index))));
  if (new Set(f2lPatterns).size !== 4) throw new Error('Adjacent F2L models are not case-specific');
  checks.push('All visible F2L cards rendered case-specific TwistyPlayer models');
  await shot(page, 'f2l-desktop');
  const initialPlayerCount = await page.locator('.case-cube-model twisty-player').count();
  const totalCardCount = await page.locator('.case-card').count();
  if (initialPlayerCount >= totalCardCount) throw new Error('Offscreen cards created players eagerly');
  checks.push(`Card players loaded on demand: ${initialPlayerCount}/${totalCardCount}`);

  const cardModel = page.locator('.case-cube-model').first();
  const cardPlayer = cardModel.locator('twisty-player');
  const cardPattern = await readPlayerPattern(cardPlayer);
  const beforeRotation = await cardModel.screenshot();
  const bounds = await cardModel.boundingBox();
  if (!bounds) throw new Error('Card 3D model has no bounds');
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 42, bounds.y + bounds.height / 2 + 12, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const afterRotation = await cardModel.screenshot();
  if (beforeRotation.equals(afterRotation)) throw new Error('Dragging did not rotate the card 3D model');
  if (!page.url().includes('#/category/f2l')) throw new Error('Dragging a card model opened its link');
  await shot(page, 'f2l-card-rotated');
  checks.push('Card model drag rotation worked without opening the link');
  await cardModel.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(250);
  const afterKeyboard = await cardModel.screenshot();
  if (afterRotation.equals(afterKeyboard)) throw new Error('Arrow key did not rotate the card 3D model');
  checks.push('Card model keyboard rotation worked');
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x - 55, bounds.y - 35, { steps: 8 });
  // Suppress the native click once, then deliver it late to exercise the race condition.
  await page.evaluate(() => document.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  }, { once: true, capture: true }));
  await page.mouse.up();
  await page.waitForTimeout(60);
  await page.locator('.case-card-link').first().dispatchEvent('click');
  await page.waitForTimeout(200);
  if (!page.url().includes('#/category/f2l')) throw new Error('A delayed click after dragging outside the model opened its link');
  checks.push('Drag ending outside the model and a delayed link click did not navigate');

  await page.locator('.case-card').last().scrollIntoViewIfNeeded();
  await waitForCard3D(page);
  await page.waitForFunction(() => {
    const first = document.querySelector('.case-cube-model');
    return first && first.getBoundingClientRect().bottom < -100 && !first.querySelector('twisty-player');
  });
  checks.push('Offscreen card released its player');
  await page.locator('.case-card').first().scrollIntoViewIfNeeded();
  await waitForCard3D(page);

  await page.locator('.case-card-link').first().click();
  await waitFor3D(page, '.viewer-panel twisty-player');
  const detailPattern = await readPlayerPattern(page.locator('.viewer-panel twisty-player'));
  if (JSON.stringify(cardPattern) !== JSON.stringify(detailPattern)) throw new Error('Card and detail player patterns differ');
  checks.push('Card and detail player initial patterns match exactly');
  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await page.waitForTimeout(250);
  const stepAfterNext = await page.locator('.move-readout strong').innerText();
  checks.push(`step after next: ${stepAfterNext}`);
  if (stepAfterNext.trim() !== '1 / 4') throw new Error(`Next step did not advance: ${stepAfterNext}`);
  await page.getByRole('button', { name: '上一步', exact: true }).click();
  await page.waitForTimeout(150);
  if ((await page.locator('.move-readout strong').innerText()).trim() !== '0 / 4') throw new Error('Previous step did not reset to zero');
  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await page.getByRole('button', { name: '播放', exact: true }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  checks.push('play and pause worked');
  await page.getByRole('button', { name: '复位到初始状态', exact: true }).click();
  await page.locator('.alternative-list > button').nth(1).click();
  await waitFor3D(page, '.viewer-panel twisty-player');
  const alternativeClass = await page.locator('.alternative-list > button').nth(1).getAttribute('class');
  checks.push(`alternative selected: ${alternativeClass}`);
  if (!alternativeClass?.includes('active')) throw new Error('Alternative formula was not selected');
  await page.locator('.detail-actions').getByRole('button', { name: '复制公式', exact: true }).click();
  await page.getByText('公式已复制', { exact: true }).waitFor();
  checks.push('copy formula worked');
  await page.locator('.detail-actions').getByRole('button', { name: '收藏', exact: true }).click();
  await page.getByRole('button', { name: '已掌握', exact: true }).click();
  const stored = await page.evaluate(() => localStorage.getItem('cube-formula-learning-v1'));
  if (!stored || !JSON.parse(stored).favorites.length) throw new Error('Learning state was not saved');
  checks.push(`localStorage saved: ${stored}`);
  await shot(page, 'detail-desktop');

  await page.locator('.main-nav a[href="#/progress"]').click();
  await page.getByRole('heading', { name: '学习进度', exact: true }).waitFor();
  checks.push(`progress page mastered summary: ${await page.locator('.progress-summary').innerText()}`);
  await page.locator('.main-nav a[href="#/favorites"]').click();
  await page.locator('.favorite-row').waitFor();
  checks.push(`favorite rows: ${await page.locator('.favorite-row').count()}`);

  await page.locator('.main-nav a[href="#/category/f2l"]').click();
  await page.locator('#status-filter').selectOption('favorites');
  if (await page.locator('.case-card').count() !== 1) throw new Error('Alternative favorite is missing from catalog filter');
  await page.locator('#status-filter').selectOption('mastered');
  if (await page.locator('.case-card').count() !== 1) throw new Error('Alternative mastered status is missing from catalog filter');
  checks.push('alternative favorite and mastered filters worked');

  await page.locator('#global-search').fill('RUR′U′');
  await page.locator('.sidebar-search').press('Enter');
  await page.locator('.case-card').first().waitFor();
  checks.push(`curly-prime compact search results: ${await page.locator('.case-card').count()}`);
  await page.locator('#global-search').fill('ZBLL T 1');
  await page.locator('.sidebar-search').press('Enter');
  await page.locator('.case-card').first().waitFor();
  if (await page.locator('#search-page-input').inputValue() !== 'ZBLL T 1') throw new Error('Search form did not follow URL query');
  checks.push(`search results: ${await page.locator('.case-card').count()}`);

  const expectedCategories = [['f2l', 41], ['f2l4', 164], ['af2l', 216], ['oll', 57], ['pll', 21], ['zbll', 493]];
  for (const [categoryId, expectedCount] of expectedCategories) {
    await page.goto(`http://127.0.0.1:4173/#/category/${categoryId}`, { waitUntil: 'networkidle' });
    const count = Number(await page.locator('.page-stat strong').innerText());
    if (count !== expectedCount) throw new Error(`${categoryId} count ${count} !== ${expectedCount}`);
    await waitForCard3D(page);
    const players = page.locator('.case-cube-model[data-state="player"] twisty-player');
    if (await players.count() < 4) throw new Error(`${categoryId} has fewer than four visible players`);
    const patterns = [];
    for (let index = 0; index < 4; index++) patterns.push(JSON.stringify(await readPlayerPattern(players.nth(index))));
    if (new Set(patterns).size !== 4) throw new Error(`${categoryId} models do not distinguish cases or orientations`);
    checks.push(`${categoryId}: four distinct TwistyPlayer models verified`);
    await shot(page, `${categoryId}-desktop`);
    await page.locator('.case-card-link').first().click();
    await waitFor3D(page, '.viewer-panel twisty-player');
  }
  checks.push('all category counts and representative 3D details worked');
  await page.goto('http://127.0.0.1:4173/#/category/zbll', { waitUntil: 'networkidle' });
  const zbllGroups = await page.locator('.group-filter button').allTextContents();
  checks.push(`ZBLL groups: ${zbllGroups}`);
  if (zbllGroups.length !== 9) throw new Error('ZBLL groups are incomplete');
  await page.goto('http://127.0.0.1:4173/#/guide', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: '黄顶、蓝前，从情况状态开始。' }).waitFor();
  await shot(page, 'guide-desktop');
  await page.evaluate(() => localStorage.setItem('cube-formula-learning-v1', '{broken-json'));
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await waitFor3D(page, '.hero-player-wrap twisty-player');
  if (await page.locator('.stats-strip > div').last().locator('strong').innerText() !== '0') throw new Error('Malformed local data was not recovered');
  checks.push('malformed local data recovered without crashing');

  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const mobilePage = await mobile.newPage();
  mobilePage.on('console', (message) => { if (message.type() === 'error') errors.push(`mobile: ${message.text()}`); });
  mobilePage.on('pageerror', (error) => errors.push(`mobile: ${error.message}`));
  mobilePage.on('response', (response) => { if (response.status() === 404) notFound.push(response.url()); });
  await mobilePage.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await waitFor3D(mobilePage, '.hero-player-wrap twisty-player');
  const homeOverflow = await mobilePage.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  checks.push(`mobile home width: ${JSON.stringify(homeOverflow)}`);
  await shot(mobilePage, 'home-mobile');
  await mobilePage.getByRole('button', { name: '打开导航' }).click();
  await mobilePage.getByRole('dialog', { name: '网站导航' }).waitFor();
  const duplicateIds = await mobilePage.evaluate(() => {
    const ids = Array.from(document.querySelectorAll('[id]')).map((element) => element.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  });
  if (duplicateIds.length) throw new Error(`Duplicate element IDs: ${duplicateIds}`);
  await mobilePage.locator('.mobile-menu .main-nav a').last().focus();
  await mobilePage.keyboard.press('Tab');
  if (!await mobilePage.evaluate(() => document.activeElement?.classList.contains('brand'))) throw new Error('Mobile menu focus did not wrap');
  await mobilePage.keyboard.press('Escape');
  if (await mobilePage.getByRole('dialog').count() !== 0) throw new Error('Mobile menu did not close');
  if (!await mobilePage.evaluate(() => document.activeElement?.getAttribute('aria-label') === '打开导航')) throw new Error('Menu focus did not return to trigger');
  if (await mobilePage.evaluate(() => document.body.style.overflow === 'hidden')) throw new Error('Body scroll remained locked');
  checks.push('mobile menu IDs, focus trap, Escape, and scroll recovery worked');
  await mobilePage.goto('http://127.0.0.1:4173/#/category/f2l', { waitUntil: 'networkidle' });
  await waitForCard3D(mobilePage);
  if (await mobilePage.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile catalog overflow');
  await shot(mobilePage, 'f2l-mobile');
  await mobilePage.goto('http://127.0.0.1:4173/#/category/f2l/case/f2l-f-1-o0', { waitUntil: 'networkidle' });
  await waitFor3D(mobilePage, '.viewer-panel twisty-player');
  const detailOverflow = await mobilePage.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  checks.push(`mobile detail width: ${JSON.stringify(detailOverflow)}`);
  const undersizedControls = await mobilePage.locator('.player-controls button, .speed-control select').evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { label: element.getAttribute('aria-label') || element.textContent, width: rect.width, height: rect.height };
  }).filter((rect) => rect.width < 44 || rect.height < 44));
  if (undersizedControls.length) throw new Error(`Undersized mobile controls: ${JSON.stringify(undersizedControls)}`);
  await shot(mobilePage, 'detail-mobile');
  await mobilePage.getByRole('button', { name: '下一步', exact: true }).click();
  await mobilePage.waitForTimeout(200);
  if ((await mobilePage.locator('.move-readout strong').innerText()).trim() !== '1 / 4') throw new Error('Mobile next step failed');
  await mobilePage.locator('.speed-control select').selectOption('0.5');
  if (await mobilePage.locator('.speed-control select').inputValue() !== '0.5') throw new Error('Mobile speed control failed');
  await mobilePage.locator('.alternative-list > button').nth(1).click();
  await waitFor3D(mobilePage, '.viewer-panel twisty-player');
  if ((await mobilePage.locator('.formula-large').innerText()).trim() !== "R' F R F'") throw new Error('Mobile alternative formula failed');
  checks.push('mobile step, speed, and alternative controls worked');

  for (const width of [768, 1024]) {
    const responsiveContext = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const responsivePage = await responsiveContext.newPage();
    responsivePage.on('console', (message) => { if (message.type() === 'error') errors.push(`${width}px: ${message.text()}`); });
    responsivePage.on('pageerror', (error) => errors.push(`${width}px: ${error.message}`));
    responsivePage.on('response', (response) => { if (response.status() === 404) notFound.push(response.url()); });
    await responsivePage.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
    await waitFor3D(responsivePage, '.hero-player-wrap twisty-player');
    if (await responsivePage.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`${width}px home overflow`);
    await shot(responsivePage, `home-${width}`);
    await responsivePage.goto('http://127.0.0.1:4173/#/category/f2l/case/f2l-f-1-o0', { waitUntil: 'networkidle' });
    await waitFor3D(responsivePage, '.viewer-panel twisty-player');
    if (await responsivePage.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`${width}px detail overflow`);
    await shot(responsivePage, `detail-${width}`);
  }
  checks.push('768px and 1024px home/detail layouts worked');

  const perf = await page.evaluate(() => ({ resources: performance.getEntriesByType('resource').length, transfer: performance.getEntriesByType('resource').reduce((sum, entry) => sum + (entry.transferSize || 0), 0) }));
  checks.push(`performance resource count/transfer: ${JSON.stringify(perf)}`);
  console.log(JSON.stringify({ checks, errors, notFound }, null, 2));
  if (errors.length || notFound.length || homeOverflow.scroll > homeOverflow.width || detailOverflow.scroll > detailOverflow.width) process.exitCode = 1;
} catch (error) {
  console.log(JSON.stringify({ checks, errors, notFound, failure: String(error) }, null, 2));
  if (browser) {
    const pages = browser.contexts().flatMap((item) => item.pages());
    if (pages[0]) await pages[0].screenshot({ path: path.join(shots, 'failure.png'), fullPage: true });
  }
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill();
}

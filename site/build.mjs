// Builds the static RedAssistance site: site/src/{layout.html,pages/*.html,config.json} -> site/ro/*.html
// No dependencies. Run: node site/build.mjs
//
// Template syntax (deliberately tiny):
//   {{a.b}}                      value from config/page, HTML-escaped
//   {{#if a.b}}…{{else}}…{{/if}}  block kept only when the value is truthy (nesting allowed)
//   {{{body}}}                   raw page body (layout only)
// Every page starts with  <!--meta {"title":…,"description":…,"slug":…} -->

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const out = join(root, 'ro');

const config = JSON.parse(readFileSync(join(src, 'config.json'), 'utf8'));
const layout = readFileSync(join(src, 'layout.html'), 'utf8');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const get = (ctx, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), ctx);

function render(tpl, ctx) {
  // Resolve innermost if-blocks first so nesting works.
  const IF = /\{\{#if ([\w.]+)\}\}((?:(?!\{\{#if )[\s\S])*?)\{\{\/if\}\}/;
  let m;
  while ((m = IF.exec(tpl))) {
    const [yes, no = ''] = m[2].split('{{else}}');
    tpl = tpl.slice(0, m.index) + (get(ctx, m[1]) ? yes : no) + tpl.slice(m.index + m[0].length);
  }
  return tpl
    .replace(/\{\{\{([\w.]+)\}\}\}/g, (_, k) => get(ctx, k) ?? '')
    .replace(/\{\{([\w.]+)\}\}/g, (_, k) => {
      const v = get(ctx, k);
      if (v == null) throw new Error(`Missing value for {{${k}}} — gate it with {{#if ${k}}} or set it in config.json`);
      return esc(v);
    });
}

mkdirSync(out, { recursive: true });
const pages = readdirSync(join(src, 'pages')).filter(f => f.endsWith('.html'));
for (const file of pages) {
  const raw = readFileSync(join(src, 'pages', file), 'utf8');
  const mm = raw.match(/^<!--meta (\{[\s\S]*?\}) -->\n/);
  if (!mm) throw new Error(`${file}: missing <!--meta {...} --> header`);
  const page = JSON.parse(mm[1]);
  const name = file.replace(/\.html$/, '');
  page.file = name === 'index' ? '' : name;
  page.canonical = config.site.url + config.site.path + page.file;
  const ctx = { ...config, page, is: { [page.slug]: true }, year: new Date().getFullYear() };
  ctx.body = render(raw.slice(mm[0].length), ctx);
  writeFileSync(join(out, file), render(layout, ctx));
  console.log('built ro/' + file);
}

#!/usr/bin/env python3
"""
AdminCore monolit HTML -> Symfony (Twig + public assets) szétbontó.

Használat (a projekt gyökeréből):
    python3 tools/split_legacy.py admincore legacy/AdminCore_Szervezesi_tabla_33_3.html
    python3 tools/split_legacy.py szerelo   legacy/szerelo-telefon.html
    python3 tools/split_legacy.py teendoim  legacy/teendoim.html
    python3 tools/split_legacy.py penzugy   legacy/penzugy-panou-2026-04.html

Mit csinál:
  * minden inline <style>  -> public/assets/<app>/css/NN-nev.css   + <link> a sablonban
  * minden inline <script> -> public/assets/<app>/js/NN-nev.js     + <script src> a sablonban
  * a HTML-jelölő részek   -> templates/<app>/markup/NN-nev.html.twig ({% verbatim %})
  * a Supabase URL / kulcs  -> .env (ADMINCORE_SUPABASE_URL / ADMINCORE_SUPABASE_KEY)
A sorrend és a tartalom bájtra azonos marad; ellenőrzés: bin/console app:verify-legacy
"""
import os, re, sys

# A blokkok sorrendje szerinti nevek (a v33 szerkezete alapján). None = külső Supabase SDK.
ADMINCORE_NAMES = [
    None,                       # 0  külső Supabase SDK <script src>
    'boot-guard',               # 1  file:// figyelmeztetés + globális hibasor
    'base',                     # 2
    'standalone-model',         # 3
    'hr-storage-alias',         # 4
    'module-body',              # 5
    'browser-design',           # 6
    'integrated-modules',       # 7
    'orgboard-models',          # 8
    'admin-nav',                # 9
    'admincore-policies',       # 10
    'orgboard-chain',           # 11
    'admin-nav',                # 12
    'supabase-adapter',         # 13
    'ra-loop',                  # 14
    'admincore-fullscreen',     # 15
    'admincore-fullscreen',     # 16
    'intake-sheet',             # 17
    'intake-sheet',             # 18
    'finance-window',           # 19
    'nav-shim',                 # 20
    'pin',                      # 21
    'production',               # 22
    'production-window',        # 23
    'verif',                    # 24
    'tmj',                      # 25
    'gyules',                   # 26
    'telefon-feladat',          # 27
    'launch',                   # 28
]

TOKEN = re.compile(r'<!--|<script\b[^>]*>|<style\b[^>]*>', re.I)
SB_URL_RE = re.compile(r"var SB_URL='([^']+)';")
SB_KEY_RE = re.compile(r"var SB_KEY='([^']+)';")
# a telefonos appokban egy sorban: var SB_URL='...', SB_KEY='...';
SB_PAIR_RE = re.compile(r"var SB_URL='([^']+)', SB_KEY='([^']+)';")
SDK_RE = re.compile(r'<script src="([^"]+)"></script>')


def blocks(t):
    """(start, end, kind, open_tag, body) — böngésző-szerű szkennelés: kommentet és
    script/style belsejét átugorja, így a JS-stringekben lévő '<style>' nem zavar."""
    i = 0
    while True:
        m = TOKEN.search(t, i)
        if not m:
            return
        if m.group(0) == '<!--':
            i = t.index('-->', m.end()) + 3
            continue
        kind = 'script' if m.group(0).lower().startswith('<script') else 'style'
        close = t.lower().index('</' + kind, m.end())
        end = t.index('>', close) + 1
        yield m.start(), end, kind, m.group(0), t[m.end():close]
        i = end


TWIG_SYNTAX = re.compile(r'\{[{%#]')


def twig_raw(s):
    """Szöveg úgy, hogy a Twig ne értelmezze: csak akkor kell verbatim, ha van benne Twig-jel."""
    return '{% verbatim %}' + s + '{% endverbatim %}' if TWIG_SYNTAX.search(s) else s


# A jelölő-részek (HTML) nevei sorrendben.
ADMINCORE_MARKUP = ['head', 'board', 'module-dialog', 'admin-shell']

APPS = {
    'admincore': {'names': ADMINCORE_NAMES, 'markup': ADMINCORE_MARKUP},
    'szerelo': {'names': ['app', None, 'app'], 'markup': ['head', 'screens']},
    'teendoim': {'names': ['app', None, 'app'], 'markup': ['head', 'screens']},
    # '@keep' = külső <script src> (nem a Supabase SDK): szó szerint a sablonban marad
    'penzugy': {'names': ['@keep', 'app', 'app'], 'markup': ['head', 'body']},
}


def main(app, src, root='.'):
    NAMES, MARKUP = APPS[app]['names'], APPS[app]['markup']
    t = open(src, encoding='utf-8', newline='').read()
    bl = list(blocks(t))
    if len(bl) != len(NAMES):
        sys.exit(f'{len(bl)} blokk van, {len(NAMES)} név — az APPS[{app!r}] listát frissíteni kell.')

    for d in (f'public/assets/{app}/css', f'public/assets/{app}/js', f'templates/{app}/markup'):
        os.makedirs(os.path.join(root, d), exist_ok=True)

    env = {}
    tpl = []
    pos = 0
    mk = 0
    nr_counter = 0
    for idx, (s, e, kind, open_tag, body) in enumerate(bl):
        chunk = t[pos:s]
        if len(chunk) > 200:
            mk += 1
            name = f'markup/{mk:02d}-{MARKUP[mk - 1]}.html.twig'
            # Partial: mindig verbatim, mert a Twig kódot nem szabad belőle értelmezni.
            open(os.path.join(root, f'templates/{app}', name), 'w', encoding='utf-8', newline='').write(
                '{% verbatim %}' + chunk + '{% endverbatim %}')
            tpl.append("{{ include('%s/%s') }}" % (app, name))
        else:
            tpl.append(twig_raw(chunk))
        pos = e

        if NAMES[idx] == '@keep':  # egyéb külső könyvtár: változatlanul
            tpl.append(twig_raw(t[s:e]))
            continue

        if NAMES[idx] is None:  # külső SDK
            env['ADMINCORE_SUPABASE_SDK'] = SDK_RE.match(t[s:e]).group(1)
            tpl.append('<script src="{{ admincore.supabaseSdk }}"></script>')
            continue

        nr = f'{nr_counter:02d}'
        nr_counter += 1
        if kind == 'script':
            if open_tag != '<script>':
                sys.exit(f'Váratlan script attribútum: {open_tag}')
            m1, m2 = SB_URL_RE.search(body), SB_KEY_RE.search(body)
            if m1 and m2:
                env['ADMINCORE_SUPABASE_URL'], env['ADMINCORE_SUPABASE_KEY'] = m1.group(1), m2.group(1)
                body = body.replace(m1.group(0), 'var SB_URL=window.ADMINCORE_CFG.supabaseUrl;')
                body = body.replace(m2.group(0), 'var SB_KEY=window.ADMINCORE_CFG.supabaseKey;')
            mp = SB_PAIR_RE.search(body)
            if mp:
                env['ADMINCORE_SUPABASE_URL'], env['ADMINCORE_SUPABASE_KEY'] = mp.group(1), mp.group(2)
                body = body.replace(mp.group(0), 'var SB_URL=window.ADMINCORE_CFG.supabaseUrl, SB_KEY=window.ADMINCORE_CFG.supabaseKey;')
            path = f'assets/{app}/js/{nr}-{NAMES[idx]}.js'
            tpl.append('<script src="{{ asset(\'%s\') }}"></script>' % path)
        else:
            attrs = open_tag[len('<style'):-1]  # pl. ' id="browserDesign"'
            path = f'assets/{app}/css/{nr}-{NAMES[idx]}.css'
            tpl.append('<link rel="stylesheet"%s href="{{ asset(\'%s\') }}">' % (attrs, path))
        open(os.path.join(root, 'public', path), 'w', encoding='utf-8', newline='').write(body)

    tail = t[pos:]
    tpl.append(twig_raw(tail))

    page = ''.join(tpl)
    # Futásidejű konfiguráció a Supabase SDK elé (az .env-ből, nem a JS-ből).
    sdk_tag = '<script src="{{ admincore.supabaseSdk }}"></script>'
    cfg_tag = '<script>window.ADMINCORE_CFG={{ admincore.clientConfig|json_encode(constant(\'JSON_HEX_TAG\') b-or constant(\'JSON_UNESCAPED_SLASHES\'))|raw }};</script>'
    page = page.replace(sdk_tag, cfg_tag + sdk_tag, 1)
    open(os.path.join(root, f'templates/{app}/index.html.twig'), 'w', encoding='utf-8', newline='').write(page)

    print(f'{len(bl)} blokk, {mk} jelölő-rész kiírva.')
    for k, v in env.items():
        print(f'{k}={v}')


if __name__ == '__main__':
    if len(sys.argv) < 3 or sys.argv[1] not in APPS:
        sys.exit('Használat: split_legacy.py <%s> <monolit.html> [gyökér]' % '|'.join(APPS))
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else '.')

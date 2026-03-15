import urllib.request, ssl, json, os
from html.parser import HTMLParser

DIR = os.path.dirname(os.path.abspath(__file__))
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

class Ext(HTMLParser):
    def __init__(self):
        super().__init__()
        self.t, self.im, self.sk, self.st = [], [], False, []
    def handle_starttag(self, tag, attrs):
        self.st.append(tag)
        ad = dict(attrs)
        if tag in ('script','style','nav','footer','noscript','form'):
            self.sk = True
        if tag == 'img' and not self.sk:
            src = ad.get('data-src') or ad.get('src', '')
            alt = ad.get('alt', '')
            if src and not src.startswith('data:'):
                self.im.append({'src': src, 'alt': alt})
        if tag in ('h1','h2','h3','h4') and not self.sk:
            self.t.append('\n' + '#' * int(tag[1]) + ' ')
        if tag == 'li' and not self.sk:
            self.t.append('\n- ')
        if tag == 'p' and not self.sk:
            self.t.append('\n')
        if tag == 'strong' and not self.sk:
            self.t.append('**')
        if tag == 'em' and not self.sk:
            self.t.append('*')
    def handle_endtag(self, tag):
        if self.st and self.st[-1] == tag:
            self.st.pop()
        if tag in ('script','style','nav','footer','noscript','form'):
            self.sk = False
        if tag == 'strong' and not self.sk:
            self.t.append('**')
        if tag == 'em' and not self.sk:
            self.t.append('*')
    def handle_data(self, data):
        if not self.sk and data.strip():
            self.t.append(data)

def fetch(url, name):
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
            'Accept': 'text/html,application/xhtml+xml',
            'Referer': 'https://www.google.com/',
        })
        resp = urllib.request.urlopen(req, context=ctx, timeout=15)
        html = resp.read().decode('utf-8', errors='ignore')
        p = Ext()
        p.feed(html)
        text = ''.join(p.t)
        with open(os.path.join(DIR, name + '.txt'), 'w') as f:
            f.write(text)
        with open(os.path.join(DIR, name + '_img.json'), 'w') as f:
            json.dump(p.im, f, indent=2)
        print('OK %-20s %6d chars  %2d imgs' % (name, len(text), len(p.im)))
    except Exception as e:
        code = getattr(e, 'code', '')
        print('FAIL %-20s %s %s' % (name, code, str(e)[:80]))

articles = [
    ('case',            'https://managementconsulted.com/case-interview/'),
    ('mckinsey5',       'https://managementconsulted.com/5-tips-for-mckinsey-case-interview/'),
    ('star',            'https://managementconsulted.com/star-method/'),
    ('frameworks',      'https://managementconsulted.com/case-interview-frameworks/'),
    ('profitability',   'https://managementconsulted.com/profitability-framework/'),
    ('market_entry',    'https://managementconsulted.com/market-entry-framework/'),
    ('mece',            'https://managementconsulted.com/mece-framework/'),
    ('pyramid',         'https://managementconsulted.com/pyramid-principle/'),
    ('pei',             'https://managementconsulted.com/mckinsey-pei/'),
    ('bcg',             'https://managementconsulted.com/bcg-case-interview/'),
    ('bain',            'https://managementconsulted.com/bain-case-interview/'),
    ('market_sizing',   'https://managementconsulted.com/market-sizing/'),
    ('fit_interview',   'https://managementconsulted.com/fit-interview/'),
    ('behavioral',      'https://managementconsulted.com/behavioral-interview/'),
    ('case_examples',   'https://managementconsulted.com/case-interview-examples/'),
    ('why_consulting',  'https://managementconsulted.com/why-consulting/'),
    ('deloitte',        'https://managementconsulted.com/deloitte-case-interview/'),
    ('consulting_math', 'https://managementconsulted.com/consulting-math/'),
]

print('Fetching %d MC articles...\n' % len(articles))
for name, url in articles:
    fetch(url, name)
print('\nDone!')

﻿function rcxDict(loadNames) {
  this.loadDictionary();
  if (loadNames) this.loadNames();
  this.loadDIF();
}

rcxDict.prototype = {
  config: {},

  setConfig: function(c) {
    this.config = c;
  },

  fileRead: function(url, charset) {
    var req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.send(null);
    return req.responseText;
  },

  fileReadArray: function(name, charset) {
    var a = this.fileRead(name, charset).split('\n');
    // Is this just in case there is blank shit in the file. It was written by Jon though.
    // I suppose this is more robust
    while ((a.length > 0) && (a[a.length - 1].length == 0)) a.pop();
    return a;
  },

  find: function(data, text) {
    const tlen = text.length;
    var beg = 0;
    var end = data.length - 1;
    var i;
    var mi;
    var mis;

    while (beg < end) {
      mi = (beg + end) >> 1;
      i = data.lastIndexOf('\n', mi) + 1;

      mis = data.substr(i, tlen);
      if (text < mis) end = i - 1;
      else if (text > mis) beg = data.indexOf('\n', mi + 1) + 1;
      else return data.substring(i, data.indexOf('\n', mi + 1));
    }
    return null;
  },

  loadNames: function() {
    if ((this.nameDict) && (this.nameIndex)) return;
    // this.nameDict = this.fileRead(rcxNamesDict.datURI, rcxNamesDict.datCharset);
    // this.nameIndex = this.fileRead(rcxNamesDict.idxURI, rcxNamesDict.idxCharset);
    this.nameDict = this.fileRead(chrome.extension.getURL("data/names.dat"));
    this.nameIndex = this.fileRead(chrome.extension.getURL("data/names.idx"));
  },

  // Note: These are mostly flat text files; loaded as one continous string to reduce memory use
  loadDictionary: function() {
    // this.wordDict = this.fileRead(rcxWordDict.datURI, rcxWordDict.datCharset);
    // this.wordIndex = this.fileRead(rcxWordDict.idxURI, rcxWordDict.idxCharset); 
    this.wordDict = this.fileRead(chrome.extension.getURL("data/dict.dat"));
    this.wordIndex = this.fileRead(chrome.extension.getURL("data/dict.idx"));
    this.kanjiData = this.fileRead(chrome.extension.getURL("data/kanji.dat"), 'UTF-8');
    this.radData = this.fileReadArray(chrome.extension.getURL("data/radicals.dat"), 'UTF-8');
  },

  loadDIF: function() {
    this.difReasons = [];
    this.difRules = [];
    this.difExact = [];

    var buffer = this.fileReadArray(chrome.extension.getURL("data/deinflect.dat"), 'UTF-8');
    var prevLen = -1;
    var g, o;

    // i = 1: skip header
    for (var i = 1; i < buffer.length; ++i) {
      var f = buffer[i].split('\t');

      if (f.length == 1) {
        this.difReasons.push(f[0]);
      } else if (f.length == 4) {
        o = {};
        o.from = f[0];
        o.to = f[1];
        o.type = f[2];
        o.reason = f[3];

        if (prevLen != o.from.length) {
          prevLen = o.from.length;
          g = [];
          g.flen = prevLen;
          this.difRules.push(g);
        }
        g.push(o);
      }
    }
  },

  deinflect: function(word) {
    var r = [];
    var have = [];
    var o;

    o = {};
    o.word = word;
    o.type = 0xFF;
    o.reason = '';
    // o.debug = 'root';
    r.push(o);
    have[word] = 0;

    var i, j, k;

    i = 0;
    do {
      word = r[i].word;
      var wordLen = word.length;
      var type = r[i].type;

      for (j = 0; j < this.difRules.length; ++j) {
        var g = this.difRules[j];
        if (g.flen <= wordLen) {
          var end = word.substr(-g.flen);
          for (k = 0; k < g.length; ++k) {
            var rule = g[k];
            if ((type & rule.type) && (end == rule.from)) {
              var newWord = word.substr(0, word.length - rule.from.length) + rule.to;
              if (newWord.length <= 1) continue;
              o = {};
              if (have[newWord] != undefined) {
                o = r[have[newWord]];
                o.type |= (rule.type >> 8);

                // o.reason += ' / ' + r[i].reason + ' ' + this.difReasons[rule.reason];
                // o.debug += ' @ ' + rule.debug;
                continue;
              }
              have[newWord] = r.length;
              if (r[i].reason.length) o.reason = this.difReasons[rule.reason] + ' &lt; ' + r[i].reason;
              else o.reason = this.difReasons[rule.reason];
              o.type = rule.type >> 8;
              o.word = newWord;
              // o.debug = r[i].debug + ' $ ' + rule.debug;
              r.push(o);
            }
          }
        }
      }

    } while (++i < r.length);

    return r;
  },

  // katakana -> hiragana conversion tables
  ch: [0x3092, 0x3041, 0x3043, 0x3045, 0x3047, 0x3049, 0x3083, 0x3085, 0x3087, 0x3063, 0x30FC, 0x3042, 0x3044, 0x3046,
    0x3048, 0x304A, 0x304B, 0x304D, 0x304F, 0x3051, 0x3053, 0x3055, 0x3057, 0x3059, 0x305B, 0x305D, 0x305F, 0x3061,
    0x3064, 0x3066, 0x3068, 0x306A, 0x306B, 0x306C, 0x306D, 0x306E, 0x306F, 0x3072, 0x3075, 0x3078, 0x307B, 0x307E,
    0x307F, 0x3080, 0x3081, 0x3082, 0x3084, 0x3086, 0x3088, 0x3089, 0x308A, 0x308B, 0x308C, 0x308D, 0x308F, 0x3093
  ],
  cv: [0x30F4, 0xFF74, 0xFF75, 0x304C, 0x304E, 0x3050, 0x3052, 0x3054, 0x3056, 0x3058, 0x305A, 0x305C, 0x305E, 0x3060,
    0x3062, 0x3065, 0x3067, 0x3069, 0xFF85, 0xFF86, 0xFF87, 0xFF88, 0xFF89, 0x3070, 0x3073, 0x3076, 0x3079, 0x307C
  ],
  cs: [0x3071, 0x3074, 0x3077, 0x307A, 0x307D],

  wordSearch: function(word, doNames, max) {
    var i, u, v, r, p;
    var trueLen = [0];
    var entry = {};

    // half & full-width katakana to hiragana conversion
    // Note: katakana vu is never converted to hiragana

    p = 0;
    r = '';
    for (i = 0; i < word.length; ++i) {
      u = v = word.charCodeAt(i);

      if (u <= 0x3000) break;

      // full-width katakana to hiragana
      if ((u >= 0x30A1) && (u <= 0x30F3)) {
        u -= 0x60;
      }
      // half-width katakana to hiragana
      else if ((u >= 0xFF66) && (u <= 0xFF9D)) {
        u = this.ch[u - 0xFF66];
      }
      // voiced (used in half-width katakana) to hiragana
      else if (u == 0xFF9E) {
        if ((p >= 0xFF73) && (p <= 0xFF8E)) {
          r = r.substr(0, r.length - 1);
          u = this.cv[p - 0xFF73];
        }
      }
      // semi-voiced (used in half-width katakana) to hiragana
      else if (u == 0xFF9F) {
        if ((p >= 0xFF8A) && (p <= 0xFF8E)) {
          r = r.substr(0, r.length - 1);
          u = this.cs[p - 0xFF8A];
        }
      }
      // ignore J~
      else if (u == 0xFF5E) {
        p = 0;
        continue;
      }

      r += String.fromCharCode(u);
      trueLen[r.length] = i + 1; // Need to keep real length because of the half-width semi/voiced conversion
      p = v;
    }
    word = r;


    var dict;
    var index;
    var maxTrim;
    var cache = [];
    var have = [];
    var count = 0;
    var maxLen = 0;

    if (doNames) {
      // Check: split this

      this.loadNames();
      dict = this.nameDict;
      index = this.nameIndex;
      maxTrim = 20; // this.config.namax;
      entry.names = 1;
      console.log('doNames');
    } else {
      dict = this.wordDict;
      index = this.wordIndex;
      maxTrim = 7; // this.config.wmax;
    }

    if (max != null) maxTrim = max;

    entry.data = [];

    while (word.length > 0) {
      var showInf = (count != 0);
      var trys;

      if (doNames) trys = [{
        'word': word,
        'type': 0xFF,
        'reason': null
      }];
      else trys = this.deinflect(word);

      for (i = 0; i < trys.length; i++) {
        u = trys[i];

        var ix = cache[u.word];
        if (!ix) {
          ix = this.find(index, u.word + ',');
          if (!ix) {
            cache[u.word] = [];
            continue;
          }
          ix = ix.split(',');
          cache[u.word] = ix;
        }

        for (var j = 1; j < ix.length; ++j) {
          var ofs = ix[j];
          if (have[ofs]) continue;

          var dentry = dict.substring(ofs, dict.indexOf('\n', ofs));

          var ok = true;
          if (i > 0) {
            // > 0 a de-inflected word

            // ex:
            // /(io) (v5r) to finish/to close/
            // /(v5r) to finish/to close/(P)/
            // /(aux-v,v1) to begin to/(P)/
            // /(adj-na,exp,int) thank you/many thanks/
            // /(adj-i) shrill/

            var w;
            var x = dentry.split(/[,()]/);
            var y = u.type;
            var z = x.length - 1;
            if (z > 10) z = 10;
            for (; z >= 0; --z) {
              w = x[z];
              if ((y & 1) && (w == 'v1')) break;
              if ((y & 4) && (w == 'adj-i')) break;
              if ((y & 2) && (w.substr(0, 2) == 'v5')) break;
              if ((y & 16) && (w.substr(0, 3) == 'vs-')) break;
              if ((y & 8) && (w == 'vk')) break;
            }
            ok = (z != -1);
          }
          if (ok) {
            if (count >= maxTrim) {
              entry.more = 1;
              break;
            }

            have[ofs] = 1;
            ++count;
            if (maxLen == 0) maxLen = trueLen[word.length];

            if (trys[i].reason) {
              if (showInf) r = '&lt; ' + trys[i].reason + ' &lt; ' + word;
              else r = '&lt; ' + trys[i].reason;
            } else {
              r = null;
            }

            entry.data.push([dentry, r]);
          }
        } // for j < ix.length
        if (count >= maxTrim) break;
      } // for i < trys.length
      if (count >= maxTrim) break;
      word = word.substr(0, word.length - 1);
    } // while word.length > 0

    if (entry.data.length == 0) return null;

    entry.matchLen = maxLen;
    return entry;
  },

  translate: function(text) {
    var e, o;
    var skip;

    o = {};
    o.data = [];
    o.textLen = text.length;

    while (text.length > 0) {
      e = this.wordSearch(text, false, 1);
      if (e != null) {
        if (o.data.length >= 7 /* this.config.wmax */ ) {
          o.more = 1;
          break;
        }
        // o.data = o.data.concat(e.data);
        o.data.push(e.data[0]);
        skip = e.matchLen;
      } else {
        skip = 1;
      }
      text = text.substr(skip, text.length - skip);
    }

    if (o.data.length == 0) {
      return null;
    }

    o.textLen -= text.length;
    return o;
  },

  bruteSearch: function(text, doNames) {
    var r, e, d, i, j;
    var wb, we;
    var max;

    r = 1;
    if (text.charAt(0) == ':') {
      text = text.substr(1, text.length - 1);
      if (text.charAt(0) != ':') r = 0;
    }
    if (r) {
      if (text.search(/[\u3000-\uFFFF]/) != -1) {
        wb = we = '[\\s\\[\\]]';
      } else {
        wb = '[\\)/]\\s*';
        we = '\\s*[/\\(]';
      }
      if (text.charAt(0) == '*') {
        text = text.substr(1, text.length - 1);
        wb = '';
      }
      if (text.charAt(text.length - 1) == '*') {
        text = text.substr(0, text.length - 1);
        we = '';
      }
      text = wb + text.replace(/[\[\\\^\$\.\|\?\*\+\(\)]/g, function(c) {
        return '\\' + c;
      }) + we;
    }

    e = {
      data: [],
      reason: [],
      kanji: 0,
      more: 0
    };

    if (doNames) {
      e.names = 1;
      max = 20; // this.config.namax;
      this.loadNames();
      d = this.nameDict;
    } else {
      e.names = 0;
      max = 7; // this.config.wmax;
      d = this.wordDict;
    }

    r = new RegExp(text, 'igm');
    while (r.test(d)) {
      if (e.data.length >= max) {
        e.more = 1;
        break;
      }
      j = d.indexOf('\n', r.lastIndex);
      e.data.push([d.substring(d.lastIndexOf('\n', r.lastIndex - 1) + 1, j), null]);
      r.lastIndex = j + 1;
    }

    return e.data.length ? e : null;
  },

  kanjiSearch: function(kanji) {
    const hex = '0123456789ABCDEF';
    var kde;
    var entry;
    var a, b;
    var i;

    i = kanji.charCodeAt(0);
    if (i < 0x3000) return null;

    kde = this.find(this.kanjiData, kanji);
    if (!kde) return null;

    a = kde.split('|');
    if (a.length != 9) return null;

    entry = {};
    entry.kanji = a[0] || '';
    entry.han = a[1] || '';
    entry.onyomi = a[2].replace(/\s+/g, '\u3001 ') || '';
    entry.kunyomi = a[3].replace(/\s+/g, '\u3001 ') || '';
    entry.meaning = a[4] || '';
    entry.stroke_count = a[5] || '';
    entry.parts = a[6] || '';
    entry.examples = a[7] || '';
    entry.level = a[8] || '';

    return entry;
  },

  numList: [
    // 'C',  'Classical Radical',
    // 'DR', 'Father Joseph De Roo Index',
    // 'DO', 'P.G. O\'Neill Index',
    // 'O',  'P.G. O\'Neill Japanese Names Index',
    // 'Q',  'Four Corner Code',
    // 'MN', 'Morohashi Daikanwajiten Index',
    // 'MP', 'Morohashi Daikanwajiten Volume/Page',
    // 'K',  'Gakken Kanji Dictionary Index',
    // 'W',  'Korean Reading',
    'H', 'Halpern',
    'L', 'Heisig',
    'E', 'Henshall',
    'DK', 'Kanji Learners Dictionary',
    'N', 'Nelson',
    'V', 'New Nelson',
    'Y', 'PinYin',
    'P', 'Skip Pattern',
    'IN', 'Tuttle Kanji &amp; Kana',
    'I', 'Tuttle Kanji Dictionary',
    'U', 'Unicode'
  ],

  makeHtml: function(entry) {
    var e;
    var b;
    var c, s, t;
    var i, j, n;

    if (entry == null) return '';

    b = [];

    if (entry.kanji) {
      var yomi;
      var box;
      var bn;
      var k;
      var nums;

      yomi = '';
      if (entry.onyomi.length) {
        yomi += '<span class="k-yomi-ti">Âm ON</span> ';
        yomi += entry.onyomi.replace(/\.([^\u3001]+)/g, '<span class="k-yomi-hi">$1</span>');
      }
      if (entry.kunyomi.length) {
        yomi += '<br/><span class="k-yomi-ti">Âm KUN</span> ';
        yomi += entry.kunyomi.replace(/\.([^\u3001]+)/g, '<span class="k-yomi-hi">$1</span>');
      }

      switch (k) {
        case 8:
          k = 'general<br/>use';
          break;
        case 9:
          k = 'name<br/>use';
          break;
        default:
          k = isNaN(k) ? '-' : ('grade<br/>' + k);
          break;
      }
      box = '<table class="k-abox-tb"><tr>' +
        '<td class="k-abox-r">Số nét<br/>' + entry.stroke_count + '</td>' +
        '<td class="k-abox-g">Cấp độ<br/>N' + entry.level + '</td>' +
        '</tr></table>';

      if (rcxMain.config.kanjicomponents == 'true' && entry.parts !== '') {
        box += '<table class="k-bbox-tb">';
        var parts = JSON.parse(entry.parts);
        for (i = 0; i < parts.length; ++i) {
          c = ' class="k-bbox-' + (j ^= 1);
          box += '<tr><td' + c + 'a">' + parts[i].w + '</td>' +
            '<td' + c + 'b">' + parts[i].h + '</td></tr>';
        }
        box += '</table>';
      }

      nums = '';
      j = 0;

      // kanjiinfo = rcxMain.config.kanjiinfo;
      // if (kanjiinfo[i] == 'true') {
      if (entry.examples !== '') {
        var meaning = entry.meaning.split('##');
        for (i = 0; i < meaning.length; ++i) {
          nums += '<tr><td class="k-meaning" colspan="4">◆ ' + meaning[i] + '</td></tr>';
        }
        var examples = JSON.parse(entry.examples);
        for (i = 0; i < examples.length; ++i) {
          c = ' class="k-mix-td' + (j ^= 1) + '"';
          nums += '<tr><td' + c + '>' + examples[i].w + '</td>';
          nums += '<td' + c + '>' + examples[i].h + '</td>';
          nums += '<td' + c + '>' + examples[i].p + '</td>';
          nums += '<td' + c + '>' + examples[i].m + '</td></tr>';
        }
      }
      if (nums.length) nums = '<table class="k-mix-tb">' + nums + '</table>';

      b.push('<table class="k-main-tb"><tr><td valign="top">');
      b.push(box);
      b.push('<table class="k-box-tb"><tr><td class="k-kanji">' + entry.kanji + '</td><td class="k-han">' +
        entry.han + '</td></tr></table>');
      b.push('<div class="k-yomi">' + yomi + '</div>');
      b.push('</td></tr><tr><td>' + nums + '</td></tr></table>');
      return b.join('');
    }

    s = t = '';

    if (entry.names) {
      c = [];

      b.push('<div class="w-title">Names Dictionary</div><table class="w-na-tb"><tr><td>');
      for (i = 0; i < entry.data.length; ++i) {
        e = entry.data[i][0].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
        if (!e) continue;

        // The next two lines re-process the entries that contain separate search key and spelling due to mixed hiragana/katakana spelling
        e3 = e[3].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
        if (e3) e = e3;

        if (s != e[3]) {
          c.push(t);
          t = '';
        }

        if (e[2]) c.push('<span class="w-kanji">' + e[1] + '</span> &#32; <span class="w-kana">' + e[2] + '</span><br/> ');
        else c.push('<span class="w-kana">' + e[1] + '</span><br/> ');

        s = e[3];
        console.log('e[1]: ' + e[1]);
        console.log('e[2]: ' + e[2]);
        console.log('e[3]: ' + e[3]);
        t = '<span class="w-def">' + s.replace(/\//g, '; ') + '</span><br/>';
      }
      c.push(t);
      if (c.length > 4) {
        n = (c.length >> 1) + 1;
        b.push(c.slice(0, n + 1).join(''));

        t = c[n];
        c = c.slice(n, c.length);
        for (i = 0; i < c.length; ++i) {
          if (c[i].indexOf('w-def') != -1) {
            if (t != c[i]) b.push(c[i]);
            if (i == 0) c.shift();
            break;
          }
        }

        b.push('</td><td>');
        b.push(c.join(''));
      } else {
        b.push(c.join(''));
      }
      if (entry.more) b.push('...<br/>');
      b.push('</td></tr></table>');
    } else {
      if (entry.title) {
        b.push('<div class="w-title">' + entry.title + '</div>');
      }

      var pK = '';
      var k;

      for (i = 0; i < entry.data.length; ++i) {
        e = entry.data[i][0].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
        if (!e) continue;

        // e[1] = kanji/kana
        // e[2] = kana
        // e[3] = definition

        if (s != e[3]) {
          b.push(t);
          pK = k = '';
        } else {
          k = t.length ? '<br/>' : '';
        }

        if (e[2]) {
          if (pK == e[1]) k = '\u3001 <span class="w-kana">' + e[2] + '</span>';
          else k += '<span class="w-kanji">' + e[1] + '</span> &#32; <span class="w-kana">' + e[2] + '</span>';
          pK = e[1];
        } else {
          k += '<span class="w-kana">' + e[1] + '</span>';
          pK = '';
        }
        b.push(k);

        if (entry.data[i][1]) b.push(' <span class="w-conj">(' + entry.data[i][1] + ')</span>');

        s = e[3];
        t = s.replace(/\|/g, '<br/>');
        if ( /* !this.config.wpos */ false) t = t.replace(/^\([^)]+\)\s*/, '');
        if ( /* !this.config.wpop */ false) t = t.replace('; (P)', '');
        if (rcxMain.config.onlyreading == 'false') {
          t = '<br/><span class="w-def">' + t + '</span><br/>';
        } else {
          t = '<br/>';
        }
      }
      b.push(t);
      if (entry.more) b.push('...<br/>');
    }

    return b.join('');
  },


  makeHtmlForRuby: function(entry) {
    var e;
    var b;
    var c, s, t;
    var i, j, n;

    if (entry == null) return '';

    b = [];

    s = t = '';

    if (entry.title) {
      b.push('<div class="w-title">' + entry.title + '</div>');
    }

    for (i = 0; i < entry.data.length; ++i) {
      e = entry.data[i][0].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
      if (!e) continue;

      s = e[3];
      t = s.replace(/\//g, '; ');
      if ( /* !this.config.wpos */ false) t = t.replace(/^\([^)]+\)\s*/, '');
      if ( /* !this.config.wpop */ false) t = t.replace('; (P)', '');
      t = '<span class="w-def">' + t + '</span><br/>\n';
    }
    b.push(t);

    return b.join('');
  },

  makeText: function(entry, max) {
    var e;
    var b;
    var i, j;
    var t;

    if (entry == null) return '';

    b = [];

    if (entry.kanji) {
      b.push(entry.kanji + '\n');
      b.push((entry.eigo.length ? entry.eigo : '-') + '\n');

      b.push(entry.onkun.replace(/\.([^\u3001]+)/g, '\uFF08$1\uFF09') + '\n');
      if (entry.nanori.length) {
        b.push('\u540D\u4E57\u308A\t' + entry.nanori + '\n');
      }
      if (entry.bushumei.length) {
        b.push('\u90E8\u9996\u540D\t' + entry.bushumei + '\n');
      }

      for (i = 0; i < this.numList.length; i += 2) {
        e = this.numList[i];
        if ( /* this.config.kdisp[e] */ 1 == 1) {
          j = entry.misc[e];
          b.push(this.numList[i + 1].replace('&amp;', '&') + '\t' + (j ? j : '-') + '\n');
        }
      }
    } else {
      if (max > entry.data.length) max = entry.data.length;
      for (i = 0; i < max; ++i) {
        e = entry.data[i][0].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
        if (!e) continue;

        if (e[2]) {
          b.push(e[1] + '\t' + e[2]);
        } else {
          b.push(e[1]);
        }

        t = e[3].replace(/\//g, '; ');
        if (false /* !this.config.wpos */ ) t = t.replace(/^\([^)]+\)\s*/, '');
        if (false /* !this.config.wpop */ ) t = t.replace('; (P)', '');
        b.push('\t' + t + '\n');
      }
    }
    return b.join('');
  }
};

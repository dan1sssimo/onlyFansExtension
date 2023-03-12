/* eslint-disable no-undef */
var hexcase = 0;

export let dynamicRules = {
  static_param: "mU96TjOU7tED2lPzBtQLWB9iYp18kaJ9",
  format: "6820:{}:{:x}:63d81407",
  checksum_indexes: [
    8, 13, 23, 13, 37, 23, 31, 11, 8, 37, 23, 27, 12, 9, 21, 20, 6, 8, 12, 16,
    12, 17, 35, 37, 35, 28, 13, 35, 9, 31, 2, 25,
  ],
  checksum_constants: [
    109, 99, -57, -98, -73, 75, -94, -77, -119, -105, 124, -87, 88, 101, 77,
    -86, 85, -89, -110, -106, -126, -70, 135, 135, -64, 133, 61, -111, 117, 81,
    67, 140,
  ],
  checksum_constant: 155,
  app_token: "33d57ade8c02dbc5a333db99ff9ae26a",
  remove_headers: ["user-id"],
  error_code: 0,
  message: "",
};

export function sign(fullUrl, timestamp) {
  const { pathname, search } = new URL(fullUrl);
  const url = search ? `${pathname}${search}` : pathname;
  let secretParamString = [
    dynamicRules.static_param,
    timestamp.toString(),
    url,
    0,
  ].join("\n");
  let sha1Sign = hex_sha1(secretParamString);
  let checksum = getChecksum(dynamicRules, sha1Sign);
  const splittedFormat = dynamicRules.format.split(":");
  const prefix = splittedFormat.at(0);
  const suffix = splittedFormat.at(-1);
  var hash = [prefix, sha1Sign, checksum, suffix].join(":");
  return hash;
}

function getChecksum(dynamicRules, sha1Sign) {
  let sha1SignAscii = Array.from(sha1Sign, (char) => char.charCodeAt(0));
  let checksum =
    dynamicRules.checksum_indexes
      .map((number) => sha1SignAscii[number])
      .reduce((a, b) => a + b) + dynamicRules.checksum_constant;
  return Math.abs(checksum).toString(16);
}

function hex_sha1(s) {
  return rstr2hex(rstr_sha1(str2rstr_utf8(s)));
}
function rstr_sha1(s) {
  return binb2rstr(binb_sha1(rstr2binb(s), s.length * 8));
}
function rstr2hex(input) {
  try {
    hexcase;
  } catch (e) {
    hexcase = 0;
  }
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var output = "";
  var x;
  for (var i = 0; i < input.length; i++) {
    x = input.charCodeAt(i);
    output += hex_tab.charAt((x >>> 4) & 0x0f) + hex_tab.charAt(x & 0x0f);
  }
  return output;
}
function str2rstr_utf8(input) {
  var output = "";
  var i = -1;
  var x, y;

  while (++i < input.length) {
    /* Decode utf-16 surrogate pairs */
    x = input.charCodeAt(i);
    y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
    if (0xd800 <= x && x <= 0xdbff && 0xdc00 <= y && y <= 0xdfff) {
      x = 0x10000 + ((x & 0x03ff) << 10) + (y & 0x03ff);
      i++;
    }

    /* Encode output as utf-8 */
    if (x <= 0x7f) output += String.fromCharCode(x);
    else if (x <= 0x7ff)
      output += String.fromCharCode(
        0xc0 | ((x >>> 6) & 0x1f),
        0x80 | (x & 0x3f)
      );
    else if (x <= 0xffff)
      output += String.fromCharCode(
        0xe0 | ((x >>> 12) & 0x0f),
        0x80 | ((x >>> 6) & 0x3f),
        0x80 | (x & 0x3f)
      );
    else if (x <= 0x1fffff)
      output += String.fromCharCode(
        0xf0 | ((x >>> 18) & 0x07),
        0x80 | ((x >>> 12) & 0x3f),
        0x80 | ((x >>> 6) & 0x3f),
        0x80 | (x & 0x3f)
      );
  }
  return output;
}
function rstr2binb(input) {
  var output = Array(input.length >> 2);
  for (var i = 0; i < output.length; i++) {
    output[i] = 0;
  }
  for (var t = 0; t < input.length * 8; t += 8) {
    output[t >> 5] |= (input.charCodeAt(t / 8) & 0xff) << (24 - (t % 32));
  }
  return output;
}
function binb2rstr(input) {
  var output = "";
  for (var i = 0; i < input.length * 32; i += 8)
    output += String.fromCharCode((input[i >> 5] >>> (24 - (i % 32))) & 0xff);
  return output;
}
function binb_sha1(x, len) {
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - (len % 32));
  x[(((len + 64) >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a = 1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d = 271733878;
  var e = -1009589776;

  for (var i = 0; i < x.length; i += 16) {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for (var j = 0; j < 80; j++) {
      if (j < 16) w[j] = x[i + j];
      else w[j] = bit_rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
      var t = safe_add(
        safe_add(bit_rol(a, 5), sha1_ft(j, b, c, d)),
        safe_add(safe_add(e, w[j]), sha1_kt(j))
      );
      e = d;
      d = c;
      c = bit_rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);
}
function sha1_ft(t, b, c, d) {
  if (t < 20) return (b & c) | (~b & d);
  if (t < 40) return b ^ c ^ d;
  if (t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}
function sha1_kt(t) {
  return t < 20
    ? 1518500249
    : t < 40
    ? 1859775393
    : t < 60
    ? -1894007588
    : -899497514;
}
function safe_add(x, y) {
  var lsw = (x & 0xffff) + (y & 0xffff);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xffff);
}
function bit_rol(num, cnt) {
  return (num << cnt) | (num >>> (32 - cnt));
}

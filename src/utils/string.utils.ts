/**
 * HTML 엔티티를 디코딩하는 함수
 */
export function decodeHtmlEntities(str: string): string {
  const htmlEntities: { [key: string]: string } = {
    "&#160;": " ",
    "&nbsp;": " ",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
  };

  let result = str;

  // HTML 엔티티 디코딩
  for (const [entity, replacement] of Object.entries(htmlEntities)) {
    result = result.replace(new RegExp(entity, "g"), replacement);
  }

  // 숫자 형태의 HTML 엔티티 처리 (&#xxx; 형태)
  result = result.replace(/&#(\d+);/g, (match, num) => {
    const charCode = parseInt(num, 10);
    // 160은 non-breaking space
    if (charCode === 160) {
      return " ";
    }
    return String.fromCharCode(charCode);
  });

  return result;
}

export function escapeStr(str: string) {
  // HTML 엔티티 디코딩을 먼저 수행
  const decoded = decodeHtmlEntities(str);
  return escapeQuote(escapeDoubleQuote(escapeNewLine(decoded)));
}

export function escapeQuote(str: string) {
  return str.replace(/'/g, `\\'`);
}

export function escapeDoubleQuote(str: string) {
  return str.replace(/"/g, `\\"`);
}

export function escapeNewLine(str: string) {
  return str.replace(/\n/g, `\\n`);
}

export function includesFormatStringMoreThanOne(str: string) {
  return (str.match(/%[sd]/g) || []).length > 1;
}

// html_tag_pattern = re.compile(r'<[a-zA-Z][^>]*>')
export function includesHtmlTag(str: string) {
  return /<[a-zA-Z][^>]*>/.test(str);
}

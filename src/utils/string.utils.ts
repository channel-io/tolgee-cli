export function escapeQuote(str: string) {
  return str.replace(/'/g, `\\'`);
}

export function includesFormatStringMoreThanOne(str: string) {
  return (str.match(/%[sd]/g) || []).length > 1;
}

// html_tag_pattern = re.compile(r'<[a-zA-Z][^>]*>')
export function includesHtmlTag(str: string) {
  return /<[a-zA-Z][^>]*>/.test(str);
}

// Small C++/Arduino tokenizer for the fixed teaching examples.
// Text nodes preserve the original code and keep copying independent of styling.
window.renderArduinoCodeLine = function renderArduinoCodeLine(source) {
  const line = document.createElement('span');
  line.className = 'arduino-source';
  const types = new Set(['void', 'bool', 'int', 'unsigned', 'long', 'const', 'volatile', 'hw_timer_t', 'uint8_t', 'uint32_t']);
  const keywords = new Set(['if', 'else', 'return', 'for', 'while', 'switch', 'case', 'break']);
  const constants = new Set(['true', 'false', 'nullptr', 'NULL', 'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'RISING', 'FALLING', 'IRAM_ATTR']);
  const tokens = /\/\*.*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b/g;
  let end = 0;
  for (const match of source.matchAll(tokens)) {
    if (match.index > end) line.append(document.createTextNode(source.slice(end, match.index)));
    const value = match[0];
    let kind = '';
    if (value.startsWith('//') || value.startsWith('/*')) kind = 'comment';
    else if (/^["']/.test(value)) kind = 'string';
    else if (/^\d/.test(value)) kind = 'number';
    else if (types.has(value)) kind = 'type';
    else if (keywords.has(value)) kind = 'keyword';
    else if (constants.has(value) || /^[A-Z][A-Z0-9_]+$/.test(value)) kind = 'constant';
    else if (/^\s*\(/.test(source.slice(match.index + value.length))) kind = 'function';
    if (kind) {
      const token = document.createElement('span');
      token.className = `arduino-${kind}`; token.textContent = value; line.append(token);
    } else line.append(document.createTextNode(value));
    end = match.index + value.length;
  }
  if (end < source.length) line.append(document.createTextNode(source.slice(end)));
  return line;
};

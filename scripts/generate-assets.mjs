import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const sourceDir = join(projectRoot, 'assets', 'source-icons')
const toolsDir = join(projectRoot, 'assets', 'tools')
const buttonsDir = join(projectRoot, 'assets', 'buttons')

const escapeXml = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

async function svgIcon(file, color, mode = 'fill', placement = {}) {
  const { x: iconX = 10, y: iconY = 10, size = 24 } = placement
  const source = await readFile(join(sourceDir, file), 'utf8')
  const viewBoxMatch = source.match(/viewBox="([^"]+)"/)
  const bodyMatch = source.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)

  if (!viewBoxMatch || !bodyMatch) {
    throw new Error(`Could not parse SVG source: ${file}`)
  }

  const [minX, minY, width, height] = viewBoxMatch[1].split(/\s+/).map(Number)
  const body = bodyMatch[1]
    .replace(/<title>[\s\S]*?<\/title>/g, '')
    .replaceAll('currentColor', color)
  const scale = Math.min(size / width, size / height)
  const renderedWidth = width * scale
  const renderedHeight = height * scale
  const x = iconX + (size - renderedWidth) / 2
  const y = iconY + (size - renderedHeight) / 2
  const paint =
    mode === 'stroke'
      ? `fill="none" stroke="${color}" color="${color}"`
      : mode === 'preserve'
        ? `color="${color}"`
        : `fill="${color}" color="${color}"`

  return `<g transform="translate(${x} ${y}) scale(${scale}) translate(${-minX} ${-minY})" ${paint}>${body}</g>`
}

async function rasterIcon(file, mime) {
  const source = await readFile(join(sourceDir, file))
  const encoded = source.toString('base64')
  return [
    '<defs><clipPath id="icon-clip"><rect x="10" y="10" width="24" height="24" rx="5"/></clipPath></defs>',
    `<image x="10" y="10" width="24" height="24" preserveAspectRatio="xMidYMid slice" clip-path="url(#icon-clip)" href="data:${mime};base64,${encoded}"/>`,
  ].join('')
}

async function renderTool(tool) {
  const width = Math.max(88, Math.ceil(tool.label.length * 7.2 + 50))
  const icon =
    tool.kind === 'raster'
      ? await rasterIcon(tool.file, tool.mime)
      : await svgIcon(tool.file, tool.color, tool.mode)

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="44" viewBox="0 0 ${width} 44" role="img" aria-label="${escapeXml(tool.label)}">`,
    `<rect x=".5" y=".5" width="${width - 1}" height="43" rx="9" fill="#161b22" stroke="#30363d"/>`,
    icon,
    `<text x="43" y="27.5" fill="#f0f6fc" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="13" font-weight="600">${escapeXml(tool.label)}</text>`,
    '</svg>',
  ].join('')
}

async function renderButton(button) {
  const width = Math.max(82, Math.ceil(button.label.length * 7.1 + 48))
  const icon = await svgIcon(button.file, '#ffffff', button.mode, { x: 8, y: 7, size: 18 })

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="32" viewBox="0 0 ${width} 32" role="img" aria-label="${escapeXml(button.label)}">`,
    `<rect x=".5" y=".5" width="${width - 1}" height="31" rx="8" fill="${button.background}" stroke="${button.border ?? button.background}"/>`,
    icon,
    `<text x="32" y="20.7" fill="#ffffff" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="12.5" font-weight="700">${escapeXml(button.label)}</text>`,
    '</svg>',
  ].join('')
}

const tools = [
  { output: 'codex.svg', label: 'Codex', file: 'icon-codex-provider.svg', color: '#ffffff', mode: 'preserve' },
  { output: 'kimi-cli.svg', label: 'Kimi CLI', file: 'icon-kimi.svg', color: '#ffffff', mode: 'fill' },
  { output: 'claude-code.svg', label: 'Claude Code', file: 'simple-claude.svg', color: '#D97757', mode: 'fill' },
  { output: 'gemini-cli.svg', label: 'Gemini CLI', file: 'simple-gemini.svg', color: '#8E75B2', mode: 'fill' },
  { output: 'opencode.svg', label: 'opencode', file: 'simple-opencode.svg', color: '#f0f6fc', mode: 'fill' },
  { output: 'hermes.svg', label: 'Hermes', file: 'icon-hermes.jpg', kind: 'raster', mime: 'image/jpeg' },
  { output: 'openclaw.svg', label: 'OpenClaw', file: 'icon-openclaw.svg', color: '#ff4d4d', mode: 'preserve' },
  { output: 'gpt-image-2.svg', label: 'GPT Image 2', file: 'icon-codex-provider.svg', color: '#ffffff', mode: 'preserve' },
  { output: 'anima.svg', label: 'Anima', file: 'icon-film.svg', color: '#fb7185', mode: 'stroke' },
  { output: 'krea-2.svg', label: 'Krea 2', file: 'icon-sparkles.svg', color: '#a78bfa', mode: 'stroke' },
  { output: 'custom-skills.svg', label: 'Custom skills', file: 'icon-wand.svg', color: '#22d3ee', mode: 'stroke' },
  { output: 'linux.svg', label: 'Linux', file: 'simple-linux.svg', color: '#FCC624', mode: 'fill' },
  { output: 'flipper-zero.svg', label: 'Flipper Zero', file: 'icon-flipper.png', kind: 'raster', mime: 'image/png' },
]

const buttons = [
  { output: 'telegram.svg', label: 'Telegram', file: 'simple-telegram.svg', background: '#26A5E4', mode: 'fill' },
  { output: 'youtube.svg', label: 'YouTube', file: 'simple-youtube.svg', background: '#FF0000', mode: 'fill' },
  { output: 'x.svg', label: 'X', file: 'simple-x.svg', background: '#111111', border: '#30363d', mode: 'fill' },
  { output: 'website.svg', label: 'Website', file: 'icon-globe.svg', background: '#7c3aed', mode: 'stroke' },
]

await mkdir(toolsDir, { recursive: true })
await mkdir(buttonsDir, { recursive: true })

for (const tool of tools) {
  await writeFile(join(toolsDir, tool.output), await renderTool(tool))
}

for (const button of buttons) {
  await writeFile(join(buttonsDir, button.output), await renderButton(button))
}

console.log(`Generated ${tools.length} tool cards and ${buttons.length} resource buttons.`)

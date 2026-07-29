import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const sourceDir = join(projectRoot, 'assets', 'source-icons')
const buttonsDir = join(projectRoot, 'assets', 'buttons')
const skillsDir = join(projectRoot, 'assets', 'skills')

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

async function renderButton(button) {
  const width = Math.max(70, Math.ceil(button.label.length * 6.4 + 40))
  const icon = await svgIcon(button.file, '#ffffff', button.mode, { x: 7, y: 6, size: 16 })

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="28" viewBox="0 0 ${width} 28" role="img" aria-label="${escapeXml(button.label)}">`,
    `<rect x=".5" y=".5" width="${width - 1}" height="27" rx="7" fill="${button.background}" stroke="${button.border ?? button.background}"/>`,
    icon,
    `<text x="29" y="18.2" fill="#ffffff" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="11" font-weight="700">${escapeXml(button.label)}</text>`,
    '</svg>',
  ].join('')
}

async function renderSkill(skill) {
  const width = Math.max(82, Math.ceil(skill.label.length * 6.8 + 43))
  const icon = await svgIcon(skill.file, skill.color, 'stroke', { x: 7, y: 6, size: 17 })

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="30" viewBox="0 0 ${width} 30" role="img" aria-label="${escapeXml(skill.label)}">`,
    `<rect x=".5" y=".5" width="${width - 1}" height="29" rx="7.5" fill="#161b22" stroke="#30363d"/>`,
    icon,
    `<text x="31" y="19.2" fill="#e6edf3" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="12" font-weight="650">${escapeXml(skill.label)}</text>`,
    '</svg>',
  ].join('')
}

const buttons = [
  { output: 'telegram.svg', label: 'Telegram', file: 'simple-telegram.svg', background: '#26A5E4', mode: 'fill' },
  { output: 'youtube.svg', label: 'YouTube', file: 'simple-youtube.svg', background: '#FF0000', mode: 'fill' },
  { output: 'x.svg', label: 'X', file: 'simple-x.svg', background: '#111111', border: '#30363d', mode: 'fill' },
  { output: 'website.svg', label: 'Website', file: 'icon-globe.svg', background: '#7c3aed', mode: 'stroke' },
]

const skills = [
  { output: 'agentation.svg', label: 'Agentation', file: 'lucide-mouse-pointer-click.svg', color: '#f472b6' },
  { output: 'graphify.svg', label: 'Graphify', file: 'lucide-network.svg', color: '#a78bfa' },
]

await mkdir(buttonsDir, { recursive: true })
await mkdir(skillsDir, { recursive: true })

for (const button of buttons) {
  await writeFile(join(buttonsDir, button.output), await renderButton(button))
}

for (const skill of skills) {
  await writeFile(join(skillsDir, skill.output), await renderSkill(skill))
}

console.log(`Generated ${buttons.length} resource buttons and ${skills.length} skill cards.`)

import { copy, labels, locales, ids, ranks, slideDefinitions } from '../src/content/slides';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
export function validateContent() {
  if(ids.length!==15 || new Set(ids).size!==15) throw new Error('Expected 15 unique slide IDs');
  for(const locale of locales){
    if(copy[locale].length!==ids.length)throw new Error(`${locale}: missing slides`);
    for(const [index,slide] of copy[locale].entries()) if(!slide.eyebrow||!slide.title)throw new Error(`${locale}: incomplete slide ${ids[index]}`);
    for(const key of Object.keys(labels.es) as (keyof typeof labels.es)[]) {
      const value=labels[locale][key];
      if(!value || Array.isArray(value)&&value.some(v=>!v))throw new Error(`${locale}: missing label ${key}`);
    }
    for(const token of ['{current}','{total}','{title}'])if(!labels[locale].announcement.includes(token))throw new Error(`${locale}: missing announcement token`);
    for(let i=1;i<ranks.length;i++)if(copy[locale][i+6].title!==ranks[i].name)throw new Error(`${locale}: rank order mismatch`);
  }
  for(const slide of slideDefinitions)if(!existsSync(resolve('public',slide.background.src.slice(1))))throw new Error(`Missing background: ${slide.background.src}`);
  if(slideDefinitions.map(s=>s.group).join(',')!==['cover',...Array(5).fill('plan'),...Array(9).fill('ranks')].join(','))throw new Error('Incorrect groups');
}
validateContent();
console.log('Content validated: 15 slides × 3 languages; shared financial data; all backgrounds present.');

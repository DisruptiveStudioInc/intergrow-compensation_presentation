import { copy, labels, locales, ids, ranks, orderedRankIds, slideDefinitions } from '../src/content/slides';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
export function validateContent() {
  if(ids.length!==15 || new Set(ids).size!==15) throw new Error('Expected 15 unique slide IDs');
  if(Object.keys(ranks).length!==8 || orderedRankIds().length!==8) throw new Error('Expected eight keyed rank entries');
  if(orderedRankIds().join(',')!=='promoter,rank-120k,rank-300k,rank-600k,rank-1-2m,rank-3m,rank-6m,rank-12m')throw new Error('Incorrect shipped rank order');
  for(const locale of locales){
    if(Object.keys(copy[locale]).length!==ids.length || ids.some(id=>!copy[locale][id]))throw new Error(`${locale}: missing keyed slides`);
    for(const id of ids){const slide=copy[locale][id];if(!slide.eyebrow||!slide.title)throw new Error(`${locale}: incomplete slide ${id}`);}
    for(const key of Object.keys(labels.es) as (keyof typeof labels.es)[]) {
      const value=labels[locale][key];
      if(!value || Array.isArray(value)&&value.some(v=>!v))throw new Error(`${locale}: missing label ${key}`);
    }
    for(const token of ['{current}','{total}','{title}'])if(!labels[locale].announcement.includes(token))throw new Error(`${locale}: missing announcement token`);
    for(const id of orderedRankIds())if(!ranks[id].name||!ranks[id].residual||!ranks[id].personal||!ranks[id].volume)throw new Error(`${locale}: incomplete rank data ${id}`);
  }
  for(const slide of slideDefinitions)if(!existsSync(resolve('public',slide.background.src.slice(1))))throw new Error(`Missing background: ${slide.background.src}`);
  if(slideDefinitions.map(s=>s.group).join(',')!==['cover',...Array(5).fill('plan'),...Array(9).fill('ranks')].join(','))throw new Error('Incorrect groups');
  if(slideDefinitions.some(slide=>!slide.layout))throw new Error('Every slide must declare a layout');
  const reordered=[...ids];
  [reordered[8],reordered[9]]=[reordered[9],reordered[8]];
  const reorderedRanks=orderedRankIds(reordered);
  if(reorderedRanks[2]!=='rank-600k'||reorderedRanks[3]!=='rank-300k')throw new Error('Rank ordering must follow slide IDs, not rank data declaration order');
}
validateContent();
console.log('Content validated: keyed copy and rank data, 15 slides × 3 languages, shipped and reordered rank sequences, explicit layouts, and all backgrounds present.');

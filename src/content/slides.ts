import type { Background, SlideDefinition } from '../engine/types';
export type Locale = 'es' | 'en' | 'fr';
export const locales: Locale[] = ['es','en','fr'];
export const localePath = (locale:Locale) => locale==='es'?'/':`/${locale}/`;
export interface SlideCopy {
  eyebrow:string; title:string; subtitle?:string; body?:string[]; bullets?:string[]; quote?:string;
}
export interface Labels {
  title:string; groups:[string,string,string]; previous:string; next:string; fullscreen:string;
  navigation:string; languages:string; slides:string; begin:string; hint:string; announcement:string;
  personal:string; structure:string; volume:string; residual:string; residualShort:string; matching:string; world:string;
  direct:string; plan:string; rank:string; closing:[string,string,string]; closingBody:[string,string,string];
}
export const labels: Record<Locale,Labels> = {
  es:{title:'Plan de compensación',groups:['Portada','El plan','Los rangos'],previous:'Diapositiva anterior',next:'Siguiente diapositiva',fullscreen:'Pantalla completa',navigation:'Secciones de la presentación',languages:'Idioma',slides:'Diapositivas',begin:'Descubre el plan',hint:'Desliza o usa las flechas para explorar',announcement:'Diapositiva {current} de {total}: {title}',personal:'Plan personal',structure:'Estructura requerida',volume:'Volumen organizacional',residual:'Residual mensual',residualShort:'Residual',matching:'Bono de igualación',world:'Bono mundial',direct:'Comisión directa',plan:'Plan',rank:'Rango',closing:['Crecimiento sostenible','Relaciones duraderas','Visión estratégica'],closingBody:['Cada rango representa un nuevo nivel de estabilidad financiera y profesionalismo.','No vendes una vez. Construyes una cartera que produce mes tras mes.','Tu negocio no depende de ti solamente. Tu estructura trabaja contigo.']},
  en:{title:'Compensation plan',groups:['Cover','The plan','The ranks'],previous:'Previous slide',next:'Next slide',fullscreen:'Fullscreen',navigation:'Presentation sections',languages:'Language',slides:'Slides',begin:'Explore the plan',hint:'Swipe or use the arrow keys to explore',announcement:'Slide {current} of {total}: {title}',personal:'Personal plan',structure:'Required structure',volume:'Organizational volume',residual:'Monthly residual',residualShort:'Residual',matching:'Matching bonus',world:'Global bonus',direct:'Direct commission',plan:'Plan',rank:'Rank',closing:['Sustainable growth','Lasting relationships','Strategic vision'],closingBody:['Each rank represents a new level of financial stability and professionalism.','You do not sell just once. You build a client portfolio that produces month after month.','Your business does not depend on you alone. Your structure works with you.']},
  fr:{title:'Plan de rémunération',groups:['Accueil','Le plan','Les rangs'],previous:'Diapositive précédente',next:'Diapositive suivante',fullscreen:'Plein écran',navigation:'Sections de la présentation',languages:'Langue',slides:'Diapositives',begin:'Découvrir le plan',hint:'Balayez ou utilisez les flèches pour explorer',announcement:'Diapositive {current} sur {total} : {title}',personal:'Plan personnel',structure:'Structure requise',volume:'Volume organisationnel',residual:'Revenu résiduel mensuel',residualShort:'Résiduel',matching:'Prime de correspondance',world:'Prime mondiale',direct:'Commission directe',plan:'Plan',rank:'Rang',closing:['Croissance durable','Relations durables','Vision stratégique'],closingBody:['Chaque rang représente un nouveau niveau de stabilité financière et de professionnalisme.','Vous ne vendez pas une seule fois. Vous construisez un portefeuille qui produit mois après mois.','Votre activité ne dépend pas uniquement de vous. Votre structure travaille avec vous.']},
};
export const ids=['cover','growth','portfolio','direct','overview','promoter-benefit','promoter','rank-120k','rank-300k','rank-600k','rank-1-2m','rank-3m','rank-6m','rank-12m','vision'] as const;
export type SlideId = typeof ids[number];
export type RankSlideId = Extract<SlideId, `rank-${string}` | 'promoter'>;
export type LayoutKind = 'cover' | 'standard' | 'direct' | 'overview' | 'promoter-benefit' | 'rank' | 'closing';
export interface AppSlideDefinition extends Omit<SlideDefinition,'id'> { id:SlideId; layout:LayoutKind }
export interface RankData { name:string; personal:string; residual:string; matching:string|null; structure:string|null; volume:string; world?:string }
export const ranks:Record<RankSlideId,RankData> = {
  promoter:{name:'Promotor',personal:'1000 USDT',residual:'1%',matching:null,structure:null,volume:'1000 – 119,999 USD'},
  'rank-120k':{name:'120K',personal:'2,000 USDT',residual:'1.5%',matching:'8%',structure:'3',volume:'120,000 – 305,999 USDT'},
  'rank-300k':{name:'300K',personal:'4,000 USDT',residual:'2%',matching:'10%',structure:'3 × 102K',volume:'306,000 – 611,999 USDT'},
  'rank-600k':{name:'600K',personal:'8,000 USDT',residual:'2.5%',matching:'10%',structure:'3 × 204K',volume:'612,000 – 1,223,999 USDT'},
  'rank-1-2m':{name:'1.2M',personal:'20,000 USDT',residual:'3%',matching:'12%',structure:'3 × 408K',volume:'1,224,000 – 3,059,999 USDT'},
  'rank-3m':{name:'3M',personal:'40,000 USDT',residual:'3.5%',matching:'13%',structure:'3 × 1,02M',volume:'3,060,000 – 6,119,999 USDT'},
  'rank-6m':{name:'6M',personal:'70,000 USDT',residual:'4%',matching:'15%',structure:'3 × 2.04M',volume:'6,120,000 – 11,999,999 USDT'},
  'rank-12m':{name:'12M',personal:'150,000 USDT',residual:'4.5%',matching:'18%',world:'1%',structure:'4 × 3M',volume:'12,000,000 USDT'},
};
const es:Record<SlideId,SlideCopy>={
  'cover':{eyebrow:'Una visión compartida. Un futuro con propósito.',title:'Plan de compensación',subtitle:'Expande tu visión, expande tu ingreso.'},
  'growth':{eyebrow:'Plan de crecimiento',title:'Oportunidad real. Residual verdadero.',subtitle:'Crecimiento profesional.',body:['Diseñamos un sistema que recompensa tu esfuerzo, tu visión y tu capacidad de construir relaciones duraderas. Este plan no es solo un esquema de comisiones: es una estructura profesional que te permite desarrollar un ingreso estable, predecible y escalable.']},
  'portfolio':{eyebrow:'¿Qué ofrecemos?',title:'Tu cartera, tu futuro',body:['Este plan te permite construir un activo real que genera ingresos recurrentes. No es solo vender una vez, es crear una base de clientes que produce rendimientos constantes.'],bullets:['Construyes una cartera sólida de clientes comprometidos','Generas ingresos residuales mensuales automáticos','Tu ingreso escala conforme crece tu volumen total','Construyes un activo financiero que produce mes a mes','Creas patrimonio']},
  'direct':{eyebrow:'Comisión directa por venta',title:'Ganas hoy por vender.',subtitle:'Construyes a largo plazo con ingresos residuales.',body:['Ingresos inmediatos desde el primer día. Por cada venta directa que realices, recibes una comisión del 5% inmediata. Sin esperar rangos. Sin estructura previa.'],bullets:['5% directo por cada venta personal','Pago inmediato','No depende de volumen organizacional','Compatible con todos los rangos']},
  'overview':{eyebrow:'Visión completa del plan',title:'Tu crecimiento, tu decisión.',body:['El plan de compensación de InterGrow Capital está estructurado en rangos progresivos. Cada nivel te ofrece mayores beneficios, rendimientos más altas y bonos adicionales.'],quote:'Cada rango representa un nuevo nivel de compromiso, liderazgo y recompensa financiera.'},
  'promoter-benefit':{eyebrow:'Beneficio único de promotoría',title:'Todos tus planes personales',body:['Recibes 5% o 6% de rendimiento mensual compuesto sobre tus planes de ahorro personal.'],quote:'Al referir a tus primeros 3 directos'},
  'promoter':{eyebrow:'El primer paso',title:'Promotor',subtitle:'Comisiones simples, sin estructura requerida.',body:['Residual mensual: 1% de tus afiliados directos.','Este es tu punto de partida para construir un ingreso sostenible.']},
  'rank-120k':{eyebrow:'Primer tramo de liderazgo',title:'120K',subtitle:'Tu negocio empieza a tener base.',body:['Tu ingreso pasivo será el 1.5% sobre el volumen de tu organización.']},
  'rank-300k':{eyebrow:'Empieza la consolidación',title:'300K',subtitle:'Tu red ya genera fuerza propia.',body:['Este es el momento donde tu organización comienza a trabajar con autonomía y tu ingreso residual se vuelve más predecible.'],quote:'Residual mensual sobre volumen total'},
  'rank-600k':{eyebrow:'Líderes consolidados',title:'600K',subtitle:'Ingresos residuales estables. Tu cartera ya es un activo real.',body:['Tu compromiso financiero aumenta y con él, tus beneficios.','A partir de este nivel, tu ingreso mensual comienza a reflejar verdadera estabilidad financiera.']},
  'rank-1-2m':{eyebrow:'Nivel profesional',title:'1.2M',subtitle:'Has alcanzado el millón.',body:['Este hito representa más que un número: simboliza tu capacidad de crear, liderar y mantener una organización financiera sólida. Tu red ya opera con profesionalismo, y tu ingreso refleja esa realidad.','Liderazgo en crecimiento y más estabilidad mensual. Tu ingreso residual ahora representa una fuente confiable de recursos para ti y tu familia.']},
  'rank-3m':{eyebrow:'Organización financiera seria',title:'3M',subtitle:'Empiezas a construir una organización financiera seria.',body:['En este rango, ya no eres solo un promotor: eres un líder estratégico con una red que genera resultados consistentes. Tu estructura tiene profundidad, estabilidad y crecimiento orgánico.'],quote:'Un compromiso de alto nivel'},
  'rank-6m':{eyebrow:'Columna del proyecto',title:'6M',subtitle:'Eres una columna del proyecto.',body:['Alcanzar los 5 millones de dólares en volumen no es casualidad. Es el resultado de años de trabajo, visión estratégica y construcción constante. En este nivel, eres una pieza fundamental del ecosistema InterGrow Capital.','Tu residual es una máquina constante. Mes tras mes, generas ingresos predecibles que te permiten planificar a largo plazo con confianza.'],quote:'Inversión elite'},
  'rank-12m':{eyebrow:'Liderazgo total',title:'12M',subtitle:'Operas como un socio estratégico.',body:['Diez millones de dólares en volumen. Este es el nivel más alto del plan de compensación, reservado para los líderes más competitivos, visionarios y estratégicos de InterGrow Capital. Operas como un socio fundamental del proyecto.','Tu voz tiene peso, tu experiencia es invaluable, y tu ingreso refleja tu posición dentro del ecosistema.'],quote:'El más alto plan. El compromiso máximo. Una organización de alto impacto.'},
  'vision':{eyebrow:'InterGrow Capital',title:'Expande tu visión, expande tu ingreso.'},
};
const en:Record<SlideId,SlideCopy>={
  'cover':{eyebrow:'A shared vision. A future with purpose.',title:'Compensation plan',subtitle:'Expand your vision, expand your income.'},
  'growth':{eyebrow:'Growth plan',title:'Real opportunity. True residual income.',subtitle:'Professional growth.',body:['We designed a system that rewards your effort, your vision, and your ability to build lasting relationships. This plan is more than a commission scheme: it is a professional structure that allows you to develop stable, predictable, and scalable income.']},
  'portfolio':{eyebrow:'What do we offer?',title:'Your portfolio, your future',body:['This plan allows you to build a real asset that generates recurring income. It is more than selling once: it means creating a client base that produces consistent returns.'],bullets:['Build a solid portfolio of committed clients','Generate automatic monthly residual income','Your income scales as your total volume grows','Build a financial asset that produces month after month','Build wealth']},
  'direct':{eyebrow:'Direct sales commission',title:'Earn today by selling.',subtitle:'Build for the long term with residual income.',body:['Immediate income from day one. For every direct sale you make, you receive an immediate 5% commission. No waiting for ranks. No prior structure.'],bullets:['5% directly on every personal sale','Immediate payment','Independent of organizational volume','Compatible with all ranks']},
  'overview':{eyebrow:'The complete plan',title:'Your growth, your decision.',body:['The InterGrow Capital compensation plan is structured around progressive ranks. Each level offers greater benefits, higher returns, and additional bonuses.'],quote:'Each rank represents a new level of commitment, leadership, and financial reward.'},
  'promoter-benefit':{eyebrow:'Exclusive promoter benefit',title:'All your personal plans',body:['Receive 5% or 6% compound monthly returns on your personal savings plans.'],quote:'When you refer your first 3 direct affiliates'},
  'promoter':{eyebrow:'The first step',title:'Promoter',subtitle:'Simple commissions, no structure required.',body:['Monthly residual: 1% of your direct affiliates.','This is your starting point for building sustainable income.']},
  'rank-120k':{eyebrow:'The first stage of leadership',title:'120K',subtitle:'Your business starts to build a foundation.',body:['Your passive income will be 1.5% of your organization’s volume.']},
  'rank-300k':{eyebrow:'Consolidation begins',title:'300K',subtitle:'Your network gains strength of its own.',body:['This is when your organization begins to work independently and your residual income becomes more predictable.'],quote:'Monthly residual on total volume'},
  'rank-600k':{eyebrow:'Established leaders',title:'600K',subtitle:'Stable residual income. Your portfolio is now a real asset.',body:['Your financial commitment increases, and so do your benefits.','From this level onward, your monthly income begins to reflect true financial stability.']},
  'rank-1-2m':{eyebrow:'Professional level',title:'1.2M',subtitle:'You have reached the million mark.',body:['This milestone represents more than a number: it symbolizes your ability to create, lead, and maintain a solid financial organization. Your network now operates professionally, and your income reflects that reality.','Growing leadership and greater monthly stability. Your residual income now represents a reliable source of resources for you and your family.']},
  'rank-3m':{eyebrow:'A serious financial organization',title:'3M',subtitle:'You are building a serious financial organization.',body:['At this rank, you are more than a promoter: you are a strategic leader with a network that generates consistent results. Your structure has depth, stability, and organic growth.'],quote:'A high-level commitment'},
  'rank-6m':{eyebrow:'A pillar of the project',title:'6M',subtitle:'You are a pillar of the project.',body:['Reaching 5 million dollars in volume is no coincidence. It is the result of years of work, strategic vision, and constant building. At this level, you are a fundamental part of the InterGrow Capital ecosystem.','Your residual income is a constant engine. Month after month, you generate predictable income that allows you to plan for the long term with confidence.'],quote:'Elite investment'},
  'rank-12m':{eyebrow:'Total leadership',title:'12M',subtitle:'You operate as a strategic partner.',body:['Ten million dollars in volume. This is the highest level of the compensation plan, reserved for InterGrow Capital’s most competitive, visionary, and strategic leaders. You operate as a fundamental partner in the project.','Your voice carries weight, your experience is invaluable, and your income reflects your position within the ecosystem.'],quote:'The highest plan. The maximum commitment. A high-impact organization.'},
  'vision':{eyebrow:'InterGrow Capital',title:'Expand your vision, expand your income.'},
};
const fr:Record<SlideId,SlideCopy>={
  'cover':{eyebrow:'Une vision partagée. Un avenir porteur de sens.',title:'Plan de rémunération',subtitle:'Élargissez votre vision, augmentez vos revenus.'},
  'growth':{eyebrow:'Plan de croissance',title:'Une vraie opportunité. Un véritable revenu résiduel.',subtitle:'Une croissance professionnelle.',body:['Nous avons conçu un système qui récompense vos efforts, votre vision et votre capacité à construire des relations durables. Ce plan est plus qu’un système de commissions : c’est une structure professionnelle qui vous permet de développer un revenu stable, prévisible et évolutif.']},
  'portfolio':{eyebrow:'Que proposons-nous ?',title:'Votre portefeuille, votre avenir',body:['Ce plan vous permet de construire un actif réel qui génère des revenus récurrents. Il ne s’agit pas de vendre une seule fois, mais de créer une clientèle qui produit des rendements constants.'],bullets:['Construisez un portefeuille solide de clients engagés','Générez des revenus résiduels mensuels automatiques','Votre revenu augmente avec votre volume total','Construisez un actif financier qui produit mois après mois','Constituez un patrimoine']},
  'direct':{eyebrow:'Commission directe sur les ventes',title:'Gagnez aujourd’hui en vendant.',subtitle:'Construisez à long terme avec des revenus résiduels.',body:['Des revenus immédiats dès le premier jour. Pour chaque vente directe, vous recevez une commission immédiate de 5%. Sans attendre un rang. Sans structure préalable.'],bullets:['5% directement sur chaque vente personnelle','Paiement immédiat','Indépendant du volume organisationnel','Compatible avec tous les rangs']},
  'overview':{eyebrow:'Vue d’ensemble du plan',title:'Votre croissance, votre décision.',body:['Le plan de rémunération d’InterGrow Capital est structuré en rangs progressifs. Chaque niveau vous offre davantage d’avantages, des rendements plus élevés et des primes supplémentaires.'],quote:'Chaque rang représente un nouveau niveau d’engagement, de leadership et de récompense financière.'},
  'promoter-benefit':{eyebrow:'Avantage exclusif des promoteurs',title:'Tous vos plans personnels',body:['Recevez un rendement mensuel composé de 5% ou 6% sur vos plans d’épargne personnels.'],quote:'Lorsque vous recommandez vos 3 premiers affiliés directs'},
  'promoter':{eyebrow:'Le premier pas',title:'Promoteur',subtitle:'Des commissions simples, sans structure requise.',body:['Revenu résiduel mensuel : 1% de vos affiliés directs.','C’est votre point de départ pour construire un revenu durable.']},
  'rank-120k':{eyebrow:'Première étape du leadership',title:'120K',subtitle:'Votre activité commence à prendre forme.',body:['Votre revenu passif sera de 1.5% du volume de votre organisation.']},
  'rank-300k':{eyebrow:'La consolidation commence',title:'300K',subtitle:'Votre réseau acquiert sa propre force.',body:['C’est le moment où votre organisation commence à travailler de façon autonome et où votre revenu résiduel devient plus prévisible.'],quote:'Revenu résiduel mensuel sur le volume total'},
  'rank-600k':{eyebrow:'Des leaders confirmés',title:'600K',subtitle:'Des revenus résiduels stables. Votre portefeuille est désormais un véritable actif.',body:['Votre engagement financier augmente, tout comme vos avantages.','À partir de ce niveau, votre revenu mensuel commence à refléter une véritable stabilité financière.']},
  'rank-1-2m':{eyebrow:'Niveau professionnel',title:'1.2M',subtitle:'Vous avez atteint le million.',body:['Cette étape représente plus qu’un chiffre : elle symbolise votre capacité à créer, diriger et maintenir une organisation financière solide. Votre réseau fonctionne désormais avec professionnalisme, et votre revenu reflète cette réalité.','Un leadership en croissance et davantage de stabilité mensuelle. Votre revenu résiduel représente désormais une source fiable de ressources pour vous et votre famille.']},
  'rank-3m':{eyebrow:'Une organisation financière sérieuse',title:'3M',subtitle:'Vous construisez une organisation financière sérieuse.',body:['À ce rang, vous êtes plus qu’un promoteur : vous êtes un leader stratégique avec un réseau qui génère des résultats constants. Votre structure possède de la profondeur, de la stabilité et une croissance organique.'],quote:'Un engagement de haut niveau'},
  'rank-6m':{eyebrow:'Un pilier du projet',title:'6M',subtitle:'Vous êtes un pilier du projet.',body:['Atteindre 5 millions de dollars de volume n’est pas un hasard. C’est le résultat d’années de travail, de vision stratégique et de construction constante. À ce niveau, vous êtes un élément fondamental de l’écosystème InterGrow Capital.','Votre revenu résiduel est un moteur constant. Mois après mois, vous générez des revenus prévisibles qui vous permettent de planifier à long terme en toute confiance.'],quote:'Investissement élite'},
  'rank-12m':{eyebrow:'Leadership total',title:'12M',subtitle:'Vous agissez en partenaire stratégique.',body:['Dix millions de dollars de volume. C’est le niveau le plus élevé du plan de rémunération, réservé aux leaders les plus compétitifs, visionnaires et stratégiques d’InterGrow Capital. Vous êtes un partenaire fondamental du projet.','Votre voix compte, votre expérience est inestimable, et votre revenu reflète votre position au sein de l’écosystème.'],quote:'Le plan le plus élevé. L’engagement maximal. Une organisation à fort impact.'},
  'vision':{eyebrow:'InterGrow Capital',title:'Élargissez votre vision, augmentez vos revenus.'},
};
export const copy:Record<Locale,Record<SlideId,SlideCopy>>={es,en,fr};
export const orderedRankIds = (order:readonly SlideId[]=ids):RankSlideId[] => order.filter((id):id is RankSlideId=>id in ranks);
const background=(src:string,focal:[number,number],brightness=.8):Background=>({src:`/images/${src}.webp`,focal,brightness,scrim:'left',camera:{zoom:.07,drift:.008,parallax:.006}});
const citySkyline=background('slides/city-skyline',[.77,.55],.95);
const backgrounds: Record<(typeof ids)[number], Background> = {
  cover: background('architecture',[.7,.5],.9),
  growth: background('slides/growth-plan',[.72,.43]),
  portfolio: background('slides/portfolio',[.72,.5]),
  direct: background('slides/direct-sales',[.73,.48]),
  overview: background('slides/plan-overview',[.74,.38]),
  'promoter-benefit': citySkyline,
  promoter: background('slides/promoter',[.72,.45]),
  'rank-120k': background('slides/rank-120k',[.72,.43]),
  'rank-300k': background('slides/rank-300k',[.74,.5],.9),
  'rank-600k': background('slides/rank-600k',[.71,.48]),
  'rank-1-2m': background('slides/rank-1-2m',[.72,.44]),
  'rank-3m': background('slides/rank-3m',[.74,.45],.9),
  'rank-6m': background('slides/rank-6m',[.72,.44]),
  'rank-12m': background('slides/rank-12m',[.73,.5],.9),
  vision: citySkyline,
};
const layouts:Record<SlideId,LayoutKind>={
  cover:'cover',growth:'standard',portfolio:'standard',direct:'direct',overview:'overview',
  'promoter-benefit':'promoter-benefit',promoter:'rank','rank-120k':'rank','rank-300k':'rank',
  'rank-600k':'rank','rank-1-2m':'rank','rank-3m':'rank','rank-6m':'rank','rank-12m':'rank',vision:'closing',
};
export const slideDefinitions:AppSlideDefinition[]=ids.map(id=>({
  id,layout:layouts[id],group:layouts[id]==='cover'?'cover':layouts[id]==='rank'||layouts[id]==='closing'?'ranks':'plan',
  background:backgrounds[id],
}));
export const directStructure:Record<Locale,string>={es:'3 afiliados directos',en:'3 direct affiliates',fr:'3 affiliés directs'};
export const promoterName:Record<Locale,string>={es:'Promotor',en:'Promoter',fr:'Promoteur'};

/* Hopin 案例数据 —— 从 startup-graveyard.html 原样抽出，数值与文案未动。
 * compare / ending 依赖宿主提供的格式化与状态辅助函数，统一由第三参数 h 注入：
 *   h.fmtMoney(m) / h.fmtSubs(v) / h.fmtSubsShort(v,unit) / h.dateOf(month) / h.effectivePmf()
 */

export const HOPIN_NODES = [
  {
    id:1, date:'2020.03', month:0, title:'产品边界',
    brief:'伦敦。线下活动一夜归零，你的直播工具原型突然成了刚需。账上只有第一笔钱，团队不到 30 人。第一个决定：把产品做成什么。',
    choices:[
      {t:'全能活动套件', d:'注册、展位、一对一配对、分会场、数据分析，一次做全。客户要什么就给什么。', tag:'大而全', hist:true,
       cash:-3, product:25, content:20, pmf:8, burn:3,
       note:'你选择了最难的路。客户很喜欢，工程团队开始睡在公司。'},
      {t:'只做单场大会直播', d:'把一件事做到极致：一万人同时在线，不卡、不崩。', tag:'单点',
       cash:-1, product:15, content:5, pmf:4, burn:1,
       note:'上线最快，但每场活动都是一次性生意，没有留存。'},
      {t:'先做创作者推流工具', d:'不服务「活动」，服务「把内容播出去」这件事。像 StreamYard。', tag:'工具流',
       cash:-1, product:12, content:8, pmf:10, burn:1, flag:'creatorTool',
       note:'你的产品不依赖「活动」这个场景——这在两年后会救你的命。'}
    ],
    pivotal:'「服务活动」还是「服务播出去」——两年后需求退潮时，这是生与死的分界线。',
    history:'Hopin 上线时就是一个「全能活动平台」：主会场、分会场、展位、配对、聊天全都有，靠一件事打动客户——上线快、不用装软件。'
  },
  {
    id:2, date:'2020.06', month:3, title:'增长打法',
    brief:'销售线索像洪水一样涌进来。问题不是有没有需求，而是你用什么姿势接住它，以及这份需求能持续多久。',
    choices:[
      {t:'免费场次 + 年单销售', d:'先免费用，再把客户锁进一年期合同。ARR 会很好看。', tag:'年单', hist:true,
       cash:6, pmf:6, burn:4, flag:'annualDeals',
       note:'年单让 ARR 一夜之间很好看，但它把「一次性活动」包装成了「经常性收入」。'},
      {t:'按场次收费', d:'用多少付多少，不做承诺。收入曲线诚实，但增长慢。', tag:'按量',
       cash:3, pmf:10, burn:1, flag:'usage',
       note:'收入跟着真实使用量走，你也就更早看到需求什么时候开始退潮。'},
      {t:'只服务头部品牌', d:'放弃长尾，专攻大客户。单客收入高，销售周期长。', tag:'大客户',
       cash:8, pmf:4, content:10, burn:2, flag:'enterprise',
       note:'单客收入高，但客户数少，天花板也低。'}
    ],
    history:'Hopin 用免费额度快速铺开，同时用年单把客户锁住。到 2020 年 11 月，ARR 从年初的 2000 万美元冲到约 1 亿美元。'
  },
  {
    id:3, date:'2020.11', month:8, title:'融资节奏',
    brief:'所有人都在抢你的份额。市场愿意给你任何你想要的钱——代价是你得接受那个估值。',
    choices:[
      {t:'融 1.25 亿，估值 21 亿', d:'成为欧洲最快晋升的独角兽之一。弹药充足，压力也充足。', tag:'高举高打', hist:true,
       cash:125, burn:3, flag:'highValuation',
       note:'你成了独角兽。从这一刻起，每个季度都要证明这个估值是真的。'},
      {t:'融 4000 万，估值 6 亿', d:'钱够用就好，把估值留在合理区间。', tag:'稳健',
       cash:40, pmf:5, flag:'lowPressure',
       note:'钱少一点，但你保留了说「我们错了」的权利。'},
      {t:'只融 1 亿，估值 10 亿', d:'拿够两年的钱，但不追「最快独角兽」的头衔。给未来的 C 轮留出空间。', tag:'留余地',
       cash:100, pmf:2, burn:1, flag:'lowPressure',
       note:'你没有上最大的那张牌桌。少了一点弹药，也多了一点说「不」的自由。'}
    ],
    history:'2020 年 11 月完成 1.25 亿美元 B 轮，估值 21.25 亿美元。四个月后又融 4 亿美元 C 轮，估值 56.5 亿。'
  },
  {
    id:4, date:'2021.03', month:12, title:'C 轮与并购',
    brief:'C 轮 4 亿美元到账，估值 56.5 亿。市场上所有做活动、做推流的公司都在等一个买家。你要决定：这笔钱用来买什么，以及为什么不自己造。',
    choices:[
      {t:'融 4 亿，2.5 亿买 StreamYard + 一堆小收购', d:'用 2.5 亿美元买下推流工具，再顺手收下 Jamm、Boomset、Attendify。剩下的当扩张弹药。', tag:'买增长', hist:true,
       cash:150, product:20, content:25, pmf:5, burn:6, flag:'streamyard',
       note:'你买到了真正有留存的创作者工具——虽然当时你是为了「补功能」。'},
      {t:'只融 1 亿，只买 StreamYard', d:'一个小一点的 C 轮，一个真正有现金流的资产，其余的自己长。', tag:'聚焦并购',
       cash:40, product:18, content:10, pmf:6, burn:3, flag:'streamyard',
       note:'少融一点，少买几个，也少背几个遗留系统。'},
      {t:'不融 C 轮，全部自研', d:'账上的钱还够，一分钱不花在并购上，靠自己的团队把产品补齐。', tag:'自研',
       cash:-20, product:8, burn:5, flag:'buildInHouse',
       note:'团队要同时造五个产品，每个都只能做到七十分。'}
    ],
    history:'2021 年 3 月完成 4 亿美元 C 轮，估值 56.5 亿美元；同月以约 2.5 亿美元收购 StreamYard，并在一年内接连收购 Jamm、Boomset、Attendify、Streamable、Topi。'
  },
  {
    id:5, date:'2021.06', month:15, title:'组织扩张',
    bridge:'上一轮，你选择了「{prev}」。钱到账了，投资人看着你——现在他们要看的是规模。',
    brief:'你已经有 300 人。销售说，要覆盖全球需求还需要 500 人。招聘团队把 offer 发得像印钞。',
    choices:[
      {t:'一年扩到 1200 人', d:'按「需求会一直涨」来配置组织。销售、市场、工程全线扩编。', tag:'超配', hist:true,
       cash:-20, team:25, burn:22, product:8, flag:'overhire',
       note:'你把「疫情期的需求」当成了「永久的需求」，并为此雇了一支按永久需求配置的军队。'},
      {t:'控制在 500 人', d:'按最保守的需求预测配人，保留调整空间。', tag:'克制',
       cash:-8, team:8, burn:6, product:4, flag:'disciplined',
       note:'你放弃了增长速度，换来了活到 2023 年的可能。'},
      {t:'大量外包 + 自动化', d:'核心团队保持精简，其余全部外包。', tag:'轻组织',
       cash:-4, team:-5, burn:2, product:2, flag:'outsource',
       note:'成本低，但产品质量和响应速度开始失控。'}
    ],
    history:'Hopin 的员工数从 2020 年初的 8 人，一路涨到 2022 年 1 月的约 1100–1200 人。'
  },
  {
    id:6, date:'2021.08', month:17, title:'D 轮与收入质量',
    brief:'4.5 亿美元 D 轮到账，估值 77.5 亿。董事会要看 ARR，投资人要看你「能不能撑起这个估值」。你手里有大量多年合同和一次性活动赞助——会计上，可以处理得很漂亮。',
    choices:[
      {t:'融 4.5 亿，全部计入 ARR，对外宣布 1 亿美元年收入', d:'把多年合同、一次性赞助、活动服务费，通通折算成年化收入，去撑住 77.5 亿的估值。', tag:'做漂亮', hist:true,
       cash:450, pmf:5, burn:3, flag:'inflatedARR',
       note:'数字很好看。但其中很大一部分，明年不会再来。'},
      {t:'只融 1 亿，只披露月度经常性收入', d:'拒绝最高估值，用最保守的口径说话，接受估值被砍。', tag:'说真话',
       cash:100, pmf:-5, burn:-2, flag:'honestMetrics',
       note:'估值会被砍，但你终于知道自己在什么位置。'},
      {t:'不融 D 轮，主动披露续费率', d:'把难看的数据也摆上桌，让董事会看清真实的留存，也让自己不必再为高估值表演。', tag:'透明',
       pmf:3, burn:-1, flag:'honestMetrics',
       note:'市场短期不满意，但你没有骗自己。'}
    ],
    history:'2021 年 8 月完成 4.5 亿美元 D 轮，估值 77.5 亿美元。Hopin 对外宣称 2021 年 ARR 约 1 亿美元，后续报道与裁员节奏显示，其中包含大量一次性与多年合同收入。'
  },
  {
    id:7, date:'2021.11', month:20, title:'战略押注',
    brief:'线下活动回来了。你必须在董事会上回答一个问题：当人们可以见面，他们还需要你的产品吗？',
    choices:[
      {t:'押注「混合活动」', d:'相信线上会成为线下活动的一部分，继续为「同时服务现场和远程」投入。', tag:'混合', hist:true,
       cash:-30, product:15, pmf:-8, burn:8, flag:'hybrid',
       note:'你相信线上会成为线下的一部分。事后看，大多数人只是回到了线下。'},
      {t:'转向创作者推流工具', d:'放弃「活动平台」的叙事，去服务一个更朴素的需求：把内容播出去。', tag:'转向',
       cash:-10, product:10, pmf:14, burn:-4, flag:'creatorTool',
       mods:[{when:'creatorTool', pmf:6, note:'你从第一天起就在造这个工具——现在只是把故事说圆。'}],
       note:'你放弃了最大的故事，去抓住一个真正还在增长的东西。'},
      {t:'转做线下活动的注册与票务 SaaS', d:'跟着人群回到线下，做签到、票务、胸牌。', tag:'跟随',
       cash:-20, product:12, pmf:6, burn:2, flag:'inPerson',
       note:'你跟着人群回到了线下，但那里已经站着 Eventbrite。'}
    ],
    pivotal:'线下回来的这一刻，押「混合」是续命，押「工具」是换命。',
    history:'Hopin 把「混合活动」当作下一增长曲线，继续投入产品与销售，但线下回归后，客户对纯线上活动的付费意愿快速下降。'
  },
  {
    id:8, date:'2022.02', month:23, title:'第一次裁员',
    brief:'增长停了。董事会要求你在月底前把成本砍下来。你的团队有 1200 人，现金跑道不到 12 个月。',
    choices:[
      {t:'裁 12%，保留扩张计划', d:'做一次「外科手术式」裁员，对外说组织仍然健康。', tag:'小步', hist:true,
       cash:-6, team:-8, burn:-6, pmf:-5, flag:'slowCuts',
       note:'你只切掉了指甲。三个月后，你还得再切一次。'},
      {t:'一次裁 40%', d:'承认需求变了，一次性把成本结构降到新现实。', tag:'狠手',
       cash:-8, team:-25, burn:-20, pmf:5, flag:'deepCut',
       mods:[{when:'overhire', team:-5, pmf:-3, note:'扩张时按「永久需求」配的人，裁起来每一刀都更深。'}],
       note:'很痛，但你买到了 18 个月的跑道，和一次真正重新做决定的机会。'},
      {t:'不裁，赌下半年反弹', d:'线下活动会回来，混合活动会起来，熬过去就好。', tag:'赌反弹',
       pmf:-10, flag:'noCut',
       note:'你在等一个不会来的反弹。'}
    ],
    history:'2022 年 2 月裁员 12%，7 月再裁 29%，11 月进行第三轮裁员。一年之内，1200 人缩减到约 500 人。'
  },
  {
    id:9, date:'2022.08', month:29, title:'保住哪一个',
    bridge:'上一轮，你选择了「{prev}」。但裁员没有买来增长，只买来了时间——现在连时间也快用完了。',
    brief:'现金只够 9 个月。活动业务在萎缩，但 StreamYard 还在增长。你必须决定：这家公司到底是谁。',
    choices:[
      {t:'继续裁员，两边都保', d:'再裁一轮，把组织压到只剩维持运转的人，试图同时维持活动平台和推流工具。', tag:'两边都要', hist:true,
       cash:-10, team:-20, burn:-35, pmf:-3, flag:'slowCuts',
       note:'你试图同时保住两个方向。成本终于降下来了，但两个业务都只是勉强活着。'},
      {t:'卖掉活动业务，全力做 StreamYard', d:'承认「活动平台」这个故事结束了，把资源压到还在增长的产品上。', tag:'聚焦',
       cash:40, team:-10, burn:-12, pmf:12, flag:'focusStreamyard',
       note:'你亲手结束了那个让你成为独角兽的故事，并保住了真正有用的资产。'},
      {t:'收缩到现金流为正', d:'砍到 400 人，停止一切扩张，只求不再失血。', tag:'止血',
       cash:-6, team:-30, burn:-18, pmf:6, flag:'breakeven',
       mods:[{when:'disciplined', pmf:4, note:'你一直留着调整的余地——现在它变成了转身的速度。'}],
       note:'公司活下来了，但也失去了增长——你只是把死亡往后推了。'}
    ],
    variants:[{
      when:'!streamyard', title:'断臂',
      brief:'现金只够 9 个月。活动业务在萎缩，而你手里没有 StreamYard——没有别人的增长引擎可买，只有自己一行一行造出来的东西。你必须决定：这家公司到底是谁。',
      choices:[
        {t:'保活动业务，工具线止损', d:'活动平台是估值故事的根。收缩自研工具线，把仅剩的现金留给主叙事。', tag:'保故事',
         cash:-20, team:-10, burn:-8, pmf:2,
         note:'你保住了故事，但故事的听众正在离场。'},
        {t:'关停活动业务，全力自研', d:'承认「活动平台」的故事结束了，把所有资源压到亲手造的产品线上。', tag:'断臂',
         cash:25, team:-10, burn:-12, pmf:10, flag:'focusStreamyard',
         note:'没有 StreamYard 可卖——你结束的是故事本身，保住的是亲手造的东西。'},
        {t:'双线节食', d:'两条线都砍到最低配置，谁都不放弃，谁也长不大。', tag:'都要',
         cash:-10, team:-8, burn:-13,
         note:'你谁也没得罪，除了未来的自己。'}
      ],
      pivotal:'现金只剩 9 个月时，聚焦比勇气值钱——哪怕聚焦意味着亲手结束那个让你成为独角兽的故事。'
    }],
    pivotal:'现金只剩 9 个月时，聚焦比勇气值钱。',
    history:'Hopin 在 2022 年下半年继续收缩，把重心转向 StreamYard，同时为活动业务寻找买家。'
  },
  {
    id:10, date:'2023.07', month:40, title:'终局',
    brief:'2023 年。活动业务已经不值钱了，但你手里还有一个每年几千万美元、仍在增长的推流产品。投资人要一个交代。',
    choices:[
      {t:'把活动业务卖给 RingCentral', d:'作价约 1500 万美元，加上最高 3500 万美元的对赌。StreamYard 暂时留下。', tag:'出售', hist:true,
       cash:15, final:'sell',
       note:'七十七亿五千万的估值，最后换回一个零头。'},
      {t:'提前 12 个月动手：卖活动业务，重注 StreamYard', d:'更早承认故事结束，把现金和团队全部压到还在增长的产品上。', tag:'及时止损',
       cash:35, final:'focus', pmf:10,
       note:'你没有救回那个故事，但你救回了这家公司里唯一还在生长的部分。'},
      {t:'整体清算关停', d:'把能卖的都卖掉，剩下的还给投资人，结束。', tag:'清算',
       final:'shutdown',
       note:'你没有选择体面，你选择了结束。'}
    ],
    history:'2023 年 7 月 31 日，Hopin 把活动平台资产出售给 RingCentral，作价约 1500 万美元现金加最高 3500 万美元对赌；创始人同月离职。2024 年 4 月，Bending Spoons 以约 1.2 亿美元收购其剩余资产（主要是 StreamYard）。'
  }
];

export const HOPIN_REAL = {
  text: '2020 至 2021 年累计融资约 10 亿美元，峰值估值 77.5 亿美元。2022 年一年内三轮裁员，团队从 1200 人缩减到约 500 人。2023 年 7 月把活动业务以约 1500 万美元（加对赌）卖给 RingCentral，创始人离职；2024 年 4 月剩余资产被 Bending Spoons 以约 1.2 亿美元收购。'
};

/* 需求曲线：疫情红利不是市场，是一条会退潮的河 */
export function interpCurve(month, pts){
  if(month <= pts[0][0]) return pts[0][1];
  for(let i=1;i<pts.length;i++){
    if(month <= pts[i][0]){
      const [m0,v0] = pts[i-1], [m1,v1] = pts[i];
      const t = (month - m0) / (m1 - m0);
      return v0 + (v1 - v0) * t;
    }
  }
  return pts[pts.length-1][1];
}

export const HOPIN_DEMAND = [[0,1.50],[6,1.50],[12,1.35],[18,1.00],[23,0.78],[29,0.58],[35,0.44],[41,0.34]];

export const HOPIN = {
  id:'hopin', caseNo:'CASE 002', company:'HOPIN', brandCase:'/ HOPIN',
  brandSub:'Startup Rebuild · Case 002',
  tagline:'疫情把所有人赶到线上——需求存在，但会退潮。',
  nodes: HOPIN_NODES, real: HOPIN_REAL,
  initial:{cash:60, product:20, pmf:55, content:5, team:30, burn:3},
  launchMonth:0, totalMonths:41, minBurn:3, launchBurn:0, quarterlyCost:3,
  startYear:2020, startMonth:2,
  arpu:0.8, subsLabel:'付费客户', subsUnit:'K', contentLabel:'产品矩阵',
  baseSubs:0, maxSubs:26, showDemand:true, burnAlert:40,
  narr:{low:4.4, mid:18, cashHigh:200, cashMid:80, contentNote:55},
  demandCurve:HOPIN_DEMAND,
  demand:(month, flags)=>{
    let m = interpCurve(month, HOPIN_DEMAND);
    if(flags.creatorTool) m += 0.30;
    if(flags.hybrid) m -= 0.12;
    if(flags.enterprise) m += 0.08;
    return Math.max(0.15, m);
  },
  modifiers:s => (s.flags.creatorTool?1.15:1) * (s.flags.enterprise?1.20:1) * (s.flags.inflatedARR?0.95:1),
  score:{subsDiv:11.5, cashDiv:280, horizon:41, span:12},
  realAP:['nomarket','burn','unit','team'],
  trackTitle:'时间线 · 2020.03 → 2023.08',
  trackLabels:['疫情爆发','估值顶峰','终局'],
  flagChips:[
    ['creatorTool','创作者工具','good'],['enterprise','大客户','good'],['usage','按量收费','good'],
    ['lean','精益','good'],['lowPressure','低估值压力','good'],['disciplined','组织克制','good'],
    ['honestMetrics','诚实口径','good'],['deepCut','狠手裁员','good'],['focusStreamyard','聚焦推流','good'],
    ['breakeven','现金流为正','good'],
    ['highValuation','高估值','bad'],['overhire','超配团队','bad'],['inflatedARR','收入注水','bad'],
    ['hybrid','押注混合','bad'],['slowCuts','慢刀裁员','bad'],['noCut','拒绝裁员','bad'],
    ['annualDeals','年单包装','bad'],['outsource','过度外包','bad'],['streamyard','并购整合','bad'],
    ['inPerson','转做线下','bad'],['buildInHouse','全线自研','bad']
  ],
  flagNarr:[
    ['creatorTool','创作者工具的收入没有跟着活动一起退潮——它成了这艘船上唯一还在划的桨。'],
    ['hybrid','「混合活动」的产品做出来了，但客户只愿意为线下那部分付钱。'],
    ['inflatedARR','财报上的 ARR 和银行账户里的钱，正在变成两个故事。'],
    ['overhire','一千多人的组织，服务的是一个正在缩小的市场。'],
    ['slowCuts','又一轮小规模裁员。留下来的人开始怀疑下一轮会不会轮到自己。'],
    ['focusStreamyard','活动平台的招牌还挂着，但公司真正的现金流已经来自另一个产品。'],
    ['breakeven','账终于不失血了，代价是公司不再增长。'],
    ['enterprise','大客户续约了，但他们只买「活动」，不买「平台」。'],
    ['usage','按场次收费让收入更真实——退潮时你也更早看见了。'],
    ['deepCut','组织被砍到骨头，但决策链短了，反而跑得更快。']
  ],
  intro:{
    title:'你能救活<br><span class="strike">Hopin</span> 吗？',
    sub:'2020 年 3 月，线下活动一夜归零。一家成立不到一年的伦敦小公司，在 18 个月内融了 <b>10 亿美元</b>、估值冲到 <b>77.5 亿</b>。三年后，它把核心资产卖了 <b>1500 万</b>。<br><br>现在你被放回疫情爆发的那一刻。你有 41 个月、10 个决策点。真正的敌人不是竞争对手——是正在退潮的需求。',
    facts:[['$1B','累计融资'],['$7.75B','峰值估值'],['$15–22M','最终出售作价']],
    startLabel:'进入 2020 年 3 月 →'
  },
  compare(s, score, h){
    const arr = s.subs * s.arpu * 12;
    return [
      {label:'年化收入 ARR', real:'≈ $100M（2021 峰值）', you:h.fmtMoney(arr), win:arr>100},
      {label:'存活时长', real:'41 个月', you:s.month+' 个月', win:s.month>41},
      {label:'最终账面', real:'$15–22M（出售）', you:h.fmtMoney(s.cash), win:s.cash>22},
      {label:'真实市场契合', real:'由高转低', you:Math.round(h.effectivePmf())+' / 100', win:h.effectivePmf()>50}
    ];
  },
  ending(s, score, h){
    const final = s.flags.final;
    if(s.dead) return `现金在 ${h.dateOf(s.month)} 耗尽。疫情红利退潮的速度，比你的成本结构下降的速度更快。你没有等到 2023 年——公司在半路就没了。`;
    if(final === 'shutdown') return '你选择了清算。没有买家，没有接盘方，团队解散，投资人拿回了一个零头。这不是体面，但至少是诚实的。';
    if(final === 'focus') return `你在还有人愿意付钱的时候，把活动业务卖掉了，把公司押在真正还在增长的产品上。账上还剩 <span class="hl">${h.fmtMoney(s.cash)}</span>。你没有救回那个 77.5 亿美元的故事，但你救回了这家公司里唯一还活着的东西。`;
    if(score >= 68) return `你把活动业务卖给了 RingCentral，作价约 1500 万美元——七十七亿五千万的估值，最后换回一个零头。但这一次，账上还有 <span class="hl">${h.fmtMoney(s.cash)}</span>，团队没有散，StreamYard 还在长。你让一场必败的战争变成了一次有序撤退。`;
    if(score >= 35) return `你把活动业务卖了。作价比历史略好，团队少受了一点伤。这不是改命，只是死得慢一点、体面一点。`;
    return '你把活动业务卖掉了。2023 年 7 月，RingCentral 用一个零头接走了它。三年，十亿美元，七十七亿估值，最后只剩一份新闻稿。';
  }
};

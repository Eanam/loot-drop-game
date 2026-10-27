/* Quibi 案例数据 —— 从 startup-graveyard.html 原样抽出，数值与文案未动。
 * compare / ending 依赖宿主提供的格式化与状态辅助函数，统一由第三参数 h 注入：
 *   h.fmtMoney(m) / h.fmtSubs(v) / h.fmtSubsShort(v,unit) / h.dateOf(month) / h.effectivePmf()
 */

export const QUIBI_NODES = [
  {
    id:1, date:'2018.08', month:0, title:'内容赌注',
    brief:'洛杉矶。Jeffrey Katzenberg 拿着一个执念融到了第一笔 10 亿美元：人们会在手机上，看 6 到 10 分钟一部的好莱坞级短剧。你要决定，这笔钱烧在哪。',
    choices:[
      {t:'买好莱坞', d:'签下斯皮尔伯格、Reese Witherspoon 这个级别的阵容，做「章节电影」。单部成本可达千万美元。', tag:'重资产', hist:true,
       cash:-50, content:70, product:5, pmf:-5, burn:40,
       note:'内容库瞬间豪华，但你在为一个尚未被验证的需求，提前支付了最贵的成本。'},
      {t:'做 UGC', d:'开放创作者上传，算法推荐，平台抽成 30%。像 YouTube，但只收 10 分钟以内。', tag:'轻资产',
       cash:-20, content:35, pmf:15, product:10, burn:25,
       note:'内容便宜且量大，但质量参差，很难撑起 5–8 美元的月费。'},
      {t:'先卖技术', d:'把 Turnstyle（横竖屏无缝切换）授权给流媒体平台和大品牌做广告。', tag:'技术流',
       cash:-10, content:5, product:45, pmf:5, team:-10, burn:14,
       note:'现金流压力最小，但公司从「平台」降级为「供应商」，失去了成为 Netflix 的可能。'}
    ],
    history:'Katzenberg 把约 10 亿美元砸进内容，签下 Steven Spielberg、Reese Witherspoon 等一线阵容，做 6–10 分钟的「章节式电影」。'
  },
  {
    id:2, date:'2018.11', month:3, title:'谁坐 CEO 的位置',
    brief:'Katzenberg 是内容人。他需要一个能把公司带到 2000 人规模、能跟华尔街对话的人。',
    choices:[
      {t:'请 Meg Whitman', d:'eBay、HP 前 CEO。融资与规模化运营履历顶级——但她没做过内容。', tag:'职业经理人', hist:true,
       cash:-40, team:15, product:5, pmf:-3,
       note:'公司拿到了最好的「融资面孔」，内容判断仍然只有一个声音。'},
      {t:'Katzenberg 自己上', d:'创始人意志最强，决策最快——但没人敢对他说不。', tag:'创始人模式',
       cash:-10, team:5, product:10, pmf:5,
       note:'决策变快，但回声室也更厚。'},
      {t:'找流媒体产品型 CEO', d:'懂推荐、懂留存、懂订阅经济的人。', tag:'产品流',
       cash:-25, team:20, product:20, pmf:15,
       note:'公司第一次有人真正对「留存曲线」负责。'}
    ],
    history:'Meg Whitman 出任 CEO，与 Katzenberg 组成「好莱坞 + 硅谷」的双头结构。'
  },
  {
    id:3, date:'2019.03', month:7, title:'融资节奏',
    brief:'产品还没上线，市场已经开始给「手机短剧」定价。你要决定拿多少弹药、背多大的回报压力。',
    choices:[
      {t:'一次融 7.5 亿美元', d:'把估值推到 17.5 亿美元。弹药充足，但每一分钱都要求回报。', tag:'高举高打', hist:true,
       cash:750, flag:'highValuation',
       note:'你买到了时间，也买到了必须赢的枷锁。'},
      {t:'分批融 3 亿', d:'先做出数据，再谈下一轮。留出调整方向的空间。', tag:'稳健',
       cash:300, pmf:8, flag:'lowPressure',
       note:'估值低一点，但董事会的手也松一点。'},
      {t:'少融 1.2 亿', d:'小团队跑通模型再扩张。', tag:'精益',
       cash:120, product:12, pmf:10, burn:-8, flag:'lean',
       note:'每一笔支出都要被逼问，这既是约束也是清醒。'}
    ],
    history:'2019 年再融 7.5 亿美元，累计 17.5 亿美元，成为当时最受瞩目的内容创业公司之一。'
  },
  {
    id:4, date:'2019.07', month:11, title:'产品形态',
    bridge:'上一轮，你选择了「{prev}」。钱有了去向，现在轮到产品本身——这个决定会安静地在一年后结账。',
    brief:'产品团队交出了第一版。现在要决定：Quibi 到底在哪些屏幕上存在。这个决定会在一年后杀死你，或者救你。',
    choices:[
      {t:'只做手机', d:'锁死竖屏体验，不做电视端、不开放投屏、不允许截图。这是「为手机而生」的信仰。', tag:'原教旨', hist:true,
       product:15, pmf:-4, flag:'noTV',
       note:'你亲手关掉了客厅那扇门——而一年后，所有人都在客厅。'},
      {t:'全端覆盖', d:'手机、平板、电视、投屏全上。客厅场景也拿下。', tag:'全场景',
       cash:-60, product:10, pmf:12, flag:'tv',
       note:'工程复杂度上升，但用户在哪你就在哪。'},
      {t:'先做 Web', d:'网页版先跑，避开应用商店抽成，快速验证。', tag:'轻验证',
       cash:-20, product:5, pmf:6, flag:'web',
       note:'验证速度快，但「手机原生」的叙事被稀释了。'}
    ],
    pivotal:'事后看，这是整条时间线上最贵的一个决定——疫情来临时，有客厅那块屏幕的公司活，没有的死。',
    history:'上线时只有手机端：没有电视 App，不支持投屏，甚至不允许截图和录屏。'
  },
  {
    id:5, date:'2019.10', month:14, title:'内容采购',
    brief:'距离上线还有半年。内容库决定第一印象，也决定现金流的死期。',
    choices:[
      {t:'一次签 100+ 部', d:'用规模建护城河，确保 4 月上线时片库充足、明星云集。', tag:'规模护城河', hist:true,
       cash:-30, content:35, burn:6, flag:'bigSlate',
       note:'片库很满，但没有一部非看不可。'},
      {t:'先做 10 部试水', d:'小步快跑，用真实完播率决定加码方向。', tag:'数据驱动',
       cash:-20, content:15, pmf:12, product:5,
       note:'你保留了「根据数据改主意」的权利。'},
      {t:'买现成版权', d:'收购别人的片库，快速填充。', tag:'采购',
       cash:-60, content:25, pmf:5,
       note:'便宜、快，但没有独家性，也就没有订阅理由。'}
    ],
    history:'一次性预订 100 多个项目，在 2020 年 4 月上线前完成备货。'
  },
  {
    id:6, date:'2020.02', month:18, title:'上线前最后 60 天',
    brief:'营销预算已花，媒体已约好，4 月 6 日的发布会不能改。但你还有最后一点钱，只能押一个方向。',
    choices:[
      {t:'全押营销', d:'硬上线，把剩下的钱砸向超级碗级别的曝光，先把名字打出去。', tag:'声量', hist:true,
       cash:-80, pmf:2,
       note:'所有人都知道了 Quibi，但知道不等于想要。'},
      {t:'全押产品', d:'推迟两周，把投屏、社交分享、留存曲线补齐再上。', tag:'产品',
       cash:-40, product:15, pmf:10, flag:'tv',
       note:'你补上了那扇门，代价是错过了最大的曝光窗口。'},
      {t:'全押内容', d:'再补几部头部剧集，保证首周口碑。', tag:'内容',
       cash:-90, content:15, pmf:5,
       note:'首周有好剧可看，但产品本身的摩擦力还在。'}
    ],
    swap:[{when:'tv', index:1, choice:
      {t:'全押留存', d:'推迟两周，把社交分享、推荐和留存曲线补齐再上。', tag:'产品',
       cash:-40, product:12, pmf:12,
       note:'投屏你早就有了——这次补的是让人留下来的理由。'}
    }],
    history:'2020 年 4 月 6 日上线，正好撞上全美封锁——「通勤时看的手机剧」遇上了没人通勤的世界。'
  },
  {
    id:7, date:'2020.04', month:20, title:'试用与定价',
    brief:'上线第一周，下载量冲上榜单（约 260 万次安装）。现在要决定：怎么把下载变成付费。',
    choices:[
      {t:'90 天免费试用', d:'用最长的试用期换增长，赌三个月后他们会留下。叠加 T-Mobile、Pepsi 导流。', tag:'增长优先', hist:true,
       cash:-90, pmf:-3, flag:'trial90',
       note:'试用期比「新鲜感」还长——大多数人还没到付费那天就忘了它。'},
      {t:'7 天试用 + $2.99 首月', d:'低门槛，但不白送。让付费动作发生得更早。', tag:'转化优先',
       pmf:8, flag:'trial7',
       mods:[{when:'bigSlate', pmf:4, note:'片库够厚，低门槛转化才有底气——试用结束有人续费。'}],
       note:'更早拿到付费信号，也就能更早知道自己错了。'},
      {t:'直接收费', d:'相信内容质量，不做促销，维持 $4.99 / $7.99。', tag:'自信',
       pmf:-10, priceBoost:1.3, flag:'noTrial',
       note:'定价干净，但转化门槛高得吓人。'}
    ],
    history:'上线即提供 90 天免费试用，并与 T-Mobile、Pepsi 做大规模导流；首月约 260 万次安装（第三方估算）。'
  },
  {
    id:8, date:'2020.05', month:21, title:'疫情红利',
    bridge:'上一轮，你选择了「{prev}」。然后世界变了：所有人被关进客厅，而你卖的是通勤时的碎片时间。',
    brief:'全美进入封锁。所有人都在家，对着家里最大的那块屏幕。而你卖的是「通勤时看的手机剧」。这是最残酷的错配。',
    choices:[
      {t:'维持原策略', d:'继续强调「地铁、咖啡店、碎片时间」，照常投放户外广告。', tag:'路径依赖', hist:true,
       cash:-60, pmf:-6, flag:'commute',
       note:'你花钱提醒一群不出门的人：这是给出门的人用的。'},
      {t:'转向宅家叙事', d:'把内容重新包装成「在家也能看的小屏幕电影」，上线一起看、弹幕、社交分享。', tag:'及时转向',
       cash:-40, pmf:16, flag:'social',
       mods:[{when:'tv', pmf:6, note:'你早就在那块屏幕上——宅家叙事直接有了落点。'}],
       note:'叙事终于和现实对齐了一次。'},
      {t:'免费内容引流', d:'每周放一部免费剧，用免费换规模，再想办法变现。', tag:'免费',
       cash:-20, pmf:9, flag:'freeTier',
       note:'规模上来了，但「为什么要付费」变得更难回答。'}
    ],
    pivotal:'需求没有消失，只是从地铁挪到了客厅。这是全局最后一次低成本转身的机会。',
    history:'官方把部分失败归因于疫情，但公司仍继续围绕「移动碎片时间」做传播。'
  },
  {
    id:9, date:'2020.07', month:23, title:'补救窗口',
    bridge:'上一轮，你选择了「{prev}」。数据已经摆在桌上：留存在失血，现金在以月为单位倒计时。',
    brief:'用户数据摆在桌上：客厅场景流失最严重，7 日留存只有两成出头。距离现金耗尽不到 12 个月。',
    choices:[
      {t:'坚持移动端', d:'不做投屏——这是我们和 Netflix 的区别。', tag:'信仰', hist:true,
       pmf:-8, team:-8,
       mods:[{when:'noTV', pmf:-6, note:'你一年前亲手关上的门，现在成了墙。'}],
       note:'坚持差异化，直到差异化变成墓志铭。'},
      {t:'紧急开放投屏 + 电视 App', d:'承认用户在哪，就去哪。两个月工程换一个场景。', tag:'认错',
       cash:-50, product:10, pmf:18, flag:'tv',
       note:'这个功能本该在一年前就存在。'},
      {t:'全面转向免费 + 广告', d:'放弃订阅，做广告支持的免费短视频平台。', tag:'转型',
       cash:-70, pmf:10, flag:'adModel',
       note:'换了一条命，也换掉了一身包袱。'}
    ],
    variants:[{
      when:'tv', title:'客厅战役',
      brief:'手机端的失血还没止住，但你早早上车的电视端正在回报你：客厅场景的完播率已经接近手机同级。Roku 和 Netflix 的人都开始约你喝咖啡。账上的钱，只够认真打一场仗。',
      choices:[
        {t:'全渠道并重，客厅只做标配', d:'手机、平板、电视一碗水端平，谁也不偏心。', tag:'均衡',
         cash:-45, burn:6, product:8, pmf:6,
         note:'每条战线都守住了，每条战线都不突出——资源被摊成了薄薄一层。'},
        {t:'战略重心转向客厅', d:'把最好的内容排播和工程资源压到电视端，手机端转为跟进的第二屏。', tag:'聚焦',
         cash:-30, burn:3, product:12, pmf:10, flag:'livingRoom',
         note:'你终于承认了一件事：那块屏幕不是功能，是命。'},
        {t:'把客厅优势卖给巨头', d:'拿着电视端的完播率数据去找 Roku：要么收购，要么深度捆绑预装。', tag:'变现',
         cash:40, pmf:-4, flag:'rokuDeal',
         note:'你把最值钱的东西摆上了货架——价格合适，但主动权已经不在你手里。'}
      ],
      pivotal:'全局最后一次低成本转身的机会——这一次，你手里握着别人没有的数据。'
    }],
    pivotal:'留存的失血此时还止得住——再晚三个月，补什么功能都来不及了。',
    history:'直到 2020 年年中才补上投屏等功能，但用户流失已经不可逆。'
  },
  {
    id:10, date:'2020.09', month:25, title:'终局',
    brief:'账上还剩最后一点钱。董事会要你给一个答案。',
    choices:[
      {t:'关停，退回剩余资金', d:'止损。把剩下的钱还给投资人，结束这场实验。', tag:'止损', hist:true, final:'shutdown'},
      {t:'卖身', d:'卖给 Roku 或传媒集团，保留团队和内容库，换一个活法。', tag:'并购', final:'sell'},
      {t:'最后一搏', d:'用剩余现金打一场广告战，赌一次爆发式增长。', tag:'豪赌', final:'gamble'}
    ],
    history:'2020 年 10 月 21 日宣布关停，12 月 1 日停服；付费订阅不足 50 万，向投资人返还约 3.5 亿美元。'
  }
];

export const QUIBI_REAL = {
  subs: 0.5, months: 26, cashLeft: 350, pmf: 0,
  text: '2020 年 4 月 6 日上线，10 月 21 日宣布关停，12 月 1 日停服。付费订阅不足 50 万，1.75 亿美元估值归零，向投资人返还约 3.5 亿。'
};

export const QUIBI = {
  id:'quibi', caseNo:'CASE 001', company:'QUIBI', brandCase:'/ QUIBI',
  brandSub:'Startup Rebuild · Case 001',
  tagline:'「通勤时看的手机剧」——需求从未存在。',
  nodes: QUIBI_NODES, real: QUIBI_REAL,
  initial:{cash:1000, product:10, pmf:30, content:0, team:50, burn:0},
  launchMonth:20, totalMonths:26, minBurn:6, launchBurn:6, quarterlyCost:6,
  startYear:2018, startMonth:7,
  arpu:6, subsLabel:'付费订阅', subsUnit:'M', contentLabel:'内容库',
  baseSubs:0.4, maxSubs:1.9, showDemand:false, burnAlert:320,
  narr:{low:0.6, mid:2.5, cashHigh:900, cashMid:500, contentNote:60},
  demand:()=>1,
  modifiers:s => (s.flags.tv?1.45:1) * (s.flags.social?1.3:1) * (s.flags.noTrial?0.85:1),
  score:{subsDiv:3.5, cashDiv:1750, horizon:26, span:24},
  realAP:['nomarket','product','burn','crushed','unit'],
  trackTitle:'时间线 · 2018.08 → 2020.10',
  trackLabels:['成立','上线','终局'],
  flagChips:[
    ['tv','电视/投屏','good'],['social','社交增长','good'],['adModel','广告模式','good'],
    ['lean','精益','good'],['lowPressure','低估值压力','good'],['noTV','纯移动端','bad'],
    ['commute','通勤叙事','bad'],['trial90','90天试用','bad'],['highValuation','高估值','bad'],
    ['bigSlate','百部片单','bad']
  ],
  flagNarr:[
    ['tv','投屏与电视端打开后，客厅场景的观看时长明显回升——那扇门本该更早打开。'],
    ['noTV','仍然没有电视端。每次用户投诉，客服只能回复「请用手机看」。'],
    ['social','社交分享带来了第一批自然增长，获客成本开始往下走。'],
    ['commute','「通勤」这个词开始反噬——地铁里没有人。'],
    ['freeTier','免费用户涨得很快，但「为什么要付费」这个问题变得更难回答了。'],
    ['adModel','广告模式跑起来了，你终于有了一条不依赖订阅的收入曲线。'],
    ['lean','精益的团队结构让你在每个岔路口都还有转身的余地。']
  ],
  intro:{
    title:'你能救活<br><span class="strike">Quibi</span> 吗？',
    sub:'2020 年 4 月 6 日，一家融了 <b>17.5 亿美元</b> 的公司上线。六个月后，它关停了。付费订阅不足 <b>50 万</b>，估值归零。<br><br>现在，你被放回 2018 年 8 月。你有 26 个月、10 个关键决策点。每一个选择都会改变市场对你的回应。',
    facts:[['$1.75B','融资金额'],['6 个月','从上线到宣布关停'],['&lt;500K','付费订阅']],
    startLabel:'进入 2018 年 8 月 →'
  },
  compare(s, score, h){
    return [
      {label:'付费订阅', real:h.fmtSubsShort(0.5,'M'), you:h.fmtSubs(s.subs), win:s.subs>0.5},
      {label:'存活时长', real:'26 个月', you:s.month+' 个月', win:s.month>26},
      {label:'剩余资金', real:h.fmtMoney(350), you:h.fmtMoney(s.cash), win:s.cash>350},
      {label:'市场契合', real:'极低', you:s.pmf+' / 100', win:s.pmf>50}
    ];
  },
  ending(s, score, h){
    const final = s.flags.final;
    if(s.dead) return `现金在 ${h.dateOf(s.month)} 耗尽。公司没有等到你的下一个决定。它死得比历史更早——不是因为运气，而是因为你把赌注押在了同一个方向上，只是下注更快。`;
    if(final === 'sell'){
      const sale = Math.round(s.content*2.5 + s.subs*90 + s.product*1.5 + s.team*0.5);
      return `你把公司卖掉了。作价约 <span class="hl">${h.fmtMoney(sale)}</span>。团队和片库找到了新家——这不算赢，但你从墓地里捞回了一些东西。历史上，Roku 在 2021 年初接手了 Quibi 的内容库。`;
    }
    if(final === 'gamble'){
      return score >= 40
        ? '你把最后一点钱全砸进了增长。赌赢了：订阅曲线终于翘了起来，公司活过了 2020。'
        : '你把最后一点钱全砸进了增长。广告打完了，用户来了又走，账上归零。';
    }
    if(score >= 68) return '你选择了关停。但这一次，不是一次失败的仓皇撤退——账上还有钱，用户还在，团队完整。你把一个已经跑通的产品体面地结束，或者交给了能接住它的人。';
    if(score >= 35) return '你选择了关停。账面比历史好看一些：订阅更多，现金剩余更多，死得更体面。';
    return '你选择了关停。2020 年 10 月，董事会宣布终止运营。这一次，没有人感到意外。';
  }
};

/* ============================================================
   LLM 推演提示词构建 —— 从 startup-graveyard.html 忠实移植。
   核心约束不变：叙事只允许引用引擎提供的数字；
   玩家没走史实路线时，真实人物不得出场。
   所有函数 DOM-free，通过 game 实例读取状态。
   ============================================================ */

import { ANTIPATTERNS } from './cases/index.js';
import { fmtMoney } from './engine.js';

/* 只允许叙述里出现的数字：dashboard 上真实展示的值 + 决策文本自带的值 */
export function narrativeAllowed(game, c, n){
  const s = game.state;
  const set = new Set(['100']);
  const grab = t => (String(t).match(/\d+(?:[.,]\d+)?/g)||[])
    .forEach(x=>set.add(x.replace(/,/g,'')));
  grab(fmtMoney(s.cash));
  grab(game.runway());
  grab(s.burn.toFixed(0));
  [s.product, s.pmf, s.content, s.team].forEach(v=>grab(v));
  if(s.launched){
    grab(game.fmtSubs(s.subs));
    grab((s.subs*s.arpu).toFixed(1));
  }
  grab(Math.abs(Math.round(c.cash||0)));
  grab(Math.max(0, s.launchMonth - s.month));
  grab(c.t + ' ' + (c.d||''));
  return set;
}

/* 史实人物名黑名单：玩家没走史实路线时，真实人物不得出场 */
export const HIST_PEOPLE = {
  quibi:[
    ['Meg Whitman', ['梅格·惠特曼','惠特曼','Whitman']],
    ['Jeffrey Katzenberg', ['杰弗里·卡岑伯格','卡岑伯格','卡森伯格','Katzenberg']],
    ['Steven Spielberg', ['史蒂文·斯皮尔伯格','斯皮尔伯格','Spielberg']],
    ['Reese Witherspoon', ['瑞茜·威瑟斯彭','威瑟斯彭','Witherspoon']]
  ],
  hopin:[]
};

/* 只禁「玩家没选的那条路上」的人物；玩家所选选项/本节点 brief 里出现的人不算 */
export function bannedPeople(game, c, n){
  const table = HIST_PEOPLE[game.CASE.id] || [];
  const chosenText = [c.t, c.d, c.note, n.brief].filter(Boolean).join(' ');
  const others = [];
  if(!c.hist) others.push(n.history || '');
  for(const o of game.effectiveChoices(n)){
    if(o !== c) others.push([o.t, o.d, o.note].filter(Boolean).join(' '));
  }
  const out = [];
  for(const [, aliases] of table){
    const mentioned = others.some(t=>aliases.some(a=>t.includes(a)));
    const allowed = aliases.some(a=>chosenText.includes(a));
    if(mentioned && !allowed) out.push(...aliases);
  }
  return out;
}

/* 兜底：剔除含未授权数字或禁用人物名的整句，避免模型把编造内容展示给玩家 */
export function sanitizeNarrative(text, allowed, banned = []){
  const dateMask = /(\d{4}\s*年(?:\s*\d{1,2}\s*月)?|\d{4}\.\d{1,2}|\d{1,2}\s*月|\d{4}\s*年)/g;
  const bad = seg => {
    const nums = seg.replace(dateMask, '◇').match(/\d+(?:[.,]\d+)?/g) || [];
    return nums.some(x=>{
      const t = x.replace(/,/g,'');
      return !allowed.has(t) && !allowed.has(String(+t));
    });
  };
  const kept = [];
  for(const para of text.split(/\n\s*\n/)){
    const out = [];
    let dangling = false; // 上一句因人名被剔除，后续代词开头的句子一并剔除
    for(const s of para.split(/(?<=[。！？!?])/)){
      const t = s.trim();
      if(!t) continue;
      const nameHit = banned.some(x=>s.includes(x));
      const pronoun = /^(他|她|他们|她们|其|该|这位|那位|此人)/.test(t);
      if(bad(s) || nameHit || (dangling && pronoun)){
        dangling = nameHit || (dangling && pronoun);
        continue;
      }
      dangling = false;
      out.push(s);
    }
    const joined = out.join('').trim();
    if(joined) kept.push(joined);
  }
  return kept.join('\n\n');
}

export function buildMessages(game, c, n){
  const s = game.state;
  const CASE = game.CASE;
  const flags = Object.keys(s.flags).filter(k=>k!=='final')
    .map(k=> (CASE.flagChips.find(f=>f[0]===k) || [k,k])[1]);
  const allowed = narrativeAllowed(game, c, n);
  const allowedList = [...allowed].sort((a,b)=>a-b).join('、');
  const monthsToLaunch = Math.max(0, s.launchMonth - s.month);

  const st = [
    `资金：${fmtMoney(s.cash)}（公司当前累计余额，不是本次决策的花费）`,
    `本次决策即时现金变化：${c.cash ? (c.cash>0?'+':'') + c.cash + 'M' : '无'}`,
    `现金跑道：${game.runway()}`,
    `月烧钱：${s.burn.toFixed(0)}M`,
    `${CASE.subsLabel}：${s.launched ? game.fmtSubs(s.subs) : '尚未上线'}`,
    `月收入：${s.launched ? (s.subs*s.arpu).toFixed(1)+'M' : '0'}`,
    `产品力：${s.product}/100`,
    `市场契合（账面）：${s.pmf}/100`,
    `${CASE.contentLabel}：${s.content}/100`,
    `团队：${s.team}/100`,
    `已触发标记：${flags.length ? flags.join('、') : '无'}`
  ];
  if(CASE.showDemand){
    st.push(`外部需求指数：×${game.demandFactor().toFixed(2)}——这是真实可触达市场的规模倍数，随外部环境变化，不受玩家决策直接控制`);
  }
  const ap = game.detectAntipatterns().map(k=>ANTIPATTERNS[k]).join('、') || '暂无明显风险';

  const stage = s.launched
    ? `产品已上线。已有用户数据以「${CASE.subsLabel}」和「月收入」两行为准，不得另行推算用户规模。`
    : `产品尚未上线（距上线还有 ${monthsToLaunch} 个月）。本阶段不存在任何用户、DAU、留存、下载、付费数据——禁止描述任何用户行为指标，只能写团队、招聘、投资人、媒体、竞品与筹备进展。`;

  const hist = c.hist
    ? `【历史对照 · 玩家重演了真实历史】${n.history}`
    : `【历史对照】玩家没有走真实历史的路线。本节不要引用真实历史中的任何人名、事件或数字。`;

  const sys = `你是「市场现实引擎」——一个冷酷、具体、不讨好的创业公司模拟器。

当前案例：${CASE.company}（${CASE.caseNo}）。

职责：根据公司当前状态和玩家刚做的决策，推演接下来 2–3 个月真实世界会发生什么。

硬性规则：
1. 【玩家决策是唯一事实来源】叙事必须以【玩家决策】所选的路线为因果起点。选了什么就只写什么的后果；玩家没选的选项、以及历史对照里的路线，一律不得写成本局发生的事。真实人物一律不得出场，只能用角色类型指代（如「一位来自流媒体平台的产品高管」）。
2. 【禁止编造数字】正文中允许出现的数字只有：${allowedList}，以及年份与月份（如 2018 年 12 月）。除此之外不得出现任何数字：不要写 DAU/MAU、留存率、转化率、下载量、内容条数、失败率、百分比、人数、天数、金额。
3. 【资金口径】资金是公司累计余额，不是本次决策的花费。不要写成「花了 X 亿买来……」，本次决策的现金变化以状态快照里那一行为准。
4. 【具体性的来源】不靠数字营造真实感，而靠：竞品动作、投资人反应、媒体口径、内部人事与招聘、采购与谈判进展。强弱一律用「偏高/偏低/勉强/严重」等定性词。
5. 不要安慰玩家，不要给建议，不要总结教训。
6. 用中文，第二人称「你」。150–260 字，分 2–3 个自然段，段间空一行。
7. 最后一段必须以「风险信号：」开头，从以下选项中挑 1–2 个：无市场需求、烧钱失控、被巨头碾压、单位经济不成立、产品问题、团队失序。
8. 纯文本，不要 Markdown 标题、列表或加粗。`;

  const user = `【时间】${n.date}
【玩家决策 · 本局唯一事实】${c.t}——${c.d}

${hist}

【阶段约束】${stage}

【公司状态快照】
${st.join('\n')}

【已积累的致命风险】${ap}

请只基于【玩家决策】推演接下来 2–3 个月真实世界会发生什么。`;

  return [{role:'system', content:sys},{role:'user', content:user}];
}

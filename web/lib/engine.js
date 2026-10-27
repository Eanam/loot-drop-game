/* ============================================================
   改命 · Startup Graveyard — 纯逻辑引擎（DOM-free）
   从 startup-graveyard.html 的 <script> 忠实移植，数值逻辑一字未改。
   用法：
     import { createGame } from './engine.js';
     const g = createGame('quibi');
     g.choose(0); g.nextNode(); ...
   每个实例独立持有状态（非单例），balance 脚本可并行多实例。
   ============================================================ */

import { CASES, ANTIPATTERNS } from './cases/index.js';

export { CASES, ANTIPATTERNS };

export const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

export function fmtMoney(m){
  const abs = Math.abs(m);
  if(abs >= 1000) return '$' + (m/1000).toFixed(2) + 'B';
  return '$' + Math.round(m) + 'M';
}

export function fmtSubsShort(v, unit){ return (v).toFixed(1) + unit; }

export function createGame(caseId){
  const CASE = CASES[caseId];
  if(!CASE) throw new Error('未知案例：' + caseId);
  const NODES = CASE.nodes;
  const REAL = CASE.real;

  let S = null;
  let nodeIndex = 0;
  let phase = 'choice'; // choice | result
  let lastChoice = null;

  /* ============================================================
     状态与模拟
     ============================================================ */

  function newState(){
    const i = CASE.initial;
    return {
      cash: i.cash, product: i.product, pmf: i.pmf, content: i.content, team: i.team,
      subs: 0, month: 0, burn: i.burn, arpu: CASE.arpu,
      launched: false, launchMonth: CASE.launchMonth,
      flags: {}, flagSrc: {}, dead: false, gameOver: false, history: []
    };
  }

  function condHolds(when){ return when.startsWith('!') ? !S.flags[when.slice(1)] : !!S.flags[when]; }

  /* 生效选项：原始选项 + swap 条件替换 + mods 数值传导（加法式，多个匹配可叠加） */
  function effectiveChoices(n){
    let list = n.choices.slice();
    (n.swap || []).forEach(sw=>{
      if(condHolds(sw.when)) list[sw.index] = Object.assign({_swapped:true, _chip:sw.chip, _src:(sw.when[0]==='!'?null:sw.when)}, sw.choice);
    });
    return list.map(c=>{
      if(!c.mods) return c;
      const hit = c.mods.filter(m=>condHolds(m.when));
      if(!hit.length) return c;
      const out = Object.assign({}, c, {_modded:true, _src:(hit[0].when[0]==='!'?null:hit[0].when)});
      hit.forEach(m=>{
        ['cash','burn','product','pmf','content','team'].forEach(k=>{
          if(typeof m[k]==='number') out[k] = (out[k]||0) + m[k];
        });
        if(m.note) out.note = m.note;
      });
      return out;
    });
  }

  function chainChip(c){
    if(!c._swapped && !c._modded) return '';
    if(c._chip) return c._chip;
    const src = c._src && S.flagSrc[c._src];
    return src ? `承接 ${src.date}「${src.t}」` : '受此前决策影响';
  }

  /* 生效节点：variants 命中时整节点替换（日期槽位锁死不变；内容由 LLM 起草、人审固化） */
  function activeNode(i){
    const base = NODES[i === undefined ? nodeIndex : i];
    if(!base.variants) return base;
    const v = base.variants.find(v=>condHolds(v.when));
    if(!v) return base;
    return Object.assign({}, base, v, {_variant:true});
  }

  /* 承接句：节点定义了 bridge 模板就用（{prev}=上轮选择），否则按局势规则兜底 */
  function bridgeLine(n){
    const h = S.history[S.history.length - 1];
    if(!h) return '';
    if(n.bridge) return n.bridge.replaceAll('{prev}', h.t);
    const rev = S.subs * S.arpu;
    let clause = '';
    if(S.launched && rev >= S.burn) clause = '收入第一次盖过了烧钱，董事会的语气变了。';
    else if(S.cash < CASE.burnAlert) clause = '账上的钱，已经让 CFO 开始按周汇报。';
    else if(S.launched && S.subs < CASE.narr.low) clause = '用户来了又走，留存是眼下最刺眼的问题。';
    else if(CASE.showDemand && demandFactor() < 0.9) clause = '外部需求还在退潮，你比谁都清楚这意味着什么。';
    else if(!S.launched) clause = '产品还没上线，一切都还只是计划。';
    return `上一轮，你选择了「${h.t}」。${clause}`;
  }

  function applyChoice(c){
    const s = S;
    if(c.cash) s.cash += c.cash;
    if(c.product) s.product = clamp(s.product + c.product, 0, 100);
    if(c.pmf) s.pmf = clamp(s.pmf + c.pmf, 0, 100);
    if(c.content) s.content = clamp(s.content + c.content, 0, 100);
    if(c.team) s.team = clamp(s.team + c.team, 0, 100);
    if(c.burn) s.burn = Math.max(CASE.minBurn, s.burn + c.burn);
    if(c.priceBoost) s.flags.priceBoost = true;
    if(c.flag){ s.flags[c.flag] = true;
      if(!s.flagSrc[c.flag]) s.flagSrc[c.flag] = {date: NODES[nodeIndex].date, t: c.t}; }
    if(c.final) s.flags.final = c.final;
  }

  function demandFactor(){
    return CASE.demand(S.month, S.flags);
  }

  function effectivePmf(){
    return clamp(S.pmf * Math.min(1.05, demandFactor()), 0, 100);
  }

  function targetSubs(){
    const s = S;
    const core = CASE.maxSubs * (s.pmf/100) * (s.product/100) * (0.5 + s.content/100);
    return Math.max(0.01, (CASE.baseSubs + core) * CASE.modifiers(s) * demandFactor());
  }

  function advanceTo(targetMonth){
    const s = S;
    while(s.month < targetMonth){
      s.month++;
      if(!s.launched && s.month >= s.launchMonth){
        s.launched = true;
        s.burn += CASE.launchBurn; // 上线后营销与客服成本
      }
      s.cash -= s.burn;
      if(s.launched){
        const t = targetSubs();
        s.subs += (t - s.subs) * 0.35;
        s.cash += s.subs * s.arpu; // ARPU 由案例定义
      }
      if(s.month % 3 === 0) s.cash -= CASE.quarterlyCost;
      if(s.cash <= 0){ s.cash = 0; s.dead = true; break; }
    }
  }

  /* ============================================================
     反模式检测
     ============================================================ */

  function detectAntipatterns(){
    const s = S;
    const out = [];
    if(s.launched && effectivePmf() < 30) out.push('nomarket');
    if(s.cash < CASE.burnAlert) out.push('burn');
    if(s.flags.noTV && s.launched) out.push('crushed');
    if(s.launched && s.subs * s.arpu < s.burn) out.push('unit');
    if(s.product < 42) out.push('product');
    if(s.team < 42) out.push('team');
    return out;
  }

  /* ============================================================
     推演叙事引擎（规则驱动，可替换为 LLM）
     ============================================================ */

  function composeNarrative(c){
    const s = S;
    const n = CASE.narr;
    const paras = [];

    // 1. 决策回声
    paras.push({cls:'', text:`你选择了「${c.t}」。${c.note || ''}市场不会立刻给你答案，但它会用数据投票。`});

    // 2. 状态观察
    const obs = [];
    if(!s.launched){
      if(s.cash > n.cashHigh) obs.push('账上弹药充足，你有犯错的空间——但每次犯错都在把这个空间变小。');
      else if(s.cash > n.cashMid) obs.push('现金还能撑一年多，董事会开始盯住每一个季度的里程碑。');
      else obs.push('现金跑道正在缩短，CFO 已经开始按周汇报。');
      if(s.content > n.contentNote) obs.push(`你手里握着一个 ${s.content} 分的${CASE.contentLabel}，但它还没有找到要喂给谁。`);
    } else {
      const rev = s.subs * s.arpu;
      if(s.subs < n.low) obs.push(`${CASE.subsLabel}停在 <b>${fmtSubs(s.subs)}</b>，后台 7 日留存只有两成出头——用户来了，但没有留下。`);
      else if(s.subs < n.mid) obs.push(`${CASE.subsLabel}爬到 <b>${fmtSubs(s.subs)}</b>，曲线是正的，但斜率还撑不起这个成本结构。`);
      else obs.push(`${CASE.subsLabel}达到 <b>${fmtSubs(s.subs)}</b>，增长开始有复利的样子。`);
      if(rev < s.burn) obs.push(`月收入约 ${rev.toFixed(1)}M，月烧钱 ${s.burn.toFixed(0)}M——单位经济仍然是倒挂的，你每多一个客户就多亏一点。`);
      else obs.push(`月收入已覆盖烧钱（${rev.toFixed(1)}M vs ${s.burn.toFixed(0)}M）——这是这家公司第一次不靠融资活着。`);
      if(CASE.showDemand){
        const d = demandFactor();
        if(d < 0.9) obs.push(`外部需求指数已降到 <b>×${d.toFixed(2)}</b>：愿意为线上活动付钱的人，正在变少。你没有做错什么，但市场在退潮。`);
        else obs.push(`外部需求指数为 <b>×${d.toFixed(2)}</b>：疫情红利还在，但没有人知道它还剩几个月。`);
      }
    }

    // 3. 标记回声
    CASE.flagNarr.forEach(([k,txt])=>{ if(s.flags[k]) obs.push(txt); });

    paras.push({cls:'', text:obs.join(' ')});

    // 4. 风险预警
    const risks = detectAntipatterns();
    if(risks.length){
      paras.push({cls:'risk', text:`<b>风险信号：</b>${risks.map(k=>ANTIPATTERNS[k]).join(' · ')}。这些正是 loot-drop 尸检库里最高频的死因。`});
    }

    // 5. 下一步压力
    const next = NODES[nodeIndex + 1];
    if(next){
      paras.push({cls:'', text:`${next.date}，你将面对「${next.title}」。`});
    }

    return paras;
  }

  /* ============================================================
     格式化 / 派生读数
     ============================================================ */

  function fmtSubs(v){
    if(CASE.subsUnit === 'M') return v < 0.1 ? '不足 10 万' : v.toFixed(1) + 'M';
    return v < 0.5 ? '不足 500' : v.toFixed(1) + 'K';
  }

  function runway(){
    if(S.cash <= 0) return '0 个月';
    if(!S.launched){
      if(S.burn <= 0) return '—';
      const m0 = Math.round(S.cash / S.burn);
      return (m0 > 60 ? '60+ 个月' : Math.max(1, m0) + ' 个月') + '（未上线）';
    }
    const net = S.burn - S.subs*S.arpu;
    if(net <= 0) return '∞（已盈利）';
    const months = Math.round(S.cash / net);
    if(months > 60) return '60+ 个月（接近盈亏平衡）';
    return Math.max(1, months) + ' 个月';
  }

  function dateOf(month){
    const base = CASE.startMonth + month;
    const y = CASE.startYear + Math.floor(base/12);
    const m = (base%12) + 1;
    return `${y}.${String(m).padStart(2,'0')}`;
  }

  /* ============================================================
     结局
     ============================================================ */

  function computeScore(){
    const s = S;
    const sc = CASE.score;
    let score = 0;
    score += Math.min(s.subs/sc.subsDiv, 1) * 50;
    score += Math.min(Math.max(s.month - sc.horizon, 0)/sc.span, 1) * 15;
    score += Math.min(Math.max(s.cash,0)/sc.cashDiv, 1) * 13;
    score += (effectivePmf()/100) * 22;
    if(s.dead) score = Math.min(score, 20);
    return Math.round(clamp(score, 0, 100));
  }

  function gradeOf(score){
    if(score >= 68) return {cls:'g3', name:'改命成功', sub:'你让这家公司活成了另一家公司'};
    if(score >= 35) return {cls:'g2', name:'部分改命', sub:'你改变了轨迹，但没能改变结局的方向'};
    if(score >= 20) return {cls:'g1', name:'延缓死亡', sub:'你让它多活了几天，但没能给它一条命'};
    return {cls:'g0', name:'历史重演', sub:'同样的错误，同样的墓志铭'};
  }

  /* 提供给案例 compare/ending 的辅助函数（原 HTML 里它们是全局函数） */
  function helpers(){
    return { fmtMoney, fmtSubs, fmtSubsShort, dateOf, effectivePmf };
  }

  function endingText(score){ return CASE.ending(S, score, helpers()); }
  function compareRows(score){ return CASE.compare(S, score, helpers()); }

  /* ============================================================
     行动
     ============================================================ */

  /* 作用于生效选项下标；返回渲染结果视图所需的全部信息（未生效时返回 null） */
  function choose(i){
    if(phase !== 'choice') return null;
    const n = activeNode();
    const c = effectiveChoices(n)[i];
    if(!c) return null;

    lastChoice = c;
    const beforeCash = S.cash, beforeMonth = S.month;
    S.history.push({idx: nodeIndex, ci: i, t: c.t, hist: !!c.hist, nt: n.title, pv: n.pivotal, variant: !!n._variant});
    applyChoice(c);
    phase = 'result';

    // 时间推进：先到本节点的下一节点时间
    const nextNodeDef = NODES[nodeIndex + 1];
    const targetMonth = nextNodeDef ? nextNodeDef.month : CASE.totalMonths;
    advanceTo(targetMonth);

    const meta = {
      months: S.month - beforeMonth,
      ops: S.cash - beforeCash - (c.cash || 0)
    };

    return {
      node: n, choice: c, meta, state: S,
      dead: S.dead,
      last: nodeIndex >= NODES.length - 1,
      next: (!S.dead && nodeIndex < NODES.length - 1) ? activeNode(nodeIndex + 1) : null
    };
  }

  function nextNode(){
    nodeIndex++;
    phase = 'choice';
    return activeNode();
  }

  S = newState();

  return {
    CASE, NODES, REAL,
    get state(){ return S; },
    get nodeIndex(){ return nodeIndex; },
    get phase(){ return phase; },
    get lastChoice(){ return lastChoice; },
    newState, condHolds, effectiveChoices, chainChip, activeNode, bridgeLine,
    applyChoice, demandFactor, effectivePmf, targetSubs, advanceTo,
    detectAntipatterns, composeNarrative,
    fmtMoney, fmtSubs, fmtSubsShort, runway, dateOf,
    computeScore, gradeOf, helpers, endingText, compareRows,
    choose, nextNode
  };
}

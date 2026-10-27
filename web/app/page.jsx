'use client';

/* ============================================================
   改命 · Startup Graveyard — React 重实现
   视觉与交互与 startup-graveyard.html 一致；
   所有数值由 web/lib/engine.js 计算，LLM 只生成叙事。
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import { createGame, fmtMoney } from '../lib/engine.js';
import { CASES, ANTIPATTERNS } from '../lib/cases/index.js';
import { buildMessages, narrativeAllowed, bannedPeople, sanitizeNarrative } from '../lib/prompt.js';

const PRESETS = {
  agnes:{base:'https://apihub.agnes-ai.com/v1', model:'agnes-2.5-flash'},
  deepseek:{base:'https://api.deepseek.com/v1', model:'deepseek-chat'},
  openai:{base:'https://api.openai.com/v1', model:'gpt-4o-mini'},
  moonshot:{base:'https://api.moonshot.cn/v1', model:'moonshot-v1-8k'},
  qwen:{base:'https://dashscope.aliyuncs.com/compatible-mode/v1', model:'qwen-plus'},
  zhipu:{base:'https://open.bigmodel.cn/api/paas/v4', model:'glm-4-flash'},
  custom:{base:'', model:''}
};

const LLM_DEFAULT = {
  mode:'off',        // proxy | direct | off
  base:'https://api.deepseek.com/v1',
  model:'deepseek-chat',
  key:'',
  proxyOk:false,
  lastError:''
};

export default function Page(){
  const [screen, setScreen] = useState('intro'); // intro | game | ending
  const gameRef = useRef(null);
  const [, setTick] = useState(0);
  const [result, setResult] = useState(null);    // choose() 的返回，供结果视图渲染
  const [narr, setNarr] = useState({status:'idle'});
  const narrSeq = useRef(0);
  const [llm, setLlm] = useState(LLM_DEFAULT);
  const [probed, setProbed] = useState(false);
  const llmRef = useRef(llm);
  llmRef.current = llm;

  const rerender = () => setTick(t => t + 1);

  /* ---------- 启动：读取配置 + 探测代理 ---------- */
  useEffect(()=>{
    let saved = null, savedRaw = null;
    try{
      savedRaw = localStorage.getItem('sg_llm_cfg') || localStorage.getItem('quibi_llm_cfg');
      saved = savedRaw ? JSON.parse(savedRaw) : null;
    }catch(e){}
    if(saved){
      setLlm(prev => ({
        ...prev,
        mode: saved.mode || prev.mode,
        base: saved.base || prev.base,
        model: saved.model || prev.model,
        key: saved.key || prev.key
      }));
    }
    (async ()=>{
      let ok = false, j = null;
      try{
        const r = await fetch('/api/health', {cache:'no-store'});
        if(r.ok){ j = await r.json(); ok = !!j.configured; }
      }catch(e){}
      setLlm(prev => {
        const next = {...prev, proxyOk: ok};
        if(ok){
          if(j.model) next.model = j.model;
          if(j.base) next.base = j.base;
          // 首次访问默认用代理；已保存过偏好则尊重用户选择
          if(!savedRaw) next.mode = 'proxy';
        }else if(next.mode === 'proxy'){
          next.mode = 'off';
        }
        return next;
      });
      setProbed(true);
    })();
  }, []);

  /* ---------- 键盘：1/2/3 选择 ---------- */
  useEffect(()=>{
    const onKey = e => {
      const g = gameRef.current;
      if(!g || screen !== 'game' || g.phase !== 'choice') return;
      const k = parseInt(e.key, 10);
      if(k >= 1 && k <= 3) choose(k - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  /* ---------- LLM 状态派生 ---------- */
  function aiReady(){
    const L = llmRef.current;
    if(L.mode === 'proxy') return L.proxyOk;
    if(L.mode === 'direct') return !!L.key && !!L.base && !!L.model;
    return false;
  }
  function engineLabel(){
    const L = llmRef.current;
    return L.mode === 'off' ? '市场现实 · 本地推演'
      : L.mode === 'proxy' ? '市场现实 · LLM 推演（本地代理）'
      : '市场现实 · LLM 推演（直连）';
  }

  /* ---------- LLM 调用 ---------- */
  async function callLLM(messages, onDelta){
    const L = llmRef.current;
    const ctrl = new AbortController();
    const timer = setTimeout(()=>ctrl.abort(), 60000);
    let url, headers = {'Content-Type':'application/json'}, body;

    if(L.mode === 'proxy'){
      url = '/api/chat';
      body = {messages, temperature:0.85, max_tokens:1600};
    }else{
      url = L.base.replace(/\/+$/,'') + '/chat/completions';
      headers['Authorization'] = 'Bearer ' + L.key;
      body = {model:L.model, messages, stream:true, temperature:0.85, max_tokens:1600};
    }

    let res;
    try{
      res = await fetch(url, {method:'POST', headers, body:JSON.stringify(body), signal:ctrl.signal});
    }catch(err){
      clearTimeout(timer);
      throw new Error(err.name === 'AbortError' ? '请求超时' : '网络请求失败（可能是 CORS 或地址错误）');
    }
    clearTimeout(timer);

    if(!res.ok){
      let msg = 'HTTP ' + res.status;
      try{
        const j = await res.json();
        const e = j.error;
        if(typeof e === 'string') msg = e;
        else if(e && e.message) msg = e.message;
        else if(j.message) msg = j.message;
      }catch(e){}
      throw new Error(msg);
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while(true){
      const {done, value} = await reader.read();
      if(done) break;
      buf += dec.decode(value, {stream:true});
      const lines = buf.split('\n');
      buf = lines.pop();
      for(const line of lines){
        const t = line.trim();
        if(!t.startsWith('data:')) continue;
        const d = t.slice(5).trim();
        if(!d || d === '[DONE]') continue;
        try{
          const j = JSON.parse(d);
          const delta = j.choices?.[0]?.delta?.content;
          if(delta) onDelta(delta);
        }catch(e){}
      }
    }
    // 兼容非流式响应
    if(buf.trim().startsWith('{')){
      try{
        const j = JSON.parse(buf);
        const txt = j.choices?.[0]?.message?.content;
        if(txt) onDelta(txt);
      }catch(e){}
    }
  }

  /* ---------- 叙事生成（流式 + 本地兜底） ---------- */
  async function runNarrative(c, n){
    const g = gameRef.current;
    const seq = ++narrSeq.current;

    if(!aiReady()){
      setNarr({status:'rule', paras: g.composeNarrative(c), err: null});
      return;
    }

    setNarr({status:'thinking'});

    let acc = '';
    let started = false;
    let canPaint = false;
    const allowed = narrativeAllowed(g, c, n);

    // 让「正在推演」至少可见 420ms，避免首字到达太快造成闪烁
    const gate = setTimeout(()=>{
      canPaint = true;
      if(acc && !started && seq === narrSeq.current){
        started = true;
        setNarr({status:'stream', text: acc});
      }
    }, 420);

    try{
      await callLLM(buildMessages(g, c, n), delta=>{
        acc += delta;
        if(!canPaint || seq !== narrSeq.current) return;
        if(!started) started = true;
        setNarr({status:'stream', text: acc});
      });
      clearTimeout(gate);
      if(seq !== narrSeq.current) return;
      if(!acc.trim()) throw new Error('模型返回空内容');
      const clean = sanitizeNarrative(acc, allowed, bannedPeople(g, c, n));
      if(!clean.trim()) throw new Error('叙述与当前状态不符，已拦截');
      setNarr({status:'done', text: clean});
    }catch(err){
      clearTimeout(gate);
      if(seq !== narrSeq.current) return;
      setLlm(prev => ({...prev, lastError: err.message}));
      setNarr({status:'rule', paras: g.composeNarrative(c), err: err.message});
    }
  }

  /* ---------- 行动 ---------- */
  function startGame(caseId){
    gameRef.current = createGame(caseId);
    setResult(null);
    setNarr({status:'idle'});
    setScreen('game');
    rerender();
    if(typeof window !== 'undefined') window.scrollTo({top:0, behavior:'smooth'});
  }

  function choose(i){
    const g = gameRef.current;
    if(!g) return;
    const res = g.choose(i);
    if(!res) return;
    setResult(res);
    rerender();
    runNarrative(res.choice, res.node);
  }

  function nextNode(){
    const g = gameRef.current;
    if(!g) return;
    g.nextNode();
    setResult(null);
    setNarr({status:'idle'});
    rerender();
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function showEnding(){
    setScreen('ending');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function restart(){
    setScreen('intro');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  /* ---------- 设置面板状态 ---------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [draftMode, setDraftMode] = useState('proxy');
  const [preset, setPreset] = useState('deepseek');
  const [modalStatus, setModalStatus] = useState(null); // {kind:'ok'|'err', text}
  const [proxyStatus, setProxyStatus] = useState(null); // {kind, text} | null=检测中
  const baseRef = useRef(null), modelRef = useRef(null), keyRef = useRef(null);

  function openSettings(){
    const L = llmRef.current;
    setDraftMode(L.mode);
    setModalStatus(null);
    setModalOpen(true);
    if(L.mode === 'proxy') refreshProxyStatus();
  }
  function closeSettings(){ setModalOpen(false); }

  function applyPresetValue(k){
    setPreset(k);
    if(PRESETS[k] && PRESETS[k].base){
      if(baseRef.current) baseRef.current.value = PRESETS[k].base;
      if(modelRef.current) modelRef.current.value = PRESETS[k].model;
    }
  }

  async function refreshProxyStatus(){
    setProxyStatus(null);
    let ok = false, j = null;
    try{
      const r = await fetch('/api/health', {cache:'no-store'});
      if(r.ok){ j = await r.json(); ok = !!j.configured; }
    }catch(e){}
    setLlm(prev => {
      const next = {...prev, proxyOk: ok};
      if(ok){ if(j.model) next.model = j.model; if(j.base) next.base = j.base; }
      return next;
    });
    setProxyStatus(ok
      ? {kind:'ok', text:`已连接服务端代理 · 模型 ${j.model}`}
      : {kind:'err', text:'未检测到服务端代理配置。请在启动服务前设置环境变量 LLM_API_KEY。'});
  }

  function persistLLMConfig(L){
    try{
      localStorage.setItem('sg_llm_cfg', JSON.stringify({
        mode: L.mode, base: L.base, model: L.model,
        key: L.mode === 'direct' ? L.key : ''
      }));
    }catch(e){}
  }

  function saveSettings(){
    const L = {...llmRef.current, mode: draftMode};
    if(draftMode === 'direct'){
      L.base = (baseRef.current?.value || '').trim();
      L.model = (modelRef.current?.value || '').trim();
      L.key = (keyRef.current?.value || '').trim();
    }
    setLlm(L);
    persistLLMConfig(L);
    const ready = L.mode === 'proxy' ? L.proxyOk
      : L.mode === 'direct' ? !!(L.key && L.base && L.model) : false;
    if(draftMode === 'direct'){
      setModalStatus(ready
        ? {kind:'ok', text:'已保存。下一阶段将使用直连 API 推演。'}
        : {kind:'err', text:'直连配置不完整，将回退到本地引擎。'});
    }else if(draftMode === 'proxy' && !L.proxyOk){
      setModalStatus({kind:'err', text:'未检测到代理，将回退到本地引擎。'});
    }
    setTimeout(closeSettings, 900);
  }

  /* ============================================================
     渲染
     ============================================================ */

  const g = gameRef.current;
  const inGame = screen !== 'intro' && g;
  const pillReady = probed && aiReady();
  const pillText = !probed ? 'AI · 检测中…' : pillReady ? 'AI · 已接入' : 'AI · 本地引擎';

  return (
    <>
      <header>
        <div className="wrap head-row">
          <div className="brand">
            <div className="skull">💀</div>
            <div>
              <h1>改命 <span>{inGame ? g.CASE.brandCase : ''}</span></h1>
              <div className="sub">{inGame ? g.CASE.brandSub : 'Startup Rebuild · 选择一个案例'}</div>
            </div>
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <button className={'btn' + (pillReady ? ' acid' : '')} onClick={openSettings}>{pillText}</button>
            <button className="btn" onClick={restart}>重新开始</button>
          </div>
        </div>
      </header>

      <div className="wrap">
        {screen === 'game' && g && <GameLayout g={g} result={result} narr={narr}
          engineLabel={engineLabel()} onChoose={choose} onNext={nextNode} onEnding={showEnding} />}
        {screen === 'intro' && <IntroScreen onStart={startGame} />}
        {screen === 'ending' && g && <EndingScreen g={g} onRestart={()=>startGame(g.CASE.id)} onIntro={restart} />}
      </div>

      <footer className="wrap">
        基于 loot-drop.io 创业墓地公开资料改编的教育性模拟游戏原型 · 财务模型为简化估算，非真实经营建议 · 推演叙事可由任意 OpenAI 兼容 LLM 生成，但所有数值始终由本地规则计算
      </footer>

      {modalOpen && (
        <div className="modal" onClick={e=>{ if(e.target === e.currentTarget) closeSettings(); }}>
          <div className="modal-box">
            <h3>AI 推演引擎</h3>
            <p className="modal-sub">数字由游戏规则计算，LLM 只负责生成下一阶段的市场叙事，永远不会改动财务与状态数值。</p>

            <div className="seg">
              {[['proxy','服务端代理（推荐）'],['direct','浏览器直连'],['off','关闭']].map(([m, label])=>(
                <button key={m} className={draftMode === m ? 'on' : ''} onClick={()=>{
                  setDraftMode(m);
                  setModalStatus(null);
                  if(m === 'proxy') refreshProxyStatus();
                }}>{label}</button>
              ))}
            </div>

            {draftMode === 'proxy' && (
              <div>
                <div className={'modal-status' + (proxyStatus ? ' ' + proxyStatus.kind : '')}>
                  {proxyStatus ? proxyStatus.text : '正在检测服务端代理…'}
                </div>
                <p className="field tip" style={{marginBottom:14}}>
                  在启动 Next.js 服务前设置环境变量 <code>LLM_API_KEY</code>（可选 <code>LLM_BASE_URL</code> / <code>LLM_MODEL</code>）。API Key 只存在服务端，不会进入浏览器。
                </p>
              </div>
            )}

            {draftMode === 'direct' && (
              <div>
                <div className="field">
                  <label>服务商预设</label>
                  <select value={preset} onChange={e=>applyPresetValue(e.target.value)}>
                    <option value="agnes">Agnes（免费）</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="openai">OpenAI</option>
                    <option value="moonshot">Moonshot</option>
                    <option value="qwen">通义千问</option>
                    <option value="zhipu">智谱 GLM</option>
                    <option value="custom">自定义</option>
                  </select>
                </div>
                <div className="field">
                  <label>Base URL</label>
                  <input ref={baseRef} type="text" placeholder="https://api.deepseek.com/v1" defaultValue={llm.base} />
                </div>
                <div className="field">
                  <label>模型</label>
                  <input ref={modelRef} type="text" placeholder="deepseek-chat" defaultValue={llm.model} />
                </div>
                <div className="field">
                  <label>API Key</label>
                  <input ref={keyRef} type="password" placeholder="sk-..." defaultValue={llm.key} />
                  <div className="tip">仅保存在本机浏览器 localStorage。若服务端支持 CORS 才可用；否则请用服务端代理。</div>
                </div>
              </div>
            )}

            {modalStatus && (
              <div className={'modal-status ' + modalStatus.kind}>{modalStatus.text}</div>
            )}

            <div className="modal-actions">
              <button className="btn" onClick={closeSettings}>取消</button>
              <button className="btn acid" onClick={saveSettings}>保存</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   案例选择屏
   ============================================================ */

function IntroScreen({ onStart }){
  return (
    <div className="screen reveal">
      <div className="hero-eyebrow">STARTUP REBUILD · 重生模式</div>
      <h1 className="hero-title">你能救活<br /><span className="strike">一个死掉的</span>公司吗？</h1>
      <p className="hero-sub">
        从 loot-drop 的创业墓地里挑一具尸体，回到它死前的关键节点，试着改变结局。
        <br /><br />
        两个案例，两种完全不同的死法——一个死于<b>没有需求</b>，一个死于<b>需求消失</b>。
      </p>
      <div className="case-grid">
        {Object.values(CASES).map(c=>(
          <button key={c.id} className="case-card" onClick={()=>onStart(c.id)}>
            <div className="cc-no">{c.caseNo}</div>
            <div className="cc-go">进入 →</div>
            <div className="cc-name">{c.company}</div>
            <div className="cc-sub">{c.tagline}</div>
            <div className="cc-meta">
              {c.intro.facts.map((f, i)=>(
                <div key={i}><b dangerouslySetInnerHTML={{__html: f[0]}} />{f[1]}</div>
              ))}
            </div>
          </button>
        ))}
      </div>
      <div className="rules">
        <div><span className="num">01</span>每个节点 <b>三选一</b>。选项没有标准答案——只有当时的合理性与事后的代价。</div>
        <div><span className="num">02</span>决策后，<b>市场推演引擎</b>会根据公司状态生成下一阶段的现实反馈。</div>
        <div><span className="num">03</span>结局按 <b>改命度</b> 评分：用户、存活时长、剩余资本、真实市场契合。</div>
      </div>
      <p className="fineprint">
        本作是「重生模式」的可玩原型：用真实死因数据构造决策节点，用规则引擎计算所有数值。
        推演叙事默认由本地引擎生成；点击右上角「AI」可接入任意 OpenAI 兼容 LLM（通过服务端代理转发，Key 不进入浏览器）。
        无论接入哪种模型，财务与状态数值始终由本地规则计算，AI 无法改动。
      </p>
    </div>
  );
}

/* ============================================================
   游戏主界面：stage + 侧边 dashboard
   ============================================================ */

function GameLayout({ g, result, narr, engineLabel, onChoose, onNext, onEnding }){
  const s = g.state;
  const CASE = g.CASE;
  const NODES = g.NODES;
  const nodeIndex = g.nodeIndex;

  /* ---- dashboard 数据 ---- */
  const stats = [
    {n:'产品力', v:s.product},
    {n:'市场契合', v:s.pmf},
    {n:CASE.contentLabel, v:s.content},
    {n:'团队', v:s.team}
  ];
  const d = g.demandFactor();
  const rev = s.subs * s.arpu;
  const fl = CASE.flagChips.filter(f=>s.flags[f[0]]);

  return (
    <div className="layout">
      <aside>
        <div className="card">
          <div className="card-title">公司状态</div>
          <div>
            {stats.map(st=>{
              const cls = st.v < 30 ? 'crit' : st.v < 55 ? 'warn' : '';
              return (
                <div className="stat" key={st.n}>
                  <div className="stat-top"><span className="stat-name">{st.n}</span><span className="stat-val">{st.v}</span></div>
                  <div className="bar"><i className={cls} style={{width: st.v + '%'}} /></div>
                </div>
              );
            })}
          </div>
          <div className="kpi">
            <div className="kpi-row"><span className="k">资金</span><span className="v" style={{color: s.cash < CASE.burnAlert ? 'var(--blood)' : 'var(--bone)'}}>{fmtMoney(s.cash)}</span></div>
            <div className="kpi-row"><span className="k">现金跑道</span><span className="v">{g.runway()}</span></div>
            <div className="kpi-row"><span className="k">{CASE.subsLabel}</span><span className="v">{s.launched ? g.fmtSubs(s.subs) : '未上线'}</span></div>
            <div className="kpi-row"><span className="k">月收入</span><span className="v" style={{color: s.launched && rev >= s.burn ? 'var(--acid)' : 'var(--bone)'}}>{s.launched ? '$' + rev.toFixed(1) + 'M' : '—'}</span></div>
            <div className="kpi-row"><span className="k">月烧钱</span><span className="v">{s.burn.toFixed(0)}M</span></div>
            {CASE.showDemand && (
              <div className="kpi-row"><span className="k">外部需求</span><span className="v" style={{color: d < 0.7 ? 'var(--blood)' : d < 0.95 ? 'var(--gold)' : 'var(--bone)'}}>×{d.toFixed(2)}</span></div>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-title">{CASE.trackTitle}</div>
          <div className="track">
            {NODES.map((_, i)=>{
              const done = i < nodeIndex, now = i === nodeIndex;
              return (
                <span key={i} style={{display:'contents'}}>
                  <div className={'dot' + (done ? ' done' : '') + (now ? ' now' : '')}></div>
                  {i < NODES.length - 1 && <div className={'seg' + (done ? ' done' : '')}></div>}
                </span>
              );
            })}
          </div>
          <div className="track-labels">
            {CASE.trackLabels.map((t, i)=><span key={i}>{t}</span>)}
          </div>
        </div>
        <div className="card">
          <div className="card-title">已触发标记</div>
          <div style={{fontSize:12, color:'#555'}}>
            {fl.length
              ? fl.map(f=><span key={f[0]} className={'flag ' + f[2]}>{f[1]}</span>)
              : <span style={{color:'#555'}}>暂无</span>}
          </div>
        </div>
      </aside>
      <main>
        {g.phase === 'choice'
          ? <NodeView g={g} onChoose={onChoose} />
          : result && <ResultView g={g} result={result} narr={narr} engineLabel={engineLabel} onNext={onNext} onEnding={onEnding} />}
      </main>
    </div>
  );
}

/* ---------- 决策节点 ---------- */

function NodeView({ g, onChoose }){
  const n = g.activeNode();
  const bridge = g.bridgeLine(n);
  const CASE = g.CASE;

  return (
    <div className="reveal">
      <div className="date-tag">
        {n.date}{n._variant && <> · <span style={{color:'var(--gold)'}}>⤷ 局面已因你的选择改变</span></>}
      </div>
      <h2 className="node-title">{n.title}</h2>
      {bridge && <div className="bridge">{bridge}</div>}
      <p className="brief">{n.brief}</p>
      <div className="choices">
        {g.effectiveChoices(n).map((c, i)=>{
          const marks = [];
          if(c.cash) marks.push(<span key="cash" className={'mk ' + (c.cash > 0 ? 'up' : 'dn')}>资金 {c.cash > 0 ? '+' : ''}{c.cash}M</span>);
          if(c.content) marks.push(<span key="content" className="mk up">{CASE.contentLabel} +{c.content}</span>);
          if(c.product) marks.push(<span key="product" className={'mk ' + (c.product > 0 ? 'up' : 'dn')}>产品 {c.product > 0 ? '+' : ''}{c.product}</span>);
          if(c.pmf) marks.push(<span key="pmf" className={'mk ' + (c.pmf > 0 ? 'up' : 'dn')}>市场契合 {c.pmf > 0 ? '+' : ''}{c.pmf}</span>);
          if(c.team) marks.push(<span key="team" className={'mk ' + (c.team > 0 ? 'up' : 'dn')}>团队 {c.team > 0 ? '+' : ''}{c.team}</span>);
          const chip = g.chainChip(c);
          return (
            <button className="choice" key={i} onClick={()=>onChoose(i)}>
              <div className="tag">{c.tag || ''}</div>
              <div className="ct"><span className="idx">{String(i + 1).padStart(2, '0')}</span>{c.t}</div>
              <div className="cd">{c.d}</div>
              {marks.length > 0 && <div className="marks">{marks}</div>}
              {chip && <div><span className="chain">⤷ {chip}</span></div>}
            </button>
          );
        })}
      </div>
      <p className="hint" style={{marginTop:16, fontSize:11, color:'#666', lineHeight:1.7}}>
        按 1 / 2 / 3 也可以选择 · 牌面数值是<b style={{color:'#9a9a9a'}}>决策即时效果</b>，阶段烧钱会在选择后结算
      </p>
    </div>
  );
}

/* ---------- 结果视图（含 LLM 流式叙事区） ---------- */

function ResultView({ g, result, narr, engineLabel, onNext, onEnding }){
  const {node: n, choice: c, meta} = result;
  const s = g.state;

  return (
    <div className="reveal">
      <div className="date-tag">{n.date} · 决策已生效</div>
      <div className="chosen">
        <div className="lbl">你的选择</div>
        <div className="val">{c.t}</div>
      </div>
      <div className="phase-note">
        ⏱ 推进 {meta.months} 个月
        {c.cash ? ` · 决策即时${c.cash > 0 ? '进账' : '支出'} ${c.cash > 0 ? '+' : ''}${c.cash}M` : ''}
        {meta.ops ? ` · 期间运营净支出 ${meta.ops < 0 ? '-' : '+'}${Math.abs(Math.round(meta.ops))}M（烧钱与订阅收入相抵）` : ''}
      </div>

      <div className="agent">
        <div className="agent-head"><div className="pulse"></div><span>{engineLabel}</span></div>
        <AgentBody narr={narr} />
      </div>

      <div className="history">
        <div className="hl">💀 历史上，这一步真实发生了什么</div>
        <p>{n.history}</p>
      </div>

      {s.dead ? (
        <div className="next-row">
          <span className="hint">现金耗尽，公司提前死亡</span>
          <button className="btn acid" onClick={onEnding}>查看结局 →</button>
        </div>
      ) : result.last ? (
        <div className="next-row">
          <span className="hint">{g.CASE.totalMonths} 个月走完了</span>
          <button className="btn acid" onClick={onEnding}>查看结局 →</button>
        </div>
      ) : (
        <div className="next-row">
          <span className="hint">下一站：{result.next.date} {result.next.title}</span>
          <button className="btn acid" onClick={onNext}>继续 →</button>
        </div>
      )}
    </div>
  );
}

function AgentBody({ narr }){
  if(narr.status === 'thinking' || narr.status === 'idle'){
    return (
      <div>
        <div className="thinking"><i></i><i></i><i></i></div>
        <p className="think-text">正在推演下一阶段…</p>
      </div>
    );
  }
  if(narr.status === 'stream' || narr.status === 'done'){
    const parts = narr.text.split(/\n\s*\n/);
    while(parts.length && !parts[parts.length - 1].trim()) parts.pop();
    return (
      <div>
        {parts.map((p, i)=>{
          const risk = /^风险信号[：:]/.test(p.trim());
          const streaming = narr.status === 'stream' && i === parts.length - 1;
          return <p key={i} className={(risk ? 'risk' : '') + (streaming ? ' streaming' : '')}
            style={narr.status === 'done' ? {opacity:1} : undefined}>{p}</p>;
        })}
      </div>
    );
  }
  // rule：本地引擎（可能带 AI 失败提示）
  return (
    <div>
      {narr.err && <div className="ai-note">AI 推演失败：{narr.err}。已切换到本地引擎。</div>}
      {narr.paras.map((p, i)=>(
        <p key={i} className={p.cls || ''} style={{animationDelay: (0.1 + i * 0.16) + 's'}}
          dangerouslySetInnerHTML={{__html: p.text}} />
      ))}
    </div>
  );
}

/* ============================================================
   结局屏
   ============================================================ */

function EndingScreen({ g, onRestart, onIntro }){
  const s = g.state;
  const CASE = g.CASE;
  const NODES = g.NODES;
  const score = g.computeScore();
  const grade = g.gradeOf(score);
  const ap = g.detectAntipatterns();
  const epi = g.endingText(score);
  const rows = g.compareRows(score);

  const tlRows = s.history.map((h, i)=>{
    const nd = NODES[h.idx];
    const hist = nd.choices.find(c=>c.hist);
    const myTitle = h.t || (nd.choices[h.ci] || {}).t || '—';
    const title = h.nt || nd.title;               // 命中变体时用当时实际打的节点标题
    const pv = h.pv !== undefined ? h.pv : nd.pivotal;
    const same = !!h.hist;
    const cls = same ? '' : (pv ? 'pv' : 'df');
    return (
      <div className={'tl-row ' + cls} key={i}><i></i>
        <div className="tl-meta">
          <span className="tl-date">{nd.date}</span>{title}
          {!same && (pv
            ? <span className="tl-badge pv">关键分叉</span>
            : <span className="tl-badge">分叉</span>)}
        </div>
        <div className="tl-chips">
          {same
            ? <span className="tl-chip hist">与历史一致 · {myTitle}</span>
            : <>
                <span className="tl-chip you">你 · {myTitle}</span>
                <span className="tl-chip hist">历史 · {hist ? hist.t : '—'}</span>
              </>}
        </div>
        {!same && pv && <div className="tl-note">{pv}</div>}
      </div>
    );
  });
  const divCount = s.history.filter(h=>!h.hist).length;
  const tlFoot = s.dead
    ? `走了 ${s.history.length} / ${NODES.length} 个节点 · 与历史分道扬镳 ${divCount} 次`
    : `共 ${NODES.length} 个节点 · 与历史分道扬镳 ${divCount} 次${divCount === 0 ? ' · 你完整重演了历史' : ''}`;

  return (
    <div className="screen reveal">
      <div className="hero-eyebrow">结局 · {CASE.caseNo}</div>
      <h2 className={'grade ' + grade.cls}>{grade.name}</h2>
      <div className="score-line">改命度 <b>{score}</b> / 100 · {grade.sub}</div>

      <p className="epilogue" dangerouslySetInnerHTML={{__html: epi}} />

      <table className="compare">
        <tbody>
          <tr><th>指标</th><th>真实历史</th><th>你的平行宇宙</th></tr>
          {rows.map((r, i)=>(
            <tr key={i}>
              <td>{r.label}</td>
              <td className="real">{r.real}</td>
              <td className={'you' + (r.win ? ' win' : '')}>{r.you} {r.win ? '▲' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="card-title" style={{marginBottom:6}}>决策回放 · 你在哪里和历史分道扬镳</div>
      <div style={{fontSize:11, color:'var(--dim)', marginBottom:12}}>
        <span className="tl-leg"><i className="l-n"></i>与历史一致</span>
        <span className="tl-leg"><i className="l-w"></i>分叉点</span>
        <span className="tl-leg"><i className="l-b"></i>关键分叉</span>
      </div>
      <div className="tl">
        {tlRows}
        {s.dead && (
          <div className="tl-row dead"><i></i>
            <div className="tl-meta"><span className="tl-date">{g.dateOf(s.month)}</span>现金耗尽，公司提前死亡</div>
          </div>
        )}
      </div>
      <div className="tl-foot">{tlFoot}</div>

      <div className="card-title" style={{marginBottom:6}}>尸检报告 · 反模式对照</div>
      <div className="ap-group">
        <div className="ap-title">你这一局命中的</div>
        <div className="ap-list">
          {ap.length
            ? ap.map(k=><span className="ap" key={k}>{ANTIPATTERNS[k]}</span>)
            : <span className="ap safe">没有命中致命反模式 —— 罕见</span>}
        </div>
        <div className="ap-title">真实案例的死因</div>
        <div className="ap-list">
          {(CASE.realAP || []).map(k=>(
            <span className={'ap real' + (ap.includes(k) ? ' hit' : '')} key={k}>
              {ANTIPATTERNS[k]}{ap.includes(k) ? ' · 你也犯了' : ''}
            </span>
          ))}
        </div>
      </div>

      <div className="history" style={{marginBottom:26}}>
        <div className="hl">💀 真实世界的结局</div>
        <p>{g.REAL.text}</p>
      </div>

      <div className="end-actions">
        <button className="btn acid" onClick={onRestart}>再救一次</button>
        <button className="btn" onClick={onIntro}>换一个案例</button>
        <button className="btn" onClick={()=>window.open('https://www.loot-drop.io/','_blank')}>去看看真实的创业墓地 ↗</button>
      </div>
    </div>
  );
}

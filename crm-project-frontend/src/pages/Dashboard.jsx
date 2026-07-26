import React, { useEffect, useState, useRef, useCallback } from "react";
import Base from "../components/Base";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  Legend, LineChart, Line,
} from "recharts";
import {
  FiUsers, FiCheckCircle, FiClock, FiAlertCircle, FiPackage,
  FiFileText, FiArrowUp, FiArrowDown, FiPhone, FiTrendingUp,
  FiActivity, FiAward, FiTarget, FiZap, FiCalendar,
} from "react-icons/fi";

/* ── palette ── */
const C = { indigo:"#818cf8", emerald:"#34d399", orange:"#fb923c", violet:"#a78bfa", sky:"#38bdf8", pink:"#f472b6" };
const PIE_COLORS = Object.values(C);

const KPI_DEFS = [
  { key:"totalLeads",      label:"Total Leads",         icon:FiUsers,       from:"#818cf8",to:"#a5b4fc", trend:12,  up:true  },
  { key:"totalCustomers",  label:"Active Customers",    icon:FiCheckCircle, from:"#34d399",to:"#6ee7b7", trend:8,   up:true  },
  { key:"totalQuotations", label:"Quotations",          icon:FiFileText,    from:"#fb923c",to:"#fdba74", trend:15,  up:true  },
  { key:"totalProducts",   label:"Products",            icon:FiPackage,     from:"#c084fc",to:"#d8b4fe", trend:5,   up:true  },
  { key:"avgResponseDays", label:"Avg Response (days)", icon:FiClock,       from:"#38bdf8",to:"#7dd3fc", trend:null,up:false },
];
const MINI_DEFS = [
  { key:"openLeads",       label:"Open Leads",        icon:FiPhone,       color:C.indigo  },
  { key:"todayFollowups",  label:"Today Follow-ups",  icon:FiClock,       color:C.emerald },
  { key:"overdueFollowups",label:"Overdue",           icon:FiAlertCircle, color:"#f87171" },
  { key:"inProcessLeads",  label:"In Process",        icon:FiActivity,    color:C.orange  },
];

/* ── hooks ── */
function useCountUp(target, active, duration = 1100) {
  const [v, setV] = useState(0);
  const raf = useRef();
  useEffect(() => {
    if (!active || !target) { setV(0); return; }
    let t0 = null;
    const ease = p => p < .5 ? 2*p*p : -1+(4-2*p)*p;
    const tick = ts => {
      if (!t0) t0 = ts;
      const p = Math.min((ts-t0)/duration,1);
      setV(Math.floor(ease(p)*target));
      if (p<1) raf.current = requestAnimationFrame(tick);
      else setV(target);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, active, duration]);
  return v;
}

function useInView(ref, threshold=0.15) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e])=>{ if(e.isIntersecting){setSeen(true);io.disconnect();} },{threshold});
    if(ref.current) io.observe(ref.current);
    return ()=>io.disconnect();
  },[ref,threshold]);
  return seen;
}

/* ── skeleton ── */
const Sk = ({className=""}) => <div className={`animate-pulse bg-slate-200/70 rounded-xl ${className}`}/>;

/* ── tooltip ── */
function CT({active,payload,label}) {
  if(!active||!payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur border border-slate-100 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-bold text-slate-600 mb-1.5">{label}</p>
      {payload.map(p=>(
        <p key={p.dataKey} className="flex items-center gap-1.5 font-semibold" style={{color:p.color}}>
          <span className="w-2 h-2 rounded-full" style={{background:p.color}}/>
          {p.name}: <span className="font-bold ml-0.5">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ── animated card wrapper ── */
function FadeCard({children, className="", delay=0}) {
  const ref = useRef(); const seen = useInView(ref);
  return (
    <div ref={ref} className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500 ${className}`}
      style={{opacity:seen?1:0,transform:seen?"translateY(0)":"translateY(22px)",transition:`opacity .55s ease ${delay}ms,transform .55s cubic-bezier(.22,1,.36,1) ${delay}ms`}}>
      {children}
    </div>
  );
}

/* ── KPI card ── */
function KpiCard({icon:Icon,label,value,from,to,trend,up,delay=0}) {
  const ref=useRef(); const seen=useInView(ref); const animated=useCountUp(value,seen);
  return (
    <div ref={ref} className="relative overflow-hidden rounded-2xl p-5 cursor-default group"
      style={{background:`linear-gradient(135deg,${from},${to})`,boxShadow:`0 6px 24px ${from}44`,
        opacity:seen?1:0,transform:seen?"translateY(0) scale(1)":"translateY(24px) scale(.97)",
        transition:`opacity .5s ease ${delay}ms,transform .5s cubic-bezier(.22,1,.36,1) ${delay}ms`}}>
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/15 group-hover:scale-125 transition-transform duration-700"/>
      <div className="absolute right-4 -bottom-10 w-20 h-20 rounded-full bg-white/10"/>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 bg-white/25 backdrop-blur-sm rounded-xl"><Icon className="w-5 h-5 text-white"/></div>
          {trend!=null&&<span className="flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white/25 text-white">
            {up?<FiArrowUp className="w-2.5 h-2.5"/>:<FiArrowDown className="w-2.5 h-2.5"/>}{trend}%
          </span>}
        </div>
        <div className="text-3xl font-extrabold text-white">{animated.toLocaleString()}</div>
        <div className="text-xs font-semibold text-white/80 mt-1">{label}</div>
      </div>
    </div>
  );
}

/* ── mini card ── */
function MiniCard({icon:Icon,label,value,color}) {
  const ref=useRef(); const seen=useInView(ref); const animated=useCountUp(value,seen);
  return (
    <div ref={ref} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-3 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
      style={{opacity:seen?1:0,transform:seen?"translateY(0)":"translateY(16px)",transition:"opacity .45s ease,transform .45s ease"}}>
      <div className="p-2.5 rounded-xl shrink-0" style={{background:color+"18"}}><Icon className="w-5 h-5" style={{color}}/></div>
      <div><div className="text-2xl font-bold text-slate-800">{animated}</div><div className="text-xs text-slate-400 font-medium">{label}</div></div>
    </div>
  );
}

/* ── animated funnel bar ── */
function FunnelBar({label,value,max,color,pct}) {
  const ref=useRef(); const seen=useInView(ref);
  const w = max>0?Math.round((value/max)*100):0;
  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">{value.toLocaleString()}</span>
          {pct!=null&&<span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{background:color+"20",color}}>{pct}%</span>}
        </div>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{width:seen?`${w}%`:"0%",background:`linear-gradient(90deg,${color},${color}99)`,transition:"width 1.1s cubic-bezier(.22,1,.36,1)"}}/>
      </div>
    </div>
  );
}

/* ═══════════════ MAIN ═══════════════ */
export default function Dashboard() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  const token = localStorage.getItem("access")||"";
  const [stats,setStats] = useState({totalLeads:0,totalCustomers:0,totalQuotations:0,totalProducts:0,openLeads:0,closedLeads:0,inProcessLeads:0,overdueFollowups:0,todayFollowups:0,avgResponseDays:0});
  const [loading,setLoading] = useState(true);
  const [monthly,setMonthly] = useState([]);
  const [statusData,setStatusData] = useState([]);
  const [srcData,setSrcData] = useState([]);
  const [recent,setRecent] = useState([]);
  const [greeting,setGreeting] = useState("Good morning");

  useEffect(()=>{const h=new Date().getHours();setGreeting(h<12?"Good morning":h<17?"Good afternoon":"Good evening");},[]);

  useEffect(()=>{
    const go=async()=>{
      setLoading(true);
      const hdr=token?{Authorization:`Bearer ${token}`}:{};
      const safe=async(u)=>{try{const r=await fetch(u,{headers:hdr});return r.ok?r.json():null;}catch{return null;}};
      const [ld,cu,qu,pr]=await Promise.all([safe(`${BASE_API}/lead/lead/?page_size=1000`),safe(`${BASE_API}/lead/customer/?page_size=1000`),safe(`${BASE_API}/api/quotation/quotation/?page_size=1000`),safe(`${BASE_API}/parking/products/?page_size=100`)]);
      const arr=d=>d?(Array.isArray(d)?d:d?.results||[]):[];
      const L=arr(ld),Cu=arr(cu),Q=arr(qu),P=arr(pr);
      const today=new Date();today.setHours(0,0,0,0);
      const open=L.filter(l=>l.status==="open").length,closed=L.filter(l=>l.status==="closed").length,inp=L.filter(l=>l.status==="in_process").length;
      const tFU=L.filter(l=>{if(!l.followup_date)return false;const d=new Date(l.followup_date);d.setHours(0,0,0,0);return d.getTime()===today.getTime();}).length;
      const ov=L.filter(l=>{if(!l.followup_date)return false;const d=new Date(l.followup_date);d.setHours(0,0,0,0);return d<today;}).length;
      const mon={};const last6=[];
      for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;last6.push(k);mon[k]={month:d.toLocaleDateString("en-IN",{month:"short"}),leads:0,customers:0,quotations:0};}
      L.forEach(x=>{const d=new Date(x.created_at||x.date);const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;if(mon[k])mon[k].leads++;});
      Cu.forEach(x=>{const d=new Date(x.created_at);const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;if(mon[k])mon[k].customers++;});
      Q.forEach(x=>{const d=new Date(x.created_at);const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;if(mon[k])mon[k].quotations++;});
      const sc={};L.forEach(l=>{const s=l.lead_source||"Unknown";sc[s]=(sc[s]||0)+1;});
      const rt=L.filter(l=>l.followup_date&&(l.created_at||l.date)).map(l=>Math.max(0,Math.round((new Date(l.followup_date)-new Date(l.created_at||l.date))/864e5)));
      const avg=rt.length?Math.round(rt.reduce((a,b)=>a+b,0)/rt.length):0;
      setStats({totalLeads:L.length,totalCustomers:Cu.length,totalQuotations:Q.length,totalProducts:P.length,openLeads:open,closedLeads:closed,inProcessLeads:inp,overdueFollowups:ov,todayFollowups:tFU,avgResponseDays:avg});
      setMonthly(last6.map(k=>mon[k]));
      setStatusData([{name:"Open",value:open,fill:C.indigo},{name:"In Process",value:inp,fill:C.orange},{name:"Closed",value:closed,fill:C.emerald}]);
      setSrcData(Object.entries(sc).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,6));
      setRecent(L.sort((a,b)=>new Date(b.created_at||b.date)-new Date(a.created_at||a.date)).slice(0,7).map(l=>({id:l.id,name:l.customer_name,date:l.date||l.created_at,status:l.status,src:l.lead_source})));
      setLoading(false);
    };
    go();
  },[BASE_API,token]);

  if(loading) return (<Base title="Dashboard"><div className="space-y-4 p-2"><Sk className="h-32"/><div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[...Array(5)].map((_,i)=><Sk key={i} className="h-28"/>)}</div><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[...Array(4)].map((_,i)=><Sk key={i} className="h-20"/>)}</div><div className="grid grid-cols-1 lg:grid-cols-3 gap-4">{[...Array(3)].map((_,i)=><Sk key={i} className="h-64"/>)}</div></div></Base>);

  const cRate=stats.totalLeads>0?Math.round((stats.totalCustomers/stats.totalLeads)*100):0;
  const qRate=stats.totalLeads>0?Math.round((stats.totalQuotations/stats.totalLeads)*100):0;
  const clRate=stats.totalLeads>0?Math.round((stats.closedLeads/stats.totalLeads)*100):0;
  const sBg=s=>s==="open"?"bg-indigo-50 text-indigo-600":s==="closed"?"bg-emerald-50 text-emerald-600":"bg-orange-50 text-orange-600";
  const sCol=s=>s==="open"?C.indigo:s==="closed"?C.emerald:C.orange;
  const funnelData=[{name:"Leads",val:stats.totalLeads,pct:null},{name:"Quotations",val:stats.totalQuotations,pct:qRate},{name:"Customers",val:stats.totalCustomers,pct:cRate},{name:"Closed",val:stats.closedLeads,pct:clRate}];

  return (
    <Base title="Dashboard">
      <div className="space-y-5 pb-8">

        {/* ── HERO ── */}
        <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8" style={{background:"linear-gradient(135deg,#eef2ff 0%,#ede9fe 60%,#fce7f3 100%)"}}>
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/30 blur-3xl animate-pulse"/>
          <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-violet-200/30 blur-2xl"/>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center"><FiZap className="w-3.5 h-3.5 text-indigo-600"/></span>
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">CRM Overview</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">{greeting}! 👋</h1>
              <p className="text-sm text-slate-500 mt-1">Here's your business snapshot for today.</p>
              <div className="flex flex-wrap gap-3 mt-4">
                {[{l:"Leads",v:stats.totalLeads,c:"text-indigo-600",bg:"bg-indigo-50"},{l:"Customers",v:stats.totalCustomers,c:"text-emerald-600",bg:"bg-emerald-50"},{l:"Quotations",v:stats.totalQuotations,c:"text-orange-600",bg:"bg-orange-50"}].map(s=>(
                  <div key={s.l} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${s.bg}`}>
                    <span className={`text-lg font-extrabold ${s.c}`}>{s.v}</span>
                    <span className="text-xs font-medium text-slate-500">{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="shrink-0 bg-white/60 backdrop-blur border border-white/80 rounded-2xl px-6 py-4 text-center shadow-sm">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{new Date().toLocaleDateString("en-IN",{weekday:"long"})}</div>
              <div className="text-2xl font-extrabold text-slate-800">{new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</div>
              <div className="text-sm text-slate-400 mt-0.5">{new Date().getFullYear()}</div>
              {stats.overdueFollowups>0&&<div className="mt-3 flex items-center gap-1 bg-red-50 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full"><FiAlertCircle className="w-3 h-3"/>{stats.overdueFollowups} overdue</div>}
              {stats.todayFollowups>0&&<div className="mt-2 flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-full"><FiCalendar className="w-3 h-3"/>{stats.todayFollowups} today</div>}
            </div>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {KPI_DEFS.map((d,i)=><KpiCard key={d.key} icon={d.icon} label={d.label} value={stats[d.key]} from={d.from} to={d.to} trend={d.trend} up={d.up} delay={i*80}/>)}
        </div>

        {/* ── MINI ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {MINI_DEFS.map(d=><MiniCard key={d.key} icon={d.icon} label={d.label} value={stats[d.key]} color={d.color}/>)}
        </div>

        {/* ── ROW 1: Area + Donut ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <FadeCard className="lg:col-span-2 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div><p className="text-sm font-bold text-slate-700 flex items-center gap-2"><FiTrendingUp className="text-indigo-400"/>Monthly Trends</p><p className="text-xs text-slate-400 mt-0.5">Last 6 months — animated on load</p></div>
              <div className="hidden sm:flex gap-3 text-xs">{[["Leads",C.indigo],["Customers",C.emerald],["Quotations",C.orange]].map(([l,c])=><span key={l} className="flex items-center gap-1 font-semibold" style={{color:c}}><span className="w-3 h-1.5 rounded-full" style={{background:c}}/>{l}</span>)}</div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{top:5,right:5,left:-20,bottom:0}}>
                  <defs>{[["leads",C.indigo],["customers",C.emerald],["quotations",C.orange]].map(([k,c])=><linearGradient key={k} id={`ag-${k}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={c} stopOpacity={0.28}/><stop offset="95%" stopColor={c} stopOpacity={0}/></linearGradient>)}</defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                  <XAxis dataKey="month" stroke="#cbd5e1" tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                  <YAxis stroke="#cbd5e1" tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                  <Tooltip content={<CT/>}/>
                  {[["leads","Leads",C.indigo],["customers","Customers",C.emerald],["quotations","Quotations",C.orange]].map(([k,n,c])=><Area key={k} type="monotone" dataKey={k} name={n} stroke={c} strokeWidth={2.5} fill={`url(#ag-${k})`} dot={{r:3,fill:c,strokeWidth:0}} activeDot={{r:5}} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out"/>)}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </FadeCard>
          <FadeCard className="p-5 sm:p-6 flex flex-col" delay={100}>
            <p className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4"><FiTarget className="text-indigo-400"/>Lead Status</p>
            <div className="flex-1 min-h-[180px] flex items-center justify-center">
              {statusData.some(d=>d.value>0)?(
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} dataKey="value" paddingAngle={4} strokeWidth={0} isAnimationActive animationBegin={200} animationDuration={1000} animationEasing="ease-out">
                    {statusData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius:"10px",border:"1px solid #f1f5f9",fontSize:"12px"}}/></PieChart>
                </ResponsiveContainer>
              ):<div className="text-slate-300 text-sm">No data</div>}
            </div>
            <div className="space-y-2 mt-2">{statusData.map(d=><div key={d.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-slate-600 font-medium"><span className="w-2.5 h-2.5 rounded-full" style={{background:d.fill}}/>{d.name}</span><span className="font-bold text-slate-800">{d.value}</span></div>)}</div>
          </FadeCard>
        </div>

        {/* ── ROW 2: Funnel + Sources Pie ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <FadeCard className="p-5 sm:p-6">
            <p className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-5"><FiActivity className="text-violet-400"/>Conversion Funnel</p>
            <div className="space-y-5">{funnelData.map((f,i)=><FunnelBar key={f.name} label={f.name} value={f.val} max={stats.totalLeads} color={PIE_COLORS[i]} pct={f.pct}/>)}</div>
            <div className="grid grid-cols-3 gap-3 mt-6">{[{l:"Conversion",v:cRate,c:C.indigo},{l:"Quote Rate",v:qRate,c:C.emerald},{l:"Close Rate",v:clRate,c:C.orange}].map(m=><div key={m.l} className="text-center py-3 rounded-xl" style={{background:m.c+"14"}}><div className="text-xl font-extrabold" style={{color:m.c}}>{m.v}%</div><div className="text-[11px] text-slate-400 font-medium mt-0.5">{m.l}</div></div>)}</div>
          </FadeCard>

          <FadeCard className="p-5 sm:p-6" delay={80}>
            <p className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4"><FiAward className="text-emerald-400"/>Lead Sources</p>
            {srcData.length>0?(
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-1/2 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={srcData} cx="50%" cy="50%" outerRadius={80} innerRadius={30} dataKey="value" paddingAngle={3} strokeWidth={0} isAnimationActive animationBegin={300} animationDuration={1100} animationEasing="ease-out" label={({name,percent})=>percent>0.08?`${(percent*100).toFixed(0)}%`:""} labelLine={false}>
                      {srcData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius:"10px",border:"1px solid #f1f5f9",fontSize:"12px"}}/></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-2">{srcData.map((d,i)=><div key={d.name} className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 font-medium text-slate-600 truncate max-w-[110px]"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:PIE_COLORS[i%PIE_COLORS.length]}}/>{d.name}</span><span className="font-bold text-slate-700">{d.value}</span></div>)}</div>
              </div>
            ):<div className="h-52 flex items-center justify-center text-slate-300 text-sm">No source data</div>}
          </FadeCard>
        </div>

        {/* ── ROW 3: Bar chart + Recent Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
          <FadeCard className="lg:col-span-2 p-5 sm:p-6">
            <p className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-1"><FiTrendingUp className="text-indigo-400"/>Performance</p>
            <p className="text-xs text-slate-400 mb-4">Conversion rates this cycle</p>
            <div className="flex items-center gap-3 bg-sky-50 rounded-xl px-4 py-3 border border-sky-100 mb-4">
              <div className="p-2 bg-sky-100 rounded-lg shrink-0"><FiClock className="w-4 h-4 text-sky-500"/></div>
              <div><div className="text-[11px] text-sky-500 font-bold uppercase tracking-wide">Avg Response</div><div className="text-xl font-extrabold text-sky-700">{stats.avgResponseDays} <span className="text-sm text-sky-400 font-semibold">days</span></div></div>
              <div className="ml-auto text-[10px] text-sky-300 font-medium">Lead→Follow-up</div>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{name:"Leads",value:stats.totalLeads},{name:"Quotes",value:stats.totalQuotations},{name:"Customers",value:stats.totalCustomers}]} margin={{top:0,right:5,left:-20,bottom:0}}>
                  <defs><linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.indigo}/><stop offset="100%" stopColor={C.violet}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                  <XAxis dataKey="name" stroke="#cbd5e1" tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                  <YAxis stroke="#cbd5e1" tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                  <Tooltip content={<CT/>}/>
                  <Bar dataKey="value" name="Count" fill="url(#bg1)" radius={[8,8,0,0]} maxBarSize={50} isAnimationActive animationBegin={200} animationDuration={1000} animationEasing="ease-out"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </FadeCard>

          <FadeCard className="lg:col-span-3 p-5 sm:p-6" delay={60}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><FiClock className="text-indigo-400"/>Recent Leads</p>
              <span className="text-[11px] bg-indigo-50 text-indigo-500 font-bold px-2.5 py-1 rounded-full">{recent.length} entries</span>
            </div>
            <div className="space-y-2">
              {recent.length===0?(<div className="flex flex-col items-center py-8 text-slate-300"><FiUsers className="w-10 h-10 mb-2 opacity-30"/><p className="text-sm">No activity</p></div>):
              recent.map((a,i)=>(
                <div key={a.id||i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                  style={{opacity:0,animation:`fadeSlide .4s ease forwards`,animationDelay:`${i*60}ms`}}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{background:sCol(a.status)}}>{(a.name||"?").charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800 truncate">{a.name||"—"}</p><p className="text-xs text-slate-400">{a.src||"Lead"} · {a.date?new Date(a.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}):"—"}</p></div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${sBg(a.status)}`}>{a.status}</span>
                </div>
              ))}
            </div>
          </FadeCard>
        </div>

      </div>
      <style>{`@keyframes fadeSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </Base>
  );
}

import React, { useEffect, useState, useRef } from "react";
import Base from "../components/Base";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  FiUsers, FiCheckCircle, FiClock, FiAlertCircle, FiPackage,
  FiFileText, FiArrowUp, FiArrowDown, FiPhone, FiTrendingUp,
  FiActivity, FiAward, FiTarget, FiZap, FiCalendar, FiPieChart, FiBarChart2
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

/* ── palette ── */
const C = { indigo:"#6366f1", emerald:"#10b981", orange:"#f97316", violet:"#8b5cf6", sky:"#0ea5e9", pink:"#ec4899", rose:"#f43f5e", amber:"#f59e0b" };
const PIE_COLORS = [C.indigo, C.emerald, C.orange, C.violet, C.sky, C.pink, C.rose, C.amber];

const KPI_DEFS = [
  { key:"totalLeads",      label:"Total Leads",         icon:FiUsers,       from:"#818cf8",to:"#a5b4fc", trend:12,  up:true  },
  { key:"totalCustomers",  label:"Active Customers",    icon:FiCheckCircle, from:"#34d399",to:"#6ee7b7", trend:8,   up:true  },
  { key:"totalQuotations", label:"Quotations",          icon:FiFileText,    from:"#fb923c",to:"#fdba74", trend:15,  up:true  },
  { key:"totalProducts",   label:"Products",            icon:FiPackage,     from:"#c084fc",to:"#d8b4fe", trend:5,   up:true  },
  { key:"avgResponseDays", label:"Avg Response (days)", icon:FiClock,       from:"#38bdf8",to:"#7dd3fc", trend:null,up:false },
];
const MINI_DEFS = [
  { key:"openLeads",       label:"Open Leads",        icon:FiPhone,       color:C.indigo  },
  { key:"todayFollowups",  label:"Today Follow-ups",  icon:FiCalendar,    color:C.emerald },
  { key:"overdueFollowups",label:"Overdue",           icon:FiAlertCircle, color:C.rose },
  { key:"inProcessLeads",  label:"In Process",        icon:FiActivity,    color:C.orange  },
];

/* ── hooks ── */
function useCountUp(target, duration = 1200) {
  const [v, setV] = useState(0);
  const raf = useRef();
  useEffect(() => {
    if (!target) { setV(0); return; }
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
  }, [target, duration]);
  return v;
}

/* ── components ── */
const Sk = ({className=""}) => <div className={`animate-pulse bg-slate-200/70 rounded-2xl ${className}`}/>;

function CT({active,payload,label}) {
  if(!active||!payload?.length) return null;
  return (
    <motion.div initial={{opacity:0,scale:0.95,y:5}} animate={{opacity:1,scale:1,y:0}} className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-xl shadow-xl p-3 text-xs z-50">
      <p className="font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1.5">{label}</p>
      {payload.map(p=>(
        <p key={p.dataKey||p.name} className="flex items-center justify-between gap-5 font-medium mb-1" style={{color:p.color||p.fill}}>
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background:p.color||p.fill}}/>{p.name}</span>
          <span className="font-bold text-slate-800 ml-2">{p.value}</span>
        </p>
      ))}
    </motion.div>
  );
}

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

function KpiCard({icon:Icon,label,value,from,to,trend,up}) {
  const animated=useCountUp(value);
  return (
    <motion.div variants={itemVariant} whileHover={{y:-4,boxShadow:`0 15px 25px -5px ${from}55`}} className="relative overflow-hidden rounded-2xl p-5 cursor-default group transition-all"
      style={{background:`linear-gradient(135deg,${from},${to})`,boxShadow:`0 8px 20px -5px ${from}33`}}>
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20 group-hover:scale-125 transition-transform duration-700 ease-out"/>
      <div className="absolute right-4 -bottom-10 w-20 h-20 rounded-full bg-white/10 group-hover:-translate-y-4 transition-transform duration-700 ease-out"/>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 bg-white/25 backdrop-blur-md rounded-xl"><Icon className="w-5 h-5 text-white"/></div>
          {trend!=null&&<span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-white/25 text-white backdrop-blur-md shadow-sm">
            {up?<FiArrowUp className="w-3 h-3"/>:<FiArrowDown className="w-3 h-3"/>}{trend}%
          </span>}
        </div>
        <div className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">{animated.toLocaleString()}</div>
        <div className="text-xs font-medium text-white/90 mt-1">{label}</div>
      </div>
    </motion.div>
  );
}

function MiniCard({icon:Icon,label,value,color}) {
  const animated=useCountUp(value);
  return (
    <motion.div variants={itemVariant} whileHover={{y:-3,boxShadow:"0 10px 15px -3px rgba(0,0,0,0.05)"}} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-4 transition-all shadow-sm">
      <div className="p-3 rounded-xl shrink-0" style={{background:color+"18",color:color}}><Icon className="w-5 h-5"/></div>
      <div><div className="text-xl font-bold text-slate-800">{animated}</div><div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mt-0.5">{label}</div></div>
    </motion.div>
  );
}

function FunnelBar({label,value,max,color,pct}) {
  const w = max>0?Math.round((value/max)*100):0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">{value.toLocaleString()}</span>
          {pct!=null&&<span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{background:color+"20",color}}>{pct}%</span>}
        </div>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <motion.div initial={{width:0}} animate={{width:`${w}%`}} transition={{duration:1.4,ease:[0.22, 1, 0.36, 1],delay:0.2}} className="h-full rounded-full" style={{background:`linear-gradient(90deg,${color},${color}dd)`}}/>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  const token = localStorage.getItem("access")||"";
  const [stats,setStats] = useState(null);
  const [monthly,setMonthly] = useState([]);
  const [statusData,setStatusData] = useState([]);
  const [srcData,setSrcData] = useState([]);
  const [portfolioData,setPortfolioData] = useState([]); 
  const [recent,setRecent] = useState([]);
  const [greeting,setGreeting] = useState("Good morning");

  useEffect(()=>{const h=new Date().getHours();setGreeting(h<12?"Good morning":h<17?"Good afternoon":"Good evening");},[]);

  useEffect(()=>{
    const go=async()=>{
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
      
      // CRM Portfolio Distribution Pie Data
      setPortfolioData([
        { name:"Leads", value:L.length, fill:C.indigo },
        { name:"Customers", value:Cu.length, fill:C.emerald },
        { name:"Quotations", value:Q.length, fill:C.orange },
        { name:"Products", value:P.length, fill:C.violet }
      ].filter(d=>d.value>0));
      
      setRecent(L.sort((a,b)=>new Date(b.created_at||b.date)-new Date(a.created_at||a.date)).slice(0,6).map(l=>({id:l.id,name:l.customer_name,date:l.date||l.created_at,status:l.status,src:l.lead_source})));
    };
    go();
  },[BASE_API,token]);

  if(!stats) return (<Base title="Dashboard"><div className="space-y-4 p-4"><Sk className="h-40"/><div className="grid grid-cols-2 lg:grid-cols-5 gap-4">{[...Array(5)].map((_,i)=><Sk key={i} className="h-32"/>)}</div><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><Sk key={i} className="h-24"/>)}</div><div className="grid grid-cols-1 lg:grid-cols-3 gap-5">{[...Array(3)].map((_,i)=><Sk key={i} className="h-72"/>)}</div></div></Base>);

  const cRate=stats.totalLeads>0?Math.round((stats.totalCustomers/stats.totalLeads)*100):0;
  const qRate=stats.totalLeads>0?Math.round((stats.totalQuotations/stats.totalLeads)*100):0;
  const clRate=stats.totalLeads>0?Math.round((stats.closedLeads/stats.totalLeads)*100):0;
  const sBg=s=>s==="open"?"bg-indigo-50 text-indigo-600":s==="closed"?"bg-emerald-50 text-emerald-600":"bg-orange-50 text-orange-600";
  const sCol=s=>s==="open"?C.indigo:s==="closed"?C.emerald:C.orange;
  const funnelData=[{name:"Leads",val:stats.totalLeads,pct:null},{name:"Quotations",val:stats.totalQuotations,pct:qRate},{name:"Customers",val:stats.totalCustomers,pct:cRate},{name:"Closed",val:stats.closedLeads,pct:clRate}];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <Base title="Dashboard">
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-5 pb-10">

        {/* ── HERO ── */}
        <motion.div variants={itemVariant} className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-white/60 shadow-sm" style={{background:"linear-gradient(135deg, #eef2ff 0%, #ede9fe 50%, #fce7f3 100%)"}}>
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/50 blur-3xl animate-pulse"/>
          <div className="absolute -bottom-8 left-1/4 w-48 h-48 rounded-full bg-violet-300/30 blur-3xl"/>
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center"><FiZap className="w-4 h-4 text-indigo-600"/></span>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide bg-white/60 px-3 py-1.5 rounded-lg shadow-sm backdrop-blur-sm">CRM Overview</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">{greeting}! 👋</h1>
              <p className="text-sm font-medium text-slate-600 mt-2">Here's your business snapshot for today.</p>
              <div className="flex flex-wrap gap-3 mt-6">
                {[{l:"Leads",v:stats.totalLeads,c:"text-indigo-700",bg:"bg-indigo-100"},{l:"Customers",v:stats.totalCustomers,c:"text-emerald-700",bg:"bg-emerald-100"},{l:"Quotations",v:stats.totalQuotations,c:"text-orange-700",bg:"bg-orange-100"}].map(s=>(
                  <div key={s.l} className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm ${s.bg}`}>
                    <span className={`text-lg font-bold ${s.c}`}>{s.v}</span>
                    <span className={`text-xs font-semibold uppercase tracking-wide ${s.c} opacity-80`}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="shrink-0 bg-white/80 backdrop-blur-md border border-white rounded-2xl p-6 text-center shadow-sm hover:-translate-y-1 transition-transform duration-500">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">{new Date().toLocaleDateString("en-IN",{weekday:"long"})}</div>
              <div className="text-4xl font-extrabold text-slate-800 tracking-tight">{new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</div>
              <div className="text-xs font-medium text-slate-400 mt-1 uppercase">{new Date().getFullYear()}</div>
              <div className="mt-4 space-y-1.5">
                {stats.overdueFollowups>0&&<div className="flex items-center justify-center gap-1.5 bg-rose-50 text-rose-600 text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide"><FiAlertCircle className="w-3.5 h-3.5"/>{stats.overdueFollowups} overdue</div>}
                {stats.todayFollowups>0&&<div className="flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-600 text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide"><FiCalendar className="w-3.5 h-3.5"/>{stats.todayFollowups} today</div>}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {KPI_DEFS.map(d=><KpiCard key={d.key} icon={d.icon} label={d.label} value={stats[d.key]} from={d.from} to={d.to} trend={d.trend} up={d.up}/>)}
        </div>

        {/* ── MINI CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {MINI_DEFS.map(d=><MiniCard key={d.key} icon={d.icon} label={d.label} value={stats[d.key]} color={d.color}/>)}
        </div>

        {/* ── ROW 1: Area + NEW CRM Portfolio Pie ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div variants={itemVariant} className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div><p className="text-base font-bold text-slate-800 flex items-center gap-2"><FiTrendingUp className="text-indigo-500"/>Monthly Trends</p><p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wide">Revenue & Growth metrics</p></div>
              <div className="flex flex-wrap gap-3 text-xs">{[["Leads",C.indigo],["Customers",C.emerald],["Quotations",C.orange]].map(([l,c])=><span key={l} className="flex items-center gap-1.5 font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md"><span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{background:c}}/>{l}</span>)}</div>
            </div>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{top:5,right:5,left:-25,bottom:0}}>
                  <defs>{[["leads",C.indigo],["customers",C.emerald],["quotations",C.orange]].map(([k,c])=><linearGradient key={k} id={`ag-${k}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={c} stopOpacity={0.3}/><stop offset="95%" stopColor={c} stopOpacity={0}/></linearGradient>)}</defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false}/>
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{fontSize:11,fontWeight:500}} tickLine={false} axisLine={false} dy={8}/>
                  <YAxis stroke="#94a3b8" tick={{fontSize:11,fontWeight:500}} tickLine={false} axisLine={false} dx={-8}/>
                  <Tooltip content={<CT/>}/>
                  {[["leads","Leads",C.indigo],["customers","Customers",C.emerald],["quotations","Quotations",C.orange]].map(([k,n,c])=><Area key={k} type="monotone" dataKey={k} name={n} stroke={c} strokeWidth={2.5} fill={`url(#ag-${k})`} dot={{r:4,fill:c,strokeWidth:0}} activeDot={{r:6,strokeWidth:2,stroke:"#fff"}} isAnimationActive animationDuration={1800} animationEasing="ease-out"/>)}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariant} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-500 flex flex-col">
            <p className="text-base font-bold text-slate-800 flex items-center gap-2 mb-1"><FiPieChart className="text-violet-500"/>CRM Portfolio</p>
            <p className="text-[11px] font-medium text-slate-400 mb-6 uppercase tracking-wide">Overall entity distribution</p>
            <div className="flex-1 min-h-[200px] flex items-center justify-center relative">
              {portfolioData.length>0?(
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={portfolioData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3} strokeWidth={0} isAnimationActive animationBegin={300} animationDuration={1500} animationEasing="ease-out">
                      {portfolioData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                    </Pie>
                    <Tooltip content={<CT/>}/>
                  </PieChart>
                </ResponsiveContainer>
              ):<div className="text-slate-300 text-xs font-medium">No data</div>}
              {portfolioData.length>0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center mt-1">
                    <div className="text-3xl font-extrabold text-slate-800 tracking-tight">{stats.totalLeads+stats.totalCustomers+stats.totalQuotations+stats.totalProducts}</div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">Total</div>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-5">
              {portfolioData.map(d=>(
                <div key={d.name} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1"><span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{background:d.fill}}/><span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{d.name}</span></div>
                  <div className="text-lg font-bold text-slate-800 pl-4">{d.value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── ROW 2: Lead Status + Lead Sources + Funnel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div variants={itemVariant} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-500 flex flex-col">
            <p className="text-base font-bold text-slate-800 flex items-center gap-2 mb-1"><FiTarget className="text-rose-500"/>Lead Status</p>
            <p className="text-[11px] font-medium text-slate-400 mb-6 uppercase tracking-wide">Current Pipeline</p>
            <div className="flex-1 min-h-[200px] flex items-center justify-center">
              {statusData.some(d=>d.value>0)?(
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" paddingAngle={2} strokeWidth={2} stroke="#fff" isAnimationActive animationBegin={500} animationDuration={1500} animationEasing="ease-out" label={({name,percent})=>percent>0.05?`${(percent*100).toFixed(0)}%`:""} labelLine={false}>
                      {statusData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                    </Pie>
                    <Tooltip content={<CT/>}/>
                  </PieChart>
                </ResponsiveContainer>
              ):<div className="text-slate-300 text-xs font-medium">No data</div>}
            </div>
            <div className="space-y-2 mt-5">{statusData.map(d=><div key={d.name} className="flex items-center justify-between text-xs px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg border border-slate-100"><span className="flex items-center gap-2 text-slate-700 font-medium"><span className="w-3 h-3 rounded-full shadow-sm" style={{background:d.fill}}/>{d.name}</span><span className="font-bold text-slate-800">{d.value}</span></div>)}</div>
          </motion.div>

          <motion.div variants={itemVariant} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-500 flex flex-col">
            <p className="text-base font-bold text-slate-800 flex items-center gap-2 mb-1"><FiAward className="text-amber-500"/>Lead Sources</p>
            <p className="text-[11px] font-medium text-slate-400 mb-6 uppercase tracking-wide">Top origin channels</p>
            <div className="flex-1 min-h-[200px] flex items-center justify-center">
              {srcData.length>0?(
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={srcData} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" paddingAngle={3} strokeWidth={0} isAnimationActive animationBegin={700} animationDuration={1500} animationEasing="ease-out">
                      {srcData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip content={<CT/>}/>
                  </PieChart>
                </ResponsiveContainer>
              ):<div className="text-slate-300 text-xs font-medium">No source data</div>}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-5">{srcData.slice(0,4).map((d,i)=><div key={d.name} className="flex flex-col bg-slate-50 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors"><span className="flex items-center gap-1.5 font-medium text-slate-600 truncate text-[11px] uppercase tracking-wide"><span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{background:PIE_COLORS[i%PIE_COLORS.length]}}/>{d.name}</span><span className="font-bold text-base text-slate-800 pl-4 mt-1">{d.value}</span></div>)}</div>
          </motion.div>

          <motion.div variants={itemVariant} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-500">
            <p className="text-base font-bold text-slate-800 flex items-center gap-2 mb-1"><FiActivity className="text-sky-500"/>Conversion Funnel</p>
            <p className="text-[11px] font-medium text-slate-400 mb-8 uppercase tracking-wide">Pipeline velocity</p>
            <div className="space-y-6">{funnelData.map((f,i)=><FunnelBar key={f.name} label={f.name} value={f.val} max={stats.totalLeads} color={PIE_COLORS[i]} pct={f.pct}/>)}</div>
            <div className="grid grid-cols-3 gap-2 mt-8">
              {[{l:"Conv. Rate",v:cRate,c:C.indigo},{l:"Quote Rate",v:qRate,c:C.emerald},{l:"Close Rate",v:clRate,c:C.orange}].map(m=>
                <div key={m.l} className="text-center py-4 rounded-xl border border-slate-100 bg-slate-50 transition-colors hover:bg-slate-100 shadow-sm">
                  <div className="text-2xl font-bold" style={{color:m.c}}>{m.v}%</div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase mt-1 tracking-wide">{m.l}</div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── ROW 3: Bar chart + Recent Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <motion.div variants={itemVariant} className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-500">
            <p className="text-base font-bold text-slate-800 flex items-center gap-2 mb-1"><FiBarChart2 className="text-indigo-500"/>Performance</p>
            <p className="text-[11px] font-medium text-slate-400 mb-6 uppercase tracking-wide">Volume analysis</p>
            <div className="flex items-center justify-between bg-sky-50 rounded-xl px-5 py-4 border border-sky-100 mb-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-100 rounded-lg shrink-0"><FiClock className="w-5 h-5 text-sky-600"/></div>
                <div><div className="text-[10px] text-sky-600 font-bold uppercase tracking-wide">Avg Response Time</div><div className="text-2xl font-extrabold text-sky-800 mt-0.5">{stats.avgResponseDays} <span className="text-sm text-sky-600/70 font-bold">days</span></div></div>
              </div>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{name:"Leads",value:stats.totalLeads},{name:"Quotes",value:stats.totalQuotations},{name:"Customers",value:stats.totalCustomers}]} margin={{top:5,right:5,left:-25,bottom:0}}>
                  <defs><linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.indigo}/><stop offset="100%" stopColor={C.violet}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false}/>
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize:11,fontWeight:500}} tickLine={false} axisLine={false} dy={5}/>
                  <YAxis stroke="#94a3b8" tick={{fontSize:11,fontWeight:500}} tickLine={false} axisLine={false} dx={-5}/>
                  <Tooltip content={<CT/>}/>
                  <Bar dataKey="value" name="Count" fill="url(#bg1)" radius={[10,10,0,0]} maxBarSize={60} isAnimationActive animationBegin={900} animationDuration={1600} animationEasing="ease-out"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariant} className="lg:col-span-3 bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-base font-bold text-slate-800 flex items-center gap-2"><FiUsers className="text-indigo-500"/>Recent Activity</p>
                <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wide">Latest leads onboarded</p>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-sm border border-indigo-100">{recent.length} entries</span>
            </div>
            <div className="space-y-3">
              {recent.length===0?(<div className="flex flex-col items-center justify-center py-12 text-slate-300"><FiUsers className="w-12 h-12 mb-3 opacity-30"/><p className="text-sm font-medium">No activity to show</p></div>):
              recent.map((a,i)=>(
                <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.1+0.7,duration:0.5,ease:[0.22, 1, 0.36, 1]}} key={a.id||i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm" style={{background:sCol(a.status)}}>{(a.name||"?").charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-800 truncate">{a.name||"—"}</p><p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mt-0.5">{a.src||"Lead"} <span className="mx-1.5 text-slate-300">•</span> {a.date?new Date(a.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}):"—"}</p></div>
                  <span className={`text-[9px] font-bold px-3 py-1.5 rounded-lg shrink-0 uppercase tracking-widest shadow-sm ${sBg(a.status)}`}>{a.status}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

      </motion.div>
    </Base>
  );
}

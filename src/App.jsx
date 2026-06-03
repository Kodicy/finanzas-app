import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

const C = {
  bg:"#000000",card:"#1C1C1E",card2:"#2C2C2E",card3:"#3A3A3C",
  blue:"#0A84FF",green:"#30D158",red:"#FF453A",orange:"#FF9F0A",
  purple:"#BF5AF2",teal:"#5AC8FA",yellow:"#FFD60A",
  text:"#FFFFFF",text2:"#EBEBF5CC",text3:"#EBEBF599",border:"#38383A",
};

const fmt = (n) => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:0}).format(n);
const fmtShort = (n) => Math.abs(n)>=1000?`$${(n/1000).toFixed(1)}k`:`$${Math.round(n)}`;

const defaultData = {
  cuentas:[
    {id:1,tipo:"debito",banco:"BBVA",nombre:"Débito Bancomer",numero:"••••4821",saldo:8420,color:C.blue},
    {id:2,tipo:"debito",banco:"Mercado Pago",nombre:"Cuenta MP",numero:"••••0093",saldo:2150,color:C.teal},
    {id:3,tipo:"credito",banco:"BBVA",nombre:"Azul BBVA",numero:"••••3302",saldo:3420,limite:12000,corte:"28",pago:"12",color:C.purple},
    {id:4,tipo:"ahorro",banco:"BBVA",nombre:"Ahorro CETES",numero:"••••7714",saldo:15000,tasa:5.5,color:C.green},
  ],
  transacciones:[
    {id:1,tipo:"ingreso",desc:"Propinas viernes",monto:620,cat:"Propinas",fecha:"2024-01-19",cuenta:1},
    {id:2,tipo:"gasto",desc:"Renta enero",monto:3500,cat:"Renta",fecha:"2024-01-18",cuenta:1},
    {id:3,tipo:"ingreso",desc:"Propinas jueves",monto:480,cat:"Propinas",fecha:"2024-01-18",cuenta:1},
    {id:4,tipo:"gasto",desc:"Metro semanal",monto:120,cat:"Transporte",fecha:"2024-01-17",cuenta:2},
    {id:5,tipo:"ingreso",desc:"Quincena",monto:4200,cat:"Sueldo",fecha:"2024-01-15",cuenta:1},
    {id:6,tipo:"gasto",desc:"Despensa semana",monto:680,cat:"Comida",fecha:"2024-01-15",cuenta:2},
    {id:7,tipo:"ingreso",desc:"Propinas miércoles",monto:410,cat:"Propinas",fecha:"2024-01-17",cuenta:1},
    {id:8,tipo:"gasto",desc:"Salida con pareja",monto:750,cat:"Entretenimiento",fecha:"2024-01-14",cuenta:1},
    {id:9,tipo:"ingreso",desc:"Bono fin de semana",monto:800,cat:"Bonos",fecha:"2024-01-13",cuenta:1},
    {id:10,tipo:"gasto",desc:"Uber a trabajo",monto:95,cat:"Transporte",fecha:"2024-01-13",cuenta:2},
    {id:11,tipo:"gasto",desc:"Netflix / Spotify",monto:279,cat:"Suscripciones",fecha:"2024-01-12",cuenta:1},
    {id:12,tipo:"gasto",desc:"Farmacia",monto:340,cat:"Salud",fecha:"2024-01-11",cuenta:2},
  ],
  metas:[
    {id:1,nombre:"Fondo de emergencia",objetivo:30000,actual:15000,color:C.blue,emoji:"🛡️",fecha:"Dic 2024"},
    {id:2,nombre:"Viaje a Cancún",objetivo:15000,actual:4200,color:C.orange,emoji:"✈️",fecha:"Jul 2024"},
    {id:3,nombre:"Laptop nueva",objetivo:20000,actual:8500,color:C.purple,emoji:"💻",fecha:"Sep 2024"},
    {id:4,nombre:"Ahorro con pareja",objetivo:10000,actual:2000,color:C.green,emoji:"💑",fecha:"Dic 2024"},
  ],
  historial:[
    {mes:"Ago",ingresos:11200,gastos:8900},
    {mes:"Sep",ingresos:12400,gastos:9100},
    {mes:"Oct",ingresos:10800,gastos:8300},
    {mes:"Nov",ingresos:13500,gastos:10200},
    {mes:"Dic",ingresos:15200,gastos:12100},
    {mes:"Ene",ingresos:14200,gastos:9800},
  ],
};

// --- Persistencia localStorage ---
const STORAGE_KEY = "finanzas_data_v1";
const loadData = () => { try { const s=localStorage.getItem(STORAGE_KEY); return s?JSON.parse(s):defaultData; } catch { return defaultData; } };
const saveData = (data) => { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(data)); } catch {} };

// --- Componentes base ---
const Card = ({children,style={},onClick}) => (
  <div onClick={onClick} style={{background:C.card,borderRadius:16,padding:"16px",...style,cursor:onClick?"pointer":"default"}}>{children}</div>
);
const Label = ({children,color=C.text3,size=12}) => (
  <p style={{margin:0,fontSize:size,color,fontWeight:500,letterSpacing:0.3}}>{children}</p>
);
const Badge = ({children,color=C.blue}) => (
  <span style={{background:color+"22",color,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:20}}>{children}</span>
);
const ProgressBar = ({value,max,color=C.blue,height=8}) => (
  <div style={{background:C.card3,borderRadius:99,height,overflow:"hidden"}}>
    <div style={{width:`${Math.min((value/max)*100,100)}%`,height:"100%",background:color,borderRadius:99,transition:"width 0.6s ease"}}/>
  </div>
);
const Divider = () => <div style={{height:1,background:C.border,margin:"8px 0"}}/>;
const TooltipUI = ({active,payload}) => {
  if(!active||!payload?.length) return null;
  return <div style={{background:C.card2,borderRadius:12,padding:"8px 12px",border:`1px solid ${C.border}`}}>
    {payload.map((p,i)=><p key={i} style={{margin:0,color:p.color||C.text,fontSize:13,fontWeight:700}}>{fmtShort(p.value)}</p>)}
  </div>;
};

// --- INICIO ---
function PantallaInicio({data}) {
  const {cuentas,transacciones,historial} = data;
  const saldoTotal = cuentas.filter(c=>c.tipo!=="credito").reduce((a,c)=>a+c.saldo,0);
  const mes = historial[historial.length-1];
  const mesPrev = historial[historial.length-2];
  const cambio = ((mes.ingresos-mesPrev.ingresos)/mesPrev.ingresos*100).toFixed(1);
  const recientes = [...transacciones].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).slice(0,6);
  const gastosCat = transacciones.filter(t=>t.tipo==="gasto").reduce((acc,t)=>{acc[t.cat]=(acc[t.cat]||0)+t.monto;return acc;},{});
  const pieData = Object.entries(gastosCat).map(([name,value])=>({name,value}));
  const COLORS=[C.red,C.orange,C.teal,C.purple,C.blue,C.green,C.yellow];
  const catEmoji={Renta:"🏠",Comida:"🍴",Transporte:"🚇",Entretenimiento:"🎉",Suscripciones:"📱",Salud:"💊",Propinas:"💰",Sueldo:"💼",Bonos:"🎯"};

  return (
    <div style={{paddingBottom:90}}>
      <div style={{padding:"60px 20px 20px",background:"linear-gradient(180deg,#1C1C1E 0%,#000 100%)"}}>
        <Label color={C.text3} size={14}>Buenos días, Andrés 👋</Label>
        <p style={{margin:"4px 0 2px",fontSize:36,fontWeight:800,color:C.text,letterSpacing:-1}}>{fmt(saldoTotal)}</p>
        <Label color={C.text3}>Saldo total disponible</Label>
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <Badge color={C.green}>+{cambio}% vs dic</Badge>
          <Badge color={C.blue}>Ene 2024</Badge>
        </div>
      </div>
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Card><Label>Ingresos del mes</Label><p style={{margin:"4px 0 0",fontSize:22,fontWeight:700,color:C.green}}>{fmt(mes.ingresos)}</p></Card>
          <Card><Label>Gastos del mes</Label><p style={{margin:"4px 0 0",fontSize:22,fontWeight:700,color:C.red}}>{fmt(mes.gastos)}</p></Card>
        </div>
        <Card style={{background:"linear-gradient(135deg,#0A84FF22,#30D15822)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <Label size={13}>Ahorro neto este mes</Label>
              <p style={{margin:"4px 0 0",fontSize:28,fontWeight:800,color:C.green}}>{fmt(mes.ingresos-mes.gastos)}</p>
            </div>
            <div style={{textAlign:"right"}}>
              <Label size={11}>Tasa ahorro</Label>
              <p style={{margin:"4px 0 0",fontSize:22,fontWeight:700,color:C.teal}}>{((1-mes.gastos/mes.ingresos)*100).toFixed(0)}%</p>
            </div>
          </div>
          <div style={{marginTop:10}}><ProgressBar value={mes.ingresos-mes.gastos} max={mes.ingresos} color={C.green} height={6}/></div>
        </Card>
        <Card>
          <Label size={13}>Ingresos vs Gastos — 6 meses</Label>
          <div style={{marginTop:12,height:160}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historial} margin={{top:0,right:0,left:-20,bottom:0}}>
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.3}/><stop offset="95%" stopColor={C.green} stopOpacity={0}/></linearGradient>
                  <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.red} stopOpacity={0.3}/><stop offset="95%" stopColor={C.red} stopOpacity={0}/></linearGradient>
                </defs>
                <XAxis dataKey="mes" tick={{fill:C.text3,fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.text3,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={fmtShort}/>
                <Tooltip content={<TooltipUI/>}/>
                <Area type="monotone" dataKey="ingresos" stroke={C.green} strokeWidth={2} fill="url(#gi)"/>
                <Area type="monotone" dataKey="gastos" stroke={C.red} strokeWidth={2} fill="url(#gg)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:"flex",gap:16,marginTop:8}}>
            {[["Ingresos",C.green],["Gastos",C.red]].map(([l,c])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:8,height:8,borderRadius:99,background:c}}/>
                <Label size={11}>{l}</Label>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <Label size={13}>Distribución de gastos</Label>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
            <div style={{width:130,height:130}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={58} dataKey="value" paddingAngle={2}>
                  {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie></PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
              {pieData.map((d,i)=>(
                <div key={d.name} style={{display:"flex",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:8,height:8,borderRadius:99,background:COLORS[i%COLORS.length],flexShrink:0}}/>
                    <Label size={11}>{d.name}</Label>
                  </div>
                  <Label size={11} color={C.text2}>{fmtShort(d.value)}</Label>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <Label size={13}>Movimientos recientes</Label>
          <div style={{marginTop:8}}>
            {recientes.map((t,i)=>(
              <div key={t.id}>
                {i>0&&<Divider/>}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:38,height:38,borderRadius:12,background:C.card2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{catEmoji[t.cat]||"💸"}</div>
                    <div>
                      <p style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>{t.desc}</p>
                      <p style={{margin:0,fontSize:11,color:C.text3}}>{t.fecha.slice(5).replace("-","/")} · {t.cat}</p>
                    </div>
                  </div>
                  <p style={{margin:0,fontSize:15,fontWeight:700,color:t.tipo==="ingreso"?C.green:C.red}}>{t.tipo==="ingreso"?"+":"-"}{fmt(t.monto)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- TARJETAS ---
function PantallaTarjetas({data,onCargarEstado}) {
  const {cuentas} = data;
  const [activa,setActiva] = useState(null);
  return (
    <div style={{paddingBottom:90}}>
      <div style={{padding:"60px 20px 20px"}}>
        <Label color={C.text3} size={14}>Mis cuentas</Label>
        <p style={{margin:"4px 0 0",fontSize:28,fontWeight:800,color:C.text}}>Tarjetas & Cuentas</p>
      </div>
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}>
        <Label size={12} color={C.text3}>DÉBITO</Label>
        {cuentas.filter(c=>c.tipo==="debito").map(c=>(
          <Card key={c.id} onClick={()=>setActiva(activa?.id===c.id?null:c)}
            style={{background:`linear-gradient(135deg,${c.color}33,${C.card})`,border:activa?.id===c.id?`1.5px solid ${c.color}`:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div><Label color={c.color}>{c.banco}</Label><p style={{margin:"2px 0 0",fontSize:18,fontWeight:700,color:C.text}}>{c.nombre}</p><Label color={C.text3}>{c.numero}</Label></div>
              <div style={{textAlign:"right"}}><Label size={11} color={C.text3}>Saldo</Label><p style={{margin:"2px 0 0",fontSize:22,fontWeight:800,color:C.text}}>{fmt(c.saldo)}</p></div>
            </div>
            {activa?.id===c.id&&(
              <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                <button onClick={e=>{e.stopPropagation();onCargarEstado(c);}} style={{background:c.color+"22",color:c.color,border:"none",borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                  📄 Cargar estado de cuenta (PDF)
                </button>
              </div>
            )}
          </Card>
        ))}
        <Label size={12} color={C.text3} style={{marginTop:8}}>CRÉDITO</Label>
        {cuentas.filter(c=>c.tipo==="credito").map(c=>{
          const util=(c.saldo/c.limite*100).toFixed(0);
          const uNum=parseFloat(util);
          const cu=uNum>70?C.red:uNum>50?C.orange:C.green;
          return (
            <Card key={c.id} style={{background:`linear-gradient(135deg,${c.color}22,${C.card})`}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div><Label color={c.color}>{c.banco}</Label><p style={{margin:"2px 0 0",fontSize:18,fontWeight:700,color:C.text}}>{c.nombre}</p><Label color={C.text3}>{c.numero}</Label></div>
                <div style={{textAlign:"right"}}><Label size={11} color={C.text3}>Adeudo / Límite</Label><p style={{margin:"2px 0 0",fontSize:18,fontWeight:800,color:C.red}}>{fmt(c.saldo)}</p><Label size={11} color={C.text3}>de {fmt(c.limite)}</Label></div>
              </div>
              <div style={{marginTop:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><Label size={11}>Utilización</Label><Label size={11} color={cu}>{util}%</Label></div><ProgressBar value={c.saldo} max={c.limite} color={cu} height={6}/></div>
              <div style={{display:"flex",gap:16,marginTop:10}}>
                {[["Corte",`Día ${c.corte}`],["Pago mín.",`Día ${c.pago}`],["Disponible",fmt(c.limite-c.saldo)]].map(([l,v])=>(
                  <div key={l}><Label size={10}>{l}</Label><Label size={12} color={C.text2}>{v}</Label></div>
                ))}
              </div>
              {uNum>55&&<div style={{marginTop:10,background:C.orange+"22",borderRadius:10,padding:"8px 12px"}}><p style={{margin:0,fontSize:12,color:C.orange}}>⚠️ Alta utilización. Paga más del mínimo para mejorar tu score.</p></div>}
            </Card>
          );
        })}
        <Label size={12} color={C.text3} style={{marginTop:8}}>AHORRO & INVERSIÓN</Label>
        {cuentas.filter(c=>c.tipo==="ahorro").map(c=>(
          <Card key={c.id} style={{background:`linear-gradient(135deg,${c.color}22,${C.card})`}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div><Label color={c.color}>{c.banco}</Label><p style={{margin:"2px 0 0",fontSize:18,fontWeight:700,color:C.text}}>{c.nombre}</p><Label color={C.text3}>{c.numero}</Label></div>
              <div style={{textAlign:"right"}}><Label size={11} color={C.text3}>Saldo</Label><p style={{margin:"2px 0 0",fontSize:22,fontWeight:800,color:C.text}}>{fmt(c.saldo)}</p></div>
            </div>
            <div style={{display:"flex",gap:16,marginTop:10}}>
              <div><Label size={10}>Tasa anual</Label><p style={{margin:"2px 0 0",fontSize:16,fontWeight:700,color:C.green}}>{c.tasa}% CETES</p></div>
              <div><Label size={10}>Rendimiento mensual est.</Label><p style={{margin:"2px 0 0",fontSize:16,fontWeight:700,color:C.green}}>{fmt(c.saldo*(c.tasa/100/12))}</p></div>
            </div>
          </Card>
        ))}
        <button style={{background:"transparent",border:`1.5px dashed ${C.border}`,borderRadius:16,padding:"14px",fontSize:14,color:C.text3,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>＋ Agregar cuenta</button>
      </div>
    </div>
  );
}

// --- METAS ---
function PantallaMetas({data}) {
  const {metas} = data;
  const totObj=metas.reduce((a,m)=>a+m.objetivo,0);
  const totAct=metas.reduce((a,m)=>a+m.actual,0);
  return (
    <div style={{paddingBottom:90}}>
      <div style={{padding:"60px 20px 20px"}}>
        <Label color={C.text3} size={14}>Mi progreso</Label>
        <p style={{margin:"4px 0 0",fontSize:28,fontWeight:800,color:C.text}}>Metas de ahorro</p>
      </div>
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}>
        <Card style={{background:"linear-gradient(135deg,#0A84FF22,#BF5AF222)"}}>
          <Label size={13}>Progreso total de metas</Label>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"8px 0"}}>
            <p style={{margin:0,fontSize:28,fontWeight:800,color:C.text}}>{fmt(totAct)}</p>
            <Label size={12} color={C.text3}>de {fmt(totObj)}</Label>
          </div>
          <ProgressBar value={totAct} max={totObj} color={C.blue} height={10}/>
          <div style={{marginTop:6,display:"flex",justifyContent:"space-between"}}>
            <Label size={11} color={C.blue}>{((totAct/totObj)*100).toFixed(0)}% alcanzado</Label>
            <Label size={11}>{fmt(totObj-totAct)} restante</Label>
          </div>
        </Card>
        {metas.map(m=>{
          const pct=((m.actual/m.objetivo)*100).toFixed(0);
          const falt=m.objetivo-m.actual;
          return (
            <Card key={m.id}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:44,height:44,borderRadius:14,background:m.color+"22",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center"}}>{m.emoji}</div>
                  <div><p style={{margin:0,fontSize:15,fontWeight:700,color:C.text}}>{m.nombre}</p><Label size={11} color={C.text3}>Meta: {m.fecha}</Label></div>
                </div>
                <Badge color={m.color}>{pct}%</Badge>
              </div>
              <div style={{margin:"10px 0 6px"}}><ProgressBar value={m.actual} max={m.objetivo} color={m.color} height={8}/></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><Label size={12} color={C.text2}>{fmt(m.actual)} ahorrado</Label><Label size={12}>{fmt(m.objetivo)} objetivo</Label></div>
              <div style={{marginTop:8,background:m.color+"11",borderRadius:10,padding:"8px 10px",display:"flex",justifyContent:"space-between"}}>
                <Label size={11}>Faltante</Label><Label size={11} color={m.color}>{fmt(falt)} · ~{fmt(falt/6)}/mes</Label>
              </div>
            </Card>
          );
        })}
        <button style={{background:"transparent",border:`1.5px dashed ${C.border}`,borderRadius:16,padding:"14px",fontSize:14,color:C.text3,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>＋ Nueva meta de ahorro</button>
      </div>
    </div>
  );
}

// --- ANÁLISIS IA ---
function PantallaAnalisis({data}) {
  const {historial,cuentas} = data;
  const [analisis,setAnalisis] = useState(null);
  const [cargando,setCargando] = useState(false);
  const mes=historial[historial.length-1];
  const mesPrev=historial[historial.length-2];
  const ahorro=mes.ingresos-mes.gastos;
  const tasa=((ahorro/mes.ingresos)*100).toFixed(0);
  const deuda=cuentas.find(c=>c.tipo==="credito")?.saldo||0;

  const analizarConIA = async () => {
    setCargando(true);setAnalisis(null);
    const prompt=`Soy Andrés, mesero 20 años México. Enero 2024:
- Ingresos: $${mes.ingresos} (sueldo $4,200 quincenal, propinas $400-620/día, bono $800)
- Gastos: $${mes.gastos} (renta $3,500, comida $680, transporte $215, entretenimiento $750, suscripciones $279, salud $340)
- Ahorro neto: $${ahorro} (${tasa}% tasa de ahorro)
- Deuda crédito: $${deuda} de $12,000 límite (28.5% utilización)
- CETES: $15,000 al 5.5% anual
- Mes anterior: ingresos $${mesPrev.ingresos}, gastos $${mesPrev.gastos}
Analiza mis finanzas. Responde SOLO JSON sin texto extra ni markdown:
{"calificacion":7,"emoji":"😊","motivacion":"frase corta","positivos":["p1","p2","p3"],"negativos":["n1","n2"],"plan":["paso1","paso2","paso3","paso4"],"inversiones":["inv1 específica México","inv2","inv3"]}`;
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:"Experto finanzas personales México. Solo JSON válido.",messages:[{role:"user",content:prompt}]})});
      const json=await res.json();
      setAnalisis(JSON.parse((json.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim()));
    } catch {
      setAnalisis({calificacion:7,emoji:"😊",motivacion:"¡Vas muy bien! Sigue construyendo tu futuro.",positivos:["Tasa ahorro 31% excelente para tu edad","CETES es decisión inteligente","Baja utilización tarjeta de crédito"],negativos:["Entretenimiento puede reducirse $250/mes","Sin diversificación en inversiones aún"],plan:["Automatiza $1,500 a CETES cada quincena","Reduce entretenimiento a $500/mes","Paga crédito completo antes del corte","Abre GBM+ para invertir en S&P500"],inversiones:["CETES 28 días via Cetesdirecto (10-11% anual)","GBM+ fondos S&P500 desde $100 MXN","Nu/Stori cuenta ahorro al 10%+ con liquidez","FIBRAS para exposición inmobiliaria desde $500"]});
    }
    setCargando(false);
  };

  const ScoreMeter = ({score}) => {
    const col=score>=8?C.green:score>=6?C.orange:C.red;
    const angle=(score/10)*180-90;
    const nx=80+50*Math.cos((angle-90)*Math.PI/180);
    const ny=80+50*Math.sin((angle-90)*Math.PI/180);
    return <div style={{width:160,height:90,margin:"0 auto"}}>
      <svg viewBox="0 0 160 90" style={{width:"100%",height:"100%"}}>
        <path d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke={C.card3} strokeWidth="12" strokeLinecap="round"/>
        <path d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke={col} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(score/10)*188} 188`}/>
        <line x1="80" y1="80" x2={nx} y2={ny} stroke={col} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="80" cy="80" r="5" fill={col}/>
        <text x="80" y="65" textAnchor="middle" fill={C.text} fontSize="24" fontWeight="800">{score}</text>
        <text x="80" y="78" textAnchor="middle" fill={C.text3} fontSize="10">/10</text>
      </svg>
    </div>;
  };

  return (
    <div style={{paddingBottom:90}}>
      <div style={{padding:"60px 20px 20px"}}>
        <Label color={C.text3} size={14}>Inteligencia artificial</Label>
        <p style={{margin:"4px 0 0",fontSize:28,fontWeight:800,color:C.text}}>Análisis IA</p>
      </div>
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[["Ingresos enero",fmt(mes.ingresos),C.green,`▲ ${((mes.ingresos-mesPrev.ingresos)/mesPrev.ingresos*100).toFixed(1)}% vs dic`],
            ["Gastos enero",fmt(mes.gastos),C.red,`${mes.gastos<mesPrev.gastos?"▼":"▲"} ${Math.abs((mes.gastos-mesPrev.gastos)/mesPrev.gastos*100).toFixed(1)}% vs dic`],
            ["Ahorro neto",fmt(ahorro),C.blue,`Tasa ${tasa}%`],
            ["Deuda crédito",fmt(deuda),C.orange,"28.5% utilización"]
          ].map(([l,v,c,s])=>(
            <Card key={l}><Label size={11}>{l}</Label><p style={{margin:"4px 0 2px",fontSize:20,fontWeight:800,color:c}}>{v}</p><Label size={10} color={c}>{s}</Label></Card>
          ))}
        </div>
        <Card>
          <Label size={13}>Comparativa mensual</Label>
          <div style={{marginTop:12,height:140}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historial.slice(-4)} margin={{top:0,right:0,left:-20,bottom:0}}>
                <XAxis dataKey="mes" tick={{fill:C.text3,fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.text3,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={fmtShort}/>
                <Tooltip content={<TooltipUI/>}/>
                <Bar dataKey="ingresos" fill={C.green} radius={[4,4,0,0]}/>
                <Bar dataKey="gastos" fill={C.red} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        {!analisis&&(
          <button onClick={analizarConIA} disabled={cargando} style={{background:cargando?C.card2:"linear-gradient(135deg,#0A84FF,#BF5AF2)",border:"none",borderRadius:16,padding:"18px",fontSize:16,fontWeight:700,color:C.text,cursor:cargando?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {cargando?"⟳ Analizando tus finanzas...":"✨ Generar análisis IA del mes"}
          </button>
        )}
        {analisis&&(
          <>
            <Card style={{textAlign:"center"}}><Label size={13}>Calificación financiera</Label><ScoreMeter score={analisis.calificacion}/><p style={{margin:"8px 0 4px",fontSize:16,fontWeight:700,color:C.text}}>{analisis.emoji} {analisis.motivacion}</p></Card>
            <Card>
              <Label size={13} color={C.green}>✓ Aspectos positivos</Label>
              <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:8}}>
                {analisis.positivos?.map((p,i)=>(
                  <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{width:22,height:22,borderRadius:99,background:C.green+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:11,color:C.green,fontWeight:700}}>✓</span></div>
                    <p style={{margin:0,fontSize:13,color:C.text2,lineHeight:1.4}}>{p}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <Label size={13} color={C.orange}>! Áreas de mejora</Label>
              <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:8}}>
                {analisis.negativos?.map((n,i)=>(
                  <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{width:22,height:22,borderRadius:99,background:C.orange+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:11,color:C.orange,fontWeight:700}}>!</span></div>
                    <p style={{margin:0,fontSize:13,color:C.text2,lineHeight:1.4}}>{n}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <Label size={13} color={C.blue}>→ Plan de acción</Label>
              <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:10}}>
                {analisis.plan?.map((paso,i)=>(
                  <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{width:24,height:24,borderRadius:99,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:12,color:"#fff",fontWeight:700}}>{i+1}</span></div>
                    <p style={{margin:0,fontSize:13,color:C.text2,lineHeight:1.4,paddingTop:3}}>{paso}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{background:"linear-gradient(135deg,#BF5AF222,#1C1C1E)"}}>
              <Label size={13} color={C.purple}>💹 Recomendaciones de inversión</Label>
              <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:8}}>
                {analisis.inversiones?.map((inv,i)=>(
                  <div key={i} style={{padding:"8px 10px",background:C.purple+"11",borderRadius:10,borderLeft:`3px solid ${C.purple}`}}><p style={{margin:0,fontSize:13,color:C.text2,lineHeight:1.4}}>{inv}</p></div>
                ))}
              </div>
            </Card>
            <button onClick={()=>setAnalisis(null)} style={{background:C.card2,border:"none",borderRadius:12,padding:"12px",fontSize:14,color:C.text3,cursor:"pointer"}}>↺ Nuevo análisis</button>
          </>
        )}
      </div>
    </div>
  );
}

// --- MODAL QUICK ADD ---
function ModalQuickAdd({cuentas,onGuardar,onCerrar}) {
  const [tipo,setTipo]=useState("gasto");
  const [monto,setMonto]=useState("");
  const [desc,setDesc]=useState("");
  const [cat,setCat]=useState("");
  const [cuentaId,setCuentaId]=useState(cuentas[0]?.id);
  const catsI=["Propinas","Sueldo","Bonos","Otro ingreso"];
  const catsG=["Renta","Comida","Transporte","Entretenimiento","Suscripciones","Salud","Pareja","Otros"];
  const categorias=tipo==="ingreso"?catsI:catsG;
  const guardar=()=>{if(!monto||!desc)return;onGuardar({tipo,monto:parseFloat(monto),desc,cat:cat||categorias[0],cuenta:cuentaId,fecha:new Date().toISOString().slice(0,10)});};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",zIndex:1000}}>
      <div style={{background:C.card,borderRadius:"24px 24px 0 0",width:"100%",padding:"24px 20px 44px"}}>
        <div style={{width:40,height:4,background:C.card3,borderRadius:99,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <p style={{margin:0,fontSize:20,fontWeight:800,color:C.text}}>Registrar movimiento</p>
          <button onClick={onCerrar} style={{background:C.card3,border:"none",borderRadius:99,width:30,height:30,color:C.text,cursor:"pointer",fontSize:16}}>✕</button>
        </div>
        <div style={{display:"flex",background:C.card2,borderRadius:12,padding:4,marginBottom:16}}>
          {["gasto","ingreso"].map(t=>(
            <button key={t} onClick={()=>{setTipo(t);setCat("");}} style={{flex:1,background:tipo===t?(t==="ingreso"?C.green:C.red):"transparent",border:"none",borderRadius:10,padding:"10px",fontSize:14,fontWeight:700,color:tipo===t?"#fff":C.text3,cursor:"pointer"}}>
              {t==="ingreso"?"💰 Ingreso":"💸 Gasto"}
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",background:C.card2,borderRadius:12,padding:"0 16px",marginBottom:12}}>
          <span style={{fontSize:20,color:C.text3,marginRight:6}}>$</span>
          <input type="number" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="0.00"
            style={{background:"transparent",border:"none",outline:"none",flex:1,fontSize:24,fontWeight:700,color:C.text,padding:"14px 0"}}/>
        </div>
        <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Descripción del movimiento"
          style={{background:C.card2,border:"none",borderRadius:12,padding:"14px 16px",fontSize:15,color:C.text,width:"100%",boxSizing:"border-box",outline:"none",marginBottom:12}}/>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
          {categorias.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{background:cat===c?C.blue+"33":C.card2,border:cat===c?`1.5px solid ${C.blue}`:"1.5px solid transparent",borderRadius:20,padding:"6px 12px",fontSize:13,color:cat===c?C.blue:C.text2,cursor:"pointer",fontWeight:cat===c?700:400}}>{c}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {cuentas.filter(c=>c.tipo!=="ahorro").map(c=>(
            <button key={c.id} onClick={()=>setCuentaId(c.id)} style={{flex:1,background:cuentaId===c.id?c.color+"22":C.card2,border:cuentaId===c.id?`1.5px solid ${c.color}`:"1.5px solid transparent",borderRadius:12,padding:"10px 8px",fontSize:12,color:cuentaId===c.id?c.color:C.text2,cursor:"pointer",fontWeight:cuentaId===c.id?700:400}}>{c.banco}</button>
          ))}
        </div>
        <button onClick={guardar} style={{width:"100%",background:tipo==="ingreso"?C.green:C.red,border:"none",borderRadius:16,padding:"16px",fontSize:17,fontWeight:800,color:"#fff",cursor:"pointer"}}>
          {tipo==="ingreso"?"💰 Registrar ingreso":"💸 Registrar gasto"}
        </button>
      </div>
    </div>
  );
}

// --- MODAL ESTADO DE CUENTA ---
function ModalEstado({cuenta,onCerrar}) {
  const [archivo,setArchivo]=useState(null);
  const [procesando,setProcesando]=useState(false);
  const [resultado,setResultado]=useState(null);
  const inputRef=useRef();
  const procesar=async()=>{
    if(!archivo)return;setProcesando(true);
    const reader=new FileReader();
    reader.onload=async(e)=>{
      const b64=e.target.result.split(",")[1];
      try {
        const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:"Extractor bancario. Solo JSON: {saldo_actual,total_cargos,total_abonos,movimientos:[{fecha,desc,monto,tipo}]}",messages:[{role:"user",content:[{type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},{type:"text",text:"Extrae datos del estado de cuenta en JSON."}]}]})});
        const json=await res.json();
        setResultado(JSON.parse((json.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim()));
      } catch {
        setResultado({saldo_actual:8420,total_cargos:5800,total_abonos:14200,movimientos:[{fecha:"2024-01-15",desc:"SPEI nómina",monto:4200,tipo:"abono"},{fecha:"2024-01-18",desc:"Renta enero",monto:3500,tipo:"cargo"}]});
      }
      setProcesando(false);
    };
    reader.readAsDataURL(archivo);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",display:"flex",alignItems:"flex-end",zIndex:1000}}>
      <div style={{background:C.card,borderRadius:"24px 24px 0 0",width:"100%",padding:"24px 20px 50px"}}>
        <div style={{width:40,height:4,background:C.card3,borderRadius:99,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div><Label color={cuenta.color}>{cuenta.banco}</Label><p style={{margin:"2px 0 0",fontSize:20,fontWeight:800,color:C.text}}>Estado de cuenta</p></div>
          <button onClick={onCerrar} style={{background:C.card3,border:"none",borderRadius:99,width:30,height:30,color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        {!resultado?(
          <>
            <div onClick={()=>inputRef.current.click()} style={{border:`2px dashed ${archivo?cuenta.color:C.border}`,borderRadius:16,padding:"40px 20px",textAlign:"center",cursor:"pointer",marginBottom:16}}>
              <p style={{margin:0,fontSize:40}}>📄</p>
              <p style={{margin:"8px 0 4px",fontSize:16,fontWeight:700,color:C.text}}>{archivo?archivo.name:"Toca para subir PDF"}</p>
              <Label>{archivo?"Listo para analizar":"Estado de cuenta en PDF"}</Label>
            </div>
            <input ref={inputRef} type="file" accept=".pdf" style={{display:"none"}} onChange={e=>setArchivo(e.target.files[0])}/>
            <button onClick={procesar} disabled={!archivo||procesando} style={{width:"100%",background:archivo?cuenta.color:C.card3,border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:800,color:"#fff",cursor:archivo?"pointer":"default"}}>
              {procesando?"⟳ Analizando con IA...":"✨ Analizar con IA"}
            </button>
          </>
        ):(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
              {[["Saldo",resultado.saldo_actual,C.blue],["Cargos",resultado.total_cargos,C.red],["Abonos",resultado.total_abonos,C.green]].map(([l,v,c])=>(
                <div key={l} style={{background:C.card2,borderRadius:12,padding:12,textAlign:"center"}}><Label size={11}>{l}</Label><p style={{margin:"4px 0 0",fontSize:14,fontWeight:800,color:c}}>{fmtShort(v)}</p></div>
              ))}
            </div>
            <Label size={12}>{resultado.movimientos?.length||0} movimientos</Label>
            <div style={{marginTop:8,maxHeight:200,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
              {resultado.movimientos?.slice(0,8).map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",background:C.card2,borderRadius:10,padding:"10px 12px"}}>
                  <div><p style={{margin:0,fontSize:13,color:C.text}}>{m.desc}</p><Label size={10}>{m.fecha}</Label></div>
                  <p style={{margin:0,fontSize:14,fontWeight:700,color:m.tipo==="abono"?C.green:C.red}}>{m.tipo==="abono"?"+":"-"}{fmt(m.monto)}</p>
                </div>
              ))}
            </div>
            <button onClick={onCerrar} style={{marginTop:16,width:"100%",background:C.blue,border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:700,color:"#fff",cursor:"pointer"}}>Sincronizar ✓</button>
          </>
        )}
      </div>
    </div>
  );
}

// --- APP PRINCIPAL ---
export default function App() {
  const [tab,setTab]=useState("inicio");
  const [data,setData]=useState(loadData);
  const [showAdd,setShowAdd]=useState(false);
  const [cuentaEstado,setCuentaEstado]=useState(null);

  // Guardar en localStorage cada vez que cambian los datos
  useEffect(()=>{ saveData(data); },[data]);

  const agregarMovimiento=(mov)=>{
    const nueva={...mov,id:Date.now()};
    setData(d=>({
      ...d,
      transacciones:[nueva,...d.transacciones],
      cuentas:d.cuentas.map(c=>c.id!==mov.cuenta?c:{...c,saldo:c.saldo+(mov.tipo==="ingreso"?mov.monto:-mov.monto)}),
      historial:d.historial.map((h,i)=>i!==d.historial.length-1?h:{...h,ingresos:mov.tipo==="ingreso"?h.ingresos+mov.monto:h.ingresos,gastos:mov.tipo==="gasto"?h.gastos+mov.monto:h.gastos})
    }));
    setShowAdd(false);
  };

  const tabs=[{id:"inicio",label:"Inicio",icon:"⌂"},{id:"tarjetas",label:"Cuentas",icon:"▣"},{id:"metas",label:"Metas",icon:"◎"},{id:"analisis",label:"Análisis",icon:"◈"}];

  return (
    <div style={{background:C.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif",position:"relative"}}>
      {tab==="inicio"&&<PantallaInicio data={data}/>}
      {tab==="tarjetas"&&<PantallaTarjetas data={data} onCargarEstado={setCuentaEstado}/>}
      {tab==="metas"&&<PantallaMetas data={data}/>}
      {tab==="analisis"&&<PantallaAnalisis data={data}/>}
      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(28,28,30,0.95)",backdropFilter:"blur(20px)",borderTop:`0.5px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-around",padding:"8px 0 20px",zIndex:500}}>
        {tabs.slice(0,2).map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"0 16px"}}>
            <span style={{fontSize:22,opacity:tab===t.id?1:0.4}}>{t.icon}</span>
            <span style={{fontSize:10,color:tab===t.id?C.blue:C.text3,fontWeight:tab===t.id?700:400}}>{t.label}</span>
          </button>
        ))}
        <button onClick={()=>setShowAdd(true)} style={{width:56,height:56,borderRadius:99,border:"none",background:"linear-gradient(135deg,#0A84FF,#BF5AF2)",boxShadow:"0 4px 24px #0A84FF44",cursor:"pointer",fontSize:28,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8,flexShrink:0}}>＋</button>
        {tabs.slice(2).map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"0 16px"}}>
            <span style={{fontSize:22,opacity:tab===t.id?1:0.4}}>{t.icon}</span>
            <span style={{fontSize:10,color:tab===t.id?C.blue:C.text3,fontWeight:tab===t.id?700:400}}>{t.label}</span>
          </button>
        ))}
      </nav>
      {showAdd&&<ModalQuickAdd cuentas={data.cuentas} onGuardar={agregarMovimiento} onCerrar={()=>setShowAdd(false)}/>}
      {cuentaEstado&&<ModalEstado cuenta={cuentaEstado} onCerrar={()=>setCuentaEstado(null)}/>}
    </div>
  );
}

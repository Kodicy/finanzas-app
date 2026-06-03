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

const emptyData = { nombre:"", cuentas:[], transacciones:[], metas:[], historial:[] };

const STORAGE_KEY = "finanzas_v2";
const load = () => { try { const s=localStorage.getItem(STORAGE_KEY); return s?JSON.parse(s):emptyData; } catch { return emptyData; } };
const save = (d) => { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(d)); } catch {} };

// ─── Componentes base ────────────────────────────────────────────────────────
const Card = ({children,style={},onClick}) => (
  <div onClick={onClick} style={{background:C.card,borderRadius:16,padding:"16px",...style,cursor:onClick?"pointer":"default"}}>{children}</div>
);
const Label = ({children,color=C.text3,size=12,style={}}) => (
  <p style={{margin:0,fontSize:size,color,fontWeight:500,letterSpacing:0.3,...style}}>{children}</p>
);
const Badge = ({children,color=C.blue}) => (
  <span style={{background:color+"22",color,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:20}}>{children}</span>
);
const ProgressBar = ({value,max,color=C.blue,height=8}) => (
  <div style={{background:C.card3,borderRadius:99,height,overflow:"hidden"}}>
    <div style={{width:`${Math.min((value/max)*100,100)}%`,height:"100%",background:color,borderRadius:99,transition:"width 0.5s ease"}}/>
  </div>
);
const Divider = () => <div style={{height:1,background:C.border,margin:"8px 0"}}/>;

const EmptyState = ({emoji,titulo,subtitulo}) => (
  <div style={{textAlign:"center",padding:"48px 24px"}}>
    <p style={{fontSize:48,margin:"0 0 12px"}}>{emoji}</p>
    <p style={{margin:"0 0 6px",fontSize:16,fontWeight:700,color:C.text}}>{titulo}</p>
    <Label>{subtitulo}</Label>
  </div>
);

const TooltipUI = ({active,payload}) => {
  if(!active||!payload?.length) return null;
  return <div style={{background:C.card2,borderRadius:12,padding:"8px 12px",border:`1px solid ${C.border}`}}>
    {payload.map((p,i)=><p key={i} style={{margin:0,color:p.color||C.text,fontSize:13,fontWeight:700}}>{fmtShort(p.value)}</p>)}
  </div>;
};

// ─── ONBOARDING ──────────────────────────────────────────────────────────────
function Onboarding({onTerminar}) {
  const [nombre,setNombre] = useState("");
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 28px"}}>
      <p style={{fontSize:56,margin:"0 0 20px"}}>💰</p>
      <p style={{margin:"0 0 8px",fontSize:30,fontWeight:800,color:C.text,textAlign:"center",letterSpacing:-0.5}}>Bienvenido a</p>
      <p style={{margin:"0 0 40px",fontSize:30,fontWeight:800,background:"linear-gradient(135deg,#0A84FF,#BF5AF2)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-0.5}}>Mis Finanzas</p>
      <div style={{width:"100%",maxWidth:340}}>
        <Label size={13} color={C.text3}>¿CÓMO TE LLAMAS?</Label>
        <input
          value={nombre}
          onChange={e=>setNombre(e.target.value)}
          placeholder="Tu nombre"
          autoFocus
          style={{marginTop:8,background:C.card,border:`1.5px solid ${nombre?C.blue:C.border}`,borderRadius:14,padding:"16px",fontSize:18,color:C.text,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit",transition:"border 0.2s"}}
        />
        <button
          onClick={()=>nombre.trim()&&onTerminar(nombre.trim())}
          disabled={!nombre.trim()}
          style={{marginTop:16,width:"100%",background:nombre.trim()?"linear-gradient(135deg,#0A84FF,#BF5AF2)":C.card2,border:"none",borderRadius:14,padding:"16px",fontSize:17,fontWeight:800,color:nombre.trim()?C.text:C.text3,cursor:nombre.trim()?"pointer":"default",transition:"all 0.2s",fontFamily:"inherit"}}
        >
          Empezar →
        </button>
      </div>
      <Label style={{marginTop:32,textAlign:"center",maxWidth:280}}>Tus datos se guardan solo en tu teléfono, no se comparten con nadie.</Label>
    </div>
  );
}

// ─── MODAL AGREGAR CUENTA ────────────────────────────────────────────────────
function ModalAgregarCuenta({onGuardar,onCerrar}) {
  const [tipo,setTipo] = useState("debito");
  const [banco,setBanco] = useState("");
  const [nombre,setNombre] = useState("");
  const [numero,setNumero] = useState("");
  const [saldo,setSaldo] = useState("");
  const [limite,setLimite] = useState("");
  const [tasa,setTasa] = useState("");

  const colores = {debito:C.blue,credito:C.purple,ahorro:C.green,efectivo:C.orange};

  // Bancos con config automática: [label, tipo sugerido, tasa, color especial]
  const bancosConfig = [
    {id:"Nu Débito",      label:"Nu",           tipo:"debito",  tasa:"",   color:C.purple},
    {id:"Nu Crédito",     label:"Nu Crédito",   tipo:"credito", tasa:"",   color:C.purple},
    {id:"Plata",          label:"Plata",        tipo:"credito", tasa:"",   color:"#C0C0C0"},
    {id:"Vexi Amex",      label:"Vexi Amex",    tipo:"credito", tasa:"",   color:C.blue},
    {id:"Revolut",        label:"Revolut",      tipo:"debito",  tasa:"",   color:"#191C1F"},
    {id:"Revolut Savings",label:"Revolut 💰",   tipo:"ahorro",  tasa:"15", color:"#191C1F"},
    {id:"Efectivo",       label:"💵 Efectivo",  tipo:"efectivo",tasa:"",   color:C.orange},
    {id:"BBVA",           label:"BBVA",         tipo:"debito",  tasa:"",   color:C.blue},
    {id:"Otro",           label:"Otro",         tipo:"debito",  tasa:"",   color:C.teal},
  ];

  const seleccionarBanco = (cfg) => {
    setBanco(cfg.id);
    setTipo(cfg.tipo);
    if(cfg.tasa) setTasa(cfg.tasa);
    else setTasa("");
    // Sugerir nombre automático
    const nombres = {
      "Nu Débito":"Nu Débito","Nu Crédito":"Nu Crédito","Plata":"Plata Crédito",
      "Vexi Amex":"Vexi Amex","Revolut":"Revolut Débito","Revolut Savings":"Revolut Savings",
      "Efectivo":"Efectivo en mano","BBVA":"BBVA Débito"
    };
    if(nombres[cfg.id]) setNombre(nombres[cfg.id]);
  };

  const cfgActual = bancosConfig.find(b=>b.id===banco);

  const guardar = () => {
    if(!banco||!nombre) return;
    if(tipo!=="efectivo" && !saldo) return;
    const cuenta = {
      id: Date.now(),
      tipo: tipo==="efectivo"?"debito":tipo,
      esEfectivo: tipo==="efectivo",
      banco: tipo==="efectivo"?"Efectivo":banco,
      nombre,
      numero: tipo==="efectivo"?"en cartera": (numero ? `••••${numero.slice(-4)}` : "••••0000"),
      saldo: parseFloat(saldo)||0,
      color: cfgActual?.color || colores[tipo] || C.blue,
      ...(tipo==="credito" && { limite: parseFloat(limite)||0, corte:"28", pago:"12" }),
      ...(tipo==="ahorro" && { tasa: parseFloat(tasa)||0 }),
    };
    onGuardar(cuenta);
  };

  const Input = ({label,value,onChange,placeholder,type="text"}) => (
    <div style={{marginBottom:12}}>
      <Label size={11} color={C.text3}>{label}</Label>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type}
        style={{marginTop:6,background:C.card2,border:"none",borderRadius:12,padding:"13px 14px",fontSize:15,color:C.text,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit"}}/>
    </div>
  );

  const listo = banco && nombre && (tipo==="efectivo" || saldo);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"flex-end",zIndex:1000}}>
      <div style={{background:C.card,borderRadius:"24px 24px 0 0",width:"100%",padding:"24px 20px 48px",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:C.card3,borderRadius:99,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <p style={{margin:0,fontSize:20,fontWeight:800,color:C.text}}>Agregar cuenta</p>
          <button onClick={onCerrar} style={{background:C.card3,border:"none",borderRadius:99,width:30,height:30,color:C.text,cursor:"pointer",fontSize:16}}>✕</button>
        </div>

        {/* Selección de banco/cuenta */}
        <div style={{marginBottom:16}}>
          <Label size={11} color={C.text3}>SELECCIONA TU CUENTA</Label>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
            {bancosConfig.map(cfg=>{
              const sel = banco===cfg.id;
              const col = cfg.color||C.blue;
              return (
                <button key={cfg.id} onClick={()=>seleccionarBanco(cfg)}
                  style={{background:sel?col+"33":C.card2,border:sel?`1.5px solid ${col}`:"1.5px solid transparent",borderRadius:20,padding:"8px 14px",fontSize:13,color:sel?col:C.text2,cursor:"pointer",fontWeight:sel?700:500,fontFamily:"inherit"}}>
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tipo (auto-seleccionado pero editable) */}
        {banco && tipo!=="efectivo" && (
          <div style={{marginBottom:14}}>
            <Label size={11} color={C.text3}>TIPO</Label>
            <div style={{display:"flex",gap:8,marginTop:8}}>
              {[["debito","💳 Débito",C.blue],["credito","💳 Crédito",C.purple],["ahorro","💰 Ahorro",C.green]].map(([t,l,c])=>(
                <button key={t} onClick={()=>setTipo(t)} style={{flex:1,background:tipo===t?c+"22":C.card2,border:tipo===t?`1.5px solid ${c}`:"1.5px solid transparent",borderRadius:12,padding:"9px 4px",fontSize:12,color:tipo===t?c:C.text2,cursor:"pointer",fontWeight:tipo===t?700:400,fontFamily:"inherit"}}>{l}</button>
              ))}
            </div>
          </div>
        )}

        {tipo==="efectivo" && (
          <div style={{background:C.orange+"11",borderRadius:12,padding:"10px 14px",marginBottom:14}}>
            <p style={{margin:0,fontSize:13,color:C.orange}}>💵 El efectivo se registra como cuenta de débito especial. Puedes actualizar el saldo cuando cambies lo que traes en cartera.</p>
          </div>
        )}

        <Input label="NOMBRE DE LA CUENTA" value={nombre} onChange={setNombre} placeholder="Ej: Nu Débito"/>
        {tipo!=="efectivo" && <Input label="ÚLTIMOS 4 DÍGITOS (opcional)" value={numero} onChange={setNumero} placeholder="4821" type="number"/>}
        <Input label={tipo==="credito"?"SALDO ACTUAL (lo que debes $)":tipo==="efectivo"?"EFECTIVO EN CARTERA ($)":"SALDO ACTUAL ($)"} value={saldo} onChange={setSaldo} placeholder="0" type="number"/>
        {tipo==="credito" && <Input label="LÍMITE DE CRÉDITO ($)" value={limite} onChange={setLimite} placeholder="12000" type="number"/>}
        {tipo==="ahorro" && (
          <div style={{marginBottom:12}}>
            <Label size={11} color={C.text3}>TASA ANUAL (%)</Label>
            <input value={tasa} onChange={e=>setTasa(e.target.value)} placeholder="15" type="number"
              style={{marginTop:6,background:C.card2,border:"none",borderRadius:12,padding:"13px 14px",fontSize:15,color:C.text,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit"}}/>
            {banco==="Revolut Savings" && <Label size={11} color={C.green} style={{marginTop:4}}>✓ Tasa Revolut Savings: 15% anual</Label>}
          </div>
        )}

        <button onClick={guardar} disabled={!listo}
          style={{width:"100%",background:listo?"linear-gradient(135deg,#0A84FF,#BF5AF2)":C.card2,border:"none",borderRadius:14,padding:"16px",fontSize:16,fontWeight:800,color:C.text,cursor:listo?"pointer":"default",fontFamily:"inherit",marginTop:4}}>
          Guardar cuenta
        </button>
      </div>
    </div>
  );
}

// ─── MODAL AGREGAR META ──────────────────────────────────────────────────────
function ModalAgregarMeta({onGuardar,onCerrar}) {
  const [nombre,setNombre] = useState("");
  const [objetivo,setObjetivo] = useState("");
  const [actual,setActual] = useState("0");
  const [fecha,setFecha] = useState("");
  const [emoji,setEmoji] = useState("🎯");
  const emojis = ["🎯","✈️","🏠","💻","🚗","💍","🛡️","📚","💪","🏖️","🎸","💑"];
  const colores = [C.blue,C.orange,C.purple,C.green,C.teal,C.red];
  const [colorIdx,setColorIdx] = useState(0);
  const guardar = () => {
    if(!nombre||!objetivo) return;
    onGuardar({id:Date.now(),nombre,objetivo:parseFloat(objetivo),actual:parseFloat(actual)||0,fecha:fecha||"2025",emoji,color:colores[colorIdx]});
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"flex-end",zIndex:1000}}>
      <div style={{background:C.card,borderRadius:"24px 24px 0 0",width:"100%",padding:"24px 20px 48px",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:C.card3,borderRadius:99,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <p style={{margin:0,fontSize:20,fontWeight:800,color:C.text}}>Nueva meta</p>
          <button onClick={onCerrar} style={{background:C.card3,border:"none",borderRadius:99,width:30,height:30,color:C.text,cursor:"pointer",fontSize:16}}>✕</button>
        </div>
        <Label size={11} color={C.text3}>ÍCONO</Label>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,margin:"8px 0 14px"}}>
          {emojis.map(e=>(
            <button key={e} onClick={()=>setEmoji(e)} style={{width:42,height:42,background:emoji===e?C.blue+"33":C.card2,border:emoji===e?`1.5px solid ${C.blue}`:"1.5px solid transparent",borderRadius:12,fontSize:22,cursor:"pointer"}}>{e}</button>
          ))}
        </div>
        <Label size={11} color={C.text3}>COLOR</Label>
        <div style={{display:"flex",gap:8,margin:"8px 0 14px"}}>
          {colores.map((c,i)=>(
            <button key={c} onClick={()=>setColorIdx(i)} style={{width:32,height:32,borderRadius:99,background:c,border:colorIdx===i?`3px solid ${C.text}`:"3px solid transparent",cursor:"pointer"}}/>
          ))}
        </div>
        {[["NOMBRE DE LA META","Ej: Viaje a Cancún",nombre,setNombre,"text"],
          ["MONTO OBJETIVO ($)","15000",objetivo,setObjetivo,"number"],
          ["YA TENGO AHORRADO ($)","0",actual,setActual,"number"],
          ["FECHA LÍMITE (Ej: Dic 2025)","Dic 2025",fecha,setFecha,"text"]
        ].map(([l,p,v,s,t])=>(
          <div key={l} style={{marginBottom:12}}>
            <Label size={11} color={C.text3}>{l}</Label>
            <input value={v} onChange={e=>s(e.target.value)} placeholder={p} type={t}
              style={{marginTop:6,background:C.card2,border:"none",borderRadius:12,padding:"13px 14px",fontSize:15,color:C.text,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit"}}/>
          </div>
        ))}
        <button onClick={guardar} disabled={!nombre||!objetivo}
          style={{width:"100%",background:(!nombre||!objetivo)?C.card2:colores[colorIdx],border:"none",borderRadius:14,padding:"16px",fontSize:16,fontWeight:800,color:C.text,cursor:(!nombre||!objetivo)?"default":"pointer",fontFamily:"inherit"}}>
          Guardar meta
        </button>
      </div>
    </div>
  );
}

// ─── MODAL QUICK ADD ─────────────────────────────────────────────────────────
function ModalQuickAdd({cuentas,onGuardar,onCerrar}) {
  const [tipo,setTipo] = useState("gasto");
  const [monto,setMonto] = useState("");
  const [desc,setDesc] = useState("");
  const [cat,setCat] = useState("");
  const [cuentaId,setCuentaId] = useState(cuentas[0]?.id||null);
  const catsI=["Propinas","Propinas efectivo","Sueldo","Bonos","Venta","Transferencia","Otro ingreso"];
  const catsG=["Renta","Comida","Transporte","Entretenimiento","Suscripciones","Salud","Pareja","Ropa","Servicios","Otros"];
  const cats=tipo==="ingreso"?catsI:catsG;
  const guardar=()=>{
    if(!monto||!desc||!cuentaId) return;
    onGuardar({tipo,monto:parseFloat(monto),desc,cat:cat||cats[0],cuenta:cuentaId,fecha:new Date().toISOString().slice(0,10)});
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",zIndex:1000}}>
      <div style={{background:C.card,borderRadius:"24px 24px 0 0",width:"100%",padding:"24px 20px 44px",maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:C.card3,borderRadius:99,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <p style={{margin:0,fontSize:20,fontWeight:800,color:C.text}}>Registrar movimiento</p>
          <button onClick={onCerrar} style={{background:C.card3,border:"none",borderRadius:99,width:30,height:30,color:C.text,cursor:"pointer",fontSize:16}}>✕</button>
        </div>
        <div style={{display:"flex",background:C.card2,borderRadius:12,padding:4,marginBottom:16}}>
          {["gasto","ingreso"].map(t=>(
            <button key={t} onClick={()=>{setTipo(t);setCat("");}} style={{flex:1,background:tipo===t?(t==="ingreso"?C.green:C.red):"transparent",border:"none",borderRadius:10,padding:"10px",fontSize:14,fontWeight:700,color:tipo===t?"#fff":C.text3,cursor:"pointer",fontFamily:"inherit"}}>
              {t==="ingreso"?"💰 Ingreso":"💸 Gasto"}
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",background:C.card2,borderRadius:12,padding:"0 16px",marginBottom:12}}>
          <span style={{fontSize:20,color:C.text3,marginRight:6}}>$</span>
          <input type="number" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="0.00"
            style={{background:"transparent",border:"none",outline:"none",flex:1,fontSize:24,fontWeight:700,color:C.text,padding:"14px 0",fontFamily:"inherit"}}/>
        </div>
        <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="¿En qué?"
          style={{background:C.card2,border:"none",borderRadius:12,padding:"14px 16px",fontSize:15,color:C.text,width:"100%",boxSizing:"border-box",outline:"none",marginBottom:12,fontFamily:"inherit"}}/>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{background:cat===c?C.blue+"33":C.card2,border:cat===c?`1.5px solid ${C.blue}`:"1.5px solid transparent",borderRadius:20,padding:"6px 12px",fontSize:13,color:cat===c?C.blue:C.text2,cursor:"pointer",fontWeight:cat===c?700:400,fontFamily:"inherit"}}>{c}</button>
          ))}
        </div>
        {cuentas.length > 0 ? (
          <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
            {cuentas.filter(c=>c.tipo!=="ahorro").map(c=>(
              <button key={c.id} onClick={()=>setCuentaId(c.id)} style={{flex:1,minWidth:80,background:cuentaId===c.id?c.color+"22":C.card2,border:cuentaId===c.id?`1.5px solid ${c.color}`:"1.5px solid transparent",borderRadius:12,padding:"10px 8px",fontSize:12,color:cuentaId===c.id?c.color:C.text2,cursor:"pointer",fontWeight:cuentaId===c.id?700:400,fontFamily:"inherit"}}>{c.banco}</button>
            ))}
          </div>
        ):(
          <div style={{background:C.card2,borderRadius:12,padding:"12px",textAlign:"center",marginBottom:20}}>
            <Label size={12} color={C.orange}>⚠️ Primero agrega una cuenta en la sección Cuentas</Label>
          </div>
        )}
        <button onClick={guardar} disabled={!monto||!desc||!cuentaId}
          style={{width:"100%",background:(!monto||!desc||!cuentaId)?C.card2:(tipo==="ingreso"?C.green:C.red),border:"none",borderRadius:16,padding:"16px",fontSize:17,fontWeight:800,color:C.text,cursor:(!monto||!desc||!cuentaId)?"default":"pointer",fontFamily:"inherit"}}>
          {tipo==="ingreso"?"💰 Registrar ingreso":"💸 Registrar gasto"}
        </button>
      </div>
    </div>
  );
}

// ─── MODAL ESTADO DE CUENTA ──────────────────────────────────────────────────
function ModalEstado({cuenta,onCerrar}) {
  const [archivo,setArchivo] = useState(null);
  const [procesando,setProcesando] = useState(false);
  const [resultado,setResultado] = useState(null);
  const inputRef = useRef();
  const procesar = async () => {
    if(!archivo) return; setProcesando(true);
    const reader = new FileReader();
    reader.onload = async(e) => {
      const b64 = e.target.result.split(",")[1];
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:"Extractor bancario. Solo JSON válido: {saldo_actual,total_cargos,total_abonos,movimientos:[{fecha,desc,monto,tipo}]}",messages:[{role:"user",content:[{type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},{type:"text",text:"Extrae datos del estado de cuenta en JSON."}]}]})});
        const json = await res.json();
        setResultado(JSON.parse((json.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim()));
      } catch { setResultado({saldo_actual:cuenta.saldo,total_cargos:0,total_abonos:0,movimientos:[]}); }
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
            <button onClick={procesar} disabled={!archivo||procesando} style={{width:"100%",background:archivo?cuenta.color:C.card3,border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:800,color:"#fff",cursor:archivo?"pointer":"default",fontFamily:"inherit"}}>
              {procesando?"⟳ Analizando...":"✨ Analizar con IA"}
            </button>
          </>
        ):(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
              {[["Saldo",resultado.saldo_actual,C.blue],["Cargos",resultado.total_cargos,C.red],["Abonos",resultado.total_abonos,C.green]].map(([l,v,c])=>(
                <div key={l} style={{background:C.card2,borderRadius:12,padding:12,textAlign:"center"}}><Label size={11}>{l}</Label><p style={{margin:"4px 0 0",fontSize:14,fontWeight:800,color:c}}>{fmtShort(v)}</p></div>
              ))}
            </div>
            <div style={{maxHeight:200,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
              {resultado.movimientos?.slice(0,8).map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",background:C.card2,borderRadius:10,padding:"10px 12px"}}>
                  <div><p style={{margin:0,fontSize:13,color:C.text}}>{m.desc}</p><Label size={10}>{m.fecha}</Label></div>
                  <p style={{margin:0,fontSize:14,fontWeight:700,color:m.tipo==="abono"?C.green:C.red}}>{m.tipo==="abono"?"+":"-"}{fmt(m.monto)}</p>
                </div>
              ))}
            </div>
            <button onClick={onCerrar} style={{marginTop:16,width:"100%",background:C.blue,border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Listo ✓</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── INICIO ──────────────────────────────────────────────────────────────────
function PantallaInicio({data}) {
  const {nombre,cuentas,transacciones,historial} = data;
  const saldoTotal = cuentas.filter(c=>c.tipo!=="credito").reduce((a,c)=>a+c.saldo,0);
  const mes = historial[historial.length-1]||{ingresos:0,gastos:0,mes:""};
  const mesPrev = historial[historial.length-2]||{ingresos:0,gastos:0};
  const recientes = [...transacciones].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).slice(0,8);
  const gastosCat = transacciones.filter(t=>t.tipo==="gasto").reduce((acc,t)=>{acc[t.cat]=(acc[t.cat]||0)+t.monto;return acc;},{});
  const pieData = Object.entries(gastosCat).map(([name,value])=>({name,value}));
  const COLORS=[C.red,C.orange,C.teal,C.purple,C.blue,C.green,C.yellow];
  const catEmoji={Renta:"🏠",Comida:"🍴",Transporte:"🚇",Entretenimiento:"🎉",Suscripciones:"📱",Salud:"💊",Propinas:"💰","Propinas efectivo":"💵",Sueldo:"💼",Bonos:"🎯",Pareja:"💑",Ropa:"👕",Venta:"🛍️",Transferencia:"↔️",Servicios:"🔧"};
  const hora = new Date().getHours();
  const saludo = hora<12?"Buenos días":"hora<19"?"Buenas tardes":"Buenas noches";

  return (
    <div style={{paddingBottom:90}}>
      <div style={{padding:"60px 20px 20px",background:"linear-gradient(180deg,#1C1C1E 0%,#000 100%)"}}>
        <Label color={C.text3} size={14}>{hora<12?"Buenos días ☀️":hora<19?"Buenas tardes 🌤️":"Buenas noches 🌙"}</Label>
        <p style={{margin:"2px 0 4px",fontSize:28,fontWeight:800,color:C.text}}>{nombre} 👋</p>
        <p style={{margin:"0 0 4px",fontSize:38,fontWeight:800,color:C.text,letterSpacing:-1}}>{fmt(saldoTotal)}</p>
        <Label color={C.text3}>Saldo total disponible</Label>
      </div>

      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}>
        {cuentas.length===0 && (
          <Card style={{background:"linear-gradient(135deg,#0A84FF11,#1C1C1E)",border:`1px dashed ${C.blue}`}}>
            <p style={{margin:"0 0 6px",fontSize:15,fontWeight:700,color:C.text}}>¡Empieza agregando una cuenta!</p>
            <Label size={13}>Ve a la sección <span style={{color:C.blue,fontWeight:700}}>Cuentas</span> y registra tu tarjeta de débito, crédito o ahorro.</Label>
          </Card>
        )}

        {transacciones.length>0 && (
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Card><Label>Ingresos del mes</Label><p style={{margin:"4px 0 0",fontSize:20,fontWeight:700,color:C.green}}>{fmt(mes.ingresos)}</p></Card>
              <Card><Label>Gastos del mes</Label><p style={{margin:"4px 0 0",fontSize:20,fontWeight:700,color:C.red}}>{fmt(mes.gastos)}</p></Card>
            </div>
            {mes.ingresos>0 && (
              <Card style={{background:"linear-gradient(135deg,#0A84FF22,#30D15822)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><Label size={13}>Ahorro neto este mes</Label><p style={{margin:"4px 0 0",fontSize:26,fontWeight:800,color:C.green}}>{fmt(mes.ingresos-mes.gastos)}</p></div>
                  <div style={{textAlign:"right"}}><Label size={11}>Tasa ahorro</Label><p style={{margin:"4px 0 0",fontSize:22,fontWeight:700,color:C.teal}}>{((1-mes.gastos/mes.ingresos)*100).toFixed(0)}%</p></div>
                </div>
                <div style={{marginTop:10}}><ProgressBar value={mes.ingresos-mes.gastos} max={mes.ingresos} color={C.green} height={6}/></div>
              </Card>
            )}
          </>
        )}

        {historial.length>=2 && (
          <Card>
            <Label size={13}>Ingresos vs Gastos</Label>
            <div style={{marginTop:12,height:150}}>
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
          </Card>
        )}

        {pieData.length>0 && (
          <Card>
            <Label size={13}>Distribución de gastos</Label>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
              <div style={{width:120,height:120}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={32} outerRadius={55} dataKey="value" paddingAngle={2}>
                    {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie></PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                {pieData.map((d,i)=>(
                  <div key={d.name} style={{display:"flex",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:7,height:7,borderRadius:99,background:COLORS[i%COLORS.length],flexShrink:0}}/>
                      <Label size={11}>{d.name}</Label>
                    </div>
                    <Label size={11} color={C.text2}>{fmtShort(d.value)}</Label>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {recientes.length>0 ? (
          <Card>
            <Label size={13}>Movimientos recientes</Label>
            <div style={{marginTop:8}}>
              {recientes.map((t,i)=>(
                <div key={t.id}>
                  {i>0&&<Divider/>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:36,height:36,borderRadius:11,background:C.card2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>{catEmoji[t.cat]||"💸"}</div>
                      <div><p style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>{t.desc}</p><p style={{margin:0,fontSize:11,color:C.text3}}>{t.fecha.slice(5).replace("-","/")} · {t.cat}</p></div>
                    </div>
                    <p style={{margin:0,fontSize:14,fontWeight:700,color:t.tipo==="ingreso"?C.green:C.red}}>{t.tipo==="ingreso"?"+":"-"}{fmt(t.monto)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ):(
          <EmptyState emoji="📋" titulo="Sin movimientos aún" subtitulo='Toca el botón ＋ para registrar tu primer ingreso o gasto'/>
        )}
      </div>
    </div>
  );
}

// ─── TARJETAS ────────────────────────────────────────────────────────────────
function PantallaTarjetas({data,onCargarEstado,onAgregarCuenta}) {
  const {cuentas} = data;
  const [activa,setActiva] = useState(null);

  return (
    <div style={{paddingBottom:90}}>
      <div style={{padding:"60px 20px 20px"}}>
        <Label color={C.text3} size={14}>Mis cuentas</Label>
        <p style={{margin:"4px 0 0",fontSize:28,fontWeight:800,color:C.text}}>Tarjetas & Cuentas</p>
      </div>
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}>
        {cuentas.length===0 && <EmptyState emoji="💳" titulo="Sin cuentas registradas" subtitulo="Agrega tu primera tarjeta o cuenta bancaria"/>}

        {["debito","credito","ahorro"].map(tipo=>{
          const lista = cuentas.filter(c=>c.tipo===tipo);
          if(!lista.length) return null;
          const labels = {debito:"DÉBITO",credito:"CRÉDITO",ahorro:"AHORRO & INVERSIÓN"};
          return (
            <div key={tipo}>
              <Label size={12} color={C.text3} style={{marginBottom:8}}>{labels[tipo]}</Label>
              {lista.map(c=>{
                const util = tipo==="credito"?(c.saldo/(c.limite||1)*100).toFixed(0):null;
                const uNum = parseFloat(util);
                const cu = uNum>70?C.red:uNum>50?C.orange:C.green;
                return (
                  <Card key={c.id} onClick={()=>setActiva(activa?.id===c.id?null:c)}
                    style={{background:`linear-gradient(135deg,${c.color}33,${C.card})`,border:activa?.id===c.id?`1.5px solid ${c.color}`:"none",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <div><Label color={c.color}>{c.banco}</Label><p style={{margin:"2px 0 0",fontSize:17,fontWeight:700,color:C.text}}>{c.nombre}</p><Label color={C.text3}>{c.numero}</Label></div>
                      <div style={{textAlign:"right"}}><Label size={11} color={C.text3}>{tipo==="credito"?"Adeudo":"Saldo"}</Label><p style={{margin:"2px 0 0",fontSize:21,fontWeight:800,color:tipo==="credito"?C.red:C.text}}>{fmt(c.saldo)}</p>{tipo==="credito"&&<Label size={11} color={C.text3}>de {fmt(c.limite)}</Label>}</div>
                    </div>
                    {tipo==="credito"&&(
                      <div style={{marginTop:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><Label size={11}>Utilización</Label><Label size={11} color={cu}>{util}%</Label></div>
                        <ProgressBar value={c.saldo} max={c.limite} color={cu} height={5}/>
                        <div style={{display:"flex",gap:14,marginTop:8}}>
                          {[["Corte",`Día ${c.corte}`],["Pago mín.",`Día ${c.pago}`],["Disponible",fmt((c.limite||0)-c.saldo)]].map(([l,v])=>(
                            <div key={l}><Label size={10}>{l}</Label><Label size={11} color={C.text2}>{v}</Label></div>
                          ))}
                        </div>
                      </div>
                    )}
                    {tipo==="ahorro"&&c.tasa>0&&(
                      <div style={{display:"flex",gap:14,marginTop:8}}>
                        <div><Label size={10}>Tasa anual</Label><p style={{margin:"2px 0 0",fontSize:15,fontWeight:700,color:C.green}}>{c.tasa}%</p></div>
                        <div><Label size={10}>Rend. mensual est.</Label><p style={{margin:"2px 0 0",fontSize:15,fontWeight:700,color:C.green}}>{fmt(c.saldo*(c.tasa/100/12))}</p></div>
                      </div>
                    )}
                    {activa?.id===c.id&&(
                      <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                        <button onClick={e=>{e.stopPropagation();onCargarEstado(c);}} style={{background:c.color+"22",color:c.color,border:"none",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                          📄 Cargar estado de cuenta (PDF)
                        </button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          );
        })}

        <button onClick={onAgregarCuenta} style={{background:"transparent",border:`1.5px dashed ${C.blue}`,borderRadius:16,padding:"16px",fontSize:15,color:C.blue,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontWeight:600,fontFamily:"inherit"}}>
          ＋ Agregar cuenta
        </button>
      </div>
    </div>
  );
}

// ─── METAS ───────────────────────────────────────────────────────────────────
function PantallaMetas({data,onAgregarMeta}) {
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
        {metas.length===0 ? (
          <EmptyState emoji="🎯" titulo="Sin metas aún" subtitulo="Define tus primeras metas de ahorro y sigue tu progreso"/>
        ):(
          <>
            <Card style={{background:"linear-gradient(135deg,#0A84FF22,#BF5AF222)"}}>
              <Label size={13}>Progreso total</Label>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"8px 0"}}>
                <p style={{margin:0,fontSize:26,fontWeight:800,color:C.text}}>{fmt(totAct)}</p>
                <Label size={12} color={C.text3}>de {fmt(totObj)}</Label>
              </div>
              <ProgressBar value={totAct} max={totObj} color={C.blue} height={10}/>
              <div style={{marginTop:6,display:"flex",justifyContent:"space-between"}}>
                <Label size={11} color={C.blue}>{totObj>0?((totAct/totObj)*100).toFixed(0):0}% alcanzado</Label>
                <Label size={11}>{fmt(totObj-totAct)} restante</Label>
              </div>
            </Card>
            {metas.map(m=>{
              const pct=m.objetivo>0?((m.actual/m.objetivo)*100).toFixed(0):0;
              const falt=m.objetivo-m.actual;
              return (
                <Card key={m.id}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:44,height:44,borderRadius:14,background:m.color+"22",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center"}}>{m.emoji}</div>
                      <div><p style={{margin:0,fontSize:15,fontWeight:700,color:C.text}}>{m.nombre}</p><Label size={11} color={C.text3}>{m.fecha}</Label></div>
                    </div>
                    <Badge color={m.color}>{pct}%</Badge>
                  </div>
                  <div style={{margin:"10px 0 6px"}}><ProgressBar value={m.actual} max={m.objetivo} color={m.color} height={8}/></div>
                  <div style={{display:"flex",justifyContent:"space-between"}}><Label size={12} color={C.text2}>{fmt(m.actual)} ahorrado</Label><Label size={12}>{fmt(m.objetivo)} objetivo</Label></div>
                  {falt>0&&<div style={{marginTop:8,background:m.color+"11",borderRadius:10,padding:"8px 10px",display:"flex",justifyContent:"space-between"}}><Label size={11}>Faltante</Label><Label size={11} color={m.color}>{fmt(falt)} · ~{fmt(falt/6)}/mes</Label></div>}
                </Card>
              );
            })}
          </>
        )}
        <button onClick={onAgregarMeta} style={{background:"transparent",border:`1.5px dashed ${C.blue}`,borderRadius:16,padding:"16px",fontSize:15,color:C.blue,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontWeight:600,fontFamily:"inherit"}}>
          ＋ Nueva meta de ahorro
        </button>
      </div>
    </div>
  );
}

// ─── ANÁLISIS IA ─────────────────────────────────────────────────────────────
function PantallaAnalisis({data}) {
  const {nombre,historial,transacciones,cuentas} = data;
  const [analisis,setAnalisis] = useState(null);
  const [cargando,setCargando] = useState(false);
  const mes=historial[historial.length-1]||{ingresos:0,gastos:0};
  const mesPrev=historial[historial.length-2]||{ingresos:0,gastos:0};
  const ahorro=mes.ingresos-mes.gastos;
  const tasa=mes.ingresos>0?((ahorro/mes.ingresos)*100).toFixed(0):0;
  const deuda=cuentas.find(c=>c.tipo==="credito")?.saldo||0;
  const limite=cuentas.find(c=>c.tipo==="credito")?.limite||0;
  const util=limite>0?((deuda/limite)*100).toFixed(0):0;

  const analizarConIA = async () => {
    if(transacciones.length===0){return;}
    setCargando(true);setAnalisis(null);
    const resumen=transacciones.filter(t=>t.tipo==="gasto").reduce((acc,t)=>{acc[t.cat]=(acc[t.cat]||0)+t.monto;return acc;},[]);
    const prompt=`Soy ${nombre||"usuario"}, joven en México. Finanzas del mes:
- Ingresos: $${mes.ingresos}
- Gastos: $${mes.gastos} (desglose: ${JSON.stringify(resumen)})
- Ahorro neto: $${ahorro} (tasa ${tasa}%)
- Deuda crédito: $${deuda} de $${limite} límite (${util}% utilización)
- Cuentas ahorro: $${cuentas.filter(c=>c.tipo==="ahorro").reduce((a,c)=>a+c.saldo,0)}
Analiza mis finanzas. SOLO JSON sin texto extra:
{"calificacion":7,"emoji":"😊","motivacion":"frase corta","positivos":["p1","p2","p3"],"negativos":["n1","n2"],"plan":["paso1","paso2","paso3","paso4"],"inversiones":["inv1 México específica","inv2","inv3"]}`;
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:"Experto finanzas personales México. Solo JSON válido.",messages:[{role:"user",content:prompt}]})});
      const json=await res.json();
      setAnalisis(JSON.parse((json.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim()));
    } catch {
      setAnalisis({calificacion:7,emoji:"😊",motivacion:"¡Vas muy bien! Sigue así.",positivos:["Estás llevando control de tus finanzas","Tienes metas claras de ahorro"],negativos:["Agrega más movimientos para mejor análisis"],plan:["Registra todos tus ingresos y gastos","Define una meta de ahorro mensual","Considera abrir una cuenta CETES","Revisa tus suscripciones innecesarias"],inversiones:["CETES vía Cetesdirecto (10-11% anual)","GBM+ fondos S&P500 desde $100","Nu/Stori cuenta ahorro al 10%+","FIBRAS desde $500 MXN"]});
    }
    setCargando(false);
  };

  const ScoreMeter=({score})=>{
    const col=score>=8?C.green:score>=6?C.orange:C.red;
    const ang=(score/10)*180-90;
    const nx=80+50*Math.cos((ang-90)*Math.PI/180);
    const ny=80+50*Math.sin((ang-90)*Math.PI/180);
    return <div style={{width:160,height:90,margin:"0 auto"}}><svg viewBox="0 0 160 90" style={{width:"100%",height:"100%"}}>
      <path d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke={C.card3} strokeWidth="12" strokeLinecap="round"/>
      <path d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke={col} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(score/10)*188} 188`}/>
      <line x1="80" y1="80" x2={nx} y2={ny} stroke={col} strokeWidth="3" strokeLinecap="round"/>
      <circle cx="80" cy="80" r="5" fill={col}/>
      <text x="80" y="63" textAnchor="middle" fill={C.text} fontSize="24" fontWeight="800">{score}</text>
      <text x="80" y="78" textAnchor="middle" fill={C.text3} fontSize="10">/10</text>
    </svg></div>;
  };

  if(transacciones.length===0) return (
    <div style={{paddingBottom:90}}>
      <div style={{padding:"60px 20px 20px"}}><Label color={C.text3} size={14}>Inteligencia artificial</Label><p style={{margin:"4px 0 0",fontSize:28,fontWeight:800,color:C.text}}>Análisis IA</p></div>
      <div style={{padding:"0 16px"}}><EmptyState emoji="🤖" titulo="Sin datos suficientes" subtitulo="Registra al menos algunos ingresos y gastos para que la IA pueda analizarte"/></div>
    </div>
  );

  return (
    <div style={{paddingBottom:90}}>
      <div style={{padding:"60px 20px 20px"}}><Label color={C.text3} size={14}>Inteligencia artificial</Label><p style={{margin:"4px 0 0",fontSize:28,fontWeight:800,color:C.text}}>Análisis IA</p></div>
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[["Ingresos",fmt(mes.ingresos),C.green],["Gastos",fmt(mes.gastos),C.red],["Ahorro",fmt(ahorro),C.blue],["Deuda",fmt(deuda),C.orange]].map(([l,v,c])=>(
            <Card key={l}><Label size={11}>{l}</Label><p style={{margin:"4px 0 0",fontSize:19,fontWeight:800,color:c}}>{v}</p></Card>
          ))}
        </div>
        {historial.length>=2&&(
          <Card>
            <Label size={13}>Comparativa mensual</Label>
            <div style={{marginTop:12,height:130}}>
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
        )}
        {!analisis&&(
          <button onClick={analizarConIA} disabled={cargando} style={{background:cargando?C.card2:"linear-gradient(135deg,#0A84FF,#BF5AF2)",border:"none",borderRadius:16,padding:"18px",fontSize:16,fontWeight:700,color:C.text,cursor:cargando?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"inherit"}}>
            {cargando?"⟳ Analizando tus finanzas...":"✨ Generar análisis IA"}
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
            <button onClick={()=>setAnalisis(null)} style={{background:C.card2,border:"none",borderRadius:12,padding:"12px",fontSize:14,color:C.text3,cursor:"pointer",fontFamily:"inherit"}}>↺ Nuevo análisis</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ───────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab] = useState("inicio");
  const [data,setData] = useState(load);
  const [showAdd,setShowAdd] = useState(false);
  const [showAddCuenta,setShowAddCuenta] = useState(false);
  const [showAddMeta,setShowAddMeta] = useState(false);
  const [cuentaEstado,setCuentaEstado] = useState(null);

  useEffect(()=>{ save(data); },[data]);

  const getNombreMes = () => {
    const meses=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return meses[new Date().getMonth()];
  };

  const actualizarHistorial = (data, tipo, monto) => {
    const mesActual = getNombreMes();
    const idx = data.historial.findIndex(h=>h.mes===mesActual);
    if(idx>=0) {
      const nuevo = [...data.historial];
      nuevo[idx] = {...nuevo[idx], ingresos: nuevo[idx].ingresos+(tipo==="ingreso"?monto:0), gastos: nuevo[idx].gastos+(tipo==="gasto"?monto:0)};
      return nuevo;
    }
    return [...data.historial, {mes:mesActual, ingresos:tipo==="ingreso"?monto:0, gastos:tipo==="gasto"?monto:0}];
  };

  const agregarMovimiento = (mov) => {
    const nueva = {...mov,id:Date.now()};
    setData(d=>({
      ...d,
      transacciones:[nueva,...d.transacciones],
      cuentas:d.cuentas.map(c=>c.id!==mov.cuenta?c:{...c,saldo:c.saldo+(mov.tipo==="ingreso"?mov.monto:-mov.monto)}),
      historial:actualizarHistorial(d,mov.tipo,mov.monto)
    }));
    setShowAdd(false);
  };

  const agregarCuenta = (cuenta) => {
    setData(d=>({...d,cuentas:[...d.cuentas,cuenta]}));
    setShowAddCuenta(false);
  };

  const agregarMeta = (meta) => {
    setData(d=>({...d,metas:[...d.metas,meta]}));
    setShowAddMeta(false);
  };

  const setNombre = (nombre) => {
    setData(d=>({...d,nombre}));
  };

  if(!data.nombre) return <Onboarding onTerminar={setNombre}/>;

  const tabs=[{id:"inicio",label:"Inicio",icon:"⌂"},{id:"tarjetas",label:"Cuentas",icon:"▣"},{id:"metas",label:"Metas",icon:"◎"},{id:"analisis",label:"Análisis",icon:"◈"}];

  return (
    <div style={{background:C.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif",position:"relative"}}>
      {tab==="inicio"&&<PantallaInicio data={data}/>}
      {tab==="tarjetas"&&<PantallaTarjetas data={data} onCargarEstado={setCuentaEstado} onAgregarCuenta={()=>setShowAddCuenta(true)}/>}
      {tab==="metas"&&<PantallaMetas data={data} onAgregarMeta={()=>setShowAddMeta(true)}/>}
      {tab==="analisis"&&<PantallaAnalisis data={data}/>}

      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(28,28,30,0.95)",backdropFilter:"blur(20px)",borderTop:`0.5px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-around",padding:"8px 0 20px",zIndex:500}}>
        {tabs.slice(0,2).map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"0 16px",fontFamily:"inherit"}}>
            <span style={{fontSize:22,opacity:tab===t.id?1:0.4}}>{t.icon}</span>
            <span style={{fontSize:10,color:tab===t.id?C.blue:C.text3,fontWeight:tab===t.id?700:400}}>{t.label}</span>
          </button>
        ))}
        <button onClick={()=>setShowAdd(true)} style={{width:56,height:56,borderRadius:99,border:"none",background:"linear-gradient(135deg,#0A84FF,#BF5AF2)",boxShadow:"0 4px 24px #0A84FF44",cursor:"pointer",fontSize:28,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8,flexShrink:0}}>＋</button>
        {tabs.slice(2).map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"0 16px",fontFamily:"inherit"}}>
            <span style={{fontSize:22,opacity:tab===t.id?1:0.4}}>{t.icon}</span>
            <span style={{fontSize:10,color:tab===t.id?C.blue:C.text3,fontWeight:tab===t.id?700:400}}>{t.label}</span>
          </button>
        ))}
      </nav>

      {showAdd&&<ModalQuickAdd cuentas={data.cuentas} onGuardar={agregarMovimiento} onCerrar={()=>setShowAdd(false)}/>}
      {showAddCuenta&&<ModalAgregarCuenta onGuardar={agregarCuenta} onCerrar={()=>setShowAddCuenta(false)}/>}
      {showAddMeta&&<ModalAgregarMeta onGuardar={agregarMeta} onCerrar={()=>setShowAddMeta(false)}/>}
      {cuentaEstado&&<ModalEstado cuenta={cuentaEstado} onCerrar={()=>setCuentaEstado(null)}/>}
    </div>
  );
}

/* =============================================
   FÚTBOL PREMIER — script.js v6.0
============================================= */
const $  = id => document.getElementById(id);
const $$ = s  => document.querySelectorAll(s);

let adminLogueado = false;
let carrito       = [];
let productos     = JSON.parse(localStorage.getItem("productos"))  || [];
let historial     = JSON.parse(localStorage.getItem("historial"))  || [];
let cupones       = JSON.parse(localStorage.getItem("cupones"))    || [];
let favoritos     = JSON.parse(localStorage.getItem("favoritos"))  || [];
let resenas       = JSON.parse(localStorage.getItem("resenas"))    || [];
let cuponAplicado = null;
let countdownInterval = null;
let estrellasVal  = 0;
let compararLista = [];
let productoSel   = null; // para modal de talla desde card

/* =============================================   PREVIEW IMÁGENES + PORTADA   */
let imagenesPreview = []; // {file, url, esPortada}
let portadaIndex = 0;

const inputImagen = $("imagen");
if (inputImagen) {
    inputImagen.addEventListener("change", () => {
        const archivos = Array.from(inputImagen.files);
        imagenesPreview = archivos.map((file, i) => ({
            file,
            url: URL.createObjectURL(file),
            esPortada: i === 0
        }));
        portadaIndex = 0;
        renderPreviewImagenes();
    });
}

function renderPreviewImagenes() {
    const cont = $("preview-imagenes");
    if (!cont) return;
    cont.innerHTML = "";
    if (!imagenesPreview.length) { cont.style.display = "none"; return; }
    cont.style.display = "grid";
    imagenesPreview.forEach((img, i) => {
        const div = document.createElement("div");
        div.className = "preview-img-item" + (i === portadaIndex ? " preview-img-portada" : "");
        div.innerHTML = `
            <img src="${img.url}" alt="preview">
            ${i === portadaIndex ? '<span class="preview-portada-badge">⭐ Portada</span>' : '<button class="preview-portada-btn">Hacer portada</button>'}
        `;
        if (i !== portadaIndex) {
            div.querySelector(".preview-portada-btn").addEventListener("click", () => {
                portadaIndex = i;
                renderPreviewImagenes();
            });
        }
        cont.appendChild(div);
    });
}

/* =============================================   CHECKBOXES TALLAS -> INPUT TEXTO   */
function sincronizarTallasCheckbox() {
    const checks = $$(".talla-check");
    const inputTallas = $("tallas");
    if (!checks.length || !inputTallas) return;
    checks.forEach(c => {
        c.addEventListener("change", () => {
            const seleccionadas = [...$$(".talla-check:checked")].map(x => x.value);
            if (seleccionadas.length) inputTallas.value = seleccionadas.join(",");
        });
    });
}
sincronizarTallasCheckbox();



/* =============================================   SPLASH   */
window.addEventListener("load", () => {
    setTimeout(() => { const s=$("splash"); s.classList.add("splash-out"); setTimeout(()=>s.remove(),600); }, 2000);
    setTimeout(() => {
        $("skeleton-grid").style.display = "none";
        renderProductos(productos); renderOfertas(); renderResenas();
        initReveal(); iniciarNotifCompras();
        $("contador-favoritos").textContent = favoritos.length || "";
    }, 1800);
});

/* =============================================   TEMA   */
const temaG = localStorage.getItem("tema") || "oscuro";
document.documentElement.setAttribute("data-tema", temaG);
$("toggle-tema").textContent = temaG==="oscuro"?"🌙":"☀️";
$("toggle-tema").addEventListener("click", () => {
    const n = document.documentElement.getAttribute("data-tema")==="oscuro"?"claro":"oscuro";
    document.documentElement.setAttribute("data-tema",n);
    localStorage.setItem("tema",n);
    $("toggle-tema").textContent = n==="oscuro"?"🌙":"☀️";
});

/* =============================================   HERO SLIDER   */
let heroIdx=0;
const slides=$$(".hero-slide"), dots=$$(".hero-dot");
function goSlide(n){slides[heroIdx].classList.remove("activo");dots[heroIdx].classList.remove("activo");heroIdx=(n+slides.length)%slides.length;slides[heroIdx].classList.add("activo");dots[heroIdx].classList.add("activo");}
$("hero-next").addEventListener("click",()=>goSlide(heroIdx+1));
$("hero-prev").addEventListener("click",()=>goSlide(heroIdx-1));
dots.forEach(d=>d.addEventListener("click",()=>goSlide(+d.dataset.idx)));
setInterval(()=>goSlide(heroIdx+1),5000);

/* =============================================   REVEAL   */
function initReveal(){
    const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("revealed");obs.unobserve(e.target);}});},{threshold:0.1});
    $$(".reveal").forEach(el=>obs.observe(el));
}

/* =============================================   SCROLL   */
window.addEventListener("scroll",()=>{
    $("navbar").classList.toggle("scrolled",window.scrollY>50);
    $("volver-arriba").classList.toggle("visible",window.scrollY>400);
});
$("volver-arriba").addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
$$('a[href^="#"]').forEach(a=>a.addEventListener("click",e=>{const t=document.querySelector(a.getAttribute("href"));if(t){e.preventDefault();t.scrollIntoView({behavior:"smooth"});}}));

/* =============================================   BUSCADOR   */
const buscador=$("buscador"), resultados=$("buscador-resultados");
buscador.addEventListener("input",()=>{
    const txt=buscador.value.trim().toLowerCase();
    if(!txt){resultados.style.display="none";renderProductos(productos);return;}
    const found=productos.filter(p=>p.nombre.toLowerCase().includes(txt));
    renderProductos(found);
    const top5=found.slice(0,5);
    if(!top5.length){resultados.style.display="none";return;}
    resultados.innerHTML=top5.map(p=>`<div class="res-item" data-id="${p.id}"><img src="${p.imagenes[0]}" alt="${p.nombre}"><div><p>${p.nombre}</p><span>${p.precio} Bs</span></div></div>`).join("");
    resultados.style.display="block";
    $$(".res-item").forEach(el=>el.addEventListener("click",()=>{const p=productos.find(x=>x.id===+el.dataset.id);if(p){abrirDetalle(p);resultados.style.display="none";buscador.value="";}}));
});
document.addEventListener("click",e=>{if(!e.target.closest(".buscador-wrap"))resultados.style.display="none";});

/* =============================================   CARRITO   */
document.querySelector(".carrito-icono").addEventListener("click",()=>{
    $("carrito-panel").style.display=$("carrito-panel").style.display==="block"?"none":"block";
});
$("cerrar-carrito").addEventListener("click",()=>{$("carrito-panel").style.display="none";});

/* =============================================   CUPONES   */
$("aplicar-cupon").addEventListener("click",()=>{
    const codigo=$("cupon-input").value.trim().toUpperCase();
    const cupon=cupones.find(c=>c.codigo===codigo);
    if(!cupon){mostrarToast("❌ Cupón no válido");return;}
    cuponAplicado=cupon;
    $("descuento-aviso").style.display="block";
    $("descuento-aviso").textContent=`✅ Cupón "${cupon.codigo}" — ${cupon.descuento}% off`;
    actualizarCarrito(true);
    mostrarToast(`🎉 ${cupon.descuento}% de descuento aplicado`);
});

/* =============================================   RANGO PRECIO   */
const pMin=$("precio-min"), pMax=$("precio-max"), rVal=$("rango-valor");
function aplicarRango(){
    let min=+pMin.value, max=+pMax.value;
    if(min>max){[min,max]=[max,min];}
    rVal.textContent=`${min} – ${max} Bs`;
    const activos=[...$$(".filtro-check:checked")].map(x=>x.value);
    let lista=productos.filter(p=>+p.precio>=min&&+p.precio<=max);
    if(activos.length) lista=lista.filter(p=>activos.includes(p.categoria));
    renderProductos(lista);
}
pMin.addEventListener("input",aplicarRango);
pMax.addEventListener("input",aplicarRango);

/* =============================================   FILTROS / ORDENAR   */
$("ordenar").addEventListener("change",()=>{
    let lista=[...productos];const v=$("ordenar").value;
    if(v==="menor") lista.sort((a,b)=>+a.precio - +b.precio);
    if(v==="mayor") lista.sort((a,b)=>+b.precio - +a.precio);
    if(v==="oferta") lista=lista.filter(p=>p.esOferta);
    if(v==="vendidos") lista.sort((a,b)=>(+b.vendidos||0)-(+a.vendidos||0));
    if(v==="agotado") lista=lista.filter(p=>!p.agotado);
    renderProductos(lista);
});

const bannerCats={
    clubes:{titulo:"⚽ Clubes",desc:"Los mejores jerseys de los equipos más grandes del mundo",color:"#3b82f6"},
    retro:{titulo:"🕹 Retro",desc:"Clásicos que nunca pasan de moda",color:"#8b5cf6"},
    selecciones:{titulo:"🌍 Selecciones",desc:"Representa a tu país con estilo",color:"#ef4444"},
    player:{titulo:"⭐ Player Version",desc:"La misma calidad que usan los profesionales",color:"#f59e0b"}
};

$$(".filtro-check").forEach(c=>c.addEventListener("change",()=>{
    const activos=[...$$(".filtro-check:checked")].map(x=>x.value);
    const banner=$("banner-categoria"),bannerContent=$("banner-cat-content");
    if(activos.length===1){
        const cat=bannerCats[activos[0]];
        bannerContent.innerHTML=`<h3>${cat.titulo}</h3><p>${cat.desc}</p>`;
        banner.style.borderColor=cat.color;banner.style.display="block";
    }else banner.style.display="none";
    let lista=activos.length?productos.filter(p=>activos.includes(p.categoria)):productos;
    const min=+pMin.value,max=+pMax.value;
    lista=lista.filter(p=>+p.precio>=min&&+p.precio<=max);
    renderProductos(lista);
}));

/* =============================================   ADMIN TABS   */
$$(".atab").forEach(btn=>btn.addEventListener("click",()=>{
    $$(".atab").forEach(b=>b.classList.remove("activo"));
    $$(".admin-tab-content").forEach(t=>t.classList.remove("activo"));
    btn.classList.add("activo");$("tab-"+btn.dataset.tab).classList.add("activo");
    if(btn.dataset.tab==="editar") renderListaAdmin();
    if(btn.dataset.tab==="cupones") renderListaCupones();
    if(btn.dataset.tab==="resenas-admin") renderResenasPendientes();
}));
$("es-oferta").addEventListener("change",()=>{$("campo-precio-original").style.display=$("es-oferta").checked?"block":"none";});
$("edit-es-oferta").addEventListener("change",()=>{$("edit-campo-oferta").style.display=$("edit-es-oferta").checked?"block":"none";});

/* =============================================   AGREGAR PRODUCTO   */
async function agregarProducto(){
    const archivos=$("imagen").files;
    const imgUrl  =$("img-url").value.trim();
    const nombre  =$("nombre").value.trim();
    const tallas  =$("tallas").value.trim();
    const dorsales=$("dorsales").value.trim();
    const calidad =$("calidad").value.trim();
    const colores =$("colores").value.trim();
    const desc    =$("descripcion").value.trim();
    const cat     =$("categoria").value;
    const precio  =$("precio").value;
    const vendidos=$("vendidos").value;
    const esOferta=$("es-oferta").checked;
    const precioO =$("precio-original").value;
    const finOf   =$("fin-oferta").value;
    const stock   =$("stock").value;
    if(!nombre||!precio){alert("Completa nombre y precio");return;}
    if(esOferta&&!precioO){alert("Ingresa el precio original");return;}
    if(!tallas){alert("Selecciona al menos una talla");return;}
    let imagenes=[];
    if(imgUrl) imagenes=[imgUrl];
    if(archivos.length>0){
        mostrarToast("⏳ Subiendo archivos...");
        // Reordenar archivos: la portada elegida va primero
        const ordenSubida=[...archivos];
        if(imagenesPreview.length===archivos.length && portadaIndex>0){
            const port=ordenSubida.splice(portadaIndex,1)[0];
            ordenSubida.unshift(port);
        }
        for(let i=0;i<ordenSubida.length;i++){
            const fd=new FormData();fd.append("file",ordenSubida[i]);fd.append("upload_preset","futbol-premier");
            const endpoint=ordenSubida[i].type.startsWith("video")?"https://api.cloudinary.com/v1_1/dxcfq1mln/video/upload":"https://api.cloudinary.com/v1_1/dxcfq1mln/image/upload";
            try{const r=await fetch(endpoint,{method:"POST",body:fd});imagenes.push((await r.json()).secure_url);}
            catch(e){alert("Error subiendo archivos");return;}
        }
    }
    if(!imagenes.length){alert("Agrega al menos una imagen o URL");return;}
    productos.push({id:Date.now(),imagenes,nombre,tallas,dorsales,calidad,colores,descripcion:desc,categoria:cat,precio,vendidos:+vendidos||0,esOferta,precioOriginal:esOferta?precioO:null,finOferta:esOferta&&finOf?finOf:null,stock:stock||null,agotado:false,visitas:0});
    guardarLS();renderProductos(productos);renderOfertas();renderAdminStats();limpiarFormulario();
    imagenesPreview=[];portadaIndex=0;
    const previewCont=$("preview-imagenes");if(previewCont){previewCont.innerHTML="";previewCont.style.display="none";}
    $$(".talla-check").forEach(c=>c.checked=false);
    mostrarToast("✅ Jersey agregado");
}

/* =============================================   RENDER   */
function renderProductos(lista){
    marcarMasVendido();
    const cat=$("catalogo");cat.innerHTML="";
    if(!lista.length){cat.innerHTML=`<p class="sin-productos">No se encontraron jerseys 😔</p>`;return;}
    lista.forEach(p=>crearCard(p,cat));initReveal();
}
function renderOfertas(){
    const co=$("catalogo-ofertas");co.innerHTML="";
    const lista=productos.filter(p=>p.esOferta);
    if(!lista.length){$("sin-ofertas").style.display="block";co.style.display="none";}
    else{$("sin-ofertas").style.display="none";co.style.display="grid";lista.forEach(p=>crearCard(p,co));}
}

/* =============================================   CREAR CARD   */
const badgeColor={clubes:"#3b82f6",retro:"#8b5cf6",selecciones:"#ef4444",player:"#f59e0b"};

function crearCard(producto,cont){
    let idx=0;
    const isFav=favoritos.includes(producto.id);
    const isComp=compararLista.some(x=>x.id===producto.id);
    const stockNum=parseInt(producto.stock);
    let stockHTML="";
    if(producto.agotado) stockHTML=`<p class="stock-agotado">❌ AGOTADO</p>`;
    else if(producto.stock&&stockNum<=4) stockHTML=`<p class="stock-bajo">⚠️ ¡Solo quedan ${stockNum}!</p>`;
    else if(producto.stock) stockHTML=`<p class="stock-info">📦 ${producto.stock} disponibles</p>`;

    const vendidosHTML=producto.vendidos&&producto.vendidos>0?`<p class="vendidos-badge">🔥 ${producto.vendidos} vendidos</p>`:"";
    const cuotasHTML=+producto.precio>100?`<p class="cuotas-badge">o 3 cuotas de ${Math.ceil(+producto.precio/3)} Bs</p>`:"";
    const precioHTML=producto.esOferta&&producto.precioOriginal
        ?`<div class="precio-oferta"><span class="precio-antes">${producto.precioOriginal} Bs</span><span class="precio-ahora">${producto.precio} Bs</span><span class="ahorro-badge">Ahorras ${+producto.precioOriginal - +producto.precio} Bs</span></div>`
        :`<p class="precio">${producto.precio} Bs</p>`;

    const thumbsHTML=producto.imagenes.map((src,i)=>{
        const isVideo=src.includes("cloudinary")&&(src.endsWith(".mp4")||src.endsWith(".webm")||src.includes("/video/"));
        return `<img src="${isVideo?src.replace(/\.(mp4|webm)/,'.jpg').replace('/video/','/image/'):src}" class="thumb ${i===0?'active':''}" data-index="${i}">`;
    }).join("");

    const card=document.createElement("div");
    card.className="card reveal"+(producto.esOferta?" card-oferta":"")+(producto.agotado?" card-agotado":"")+(isComp?" card-comparando":"");
    card.innerHTML=`
        <div class="slider">
            <img src="${producto.imagenes[0]}" class="slider-img">
            <button class="prev">❮</button><button class="next">❯</button>
            <div class="badges-slider">
                ${producto.esOferta?'<span class="badge-oferta">🔥 OFERTA</span>':""}
                ${producto.agotado?'<span class="badge-agotado">AGOTADO</span>':""}
                <span class="badge-cat" style="background:${badgeColor[producto.categoria]||'#333'}">${producto.categoria.toUpperCase()}</span>
            </div>
            <button class="btn-fav-card ${isFav?'fav-activo':''}" data-id="${producto.id}">${isFav?'❤️':'🤍'}</button>
        </div>
        <div class="miniaturas">${thumbsHTML}</div>
        <div class="info">
            <h3>${producto.nombre}</h3>
            <p><strong>Tallas:</strong> ${producto.tallas}</p>
            <p><strong>Calidad:</strong> ${producto.calidad}</p>
            ${vendidosHTML}${stockHTML}${precioHTML}${cuotasHTML}
            <div class="botones-card">
                <button class="btn-ver-detalle">👁 Ver detalle</button>
                <button class="agregar-carrito" ${producto.agotado?"disabled":""}>🛒 ${producto.agotado?"Agotado":"Agregar"}</button>
                <div class="card-extra-btns">
                    <button class="btn-wsp-rapido" data-nombre="${producto.nombre}" data-precio="${producto.precio}">💬 Consultar</button>
                    <button class="btn-comparar-card ${isComp?'comp-activo':''}" data-id="${producto.id}">⚖️ ${isComp?'Quitando...':'Comparar'}</button>
                    ${adminLogueado?`<button class="btn-editar-card">✏️</button><button class="btn-agotado-card">${producto.agotado?"↩️":"❌"}</button><button class="eliminar">🗑</button>`:""}
                </div>
            </div>
        </div>`;

    const sImg=card.querySelector(".slider-img");
    const thumbs=card.querySelectorAll(".thumb");
    function syncSlider(){sImg.src=producto.imagenes[idx];thumbs.forEach((t,i)=>t.classList.toggle("active",i===idx));}
    card.querySelector(".prev").addEventListener("click",()=>{idx=(idx-1+producto.imagenes.length)%producto.imagenes.length;syncSlider();});
    card.querySelector(".next").addEventListener("click",()=>{idx=(idx+1)%producto.imagenes.length;syncSlider();});
    thumbs.forEach(t=>t.addEventListener("click",()=>{idx=+t.dataset.index;syncSlider();}));
    sImg.addEventListener("click",()=>abrirGaleria(producto.imagenes,idx));

    card.querySelector(".btn-ver-detalle").addEventListener("click",()=>{
        producto.visitas=(producto.visitas||0)+1;guardarLS();abrirDetalle(producto);
    });

    card.querySelector(".btn-fav-card").addEventListener("click",e=>{
        e.stopPropagation();toggleFavorito(producto.id);
        const btn=card.querySelector(".btn-fav-card");
        const now=favoritos.includes(producto.id);
        btn.textContent=now?"❤️":"🤍";btn.classList.toggle("fav-activo",now);
    });

    // AGREGAR — abre modal de talla
    const btnAg=card.querySelector(".agregar-carrito");
    if(!producto.agotado){
        btnAg.addEventListener("click",()=>abrirTallaSelector(producto));
    }

    // WhatsApp rápido
    card.querySelector(".btn-wsp-rapido").addEventListener("click",e=>{
        e.stopPropagation();
        const nombre=e.currentTarget.dataset.nombre;
        const precio=e.currentTarget.dataset.precio;
        const msg=`Hola, me interesa el jersey: *${nombre}* — ${precio} Bs. ¿Tienen disponibilidad?`;
        window.open(`https://wa.me/59171208827?text=${encodeURIComponent(msg)}`,"_blank");
    });

    // COMPARAR
    card.querySelector(".btn-comparar-card").addEventListener("click",e=>{
        e.stopPropagation();
        const yaEsta=compararLista.some(x=>x.id===producto.id);
        if(yaEsta){compararLista=compararLista.filter(x=>x.id!==producto.id);}
        else{if(compararLista.length>=2){mostrarToast("Solo puedes comparar 2 jerseys");return;}compararLista.push(producto);}
        renderProductos(productos);actualizarBarraComparar();
    });

    if(adminLogueado){
        card.querySelector(".btn-editar-card").addEventListener("click",()=>abrirEditar(producto));
        card.querySelector(".btn-agotado-card").addEventListener("click",()=>{producto.agotado=!producto.agotado;guardarLS();renderProductos(productos);renderOfertas();mostrarToast(producto.agotado?"❌ Agotado":"✅ Repuesto");});
        card.querySelector(".eliminar").addEventListener("click",()=>{if(confirm(`¿Eliminar "${producto.nombre}"?`)){productos=productos.filter(p=>p.id!==producto.id);guardarLS();renderProductos(productos);renderOfertas();renderAdminStats();mostrarToast("🗑 Eliminado");}});
    }
    cont.appendChild(card);
}

/* =============================================   MODAL SELECTOR TALLA (DESDE CARD)   */
function abrirTallaSelector(producto){
    productoSel = producto;
    let tallaS = null, dorsalS = null, colorS = null;

    const modal = $("talla-selector-modal");

    // Imagen y nombre
    const img = $("talla-sel-img");
    if(img) img.src = producto.imagenes[0];
    $("talla-sel-nombre").textContent = producto.nombre;

    // Precio
    $("talla-sel-precio").innerHTML = producto.esOferta && producto.precioOriginal
        ? `<span style="color:var(--text3);text-decoration:line-through;font-size:.9rem;">${producto.precioOriginal} Bs</span>
           <span style="color:#ff4444;font-size:1.2rem;font-weight:bold;margin-left:6px;">${producto.precio} Bs</span>`
        : `<span style="font-size:1.2rem;font-weight:bold;">${producto.precio} Bs</span>`;

    // Visores
    const vEl = $("talla-sel-visores");
    if(vEl){ const v=Math.floor(Math.random()*8)+2; vEl.innerHTML=`<span style="display:inline-block;background:rgba(0,255,136,.1);border:1px solid rgba(0,255,136,.3);color:var(--accent);padding:2px 9px;border-radius:18px;font-size:.72rem;margin-top:4px;">👁 ${v} personas viendo</span>`; }

    // ---- TALLAS ----
    const ta = producto.tallas ? producto.tallas.split(",").map(s=>s.trim()).filter(Boolean) : ["Única"];
    const tb = $("talla-sel-btns");
    tb.innerHTML = "";
    tallaS = ta.length === 1 ? ta[0] : null;
    $("talla-sel-error").style.display = "none";

    ta.forEach(t => {
        const b = document.createElement("button");
        b.textContent = t;
        b.style.cssText = "padding:9px 16px;border:1px solid var(--border);border-radius:9px;background:var(--bg3);color:var(--text);cursor:pointer;font-weight:600;font-size:.86rem;transition:.2s;";
        if(ta.length === 1){ b.style.borderColor="var(--accent)"; b.style.background="var(--accent)"; b.style.color="#000"; }
        b.addEventListener("mouseenter", ()=>{ if(tallaS!==t){ b.style.borderColor="var(--accent)"; } });
        b.addEventListener("mouseleave", ()=>{ if(tallaS!==t){ b.style.borderColor="var(--border)"; b.style.background="var(--bg3)"; b.style.color="var(--text)"; } });
        b.addEventListener("click", () => {
            tallaS = t;
            tb.querySelectorAll("button").forEach(x=>{ x.style.borderColor="var(--border)"; x.style.background="var(--bg3)"; x.style.color="var(--text)"; });
            b.style.borderColor = "var(--accent)"; b.style.background = "var(--accent)"; b.style.color = "#000";
            $("talla-sel-error").style.display = "none";
        });
        tb.appendChild(b);
    });

    // ---- DORSALES ----
    const da = producto.dorsales ? producto.dorsales.split(",").map(s=>s.trim()).filter(Boolean) : ["—"];
    const db = $("dorsal-sel-btns");
    db.innerHTML = "";
    dorsalS = da.length === 1 ? da[0] : null;
    $("dorsal-sel-error").style.display = "none";

    da.forEach(d => {
        const b = document.createElement("button");
        b.textContent = d;
        b.style.cssText = "padding:9px 16px;border:1px solid var(--border);border-radius:9px;background:var(--bg3);color:var(--text);cursor:pointer;font-weight:600;font-size:.86rem;transition:.2s;";
        if(da.length === 1){ b.style.borderColor="var(--accent)"; b.style.background="var(--accent)"; b.style.color="#000"; }
        b.addEventListener("click", () => {
            dorsalS = d;
            db.querySelectorAll("button").forEach(x=>{ x.style.borderColor="var(--border)"; x.style.background="var(--bg3)"; x.style.color="var(--text)"; });
            b.style.borderColor = "var(--accent)"; b.style.background = "var(--accent)"; b.style.color = "#000";
            $("dorsal-sel-error").style.display = "none";
        });
        db.appendChild(b);
    });

    // ---- COLORES ----
    const cw = $("color-sel-wrap"), cb = $("color-sel-btns");
    if(producto.colores){
        const ca = producto.colores.split(",").map(s=>s.trim()).filter(Boolean);
        cb.innerHTML = ""; colorS = ca.length===1 ? ca[0] : null;
        ca.forEach(c => {
            const b = document.createElement("button");
            b.textContent = c;
            b.style.cssText = "padding:9px 16px;border:1px solid var(--border);border-radius:9px;background:var(--bg3);color:var(--text);cursor:pointer;font-weight:600;font-size:.86rem;transition:.2s;";
            if(ca.length===1){ b.style.borderColor="var(--accent)"; b.style.background="var(--accent)"; b.style.color="#000"; }
            b.addEventListener("click",()=>{
                colorS=c;
                cb.querySelectorAll("button").forEach(x=>{ x.style.borderColor="var(--border)"; x.style.background="var(--bg3)"; x.style.color="var(--text)"; });
                b.style.borderColor="var(--accent)"; b.style.background="var(--accent)"; b.style.color="#000";
            });
            cb.appendChild(b);
        });
        cw.style.display = "block";
    } else { cw.style.display = "none"; }

    // ---- STOCK ----
    const sn = parseInt(producto.stock); const sa = $("talla-sel-stock");
    if(producto.agotado){ sa.style.display="block"; sa.textContent="❌ Producto agotado"; }
    else if(producto.stock && sn<=4){ sa.style.display="block"; sa.textContent=`⚠️ ¡Solo quedan ${sn} unidades!`; }
    else sa.style.display = "none";

    // ---- VALIDAR ----
    function validar(){
        let ok = true;
        if(!tallaS){
            $("talla-sel-error").style.display = "block";
            tb.style.animation = "shake .4s ease";
            setTimeout(()=>tb.style.animation="", 500);
            ok = false;
        }
        if(!dorsalS){
            $("dorsal-sel-error").style.display = "block";
            db.style.animation = "shake .4s ease";
            setTimeout(()=>db.style.animation="", 500);
            ok = false;
        }
        if(!ok) mostrarToast("👆 Selecciona talla y dorsal");
        return ok;
    }

    // ---- BOTONES ----
    $("talla-sel-agregar").onclick = () => {
        if(!validar()) return;
        agregarAlCarrito(producto, tallaS, dorsalS, colorS||"");
        cerrarTallaModal();
    };

    $("talla-sel-comprar-ya").onclick = () => {
        if(!validar()) return;
        agregarAlCarrito(producto, tallaS, dorsalS, colorS||"");
        cerrarTallaModal();
        setTimeout(()=>{
            let subtotal=0; carrito.forEach(i=>subtotal+=+i.precio*i.cantidad);
            const desc=cuponAplicado?Math.round(subtotal*cuponAplicado.descuento/100):0;
            $("total-pago").textContent = subtotal-desc;
            const pr=$("pago-resumen");
            pr.innerHTML=`<h4>📋 Tu pedido:</h4>`+carrito.map(item=>`
                <div class="pago-item">
                    <span>${item.nombre} x${item.cantidad}</span>
                    <div class="pago-item-detalle">
                        <span class="pago-talla-badge">Talla: ${item.talla}</span>
                        ${item.dorsal&&item.dorsal!=="—"?`<span class="pago-talla-badge">Dorsal: ${item.dorsal}</span>`:""}
                        ${item.color?`<span class="pago-talla-badge">${item.color}</span>`:""}
                    </div>
                    <span>${+item.precio*item.cantidad} Bs</span>
                </div>`).join("");
            $("pago-modal").style.display = "flex";
        }, 300);
    };

    $("talla-sel-wsp").onclick = () => {
        const msg=`Hola, me interesa: *${producto.nombre}* — ${producto.precio} Bs. ¿Tienen disponibilidad?`;
        window.open(`https://wa.me/59171208827?text=${encodeURIComponent(msg)}`,"_blank");
    };

    // Abrir modal usando display flex
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function cerrarTallaModal(){
    $("talla-selector-modal").style.display = "none";
    document.body.style.overflow = "";
}

$("talla-sel-cerrar").addEventListener("click", cerrarTallaModal);
$("talla-selector-modal").addEventListener("click", e=>{ if(e.target===$("talla-selector-modal")) cerrarTallaModal(); });
$("btn-guia-tallas2").addEventListener("click", ()=>$("talla-guia-modal").classList.add("activo"));



/* =============================================   AGREGAR AL CARRITO   */
function agregarAlCarrito(producto,talla,dorsal,color){
    const key=`${producto.id}-${talla}-${dorsal}-${color}`;
    const ex=carrito.find(i=>i.key===key);
    ex?ex.cantidad++:carrito.push({key,id:producto.id,nombre:producto.nombre,precio:producto.precio,talla,dorsal,color,cantidad:1});
    document.querySelector(".carrito-icono").classList.add("bounce");
    setTimeout(()=>document.querySelector(".carrito-icono").classList.remove("bounce"),400);
    actualizarCarrito();
    mostrarToast(`✅ ${producto.nombre} (${talla}${color?" · "+color:""}) agregado`);
    $("carrito-panel").style.display="block";
}

/* =============================================   ACTUALIZAR CARRITO   */
function actualizarCarrito(animar){
    const ic=$("items-carrito");ic.innerHTML="";
    let subtotal=0,cantTotal=0;
    carrito.forEach((item,i)=>{
        subtotal+=+item.precio*item.cantidad;cantTotal+=item.cantidad;
        const d=document.createElement("div");d.className="item-carrito";
        d.innerHTML=`<div class="item-top"><h4>${item.nombre}</h4><button class="eliminar-item" data-index="${i}">✕</button></div>
            <p class="item-detalles">Talla: <strong>${item.talla}</strong>${item.dorsal&&item.dorsal!=="—"?" · Dorsal: <strong>"+item.dorsal+"</strong>":""}${item.color?" · Color: <strong>"+item.color+"</strong>":""}</p>
            <p class="item-precio">${item.precio} Bs c/u</p>
            <div class="cantidad-control"><button class="menos" data-index="${i}">−</button><span>${item.cantidad}</span><button class="mas" data-index="${i}">+</button></div>`;
        ic.appendChild(d);
    });
    const desc=cuponAplicado?Math.round(subtotal*cuponAplicado.descuento/100):0;
    const total=subtotal-desc;
    $("subtotal").textContent=subtotal;
    // Animación precio
    if(animar){animarPrecio($("total"),+$("total").textContent,total);}
    else $("total").textContent=total;
    $("contador-carrito").textContent=cantTotal;
    const ld=$("linea-descuento");
    if(cuponAplicado&&desc>0){ld.style.display="block";$("descuento-monto").textContent=desc;}else ld.style.display="none";
    $$(".mas").forEach(b=>b.addEventListener("click",()=>{carrito[+b.dataset.index].cantidad++;actualizarCarrito();}));
    actualizarBarraEnvio();
    if(carrito.length>0) iniciarTimerCarrito();
    $$(".menos").forEach(b=>b.addEventListener("click",()=>{const i=+b.dataset.index;carrito[i].cantidad>1?carrito[i].cantidad--:carrito.splice(i,1);actualizarCarrito();}));
    $$(".eliminar-item").forEach(b=>b.addEventListener("click",()=>{carrito.splice(+b.dataset.index,1);actualizarCarrito();}));
}

/* =============================================   ANIMACIÓN PRECIO   */
function animarPrecio(el,desde,hasta){
    const steps=20,dur=600,inc=(hasta-desde)/steps;
    let v=desde,s=0;
    const t=setInterval(()=>{v+=inc;s++;el.textContent=Math.round(v);if(s>=steps){el.textContent=hasta;clearInterval(t);}},dur/steps);
}

/* =============================================   FINALIZAR COMPRA   */
$("finalizar-compra").addEventListener("click",()=>{
    if(!carrito.length){alert("El carrito está vacío");return;}
    let subtotal=0;carrito.forEach(i=>subtotal+=+i.precio*i.cantidad);
    const desc=cuponAplicado?Math.round(subtotal*cuponAplicado.descuento/100):0;
    $("total-pago").textContent=subtotal-desc;
    // Resumen con tallas en modal pago
    const pr=$("pago-resumen");
    pr.innerHTML=`<h4>📋 Resumen de tu pedido:</h4>`+carrito.map(item=>`
        <div class="pago-item">
            <span>${item.nombre} x${item.cantidad}</span>
            <div class="pago-item-detalle">
                <span class="pago-talla-badge">Talla: ${item.talla}</span>
                ${item.dorsal&&item.dorsal!=="—"?`<span class="pago-talla-badge">Dorsal: ${item.dorsal}</span>`:""}
                ${item.color?`<span class="pago-talla-badge">${item.color}</span>`:""}
            </div>
            <span>${+item.precio*item.cantidad} Bs</span>
        </div>`).join("");
    $("pago-modal").style.display="flex";$("carrito-panel").style.display="none";
});
$("cerrar-pago").addEventListener("click",()=>$("pago-modal").style.display="none");


/* =============================================   SELECTOR ENVÍO EN PAGO   */
let tipoEnvioSeleccionado = "";
let puntoEnvioSeleccionado = "";

$$('input[name="tipo-envio"]').forEach(radio => {
    radio.addEventListener("change", () => {
        tipoEnvioSeleccionado = radio.value;
        // Ocultar todos los detalles
        ["lapaz","elalto","nacional","delivery"].forEach(id => {
            const el = $("detalle-"+id);
            if(el) el.style.display = "none";
        });
        // Mostrar el seleccionado
        const detalle = $("detalle-"+radio.value);
        if(detalle) detalle.style.display = "block";
        puntoEnvioSeleccionado = "";

        // Actualizar badge de costo
        const badge = $("costo-envio-badge");
        if(badge){
            if(radio.value==="lapaz"||radio.value==="elalto"){
                badge.textContent="+ 10-15 Bs delivery";badge.style.display="inline";
            }else if(radio.value==="nacional"){
                badge.textContent="+ envío según ciudad";badge.style.display="inline";
            }else if(radio.value==="delivery"){
                badge.textContent="+ 10-15 Bs delivery";badge.style.display="inline";
            }
        }
        // Resaltar opción seleccionada
        $$(".envio-opcion").forEach(op=>op.classList.remove("envio-opcion-activo"));
        radio.closest(".envio-opcion").classList.add("envio-opcion-activo");
    });
});

// Capturar punto seleccionado
["punto-lapaz","punto-elalto","ciudad-nacional"].forEach(id => {
    const el = $(id);
    if(el) el.addEventListener("change", () => { puntoEnvioSeleccionado = el.value; });
});


/* =============================================   WHATSAPP   */
$("enviar-whatsapp").addEventListener("click",()=>{
    const num=Math.floor(1000+Math.random()*9000);
    // Validar que eligió tipo de envío
    if(!tipoEnvioSeleccionado){
        mostrarToast("⚠️ Elige cómo quieres recibir tu pedido");
        return;
    }
    const etiquetasEnvio={lapaz:"🏙️ Entrega en La Paz",elalto:"🌆 Entrega en El Alto",nacional:"🇧🇴 Envío Nacional",delivery:"🛵 Delivery a domicilio"};
    const direccionDelivery=$("direccion-delivery")?$("direccion-delivery").value:"";
    let infoEnvio=etiquetasEnvio[tipoEnvioSeleccionado]||tipoEnvioSeleccionado;
    if(puntoEnvioSeleccionado) infoEnvio+=` — ${puntoEnvioSeleccionado}`;
    if(tipoEnvioSeleccionado==="delivery"&&direccionDelivery) infoEnvio+=` — ${direccionDelivery}`;

    let msg=`Hola, pedido *#${num}* — ya realicé el pago:%0A%0A`;
    let subtotal=0;const itemsG=[];
    carrito.forEach(item=>{
        msg+=`• ${item.nombre} x${item.cantidad}%0A  Talla: *${item.talla}*${item.dorsal&&item.dorsal!=="—"?" | Dorsal: *"+item.dorsal+"*":""}${item.color?" | Color: *"+item.color+"*":""} — ${item.precio} Bs%0A`;
        subtotal+=+item.precio*item.cantidad;itemsG.push({...item});
    });
    const desc=cuponAplicado?Math.round(subtotal*cuponAplicado.descuento/100):0;
    const total=subtotal-desc;
    msg+=`%0A%0A🚚 *Envío/Entrega:* ${infoEnvio}`;
    if(cuponAplicado) msg+=`%0ACupón: ${cuponAplicado.codigo} (-${desc} Bs)`;
    const numRef=$("num-referencia")?$("num-referencia").value.trim():"";
    msg+=`%0A%0A💰 *Total: ${total} Bs*`;
    if(numRef) msg+=`%0A📋 Referencia de pago: *${numRef}*`;
    msg+=`%0A%0A📸 *Adjunto mi comprobante de pago.*`;
    historial.unshift({numero:num,fecha:new Date().toLocaleString("es-BO"),items:itemsG,subtotal,descuento:desc,total,envio:infoEnvio});
    localStorage.setItem("historial",JSON.stringify(historial));
    window.open(`https://wa.me/59171208827?text=${msg}`,"_blank");
    $("conf-numero-pedido").textContent="#"+num;
    const res=$("conf-resumen");
    res.innerHTML=itemsG.map(i=>`<p>• ${i.nombre} x${i.cantidad} — Talla: <strong>${i.talla}</strong>${i.color?" · "+i.color:""}</p>`).join("")+`<p class="conf-envio">🚚 ${infoEnvio}</p><p class="conf-total">Total: ${total} Bs</p>`;
    $("pago-modal").style.display="none";$("confirmacion-modal").classList.add("activo");
    lanzarConfeti();
    // Limpiar referencia
    if($("num-referencia")) $("num-referencia").value="";
    // Reset selector envío
    tipoEnvioSeleccionado="";puntoEnvioSeleccionado="";
    $$('input[name="tipo-envio"]').forEach(r=>r.checked=false);
    $$(".envio-opcion").forEach(op=>op.classList.remove("envio-opcion-activo"));
    ["lapaz","elalto","nacional","delivery"].forEach(id=>{const el=$("detalle-"+id);if(el)el.style.display="none";});
    const badge=$("costo-envio-badge");if(badge)badge.style.display="none";
    carrito=[];cuponAplicado=null;$("cupon-input").value="";$("descuento-aviso").style.display="none";actualizarCarrito();
});
$("conf-cerrar").addEventListener("click",()=>$("confirmacion-modal").classList.remove("activo"));

/* =============================================   CONFETI   */
function lanzarConfeti(){
    const canvas=$("confeti-canvas");const ctx=canvas.getContext("2d");
    canvas.width=window.innerWidth;canvas.height=window.innerHeight;canvas.style.display="block";
    const piezas=[];const cols=["#00ff88","#ff4444","#ffcc00","#3b82f6","#ff8800","#fff"];
    for(let i=0;i<200;i++) piezas.push({x:Math.random()*canvas.width,y:-10,w:8+Math.random()*8,h:14+Math.random()*10,color:cols[Math.floor(Math.random()*cols.length)],rot:Math.random()*360,rotV:3+Math.random()*5,vy:3+Math.random()*4,vx:(Math.random()-.5)*3});
    let frame=0;
    function animar(){ctx.clearRect(0,0,canvas.width,canvas.height);piezas.forEach(p=>{p.y+=p.vy;p.x+=p.vx;p.rot+=p.rotV;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();});frame++;if(frame<150)requestAnimationFrame(animar);else{ctx.clearRect(0,0,canvas.width,canvas.height);canvas.style.display="none";}}
    animar();
}

/* =============================================   COMPARAR   */
function actualizarBarraComparar(){
    const barra=$("comparar-barra"),items=$("comparar-items");
    if(!compararLista.length){barra.style.display="none";return;}
    barra.style.display="flex";
    items.innerHTML=compararLista.map(p=>`<div class="comp-item"><img src="${p.imagenes[0]}" alt="${p.nombre}"><span>${p.nombre}</span></div>`).join("");
}
$("btn-comparar").addEventListener("click",()=>{
    if(compararLista.length<2){mostrarToast("Selecciona 2 jerseys para comparar");return;}
    const grid=$("comparar-grid");
    const campos=["nombre","precio","tallas","dorsales","calidad","categoria","stock"];
    const labels={"nombre":"Jersey","precio":"Precio","tallas":"Tallas","dorsales":"Dorsales","calidad":"Calidad","categoria":"Categoría","stock":"Stock"};
    grid.innerHTML=`
        <div class="comp-col comp-labels"><div class="comp-header"></div>${campos.map(c=>`<div class="comp-fila-label">${labels[c]}</div>`).join("")}</div>
        ${compararLista.map(p=>`<div class="comp-col"><div class="comp-header"><img src="${p.imagenes[0]}" alt="${p.nombre}"></div>${campos.map(c=>`<div class="comp-fila">${c==="precio"?p[c]+" Bs":(p[c]||"—")}</div>`).join("")}</div>`).join("")}`;
    $("comparar-modal").classList.add("activo");
});
$("btn-limpiar-comparar").addEventListener("click",()=>{compararLista=[];actualizarBarraComparar();renderProductos(productos);});
$("comparar-cerrar").addEventListener("click",()=>$("comparar-modal").classList.remove("activo"));

/* =============================================   HISTORIAL   */
$("ver-historial-btn").addEventListener("click",()=>{
    const lista=$("historial-lista");lista.innerHTML="";
    if(!historial.length){lista.innerHTML=`<p class="sin-historial">No tienes pedidos anteriores 📭</p>`;}
    else historial.forEach(p=>{const d=document.createElement("div");d.className="historial-item";d.innerHTML=`<div class="historial-header"><strong>#${p.numero}</strong><span>${p.fecha}</span></div><ul>${p.items.map(i=>`<li>${i.nombre} x${i.cantidad} — Talla: <strong>${i.talla}</strong>${i.dorsal&&i.dorsal!=="—"?" | Dorsal: "+i.dorsal:""}${i.color?" | "+i.color:""}</li>`).join("")}</ul><p class="historial-total">Total: ${p.total} Bs</p>`;lista.appendChild(d);});
    $("historial-modal").classList.add("activo");$("carrito-panel").style.display="none";
});
$("historial-cerrar").addEventListener("click",()=>$("historial-modal").classList.remove("activo"));

/* =============================================   FAVORITOS   */
function toggleFavorito(id){const i=favoritos.indexOf(id);i===-1?favoritos.push(id):favoritos.splice(i,1);localStorage.setItem("favoritos",JSON.stringify(favoritos));$("contador-favoritos").textContent=favoritos.length||"";}
function renderFavoritos(){
    const lista=$("favoritos-lista");lista.innerHTML="";
    const favProds=productos.filter(p=>favoritos.includes(p.id));
    if(!favProds.length){lista.innerHTML=`<p class="sin-historial">No tienes favoritos aún 🤍</p>`;return;}
    favProds.forEach(p=>{const d=document.createElement("div");d.className="fav-item";d.innerHTML=`<img src="${p.imagenes[0]}" alt="${p.nombre}"><div class="fav-info"><strong>${p.nombre}</strong><span>${p.precio} Bs</span></div><div class="fav-btns"><button class="fav-ver" data-id="${p.id}">👁 Ver</button><button class="fav-quitar" data-id="${p.id}">🗑</button></div>`;lista.appendChild(d);});
    $$(".fav-ver").forEach(b=>b.addEventListener("click",()=>{const p=productos.find(x=>x.id===+b.dataset.id);if(p){$("favoritos-modal").classList.remove("activo");abrirDetalle(p);}}));
    $$(".fav-quitar").forEach(b=>b.addEventListener("click",()=>{toggleFavorito(+b.dataset.id);renderFavoritos();renderProductos(productos);}));
}
$("btn-favoritos-nav").addEventListener("click",()=>{renderFavoritos();$("favoritos-modal").classList.add("activo");});
$("ver-favoritos-btn").addEventListener("click",()=>{renderFavoritos();$("favoritos-modal").classList.add("activo");$("carrito-panel").style.display="none";});
$("favoritos-cerrar").addEventListener("click",()=>$("favoritos-modal").classList.remove("activo"));

/* =============================================   NOTIF COMPRAS   */
const notifFicticias=[
    {nombre:"Carlos",ciudad:"Santa Cruz",jersey:"Manchester United"},
    {nombre:"Gabriela",ciudad:"La Paz",jersey:"Barcelona Retro"},
    {nombre:"Marco",ciudad:"Cochabamba",jersey:"Argentina 2022"},
    {nombre:"Luis",ciudad:"Oruro",jersey:"Real Madrid"},
    {nombre:"Sofía",ciudad:"Sucre",jersey:"Brasil Player Version"},
];
function iniciarNotifCompras(){
    let i=0;
    function mostrarNotif(){
        const n=notifFicticias[i%notifFicticias.length];
        const hace=Math.floor(Math.random()*59)+1;
        $("notif-texto").textContent=`${n.nombre} de ${n.ciudad} compró "${n.jersey}" hace ${hace} min`;
        const el=$("notif-compra");el.style.display="flex";el.classList.add("notif-show");
        setTimeout(()=>{el.classList.remove("notif-show");setTimeout(()=>el.style.display="none",500);},4000);i++;
    }
    setTimeout(()=>{mostrarNotif();setInterval(mostrarNotif,18000);},6000);
}

/* =============================================   CHAT FAQ   */
const chatRespuestas={
    envio:"🚚 Los envíos tardan entre 2 y 5 días hábiles según tu ciudad. Enviamos a toda Bolivia por bus o encomienda.",
    tallas:"📏 Puedes ver nuestra guía de tallas en el detalle de cada producto. Si dudas entre dos tallas, elige la más grande.",
    pago:"💳 Aceptamos pago por QR (código escaneado), transferencia bancaria al Banco Mercantil SCZ y efectivo en coordinación.",
    calidad:"⭐ Todos nuestros jerseys son de alta calidad AAA o Player Version. Trabajamos con proveedores certificados.",
    whatsapp:"📱 Te redirigiremos a WhatsApp para hablar directamente con un asesor."
};
$("chat-btn").addEventListener("click",()=>{
    const faq=$("chat-faq");faq.style.display=faq.style.display==="flex"?"none":"flex";
});
$("chat-cerrar").addEventListener("click",()=>{$("chat-faq").style.display="none";});
$$(".chat-opcion").forEach(btn=>btn.addEventListener("click",()=>{
    const resp=chatRespuestas[btn.dataset.resp];
    const body=$("chat-body");
    const userMsg=document.createElement("div");userMsg.className="chat-msg user";userMsg.textContent=btn.textContent;
    body.appendChild(userMsg);
    if(btn.dataset.resp==="whatsapp"){window.open("https://wa.me/59171208827","_blank");return;}
    setTimeout(()=>{const botMsg=document.createElement("div");botMsg.className="chat-msg bot";botMsg.textContent=resp;body.appendChild(botMsg);body.scrollTop=body.scrollHeight;},400);
}));

/* =============================================   MODAL DETALLE   */
function abrirDetalle(producto){
    let detIdx=0,tallaS=null,dorsalS=null,colorS=null;
    const ip=$("detalle-img-principal");ip.src=producto.imagenes[0];
    ip.onclick=()=>abrirGaleria(producto.imagenes,detIdx);

    // Zoom
    const zw=document.querySelector(".zoom-wrap"),zl=$("zoom-lupa");
    zw.addEventListener("mousemove",e=>{const rect=zw.getBoundingClientRect();const x=e.clientX-rect.left,y=e.clientY-rect.top;zl.style.display="block";zl.style.left=x-50+"px";zl.style.top=y-50+"px";zl.style.backgroundImage=`url(${ip.src})`;zl.style.backgroundSize="300%";zl.style.backgroundPosition=`${(x/rect.width)*100}% ${(y/rect.height)*100}%`;});
    zw.addEventListener("mouseleave",()=>{zl.style.display="none";});

    // Thumbs
    const dthumbs=$("detalle-thumbs");dthumbs.innerHTML="";
    producto.imagenes.forEach((src,i)=>{const t=document.createElement("img");t.src=src;t.className="det-thumb"+(i===0?" det-thumb-activo":"");t.addEventListener("click",()=>{detIdx=i;ip.src=src;dthumbs.querySelectorAll(".det-thumb").forEach((x,j)=>x.classList.toggle("det-thumb-activo",j===i));});dthumbs.appendChild(t);});

    $("detalle-badges").innerHTML=`${producto.esOferta?'<span class="badge-oferta">🔥 OFERTA</span>':""}${producto.agotado?'<span class="badge-agotado">AGOTADO</span>':""}<span class="badge-cat" style="background:${badgeColor[producto.categoria]||'#333'}">${producto.categoria.toUpperCase()}</span>`;
    $("detalle-nombre").textContent=producto.nombre;
    $("detalle-visitas").innerHTML=(producto.visitas||0)>0?`<span class="visitas-badge">👁 ${producto.visitas} vistas hoy</span>`:"";
    $("detalle-vendidos").innerHTML=producto.vendidos&&producto.vendidos>0?`<span class="vendidos-det">🔥 ${producto.vendidos} vendidos</span>`:"";
    // Personas viendo en detalle
    const viendoDet=Math.floor(Math.random()*12)+3;
    const viendoEl=$("detalle-visitas");
    if(viendoEl) viendoEl.innerHTML=`<span class="visitas-badge">👁 ${viendoDet} personas viendo esto</span>`;
    // Cuotas en detalle
    const cuotasDetEl=document.getElementById("detalle-cuotas");
    if(cuotasDetEl) cuotasDetEl.textContent=`o 3 cuotas de ${Math.ceil(+producto.precio/3)} Bs sin interés`;;

    $("detalle-precio").innerHTML=producto.esOferta&&producto.precioOriginal
        ?`<div class="precio-oferta"><span class="precio-antes">${producto.precioOriginal} Bs</span><span class="precio-ahora">${producto.precio} Bs</span><span class="ahorro-badge">Ahorras ${+producto.precioOriginal - +producto.precio} Bs</span></div>`
        :`<p class="precio">${producto.precio} Bs</p>`;

    clearInterval(countdownInterval);
    const cd=$("detalle-countdown");
    if(producto.esOferta&&producto.finOferta){
        cd.style.display="block";
        const tick=()=>{const diff=new Date(producto.finOferta)-new Date();if(diff<=0){cd.textContent="⏰ Oferta finalizada";clearInterval(countdownInterval);return;}const h=String(Math.floor(diff/3600000)).padStart(2,"0");const m=String(Math.floor((diff%3600000)/60000)).padStart(2,"0");const s=String(Math.floor((diff%60000)/1000)).padStart(2,"0");cd.innerHTML=`⏰ Oferta termina en <strong>${h}:${m}:${s}</strong>`;};tick();countdownInterval=setInterval(tick,1000);
    }else cd.style.display="none";

    $("detalle-descripcion").textContent=producto.descripcion||"Jersey de alta calidad. Contáctanos para más info.";

    // Tallas
    const ta=producto.tallas?producto.tallas.split(",").map(s=>s.trim()).filter(Boolean):["Única"];
    const tb=$("tallas-btns");tb.innerHTML="";tallaS=ta.length===1?ta[0]:null;
    ta.forEach(t=>{const b=document.createElement("button");b.className="sel-btn"+(ta.length===1?" sel-btn-activo":"");b.textContent=t;b.addEventListener("click",()=>{tallaS=t;tb.querySelectorAll(".sel-btn").forEach(x=>x.classList.remove("sel-btn-activo"));b.classList.add("sel-btn-activo");});tb.appendChild(b);});

    // Dorsales
    const da=producto.dorsales?producto.dorsales.split(",").map(s=>s.trim()).filter(Boolean):["—"];
    const db=$("dorsales-btns");db.innerHTML="";dorsalS=da.length===1?da[0]:null;
    da.forEach(d=>{const b=document.createElement("button");b.className="sel-btn"+(da.length===1?" sel-btn-activo":"");b.textContent=d;b.addEventListener("click",()=>{dorsalS=d;db.querySelectorAll(".sel-btn").forEach(x=>x.classList.remove("sel-btn-activo"));b.classList.add("sel-btn-activo");});db.appendChild(b);});

    // Colores
    const cc=$("colores-campo"),ccb=$("colores-btns");
    if(producto.colores){
        const ca=producto.colores.split(",").map(s=>s.trim()).filter(Boolean);
        ccb.innerHTML="";colorS=ca.length===1?ca[0]:null;cc.style.display="block";
        ca.forEach(c=>{const b=document.createElement("button");b.className="sel-btn"+(ca.length===1?" sel-btn-activo":"");b.textContent=c;b.addEventListener("click",()=>{colorS=c;ccb.querySelectorAll(".sel-btn").forEach(x=>x.classList.remove("sel-btn-activo"));b.classList.add("sel-btn-activo");});ccb.appendChild(b);});
    }else cc.style.display="none";

    // Stock
    const sn=parseInt(producto.stock);const sa=$("detalle-stock-aviso");
    if(producto.agotado){sa.style.display="block";sa.textContent="❌ Producto agotado";}
    else if(producto.stock&&sn<=4){sa.style.display="block";sa.textContent=`⚠️ ¡Solo quedan ${sn}!`;}
    else sa.style.display="none";

    const ba=$("detalle-agregar");ba.disabled=producto.agotado;ba.textContent=producto.agotado?"❌ Agotado":"🛒 Agregar al carrito";
    ba.onclick=()=>{
        if(!tallaS){mostrarToast("👆 Selecciona una talla");return;}
        if(!dorsalS){mostrarToast("👆 Selecciona un dorsal");return;}
        agregarAlCarrito(producto,tallaS,dorsalS,colorS||"");cerrarDetalle();
    };

    const btnFav=$("detalle-fav");const isFavNow=favoritos.includes(producto.id);
    btnFav.textContent=isFavNow?"❤️":"🤍";
    btnFav.onclick=()=>{toggleFavorito(producto.id);btnFav.textContent=favoritos.includes(producto.id)?"❤️":"🤍";renderProductos(productos);};

    $("detalle-compartir").onclick=()=>{const txt=`🔥 ${producto.nombre} — ${producto.precio} Bs\nFútbol Premier Bolivia`;navigator.share?navigator.share({title:producto.nombre,text:txt}):(navigator.clipboard.writeText(txt),mostrarToast("📋 Link copiado"));};

    // También te puede gustar
    const similares=productos.filter(p=>p.id!==producto.id&&p.categoria===producto.categoria).slice(0,3);
    const tg=$("tambien-gusta");tg.innerHTML="";
    if(similares.length){tg.innerHTML=`<h4>También te puede gustar</h4><div class="tg-grid">${similares.map(p=>`<div class="tg-item" data-id="${p.id}"><img src="${p.imagenes[0]}" alt="${p.nombre}"><p>${p.nombre}</p><span>${p.precio} Bs</span></div>`).join("")}</div>`;tg.querySelectorAll(".tg-item").forEach(el=>el.addEventListener("click",()=>{const p=productos.find(x=>x.id===+el.dataset.id);if(p)abrirDetalle(p);}));}

    $("detalle-modal").classList.add("activo");document.body.style.overflow="hidden";
}
function cerrarDetalle(){$("detalle-modal").classList.remove("activo");document.body.style.overflow="";clearInterval(countdownInterval);}
$("detalle-cerrar").addEventListener("click",cerrarDetalle);
$("detalle-overlay").addEventListener("click",cerrarDetalle);
$("btn-guia-tallas").addEventListener("click",()=>$("talla-guia-modal").classList.add("activo"));
$("talla-guia-cerrar").addEventListener("click",()=>$("talla-guia-modal").classList.remove("activo"));

/* =============================================   EDITAR   */
function abrirEditar(p){
    $("edit-id").value=p.id;$("edit-nombre").value=p.nombre;$("edit-tallas").value=p.tallas;
    $("edit-dorsales").value=p.dorsales;$("edit-calidad").value=p.calidad;$("edit-colores").value=p.colores||"";
    $("edit-descripcion").value=p.descripcion||"";$("edit-categoria").value=p.categoria;
    $("edit-precio").value=p.precio;$("edit-stock").value=p.stock||"";$("edit-vendidos").value=p.vendidos||"";
    $("edit-es-oferta").checked=p.esOferta||false;$("edit-campo-oferta").style.display=p.esOferta?"block":"none";
    $("edit-precio-original").value=p.precioOriginal||"";$("edit-fin-oferta").value=p.finOferta||"";
    $("editar-modal").classList.add("activo");
}
function guardarEdicion(){
    const id=+$("edit-id").value;const p=productos.find(x=>x.id===id);if(!p)return;
    p.nombre=$("edit-nombre").value.trim();p.tallas=$("edit-tallas").value.trim();p.dorsales=$("edit-dorsales").value.trim();
    p.calidad=$("edit-calidad").value.trim();p.colores=$("edit-colores").value.trim();
    p.descripcion=$("edit-descripcion").value.trim();p.categoria=$("edit-categoria").value;
    p.precio=$("edit-precio").value;p.stock=$("edit-stock").value||null;p.vendidos=+$("edit-vendidos").value||0;
    p.esOferta=$("edit-es-oferta").checked;p.precioOriginal=p.esOferta?$("edit-precio-original").value:null;p.finOferta=p.esOferta?$("edit-fin-oferta").value:null;
    guardarLS();renderProductos(productos);renderOfertas();renderListaAdmin();renderAdminStats();
    $("editar-modal").classList.remove("activo");mostrarToast("✅ Jersey actualizado");
}
$("editar-cerrar").addEventListener("click",()=>$("editar-modal").classList.remove("activo"));

/* =============================================   LISTA ADMIN   */
function renderListaAdmin(){
    const la=$("lista-admin");
    if(!productos.length){la.innerHTML=`<p style="color:var(--text3);text-align:center;padding:20px">No hay jerseys aún</p>`;return;}
    la.innerHTML=productos.map(p=>`<div class="admin-prod-item"><img src="${p.imagenes[0]}" alt="${p.nombre}"><div class="admin-prod-info"><strong>${p.nombre}</strong><span>${p.precio} Bs · ${p.agotado?"❌":"✅"} · ${p.vendidos||0} vendidos</span></div><div class="admin-prod-btns"><button onclick="abrirEditar(productos.find(x=>x.id===${p.id}))">✏️</button><button onclick="toggleAgotado(${p.id})">${p.agotado?"↩️":"❌"}</button><button onclick="eliminarProd(${p.id})">🗑</button></div></div>`).join("");
}
function toggleAgotado(id){const p=productos.find(x=>x.id===id);if(p){p.agotado=!p.agotado;guardarLS();renderProductos(productos);renderOfertas();renderListaAdmin();mostrarToast(p.agotado?"❌ Agotado":"✅ Repuesto");}}
function eliminarProd(id){if(confirm("¿Eliminar?")){productos=productos.filter(p=>p.id!==id);guardarLS();renderProductos(productos);renderOfertas();renderListaAdmin();renderAdminStats();mostrarToast("🗑 Eliminado");}}

/* =============================================   STATS ADMIN   */
function renderAdminStats(){
    const s=$("admin-stats");if(!s)return;
    const total=productos.length,agotados=productos.filter(p=>p.agotado).length;
    const valor=productos.reduce((acc,p)=>acc+(+p.precio*(+p.stock||0)),0);
    const totalVendidos=productos.reduce((acc,p)=>acc+(+p.vendidos||0),0);
    s.innerHTML=`<div class="stat-card"><h4>${total}</h4><p>Jerseys</p></div><div class="stat-card"><h4>${agotados}</h4><p>Agotados</p></div><div class="stat-card"><h4>${valor} Bs</h4><p>Inventario</p></div><div class="stat-card"><h4>${totalVendidos}</h4><p>Vendidos</p></div>`;
}

/* =============================================   CUPONES   */
function crearCupon(){const codigo=$("cupon-codigo").value.trim().toUpperCase();const desc=+$("cupon-descuento").value;if(!codigo||!desc||desc<1||desc>100){alert("Completa código y descuento");return;}if(cupones.find(c=>c.codigo===codigo)){alert("Ese código ya existe");return;}cupones.push({codigo,descuento:desc});localStorage.setItem("cupones",JSON.stringify(cupones));$("cupon-codigo").value="";$("cupon-descuento").value="";renderListaCupones();mostrarToast(`🎟 Cupón ${codigo} creado`);}
function renderListaCupones(){const lc=$("lista-cupones");if(!cupones.length){lc.innerHTML=`<p style="color:var(--text3);text-align:center;padding:20px">No hay cupones</p>`;return;}lc.innerHTML=cupones.map((c,i)=>`<div class="cupon-item"><strong>${c.codigo}</strong><span>${c.descuento}% off</span><button onclick="eliminarCupon(${i})">🗑</button></div>`).join("");}
function eliminarCupon(i){cupones.splice(i,1);localStorage.setItem("cupones",JSON.stringify(cupones));renderListaCupones();mostrarToast("🗑 Cupón eliminado");}

/* =============================================   RESEÑAS   */
$$(".estrella-inp").forEach(s=>{
    s.addEventListener("mouseover",()=>$$(".estrella-inp").forEach((x,i)=>x.classList.toggle("activa",i<=+s.dataset.val-1)));
    s.addEventListener("mouseout",()=>$$(".estrella-inp").forEach((x,i)=>x.classList.toggle("activa",i<=estrellasVal-1)));
    s.addEventListener("click",()=>{estrellasVal=+s.dataset.val;$$(".estrella-inp").forEach((x,i)=>x.classList.toggle("activa",i<=estrellasVal-1));});
});
$("enviar-resena").addEventListener("click",()=>{
    const nombre=$("resena-nombre").value.trim();const ciudad=$("resena-ciudad").value.trim();const texto=$("resena-texto").value.trim();
    if(!nombre||!ciudad||!estrellasVal||!texto){mostrarToast("⚠️ Completa todos los campos");return;}
    resenas.push({id:Date.now(),nombre,ciudad,estrellas:estrellasVal,texto,aprobada:false,fecha:new Date().toLocaleDateString("es-BO")});
    localStorage.setItem("resenas",JSON.stringify(resenas));
    $("resena-nombre").value="";$("resena-ciudad").value="";$("resena-texto").value="";estrellasVal=0;$$(".estrella-inp").forEach(x=>x.classList.remove("activa"));
    mostrarToast("✅ Reseña enviada, será revisada pronto");
});
function renderResenas(){
    const grid=$("resenas-grid");grid.innerHTML="";
    const aprobadas=resenas.filter(r=>r.aprobada);
    if(!aprobadas.length){grid.innerHTML=`<p style="color:var(--text3);text-align:center;grid-column:1/-1;padding:20px">Sé el primero en dejar una reseña ⭐</p>`;return;}
    aprobadas.forEach(r=>{const d=document.createElement("div");d.className="testimonio reveal";d.innerHTML=`<div class="estrellas">${"⭐".repeat(r.estrellas)}</div><p>"${r.texto}"</p><span>— ${r.nombre}, ${r.ciudad} · ${r.fecha}</span>`;grid.appendChild(d);});initReveal();
}
function renderResenasPendientes(){
    const cont=$("resenas-pendientes");cont.innerHTML="";
    const pend=resenas.filter(r=>!r.aprobada);
    if(!pend.length){cont.innerHTML=`<p style="color:var(--text3);text-align:center;padding:20px">No hay reseñas pendientes ✅</p>`;return;}
    pend.forEach(r=>{const d=document.createElement("div");d.className="resena-pend-item";d.innerHTML=`<div class="resena-pend-header"><strong>${r.nombre} — ${r.ciudad}</strong><span>${"⭐".repeat(r.estrellas)}</span></div><p>"${r.texto}"</p><div class="resena-pend-btns"><button class="btn-aprobar" data-id="${r.id}">✅ Aprobar</button><button class="btn-rechazar" data-id="${r.id}">❌ Rechazar</button></div>`;cont.appendChild(d);});
    $$(".btn-aprobar").forEach(b=>b.addEventListener("click",()=>{const r=resenas.find(x=>x.id===+b.dataset.id);if(r){r.aprobada=true;localStorage.setItem("resenas",JSON.stringify(resenas));renderResenas();renderResenasPendientes();mostrarToast("✅ Reseña aprobada");}}));
    $$(".btn-rechazar").forEach(b=>b.addEventListener("click",()=>{resenas=resenas.filter(x=>x.id!==+b.dataset.id);localStorage.setItem("resenas",JSON.stringify(resenas));renderResenasPendientes();mostrarToast("🗑 Reseña rechazada");}));
}

/* =============================================   LOGIN   */
$("abrir-login").addEventListener("click",()=>{$("login-modal").style.display="flex";$("admin-password").value="";$("admin-password").focus();});
$("login-btn").addEventListener("click",()=>{
    if($("admin-password").value==="futbolpremier123"){adminLogueado=true;$("admin-panel").style.display="block";$("login-modal").style.display="none";renderProductos(productos);renderOfertas();renderAdminStats();mostrarToast("✅ Bienvenido Admin");$("admin-panel").scrollIntoView({behavior:"smooth"});}
    else{mostrarToast("❌ Contraseña incorrecta");$("admin-password").value="";}
});
$("admin-password").addEventListener("keydown",e=>{if(e.key==="Enter")$("login-btn").click();});
$("login-modal").addEventListener("click",e=>{if(e.target===$("login-modal"))$("login-modal").style.display="none";});
function cerrarAdmin(){adminLogueado=false;$("admin-panel").style.display="none";renderProductos(productos);renderOfertas();mostrarToast("👋 Sesión cerrada");}

/* =============================================   GALERÍA   */
let gImgs=[],gIdx=0;
const gModal=$("galeria-modal"),gImg=$("galeria-img"),gPrev=$("galeria-prev"),gNext=$("galeria-next"),gCerrar=$("galeria-cerrar"),gCont=$("galeria-contador"),gThumbs=$("galeria-thumbs");
function abrirGaleria(imgs,i){gImgs=imgs;gIdx=i||0;gModal.classList.add("activo");document.body.style.overflow="hidden";syncG();renderGT();}
function cerrarGaleria(){gModal.classList.remove("activo");document.body.style.overflow="";}
function syncG(dir){if(dir){gImg.classList.add(dir==="next"?"salir-izq":"salir-der");setTimeout(()=>{gImg.classList.remove("salir-izq","salir-der");gImg.src=gImgs[gIdx];gImg.classList.add(dir==="next"?"entrar-der":"entrar-izq");setTimeout(()=>gImg.classList.remove("entrar-der","entrar-izq"),300);},200);}else gImg.src=gImgs[gIdx];gCont.textContent=`${gIdx+1} / ${gImgs.length}`;const solo=gImgs.length<=1;gPrev.style.display=solo?"none":"flex";gNext.style.display=solo?"none":"flex";$$(".gthumb").forEach((t,i)=>t.classList.toggle("gthumb-activo",i===gIdx));}
function renderGT(){gThumbs.innerHTML="";if(gImgs.length<=1){gThumbs.style.display="none";return;}gThumbs.style.display="flex";gImgs.forEach((src,i)=>{const t=document.createElement("img");t.src=src;t.className="gthumb"+(i===gIdx?" gthumb-activo":"");t.addEventListener("click",()=>{const d=i>gIdx?"next":"prev";gIdx=i;syncG(d);});gThumbs.appendChild(t);});}
gNext.addEventListener("click",()=>{gIdx=(gIdx+1)%gImgs.length;syncG("next");});
gPrev.addEventListener("click",()=>{gIdx=(gIdx-1+gImgs.length)%gImgs.length;syncG("prev");});
gCerrar.addEventListener("click",cerrarGaleria);
document.querySelector(".galeria-overlay").addEventListener("click",cerrarGaleria);
document.addEventListener("keydown",e=>{
    if(gModal.classList.contains("activo")){if(e.key==="ArrowRight"){gIdx=(gIdx+1)%gImgs.length;syncG("next");}else if(e.key==="ArrowLeft"){gIdx=(gIdx-1+gImgs.length)%gImgs.length;syncG("prev");}else if(e.key==="Escape")cerrarGaleria();}
    if($("detalle-modal").classList.contains("activo")&&e.key==="Escape")cerrarDetalle();
    if($("talla-guia-modal").classList.contains("activo")&&e.key==="Escape")$("talla-guia-modal").classList.remove("activo");
    if($("talla-selector-modal").style.display==="flex"&&e.key==="Escape") cerrarTallaModal();
});
let tX=0;
gModal.addEventListener("touchstart",e=>{tX=e.touches[0].clientX;},{passive:true});
gModal.addEventListener("touchend",e=>{const d=tX-e.changedTouches[0].clientX;if(Math.abs(d)<50)return;if(d>0){gIdx=(gIdx+1)%gImgs.length;syncG("next");}else{gIdx=(gIdx-1+gImgs.length)%gImgs.length;syncG("prev");}},{passive:true});


/* =============================================   TIMER CARRITO   */
let timerCarrito=null;
function iniciarTimerCarrito(){
    if(timerCarrito) return; // ya corriendo
    let seg=15*60;
    const el=$("timer-cuenta");
    const timerDiv=$("carrito-timer");
    if(timerDiv) timerDiv.style.display="block";
    timerCarrito=setInterval(()=>{
        seg--;
        if(!el) return;
        const m=String(Math.floor(seg/60)).padStart(2,"0");
        const s=String(seg%60).padStart(2,"0");
        el.textContent=`${m}:${s}`;
        if(seg<=0){
            clearInterval(timerCarrito);timerCarrito=null;
            el.textContent="¡Expirado!";
            if(timerDiv) timerDiv.style.background="#ff4444";
        }
    },1000);
}

/* =============================================   BARRA ENVÍO GRATIS   */
const ENVIO_GRATIS_MIN=500; // Bs mínimo para envío gratis
function actualizarBarraEnvio(){
    const subtotal=carrito.reduce((acc,i)=>acc+(+i.precio*i.cantidad),0);
    const prog=$("envio-barra-prog");
    const texto=$("envio-barra-texto");
    if(!prog||!texto) return;
    const porcentaje=Math.min((subtotal/ENVIO_GRATIS_MIN)*100,100);
    prog.style.width=porcentaje+"%";
    if(subtotal>=ENVIO_GRATIS_MIN){
        texto.innerHTML=`🎉 ¡Envío gratis desbloqueado!`;
        prog.style.background="#00ff88";
    }else{
        const falta=ENVIO_GRATIS_MIN-subtotal;
        texto.innerHTML=`Solo <strong>${falta} Bs</strong> más para envío gratis 🚚`;
        prog.style.background="var(--accent)";
    }
}

/* =============================================   POPUP SALIDA   */
let exitPopupMostrado=false;
document.addEventListener("mouseleave",e=>{
    if(e.clientY<10&&!exitPopupMostrado&&carrito.length>0){
        exitPopupMostrado=true;
        $("exit-popup").classList.add("activo");
    }
});
const exitCerrar=$("exit-cerrar");
const exitBtn=$("exit-btn");
if(exitCerrar) exitCerrar.addEventListener("click",()=>$("exit-popup").classList.remove("activo"));
if(exitBtn) exitBtn.addEventListener("click",()=>{
    $("exit-popup").classList.remove("activo");
    // Aplicar cupón automáticamente
    const cupon=cupones.find(c=>c.codigo==="PREMIER10");
    if(cupon){cuponAplicado=cupon;$("descuento-aviso").style.display="block";$("descuento-aviso").textContent=`✅ Cupón "PREMIER10" — 10% off aplicado`;actualizarCarrito(true);}
    $("carrito-panel").style.display="block";
    document.querySelector(".catalogo").scrollIntoView({behavior:"smooth"});
});

/* =============================================   BADGE MÁS VENDIDO   */
function marcarMasVendido(){
    if(!productos.length) return;
    const maxVendidos=Math.max(...productos.map(p=>+p.vendidos||0));
    if(maxVendidos===0) return;
    productos.forEach(p=>p.esMasVendido=(+p.vendidos||0)===maxVendidos&&maxVendidos>0);
}

/* =============================================   UTILS   */
function mostrarToast(txt){const t=$("toast");t.textContent=txt;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800);}
function guardarLS(){localStorage.setItem("productos",JSON.stringify(productos));}
function limpiarFormulario(){["imagen","img-url","nombre","tallas","dorsales","calidad","colores","descripcion","precio","vendidos","precio-original","fin-oferta","stock"].forEach(id=>{if($(id))$(id).value="";});$("es-oferta").checked=false;$("campo-precio-original").style.display="none";}

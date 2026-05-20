const totalElemento =
document.getElementById("total");

const finalizarCompra =
document.getElementById("finalizar-compra");

const pagoModal =
document.getElementById("pago-modal");

const cerrarPago =
document.getElementById("cerrar-pago");

const totalPago =
document.getElementById("total-pago");

const enviarWhatsapp =
document.getElementById("enviar-whatsapp");

const sonidoCarrito =
document.getElementById("sonido-carrito");

/* =========================
   CARRITO
========================= */

let carrito = [];

/* =========================
   ELEMENTOS
========================= */

const carritoIcono =
document.querySelector(".carrito-icono");

const carritoPanel =
document.getElementById("carrito-panel");

const cerrarCarrito =
document.getElementById("cerrar-carrito");

const itemsCarrito =
document.getElementById("items-carrito");

const contadorCarrito =
document.getElementById("contador-carrito");

const catalogo =
document.getElementById("catalogo");

const buscador =
document.getElementById("buscador");

/* =========================
   PRODUCTOS
========================= */

let productos = JSON.parse(
    localStorage.getItem("productos")
) || [];

/* =========================
   INICIO
========================= */

window.onload = () => {

    renderProductos(productos);

};

/* =========================
   MOSTRAR / OCULTAR CARRITO
========================= */

carritoIcono.addEventListener("click", () => {

    if(
        carritoPanel.style.display === "block"
    ){

        carritoPanel.style.display = "none";

    }else{

        carritoPanel.style.display = "block";

    }

});

/* =========================
   CERRAR CARRITO
========================= */

if(cerrarCarrito){

    cerrarCarrito.addEventListener("click", () => {

        carritoPanel.style.display = "none";

    });

}

/* =========================
   BUSCADOR
========================= */

buscador.addEventListener("keyup", () => {

    const texto =
    buscador.value.toLowerCase();

    const filtrados =
    productos.filter(producto =>

        producto.nombre
        .toLowerCase()
        .includes(texto)

    );

    renderProductos(filtrados);

});

/* =========================
   AGREGAR PRODUCTO
========================= */

async function agregarProducto(){

    const archivos =
    document.getElementById("imagen").files;

    const nombre =
    document.getElementById("nombre").value;

    const tallas =
    document.getElementById("tallas").value;

    const dorsales =
    document.getElementById("dorsales").value;

    const calidad =
    document.getElementById("calidad").value;

    const categoria =
    document.getElementById("categoria").value;

    const precio =
    document.getElementById("precio").value;

    if(
        archivos.length === 0 ||
        nombre === "" ||
        precio === ""
    ){

        alert("Completa todos los campos");

        return;

    }

    alert("Subiendo imágenes...");

    let imagenes = [];

    for(let i = 0; i < archivos.length; i++){

        const formData = new FormData();

        formData.append(
            "file",
            archivos[i]
        );

        formData.append(
            "upload_preset",
            "futbol-premier"
        );

        try{

            const respuesta = await fetch(

                "https://api.cloudinary.com/v1_1/dxcfq1mln/image/upload",

                {
                    method:"POST",
                    body:formData
                }

            );

            const data =
            await respuesta.json();

            imagenes.push(
                data.secure_url
            );

        }catch(error){

            alert(
                "Error subiendo imágenes"
            );

            console.log(error);

            return;

        }

    }

    const producto = {

        id: Date.now(),

        imagenes,

        nombre,

        tallas,

        dorsales,

        calidad,

        categoria,

        precio

    };

    productos.push(producto);

    guardarLocalStorage();

    renderProductos(productos);

    limpiarFormulario();

    mostrarToast(
        "✅ Jersey agregado"
    );

}

/* =========================
   RENDER PRODUCTOS
========================= */

function renderProductos(lista){

    catalogo.innerHTML = "";

    if(lista.length === 0){

        catalogo.innerHTML = `

            <h2 class="sin-productos">
                No se encontraron jerseys
            </h2>

        `;

        return;

    }

    lista.forEach(producto => {

        crearCard(producto);

    });

}

/* =========================
   CREAR CARD
========================= */

function crearCard(producto){

    let index = 0;

    const thumbnails =
    producto.imagenes.map((img, i) => {

        return `

            <img
                src="${img}"
                class="thumb ${i === 0 ? 'active' : ''}"
                data-index="${i}"
            >

        `;

    }).join("");

    const card =
    document.createElement("div");

    card.classList.add("card");

    card.innerHTML = `

        <div class="slider">

            <img
                src="${producto.imagenes[0]}"
                class="slider-img"
            >

            <button class="prev">
                ❮
            </button>

            <button class="next">
                ❯
            </button>

        </div>

        <div class="miniaturas">

            ${thumbnails}

        </div>

        <div class="info">

            <h3>
                ${producto.nombre}
            </h3>

            <p>
                <strong>Tallas:</strong>
                ${producto.tallas}
            </p>

            <p>
                <strong>Dorsales:</strong>
                ${producto.dorsales}
            </p>

            <p>
                <strong>Calidad:</strong>
                ${producto.calidad}
            </p>

            <p>
                <strong>Categoría:</strong>
                ${producto.categoria}
            </p>

            <p class="precio">
                ${producto.precio} Bs
            </p>

            <div class="botones-card">

                <button class="agregar-carrito">
                    Agregar al carrito
                </button>

                <button class="eliminar">
                    Eliminar
                </button>

            </div>

        </div>

    `;

    const img =
    card.querySelector(".slider-img");

    const prev =
    card.querySelector(".prev");

    const next =
    card.querySelector(".next");

    const eliminar =
    card.querySelector(".eliminar");

    const agregarCarrito =
    card.querySelector(".agregar-carrito");

    const thumbs =
    card.querySelectorAll(".thumb");

    /* MODAL */

    const modal =
    document.getElementById("modal");

    const modalImg =
    document.getElementById("modal-img");

    const cerrar =
    document.querySelector(".cerrar");

    /* ACTUALIZAR IMAGEN */

    function actualizarImagen(){

        img.src =
        producto.imagenes[index];

        thumbs.forEach(t => {

            t.classList.remove("active");

        });

        thumbs[index]
        .classList.add("active");

    }

    /* BOTONES SLIDER */

    prev.addEventListener("click", () => {

        index--;

        if(index < 0){

            index =
            producto.imagenes.length - 1;

        }

        actualizarImagen();

    });

    next.addEventListener("click", () => {

        index++;

        if(index >= producto.imagenes.length){

            index = 0;

        }

        actualizarImagen();

    });

    /* MINIATURAS */

    thumbs.forEach(thumb => {

        thumb.addEventListener("click", () => {

            index =
            parseInt(
                thumb.dataset.index
            );

            actualizarImagen();

        });

    });

    /* MODAL IMAGEN */

    img.addEventListener("click", () => {

        modal.style.display = "flex";

        modalImg.src =
        producto.imagenes[index];

    });

    cerrar.addEventListener("click", () => {

        modal.style.display = "none";

    });

    modal.addEventListener("click", (e) => {

        if(e.target === modal){

            modal.style.display = "none";

        }

    });

    /* AGREGAR CARRITO */

    agregarCarrito.addEventListener("click", () => {

        const existente =
        carrito.find(item =>
            item.id === producto.id
        );

        if(existente){

            existente.cantidad++;

        }else{

            carrito.push({

                ...producto,

                cantidad:1

            });

        }

        actualizarCarrito();

        if(sonidoCarrito){

            sonidoCarrito.play();

        }

        mostrarToast(
            "🛒 Producto agregado"
        );

    });

    /* ELIMINAR PRODUCTO */

    eliminar.addEventListener("click", () => {

        const confirmar =
        confirm(
            "¿Eliminar este jersey?"
        );

        if(!confirmar){

            return;

        }

        productos = productos.filter(p =>

            p.id !== producto.id

        );

        guardarLocalStorage();

        renderProductos(productos);

        mostrarToast(
            "❌ Jersey eliminado"
        );

    });

    catalogo.appendChild(card);

}

/* =========================
   GUARDAR LOCALSTORAGE
========================= */

function guardarLocalStorage(){

    localStorage.setItem(
        "productos",
        JSON.stringify(productos)
    );

}

/* =========================
   LIMPIAR FORMULARIO
========================= */

function limpiarFormulario(){

    document.getElementById("imagen").value = "";

    document.getElementById("nombre").value = "";

    document.getElementById("tallas").value = "";

    document.getElementById("dorsales").value = "";

    document.getElementById("calidad").value = "";

    document.getElementById("precio").value = "";

}

/* =========================
   FILTRAR CATEGORÍA
========================= */

function filtrarCategoria(categoria){

    if(categoria === "todos"){

        renderProductos(productos);

        return;

    }

    const filtrados =
    productos.filter(producto =>

        producto.categoria === categoria

    );

    renderProductos(filtrados);

}

/* =========================
   ACTUALIZAR CARRITO
========================= */

function actualizarCarrito(){

    itemsCarrito.innerHTML = "";

    let total = 0;

    let cantidadTotal = 0;

    carrito.forEach((item, index) => {

        total +=
        Number(item.precio) * item.cantidad;

        cantidadTotal +=
        item.cantidad;

        const div =
        document.createElement("div");

        div.classList.add("item-carrito");

        div.innerHTML = `

            <div class="item-top">

                <h4>
                    ${item.nombre}
                </h4>

                <button
                    class="eliminar-item"
                    data-index="${index}"
                >
                    ✕
                </button>

            </div>

            <p>
                ${item.precio} Bs
            </p>

            <div class="cantidad-control">

                <button
                    class="menos"
                    data-index="${index}"
                >
                    -
                </button>

                <span>
                    ${item.cantidad}
                </span>

                <button
                    class="mas"
                    data-index="${index}"
                >
                    +
                </button>

            </div>

        `;

        itemsCarrito.appendChild(div);

    });

    contadorCarrito.textContent =
    cantidadTotal;

    totalElemento.textContent =
    total;

    /* MÁS */

    document.querySelectorAll(".mas")
    .forEach(btn => {

        btn.addEventListener("click", () => {

            const index =
            parseInt(btn.dataset.index);

            carrito[index].cantidad++;

            actualizarCarrito();

        });

    });

    /* MENOS */

    document.querySelectorAll(".menos")
    .forEach(btn => {

        btn.addEventListener("click", () => {

            const index =
            parseInt(btn.dataset.index);

            if(
                carrito[index].cantidad > 1
            ){

                carrito[index].cantidad--;

            }else{

                carrito.splice(index, 1);

            }

            actualizarCarrito();

        });

    });

    /* ELIMINAR ITEM */

    document.querySelectorAll(".eliminar-item")
    .forEach(btn => {

        btn.addEventListener("click", () => {

            const index =
            parseInt(btn.dataset.index);

            carrito.splice(index, 1);

            actualizarCarrito();

        });

    });

}

/* =========================
   FINALIZAR COMPRA
========================= */

finalizarCompra.addEventListener("click", () => {

    if(carrito.length === 0){

        alert(
            "El carrito está vacío"
        );

        return;

    }

    let total = 0;

    carrito.forEach(item => {

        total +=
        Number(item.precio) * item.cantidad;

    });

    totalPago.textContent =
    total;

    pagoModal.style.display =
    "flex";

});

/* =========================
   CERRAR MODAL PAGO
========================= */

cerrarPago.addEventListener("click", () => {

    pagoModal.style.display =
    "none";

});

/* =========================
   ENVIAR WHATSAPP
========================= */

enviarWhatsapp.addEventListener("click", () => {

    let mensaje =
    "Hola, ya realicé el pago:%0A%0A";

    let total = 0;

    carrito.forEach(item => {

        mensaje +=
        `• ${item.nombre} x${item.cantidad} - ${item.precio} Bs%0A`;

        total +=
        Number(item.precio) * item.cantidad;

    });

    mensaje +=
    `%0A💰 Total: ${total} Bs`;

    mensaje +=
    `%0A%0AAdjuntaré mi comprobante.`;

    const numero =
    "59171208827";

    const url =
    `https://wa.me/${numero}?text=${mensaje}`;

    window.open(url, "_blank");

    carrito = [];

    actualizarCarrito();

    pagoModal.style.display =
    "none";

});

/* =========================
   TOAST
========================= */

function mostrarToast(texto){

    const toast =
    document.getElementById("toast");

    if(!toast) return;

    toast.textContent = texto;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}

/* =========================
   LOGIN ADMIN
========================= */

const loginModal =
document.getElementById("login-modal");

const loginBtn =
document.getElementById("login-btn");

const adminPanel =
document.getElementById("admin-panel");

const adminPassword =
document.getElementById("admin-password");

/* OCULTAR PANEL ADMIN */

if(adminPanel){

    adminPanel.style.display = "none";

}

/* LOGIN */

if(loginBtn){

    loginBtn.addEventListener("click", () => {

        if(
            adminPassword.value ===
            "futbolpremier123"
        ){

            adminPanel.style.display =
            "block";

            loginModal.style.display =
            "none";

            mostrarToast(
                "✅ Bienvenido Admin"
            );

        }else{

            alert(
                "Contraseña incorrecta"
            );

        }

    });

}
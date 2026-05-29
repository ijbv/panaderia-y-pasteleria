/* ================================================
   Pan y Miel — JavaScript Funcional Completo
   ================================================ */


// ── SUPABASE CONFIG ───────────────────────────────
var SUPABASE_URL = 'https://qfsqufwlwhyuecgtfjji.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmc3F1Zndsd2h5dWVjZ3RmamppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3Mzg2MzUsImV4cCI6MjA5NTMxNDYzNX0.HnEuxrXeaFpMKrV4u5fmUq3QKaH61FE9ELdsBZRXuIY';

// ── EMAILJS CONFIG ────────────────────────────────
// Reemplaza estos 3 valores con los tuyos de emailjs.com
var EMAILJS_PUBLIC_KEY         = 'CffRFulzpH1KQLXqX';
var EMAILJS_SERVICE_ID         = 'service_ad9fld5';
var EMAILJS_TEMPLATE_ID        = 'template_lg2l91r';   // plantilla "Contact Us" (cliente)
var EMAILJS_TEMPLATE_DELIVERY  = 'template_lg2l91r'; // plantilla Delivery Notificación

function inicializarEmailJS() {
  // EmailJS puede no estar listo si se llama antes del DOMContentLoaded
  // Se inicializa aquí y también se reintenta antes de cada envío
  if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }
}
// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarEmailJS);
} else {
  inicializarEmailJS();
}

// Envía correo al delivery con los detalles del pedido
function enviarCorreoDelivery(correoDelivery, nombreDelivery, pedido) {
  // Reintentar init por si acaso
  if (typeof emailjs !== 'undefined') {
    try { emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); } catch(e) {}
  } else {
    console.warn('EmailJS no está cargado');
    return;
  }
  if (!correoDelivery) { console.warn('Sin correo de delivery'); return; }
  var items = pedido.items ? pedido.items.map(function(i){ return i.name + ' ×' + i.qty; }).join(', ') : '';
  var pageUrl = 'https://ijbv.github.io/PANADERIA-Y-PASTELERIA/';
  var params = {
    to_email:    correoDelivery,
    to_name:     nombreDelivery,
    pedido_id:   pedido.id ? pedido.id.substring(0,8).toUpperCase() : '',
    items:       items,
    direccion:   pedido.direccion || 'Sin dirección',
    telefono:    pedido.telefono  || 'No indicado',
    total:       pedido.total ? '$' + parseFloat(pedido.total).toFixed(2) : '',
    app_url:     pageUrl
  };
  console.log('📧 Enviando correo a:', correoDelivery, '| Template:', EMAILJS_TEMPLATE_DELIVERY, '| Params:', params);
  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_DELIVERY, params)
    .then(function(r) { console.log('✅ Correo enviado OK:', r.status, r.text); })
    .catch(function(e) { console.error('❌ EmailJS error:', JSON.stringify(e)); });
}

function savePedido(pedidoData) {
  return fetch(SUPABASE_URL + '/rest/v1/pedidos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(pedidoData)
  })
  .then(function(res) { return res.json(); })
  .catch(function(err) { console.error('Supabase error:', err); return null; });
}

// ── CARRITO ──────────────────────────────────────
let cart = [];

function addToCart(id, name, price, img) {
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price, img, qty: 1 });
  }
  updateCartUI();
  renderCartItems();
  showToast('\u2713 ' + name + ' a\u00f1adido al carrito');
  animateBadge();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCartUI();
  renderCartItems();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id); return; }
  updateCartUI();
  renderCartItems();
}

function updateCartUI() {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartTotal').textContent = '$' + total.toFixed(2);
  document.getElementById('cartBadge').textContent = count;
}

function renderCartItems() {
  const el = document.getElementById('cartItems');
  if (cart.length === 0) {
    el.innerHTML = '<p class="cart-empty">Tu carrito est\u00e1 vac\u00edo</p>';
    return;
  }
  el.innerHTML = cart.map(function(item) {
    return '<div class="cart-item">' +
      '<img src="' + item.img + '" alt="' + item.name + '">' +
      '<div class="cart-item-info">' +
        '<p class="cart-item-name">' + item.name + '</p>' +
        '<p class="cart-item-price">$' + item.price.toFixed(2) + '</p>' +
        '<div class="cart-item-qty">' +
          '<button onclick="changeQty(' + item.id + ',-1)">\u2212</button>' +
          '<span>' + item.qty + '</span>' +
          '<button onclick="changeQty(' + item.id + ',1)">+</button>' +
        '</div>' +
      '</div>' +
      '<button class="cart-item-remove" onclick="removeFromCart(' + item.id + ')" title="Eliminar">' +
        '<i class="fa-solid fa-trash-can"></i>' +
      '</button>' +
    '</div>';
  }).join('');
}

function toggleCart() {
  document.getElementById('cartSidebar').classList.toggle('open');
  document.getElementById('cartOverlay').classList.toggle('active');
  document.body.style.overflow = document.getElementById('cartSidebar').classList.contains('open') ? 'hidden' : '';
}

function animateBadge() {
  const badge = document.getElementById('cartBadge');
  badge.classList.remove('bounce');
  void badge.offsetWidth;
  badge.classList.add('bounce');
}

// ── CHECKOUT FLOW ─────────────────────────────────
let selectedEntrega = null;
let selectedPago = null;
let comprobanteFile = null;

function openCheckout() {
  if (cart.length === 0) { showToast('\u26a0 Tu carrito est\u00e1 vac\u00edo'); return; }
  selectedEntrega = null;
  selectedPago = null;
  comprobanteFile = null;

  document.querySelectorAll('.delivery-option').forEach(function(el) { el.classList.remove('selected'); });
  document.querySelectorAll('.payment-option').forEach(function(el) { el.classList.remove('selected'); });
  document.querySelectorAll('input[name="entrega"]').forEach(function(i) { i.checked = false; });
  document.querySelectorAll('input[name="pago"]').forEach(function(i) { i.checked = false; });

  document.getElementById('deliveryAddress').style.display = 'none';
  document.getElementById('addressInput').value = '';
  if (document.getElementById('phoneInput')) document.getElementById('phoneInput').value = '';
  document.getElementById('btnGoPayment').disabled = true;

  var inp = document.getElementById('comprobanteInput');
  if (inp) inp.value = '';
  var prev = document.getElementById('comprobantePreview');
  if (prev) prev.style.display = 'none';
  var lbl = document.getElementById('uploadLabel');
  if (lbl) lbl.style.display = '';
  var panel = document.getElementById('pagoMovilPanel');
  if (panel) panel.classList.remove('visible');

  document.getElementById('stepEntrega').style.display = '';
  document.getElementById('stepPago').style.display = 'none';
  document.getElementById('stepConfirmado').style.display = 'none';

  if (document.getElementById('cartSidebar').classList.contains('open')) toggleCart();

  document.getElementById('checkoutOverlay').classList.add('active');
  document.getElementById('checkoutModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function cancelCheckout() {
  document.getElementById('checkoutOverlay').classList.remove('active');
  document.getElementById('checkoutModal').classList.remove('open');
  document.body.style.overflow = '';
  showToast('\uD83D\uDEAB Pedido cancelado');
}

function selectEntrega(tipo) {
  selectedEntrega = tipo;
  document.querySelectorAll('.delivery-option').forEach(function(el) { el.classList.remove('selected'); });
  document.getElementById(tipo === 'delivery' ? 'optDelivery' : 'optRetiro').classList.add('selected');
  document.getElementById('deliveryAddress').style.display = tipo === 'delivery' ? '' : 'none';
  document.getElementById('retiroPhone').style.display = tipo === 'retiro' ? '' : 'none';
  document.getElementById('btnGoPayment').disabled = false;
}

function goToPayment() {
  if (!selectedEntrega) return;
  if (selectedEntrega === 'delivery') {
    var addr = document.getElementById('addressInput').value.trim();
    if (!addr) { showToast('\u26a0 Ingresa tu direcci\u00f3n de entrega'); return; }
  }

  var subtotal = cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
  var deliveryCost = selectedEntrega === 'delivery' ? 2.00 : 0;
  var total = subtotal + deliveryCost;

  var summaryItems = document.getElementById('checkoutSummaryItems');
  summaryItems.innerHTML = cart.map(function(i) {
    return '<div class="summary-item"><span>' + i.name + ' \u00d7' + i.qty + '</span><span>$' + (i.price * i.qty).toFixed(2) + '</span></div>';
  }).join('');

  document.getElementById('summarySubtotal').textContent = '$' + subtotal.toFixed(2);
  var deliveryRow = document.getElementById('summaryDeliveryRow');
  if (selectedEntrega === 'delivery') {
    deliveryRow.style.display = 'flex';
    document.getElementById('summaryDelivery').textContent = '$2.00';
  } else {
    deliveryRow.style.display = 'none';
  }
  document.getElementById('summaryTotal').textContent = '$' + total.toFixed(2);
  document.getElementById('btnConfirm').disabled = true;

  selectedPago = null;
  comprobanteFile = null;
  var inp2 = document.getElementById('comprobanteInput');
  if (inp2) inp2.value = '';
  var prev2 = document.getElementById('comprobantePreview');
  if (prev2) prev2.style.display = 'none';
  var lbl2 = document.getElementById('uploadLabel');
  if (lbl2) lbl2.style.display = '';
  document.getElementById('pagoMovilPanel').classList.remove('visible');
  document.querySelectorAll('.payment-option').forEach(function(el) { el.classList.remove('selected'); });
  document.querySelectorAll('input[name="pago"]').forEach(function(i) { i.checked = false; });

  document.getElementById('stepEntrega').style.display = 'none';
  document.getElementById('stepPago').style.display = '';
}

function backToEntrega() {
  document.getElementById('stepPago').style.display = 'none';
  document.getElementById('stepEntrega').style.display = '';
}

function selectPago(metodo) {
  selectedPago = metodo;
  document.querySelectorAll('.payment-option').forEach(function(el) { el.classList.remove('selected'); });
  var ids = { efectivo: 'payEfectivo', transferencia: 'payTransferencia', pagomovil: 'payPagoMovil', tarjeta: 'payTarjeta' };
  document.getElementById(ids[metodo]).classList.add('selected');

  var panel = document.getElementById('pagoMovilPanel');
  if (metodo === 'pagomovil') {
    panel.classList.add('visible');
    document.getElementById('btnConfirm').disabled = (comprobanteFile === null);
  } else {
    panel.classList.remove('visible');
    document.getElementById('btnConfirm').disabled = false;
  }
}

function handleComprobante(event) {
  var file = event.target.files[0];
  if (!file) return;
  comprobanteFile = file;
  var reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('comprobanteImg').src = e.target.result;
    document.getElementById('comprobantePreview').style.display = '';
    document.getElementById('uploadLabel').style.display = 'none';
    document.getElementById('btnConfirm').disabled = false;
    showToast('\u2713 Comprobante cargado');
  };
  reader.readAsDataURL(file);
}

function removeComprobante() {
  comprobanteFile = null;
  document.getElementById('comprobanteInput').value = '';
  document.getElementById('comprobantePreview').style.display = 'none';
  document.getElementById('uploadLabel').style.display = '';
  document.getElementById('btnConfirm').disabled = true;
}

function confirmCheckout() {
  if (!selectedPago) return;
  var subtotal = cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
  var deliveryCost = selectedEntrega === 'delivery' ? 2.00 : 0;
  var total = (subtotal + deliveryCost).toFixed(2);
  var pagoLabels = { efectivo: 'Efectivo', transferencia: 'Transferencia bancaria', pagomovil: 'Pago M\u00f3vil', tarjeta: 'Tarjeta' };
  var entregaLabel = selectedEntrega === 'delivery' ? '\uD83D\uDCE6 Te lo enviamos a tu direcci\u00f3n.' : '\uD83C\uDFEA P\u00e1salo a buscar a nuestra tienda.';
  var address = selectedEntrega === 'delivery' ? document.getElementById('addressInput').value.trim() : '';

  // Guardar pedido en Supabase
  var pedidoData = {
    items: cart.map(function(i) { return { id: i.id, name: i.name, price: i.price, qty: i.qty }; }),
    subtotal: subtotal,
    delivery_cost: deliveryCost,
    total: parseFloat(total),
    entrega: selectedEntrega,
    direccion: address || null,
    telefono: selectedEntrega === 'delivery'
      ? (document.getElementById('phoneInput').value.trim() || null)
      : (document.getElementById('retiroPhoneInput').value.trim() || null),
    metodo_pago: selectedPago,
    estado: 'pendiente'
  };
  // Mostrar pantalla de confirmación primero
  document.getElementById('stepPago').style.display = 'none';
  document.getElementById('stepConfirmado').style.display = '';
  document.getElementById('confirmedMsg').innerHTML =
    entregaLabel + '<br>Pago: <strong>' + pagoLabels[selectedPago] + '</strong><br>Total: <strong>$' + total + '</strong>';

  var elCodigo = document.getElementById('codigoPedido');
  if (elCodigo) elCodigo.textContent = 'Guardando pedido...';

  // Guardar en Supabase y mostrar código
  savePedido(pedidoData).then(function(res) {
    if (res && res[0] && res[0].id) {
      window._lastPedidoId = res[0].id;
      var codigo = res[0].id.substring(0, 8).toUpperCase();
      window._lastCodigo = codigo;
      if (elCodigo) elCodigo.textContent = '#' + codigo;
      var btnCopiar = document.getElementById('btnCopiarCodigo');
      var explicacion = document.getElementById('codigoExplicacion');
      if (btnCopiar) btnCopiar.style.display = '';
      if (explicacion) explicacion.style.display = '';
    } else {
      if (elCodigo) elCodigo.textContent = 'Error al guardar';
    }
  });
}


function finishCheckout() {
  cart = [];
  updateCartUI();
  renderCartItems();
  document.getElementById('checkoutOverlay').classList.remove('active');
  document.getElementById('checkoutModal').classList.remove('open');
  document.body.style.overflow = '';
  showToast('\uD83C\uDF89 \u00a1Gracias por tu pedido!');
}

function checkout() { openCheckout(); }

// ── MENÚ HAMBURGUESA ─────────────────────────────
function toggleMenu() {
  var nav = document.getElementById('mainNav');
  var btn = document.getElementById('hamburgerBtn');
  nav.classList.toggle('open');
  var icon = btn.querySelector('i');
  icon.classList.toggle('fa-bars');
  icon.classList.toggle('fa-xmark');
}

document.querySelectorAll('.main-nav a').forEach(function(a) {
  a.addEventListener('click', function() {
    document.getElementById('mainNav').classList.remove('open');
    var icon = document.querySelector('#hamburgerBtn i');
    icon.classList.add('fa-bars');
    icon.classList.remove('fa-xmark');
  });
});

// ── BÚSQUEDA ─────────────────────────────────────
function handleSearch(e) {
  e.preventDefault();
  var q = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!q) return;
  var cards = document.querySelectorAll('.product-card');
  var found = 0;
  cards.forEach(function(card) {
    var name = card.querySelector('.product-name').textContent.toLowerCase();
    if (name.includes(q)) {
      found++;
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.outline = '2px solid var(--amber)';
      card.style.outlineOffset = '4px';
      setTimeout(function() { card.style.outline = ''; card.style.outlineOffset = ''; }, 2500);
    }
  });
  showToast(found ? '\uD83D\uDD0D ' + found + ' resultado(s) para "' + q + '"' : '\uD83D\uDD0D Sin resultados para "' + q + '"');
  document.getElementById('searchInput').value = '';
}

// ── WISHLIST ──────────────────────────────────────
function addToWishlist(name) {
  showToast('\u2764 "' + name + '" a\u00f1adido a favoritos');
}

// ── VISTA RÁPIDA ─────────────────────────────────
function quickView(name, img, priceStr, id, price) {
  document.getElementById('modalImg').src = img;
  document.getElementById('modalImg').alt = name;
  document.getElementById('modalName').textContent = name;
  document.getElementById('modalPrice').textContent = priceStr;
  document.getElementById('modalCartBtn').onclick = function() {
    addToCart(id, name, price, img);
    closeModal();
  };
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('quickModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.getElementById('quickModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ── CATEGORÍAS ───────────────────────────────────
function scrollToProducts() {
  document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });
}

// ── NEWSLETTER ───────────────────────────────────
function handleNewsletter() {
  var email = document.getElementById('newsletterEmail').value.trim();
  if (!email || !email.includes('@')) {
    showToast('\u26a0 Ingresa un correo v\u00e1lido');
    return;
  }
  showToast('\u2713 \u00a1Suscrito con \u00e9xito! Bienvenido.');
  document.getElementById('newsletterEmail').value = '';
}

// ── TOAST ─────────────────────────────────────────
var toastTimer;
function showToast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { el.classList.remove('show'); }, 3200);
}

// ── SCROLL TO TOP ─────────────────────────────────
var scrollBtn = document.createElement('button');
scrollBtn.className = 'scroll-top-btn';
scrollBtn.title = 'Volver arriba';
scrollBtn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
scrollBtn.onclick = function() { window.scrollTo({ top: 0, behavior: 'smooth' }); };
document.body.appendChild(scrollBtn);

window.addEventListener('scroll', function() {
  scrollBtn.classList.toggle('visible', window.scrollY > 500);
});

// ── INTERSECTION OBSERVER (fade-in al scroll) ─────
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.product-card, .category-card, .blog-card, .feature-item').forEach(function(el) {
  el.style.opacity = '0';
  el.style.transform = 'translateY(2.5rem)';
  el.style.transition = 'opacity 0.55s ease, transform 0.55s ease, box-shadow 0.35s ease';
  observer.observe(el);
});

// ── SMOOTH SCROLL ─────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    var target = document.querySelector(this.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ── OVERLAY CHECKOUT (clic fuera cierra) ────────────
document.getElementById('checkoutOverlay').addEventListener('click', function() {
  cancelCheckout();
});

// Evitar que clics dentro del modal lo cierren
document.getElementById('checkoutModal').addEventListener('click', function(e) {
  e.stopPropagation();
});

// ── CERRAR CON ESC ────────────────────────────────
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal();
    if (document.getElementById('cartSidebar').classList.contains('open')) toggleCart();
    if (document.getElementById('checkoutModal').classList.contains('open')) cancelCheckout();
  }
});

// ── COPIAR CÓDIGO ────────────────────────────────────
function copiarCodigo() {
  var codigo = window._lastCodigo || '';
  if (!codigo) return;
  navigator.clipboard.writeText('#' + codigo).then(function() {
    showToast('✓ Código copiado: #' + codigo);
  }).catch(function() {
    showToast('Código: #' + codigo);
  });
}

// ── BUSCAR PEDIDO ─────────────────────────────────
function buscarPedido() {
  var input = document.getElementById('buscarCodigo').value.trim().replace('#', '').toLowerCase();
  var resultBox = document.getElementById('pedidoResultado');
  if (!input || input.length < 6) {
    resultBox.innerHTML = '<p class="pedido-error">Ingresa un c\u00f3digo v\u00e1lido</p>';
    return;
  }
  resultBox.innerHTML = '<p class="pedido-buscando"><i class="fa-solid fa-spinner fa-spin"></i> Buscando...</p>';

  // Los UUIDs no soportan ilike — traemos todos y filtramos por los primeros 8 chars
  fetch(SUPABASE_URL + '/rest/v1/pedidos?select=*&order=created_at.desc', {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY
    }
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (!data || data.length === 0) {
      resultBox.innerHTML = '<p class="pedido-error">\u26a0 No encontramos ese pedido. Verifica el c\u00f3digo.</p>';
      return;
    }
    var p = data.find(function(x) { return x.id && x.id.toLowerCase().startsWith(input.toLowerCase()); });
    if (!p) {
      resultBox.innerHTML = '<p class="pedido-error">\u26a0 No encontramos ese pedido. Verifica el c\u00f3digo.</p>';
      return;
    }
    var items = p.items.map(function(i) {
      return '<li style="display:flex; justify-content:space-between; font-size:.88rem; color:var(--ink);">' +
        '<span>🍞 ' + i.name + ' <span style="color:#999;">×' + i.qty + '</span></span>' +
        '<span style="font-weight:600;">$' + (i.price * i.qty).toFixed(2) + '</span>' +
        '</li>';
    }).join('');
    var estado = p.estado || 'pendiente';
    var fecha = new Date(p.created_at).toLocaleString('es-VE');

    // Pasos del progreso
    var pasos = [
      { key: 'pendiente',  icon: '🧾', label: 'Pedido recibido' },
      { key: 'listo',      icon: '👨‍🍳', label: 'Preparando' },
      { key: 'confirmado', icon: '🛵', label: 'En camino' },
      { key: 'entregado',  icon: '✅', label: 'Entregado' }
    ];
    var ordenEstado = { pendiente: 0, listo: 1, confirmado: 2, entregado: 3 };
    var pasoActual = ordenEstado[estado] !== undefined ? ordenEstado[estado] : 0;

    var barraProgreso = '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin:1.5rem 0 1rem; position:relative;">' +
      '<div style="position:absolute; top:1.2rem; left:10%; right:10%; height:3px; background:#e8e0d0; z-index:0;">' +
        '<div style="height:100%; background:var(--amber); width:' + (pasoActual / 3 * 100) + '%; transition:width .5s;"></div>' +
      '</div>' +
      pasos.map(function(paso, i) {
        var activo = i <= pasoActual;
        var esCurrent = i === pasoActual;
        return '<div style="display:flex; flex-direction:column; align-items:center; gap:.4rem; z-index:1; flex:1;">' +
          '<div style="width:2.4rem; height:2.4rem; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.1rem; ' +
            (esCurrent ? 'background:var(--amber); box-shadow:0 0 0 4px rgba(196,130,40,.2);' :
             activo ? 'background:var(--amber);' : 'background:#e8e0d0;') + '">' +
            paso.icon +
          '</div>' +
          '<span style="font-size:.72rem; text-align:center; color:' + (activo ? 'var(--ink)' : '#aaa') + '; font-weight:' + (esCurrent ? '700' : '400') + ';">' + paso.label + '</span>' +
        '</div>';
      }).join('') +
    '</div>';

    // Badge de estado
    var estadoBadgeStyle = {
      pendiente:  'background:#fff3cd; color:#856404;',
      listo:      'background:#d4edda; color:#155724;',
      confirmado: 'background:#cce5ff; color:#004085;',
      entregado:  'background:#d4edda; color:#155724;'
    };
    var estadoLabel = { pendiente: '🧾 Pedido recibido', listo: '👨‍🍳 Preparando', confirmado: '🛵 En camino', entregado: '✅ Entregado' };

    var deliveryInfo = (estado === 'confirmado' || estado === 'entregado') && p.delivery_nombre
      ? '<div style="background:#f0f9ff; border:1px solid #bde0fe; border-radius:.7rem; padding:.8rem 1rem; margin-top:.8rem; display:flex; align-items:center; gap:.6rem;">' +
          '<span style="font-size:1.4rem;">🛵</span>' +
          '<div><p style="margin:0; font-size:.8rem; color:#666;">Tu delivery</p><p style="margin:0; font-weight:700; color:var(--ink);">' + p.delivery_nombre + '</p></div>' +
        '</div>'
      : '';

    resultBox.innerHTML =
      '<div class="pedido-card" style="border-radius:1.2rem; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,.1); border:none;">' +
        // Cabecera
        '<div style="background:var(--ink); padding:1.2rem 1.5rem; display:flex; justify-content:space-between; align-items:center;">' +
          '<div>' +
            '<p style="margin:0; color:rgba(255,255,255,.6); font-size:.78rem; letter-spacing:.05em;">NÚMERO DE PEDIDO</p>' +
            '<p style="margin:0; color:#fff; font-size:1.3rem; font-weight:800; font-family:var(--font-display);">#' + p.id.substring(0,8).toUpperCase() + '</p>' +
          '</div>' +
          '<span style="padding:.4rem .9rem; border-radius:2rem; font-size:.82rem; font-weight:700; ' + (estadoBadgeStyle[estado]||'background:#eee; color:#333;') + '">' + (estadoLabel[estado]||estado) + '</span>' +
        '</div>' +
        // Barra progreso
        '<div style="padding:1rem 1.5rem 0;">' + barraProgreso + '</div>' +
        // Detalle
        '<div style="padding:.5rem 1.5rem 1.5rem;">' +
          '<p style="color:#999; font-size:.8rem; margin:.2rem 0 1rem;">📅 ' + fecha + '</p>' +
          '<div style="background:#faf8f5; border-radius:.8rem; padding:1rem;">' +
            '<ul style="list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.4rem;">' + items + '</ul>' +
            '<div style="border-top:1px solid #e8e0d0; margin-top:.8rem; padding-top:.8rem; display:flex; flex-direction:column; gap:.3rem;">' +
              '<div style="display:flex; justify-content:space-between; color:#888; font-size:.85rem;"><span>Subtotal</span><span>$' + parseFloat(p.subtotal).toFixed(2) + '</span></div>' +
              (p.delivery_cost > 0 ? '<div style="display:flex; justify-content:space-between; color:#888; font-size:.85rem;"><span>Envío</span><span>$' + parseFloat(p.delivery_cost).toFixed(2) + '</span></div>' : '') +
              '<div style="display:flex; justify-content:space-between; font-weight:800; font-size:1rem; color:var(--ink); margin-top:.2rem;"><span>Total</span><span>$' + parseFloat(p.total).toFixed(2) + '</span></div>' +
            '</div>' +
          '</div>' +
          '<div style="margin-top:.8rem; display:flex; align-items:center; gap:.5rem; color:#666; font-size:.85rem;">' +
            (p.entrega === 'delivery' ? '🛵 <strong>Delivery</strong>' : '🏪 <strong>Retiro en tienda</strong>') +
            (p.direccion ? ' · ' + p.direccion : '') +
          '</div>' +
          deliveryInfo +
        '</div>' +
      '</div>';
    // Activar auto-refresh para actualizar la barra automáticamente
    iniciarSeguimientoAutoRefresh(input, estado);
  })
  .catch(function() {
    resultBox.innerHTML = '<p class="pedido-error">Error de conexi\u00f3n. Int\u00e9ntalo de nuevo.</p>';
  });
}

// u2500u2500 AUTO-REFRESH SEGUIMIENTO PEDIDO u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500
var _seguimientoTimer = null;
var _seguimientoUltimoEstado = null;
var _seguimientoCodigo = null;

function iniciarSeguimientoAutoRefresh(codigo, estadoActual) {
  _seguimientoCodigo = codigo;
  _seguimientoUltimoEstado = estadoActual;
  detenerSeguimientoAutoRefresh();
  if (estadoActual === 'entregado') return;
  _seguimientoTimer = setInterval(function() {
    if (!_seguimientoCodigo) return;
    fetch(SUPABASE_URL + '/rest/v1/pedidos?select=id,estado&order=created_at.desc', {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
    })
    .then(function(r){ return r.json(); })
    .then(function(data) {
      if (!data || !data.length) return;
      var found = data.find(function(x){ return x.id && x.id.toLowerCase().startsWith(_seguimientoCodigo.toLowerCase()); });
      if (!found) return;
      var nuevoEstado = found.estado;
      if (nuevoEstado !== _seguimientoUltimoEstado) {
        _seguimientoUltimoEstado = nuevoEstado;
        buscarPedido();
        if (nuevoEstado === 'entregado') detenerSeguimientoAutoRefresh();
      }
    })
    .catch(function(){});
  }, 8000);
}

function detenerSeguimientoAutoRefresh() {
  if (_seguimientoTimer) { clearInterval(_seguimientoTimer); _seguimientoTimer = null; }
}

// ── PANTALLA DELIVERY ─────────────────────────────
var _deliveryFiltro = 'disponibles';
var _deliveryActual = null; // { id, nombre, telefono }

// ── SESIÓN DELIVERY (localStorage) ───────────────
function cargarSesionDelivery() {
  try { var s = localStorage.getItem('delivery_sesion'); if (s) return JSON.parse(s); } catch(e) {}
  return null;
}
function guardarSesionDelivery(data) {
  try { localStorage.setItem('delivery_sesion', JSON.stringify(data)); } catch(e) {}
}
function borrarSesionDelivery() {
  try { localStorage.removeItem('delivery_sesion'); } catch(e) {}
}

// ── TABS REGISTRO / LOGIN ─────────────────────────
function switchDeliveryTab(tab) {
  var esLogin = tab === 'login';
  document.getElementById('formLogin').style.display   = esLogin ? 'flex' : 'none';
  document.getElementById('formRegistro').style.display = esLogin ? 'none' : 'flex';
  document.getElementById('deliveryRegError').style.display = 'none';
  document.getElementById('deliveryTabSubtitle').textContent = esLogin
    ? 'Ingresa tu correo y contraseña para continuar.'
    : 'Crea tu cuenta para empezar a recibir pedidos.';
  document.getElementById('tabLoginBtn').style.color        = esLogin ? 'var(--amber)' : 'var(--warm-gray)';
  document.getElementById('tabLoginBtn').style.borderBottomColor  = esLogin ? 'var(--amber)' : 'transparent';
  document.getElementById('tabLoginBtn').style.fontWeight   = esLogin ? '700' : '600';
  document.getElementById('tabRegistroBtn').style.color     = esLogin ? 'var(--warm-gray)' : 'var(--amber)';
  document.getElementById('tabRegistroBtn').style.borderBottomColor = esLogin ? 'transparent' : 'var(--amber)';
  document.getElementById('tabRegistroBtn').style.fontWeight = esLogin ? '600' : '700';
}

// ── ABRIR / CERRAR ────────────────────────────────
function abrirDelivery() {
  document.getElementById('deliveryScreen').style.display = '';
  document.body.style.overflow = 'hidden';
  var sesion = cargarSesionDelivery();
  if (sesion && sesion.id) {
    _deliveryActual = sesion;
    // Si la sesión guardada no tiene correo, refrescamos desde Supabase
    if (!sesion.correo) {
      fetch(SUPABASE_URL + '/rest/v1/deliveries?id=eq.' + sesion.id + '&select=*', {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
      })
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d && d[0]) {
          _deliveryActual = { id: d[0].id, nombre: d[0].nombre, telefono: d[0].telefono, correo: d[0].correo };
          guardarSesionDelivery(_deliveryActual);
          console.log('✅ Sesión refrescada con correo:', _deliveryActual.correo);
        }
      })
      .catch(function(){});
    }
    mostrarPanelPedidos();
  } else {
    mostrarPanelRegistro();
  }
}

function cerrarDelivery() {
  document.getElementById('deliveryScreen').style.display = 'none';
  document.body.style.overflow = '';
  detenerAutoRefresh();
}

function cerrarSesionDelivery() {
  _deliveryActual = null;
  borrarSesionDelivery();
  detenerAutoRefresh();
  mostrarPanelRegistro();
  showToast('Sesión cerrada');
}

function mostrarPanelRegistro() {
  document.getElementById('deliveryPanelRegistro').style.display = '';
  document.getElementById('deliveryPanelPedidos').style.display = 'none';
  document.getElementById('deliveryRegError').style.display = 'none';
  switchDeliveryTab('login');
}

function mostrarPanelPedidos() {
  document.getElementById('deliveryPanelRegistro').style.display = 'none';
  document.getElementById('deliveryPanelPedidos').style.display = '';
  document.getElementById('deliveryBienvenido').textContent = '¡Hola, ' + _deliveryActual.nombre + '! 👋 Toca "Tomar pedido" para asignarte uno.';
  _deliveryFiltro = 'disponibles';
  document.querySelectorAll('.btn-filtro-delivery').forEach(function(b) { b.classList.remove('active'); });
  var fd = document.getElementById('filtroDisponibles');
  if (fd) fd.classList.add('active');
  cargarDelivery();
  iniciarAutoRefresh();
}

// ── AUTO-REFRESH CON ALERTA ───────────────────────
var _autoRefreshTimer = null;
var _pedidosDisponiblesAntes = 0;

function iniciarAutoRefresh() {
  detenerAutoRefresh();
  _autoRefreshTimer = setInterval(function() {
    if (_deliveryFiltro !== 'disponibles') return;
    // Consultar cuántos pedidos listos hay sin asignar
    fetch(SUPABASE_URL + '/rest/v1/pedidos?select=id&entrega=eq.delivery&estado=eq.listo&delivery_id=is.null', {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var cantidad = data ? data.length : 0;
      if (cantidad > _pedidosDisponiblesAntes && _pedidosDisponiblesAntes >= 0) {
        // Hay pedidos nuevos — sonar alerta y recargar
        sonarAlertaDelivery();
        cargarDelivery();
        showToast('🛵 ¡Nuevo pedido disponible!');
        // El correo se envía solo cuando el delivery TOMA un pedido, no aquí
      }
      _pedidosDisponiblesAntes = cantidad;
    })
    .catch(function() {});
  }, 30000); // cada 30 segundos
}

function detenerAutoRefresh() {
  if (_autoRefreshTimer) { clearInterval(_autoRefreshTimer); _autoRefreshTimer = null; }
  _pedidosDisponiblesAntes = 0;
}

function sonarAlertaDelivery() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Tres pitidos cortos
    [0, 0.25, 0.5].forEach(function(t) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.18);
    });
  } catch(e) {}
}

// ── INICIAR SESIÓN ────────────────────────────────
function loginDelivery() {
  var correo   = document.getElementById('loginCorreo').value.trim().toLowerCase();
  var password = document.getElementById('loginPassword').value;
  var errEl    = document.getElementById('deliveryRegError');

  if (!correo || !correo.includes('@')) { errEl.textContent = '⚠ Ingresa un correo válido'; errEl.style.display = ''; return; }
  if (!password) { errEl.textContent = '⚠ Ingresa tu contraseña'; errEl.style.display = ''; return; }
  errEl.style.display = 'none';

  // Buscar en Supabase por correo
  fetch(SUPABASE_URL + '/rest/v1/deliveries?correo=eq.' + encodeURIComponent(correo) + '&select=*', {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (!data || data.length === 0) {
      errEl.textContent = '⚠ No encontramos esa cuenta. ¿Ya te registraste?';
      errEl.style.display = '';
      return;
    }
    var d = data[0];
    // Verificar contraseña (comparación simple en texto plano)
    if (d.password !== password) {
      errEl.textContent = '⚠ Contraseña incorrecta';
      errEl.style.display = '';
      return;
    }
    _deliveryActual = { id: d.id, nombre: d.nombre, telefono: d.telefono, correo: d.correo };
    guardarSesionDelivery(_deliveryActual);
    mostrarPanelPedidos();
    showToast('✓ ¡Bienvenido de nuevo, ' + d.nombre + '!');
  })
  .catch(function() {
    errEl.textContent = '⚠ Error de conexión. Intenta de nuevo.';
    errEl.style.display = '';
  });
}

// ── REGISTRO NUEVO DELIVERY ───────────────────────
function registrarDelivery() {
  var nombre   = document.getElementById('regNombre').value.trim();
  var telefono = document.getElementById('regTelefono').value.trim().replace(/\s/g, '');
  var correo   = document.getElementById('regCorreo').value.trim().toLowerCase();
  var password = document.getElementById('regPassword').value;
  var errEl    = document.getElementById('deliveryRegError');

  if (!nombre)                         { errEl.textContent = '⚠ Ingresa tu nombre'; errEl.style.display = ''; return; }
  if (!telefono || telefono.length < 7){ errEl.textContent = '⚠ Ingresa un número de WhatsApp válido'; errEl.style.display = ''; return; }
  if (!correo || !correo.includes('@')){ errEl.textContent = '⚠ Ingresa un correo válido'; errEl.style.display = ''; return; }
  if (!password || password.length < 6){ errEl.textContent = '⚠ La contraseña debe tener al menos 6 caracteres'; errEl.style.display = ''; return; }
  errEl.style.display = 'none';

  // Verificar si el correo ya existe
  fetch(SUPABASE_URL + '/rest/v1/deliveries?correo=eq.' + encodeURIComponent(correo) + '&select=id', {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  })
  .then(function(r) { return r.json(); })
  .then(function(existe) {
    if (existe && existe.length > 0) {
      errEl.textContent = '⚠ Ese correo ya está registrado. Inicia sesión.';
      errEl.style.display = '';
      return;
    }
    // Crear cuenta
    return fetch(SUPABASE_URL + '/rest/v1/deliveries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ nombre: nombre, telefono: telefono, correo: correo, password: password, activo: true })
    })
    .then(function(r) { return r.json(); })
    .then(function(res) {
      var reg = (res && res[0]) ? res[0] : { id: 'local-' + Date.now(), nombre: nombre, telefono: telefono };
      _deliveryActual = { id: reg.id, nombre: reg.nombre, telefono: reg.telefono, correo: reg.correo || correo };
      guardarSesionDelivery(_deliveryActual);
      mostrarPanelPedidos();
      showToast('✓ ¡Cuenta creada! Bienvenido, ' + nombre + '!');
    });
  })
  .catch(function() {
    errEl.textContent = '⚠ Error de conexión. Intenta de nuevo.';
    errEl.style.display = '';
  });
}

// ── FILTRO Y CARGA ────────────────────────────────
function filtrarDelivery(filtro) {
  _deliveryFiltro = filtro;
  document.querySelectorAll('.btn-filtro-delivery').forEach(function(b) { b.classList.remove('active'); });
  var ids = { disponibles: 'filtroDisponibles', mis: 'filtroMis' };
  var el = document.getElementById(ids[filtro]);
  if (el) el.classList.add('active');
  cargarDelivery();
}

function cargarDelivery() {
  var lista = document.getElementById('deliveryLista');
  lista.innerHTML = '<p style="color:var(--warm-gray); text-align:center; padding:2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</p>';

  fetch(SUPABASE_URL + '/rest/v1/pedidos?select=*&order=created_at.desc', {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    var filtrados = data.filter(function(p) {
      if (p.entrega !== 'delivery') return false;
      if (_deliveryFiltro === 'disponibles') return p.estado === 'listo' && !p.delivery_id;
      if (_deliveryFiltro === 'mis') return _deliveryActual && p.delivery_id === _deliveryActual.id;
      return true;
    });

    if (!filtrados.length) {
      var msg = _deliveryFiltro === 'disponibles'
        ? '✅ No hay pedidos listos en este momento. ¡Vuelve a revisar pronto!'
        : '📭 No tienes pedidos asignados todavía.';
      lista.innerHTML = '<p style="color:var(--warm-gray); text-align:center; padding:2rem;">' + msg + '</p>';
      return;
    }

    lista.innerHTML = filtrados.map(function(p) {
      var items = p.items.map(function(i) { return i.name + ' ×' + i.qty; }).join(', ');
      var fecha = new Date(p.created_at).toLocaleString('es-VE');
      var esMio = _deliveryActual && p.delivery_id === _deliveryActual.id;
      var estado = p.estado || 'listo';

      var accionBtn = '';
      if (_deliveryFiltro === 'disponibles') {
        accionBtn = '<button onclick="tomarPedido(\'' + p.id + '\')" style="background:var(--amber); color:#fff; border:none; border-radius:.6rem; padding:.6rem 1.2rem; font-weight:700; cursor:pointer; font-size:.9rem; font-family:var(--font-body);">🛵 Tomar pedido</button>';
      } else if (esMio) {
        var estadoOpts = ['confirmado','entregado'].map(function(e) {
          var labels = { confirmado: '📦 En camino', entregado: '✅ Entregado' };
          return '<option value="' + e + '"' + (estado === e ? ' selected' : '') + '>' + (labels[e]||e) + '</option>';
        }).join('');
        var telCliente = p.telefono ? p.telefono.replace(/\D/g,'') : null;
        // Normalizar: si empieza con 0, reemplazar por 58
        if (telCliente && telCliente.startsWith('0')) telCliente = '58' + telCliente.substring(1);
        var items_txt = p.items.map(function(i) { return i.name + ' ×' + i.qty; }).join(', ');
        var msgCliente = '🛵 ¡Hola! Soy ' + _deliveryActual.nombre + ', el delivery de *Pan y Miel*.\n' +
                         'Ya voy en camino con tu pedido 🍞\n\n' +
                         '📦 *Pedido:* ' + items_txt + '\n' +
                         '📍 *Dirección:* ' + (p.direccion || 'tu dirección') + '\n' +
                         '💰 *Total:* $' + parseFloat(p.total).toFixed(2) + '\n\n' +
                         '¿Tienes alguna indicación para la entrega?';
        var waBtnCliente = telCliente
          ? '<a href="https://wa.me/' + telCliente + '?text=' + encodeURIComponent(msgCliente) + '" target="_blank" style="display:inline-flex; align-items:center; gap:.4rem; background:#25d366; color:#fff; text-decoration:none; border-radius:.6rem; padding:.6rem 1rem; font-weight:700; font-size:.9rem; font-family:var(--font-body);">📱 WhatsApp cliente</a>'
          : '<span style="color:#999; font-size:.85rem;">Sin número de cliente</span>';
        accionBtn = '<div style="display:flex; gap:.6rem; flex-wrap:wrap; align-items:center;">' +
          waBtnCliente +
          '<select class="select-estado-delivery" onchange="cambiarEstadoDelivery(\'' + p.id + '\', this.value)" style="padding:.5rem .8rem; border-radius:.5rem; border:1.5px solid #ddd; font-family:var(--font-body);">' + estadoOpts + '</select>' +
          '</div>';
      }

      var estadoBgMap = { listo: '#d4edda', confirmado: '#d1ecf1', entregado: '#e9ecef' };
      var estadoColorMap = { listo: '#155724', confirmado: '#0c5460', entregado: '#6c757d' };
      var estadoIconMap = { listo: '🛵', confirmado: '📦', entregado: '✅' };

      var fotoEntregaHtml = (estado === 'entregado' && p.foto_entrega)
        ? '<div style="margin-top:.8rem;"><a href="' + p.foto_entrega + '" target="_blank"><img src="' + p.foto_entrega + '" style="max-width:100%;max-height:160px;border-radius:.7rem;border:2px solid #d4edda;" alt="Foto de entrega" /></a><p style="font-size:.78rem;color:#888;margin:.3rem 0 0;">📸 Foto de entrega</p></div>'
        : '';

      return '<div class="delivery-card" data-pedido-id="' + p.id + '">' +
        '<div class="delivery-card-top">' +
          '<span class="delivery-codigo">#' + p.id.substring(0,8).toUpperCase() + '</span>' +
          '<span class="delivery-estado-badge" style="background:' + (estadoBgMap[estado]||'#eee') + '; color:' + (estadoColorMap[estado]||'#333') + '">' + (estadoIconMap[estado]||'') + ' ' + estado + '</span>' +
        '</div>' +
        '<p class="delivery-items">' + items + '</p>' +
        '<p class="delivery-dir"><i class="fa-solid fa-location-dot"></i> ' + (p.direccion || 'Sin dirección') + '</p>' +
        (p.telefono ? '<p class="delivery-tel"><i class="fa-solid fa-phone"></i> ' + p.telefono + '</p>' : '') +
        '<p class="delivery-fecha">' + fecha + ' · <strong>$' + parseFloat(p.total).toFixed(2) + '</strong></p>' +
        fotoEntregaHtml +
        '<div class="delivery-actions">' + accionBtn + '</div>' +
      '</div>';
    }).join('');
  })
  .catch(function() {
    lista.innerHTML = '<p style="color:#d9534f; text-align:center; padding:2rem;">Error de conexión</p>';
  });
}

// ── TOMAR PEDIDO ──────────────────────────────────
function tomarPedido(pedidoId) {
  if (!_deliveryActual) return;
  fetch(SUPABASE_URL + '/rest/v1/pedidos?id=eq.' + pedidoId, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      delivery_id: _deliveryActual.id,
      delivery_nombre: _deliveryActual.nombre,
      estado: 'confirmado'
    })
  })
  .then(function(r) { return r.json(); })
  .then(function(res) {
    var p = res && res[0] ? res[0] : null;
    showToast('✓ ¡Pedido #' + pedidoId.substring(0,8).toUpperCase() + ' asignado a ti!');

    // Enviar correo al delivery con detalles completos
    console.log('🔍 _deliveryActual:', JSON.stringify(_deliveryActual));
    console.log('🔍 pedido p:', JSON.stringify(p));
    if (_deliveryActual && _deliveryActual.correo) {
      if (p) {
        enviarCorreoDelivery(_deliveryActual.correo, _deliveryActual.nombre, p);
      } else {
        // p llegó null, buscar el pedido directamente
        fetch(SUPABASE_URL + '/rest/v1/pedidos?id=eq.' + pedidoId + '&select=*', {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
        }).then(function(r){ return r.json(); })
          .then(function(d){ if (d && d[0]) enviarCorreoDelivery(_deliveryActual.correo, _deliveryActual.nombre, d[0]); })
          .catch(function(e){ console.error('Error buscando pedido para correo:', e); });
      }
    } else {
      console.warn('⚠ No se puede enviar correo — correo delivery:', _deliveryActual && _deliveryActual.correo);
    }

    // Enviar WhatsApp de confirmación al delivery
    var tel = _deliveryActual.telefono.replace(/\D/g,'');
    if (tel.startsWith('0')) tel = '58' + tel.substring(1);
    var dir = p ? (p.direccion || 'Sin dirección') : 'Sin dirección';
    var telCliente = p && p.telefono ? p.telefono : 'No indicado';
    var itemsTxt = p && p.items ? p.items.map(function(i){ return i.name + ' ×' + i.qty; }).join(', ') : '';
    var total = p ? '$' + parseFloat(p.total).toFixed(2) : '';
    var codigo = pedidoId.substring(0,8).toUpperCase();
    var pageUrl = window.location.href.split('?')[0];
    var msg = '🛵 *¡Nuevo pedido asignado!* #' + codigo + '\n\n' +
              '📦 *Productos:* ' + itemsTxt + '\n' +
              '📍 *Dirección:* ' + dir + '\n' +
              '📞 *Teléfono cliente:* ' + telCliente + '\n' +
              (total ? '💰 *Total a cobrar:* ' + total + '\n' : '') +
              '\n🌐 *Abre la app aquí:*\n' + pageUrl + '\n\n' +
              '¡Mucho éxito en la entrega! 💪';
    var waUrl = 'https://wa.me/' + tel + '?text=' + encodeURIComponent(msg);
    window.open(waUrl, '_blank');

    // Recargar lista
    setTimeout(cargarDelivery, 600);
  })
  .catch(function() {
    showToast('⚠ Error al tomar el pedido. Intenta de nuevo.');
  });
}

// ── CAMBIAR ESTADO (mis pedidos) ──────────────────
function cambiarEstadoDelivery(id, nuevoEstado) {
  if (nuevoEstado === 'entregado') {
    // Mostrar modal para subir foto de entrega
    mostrarModalFotoEntrega(id);
    // Revertir el select visualmente hasta confirmar
    setTimeout(function() {
      var selects = document.querySelectorAll('.select-estado-delivery');
      selects.forEach(function(s) {
        if (s.closest('[data-pedido-id="' + id + '"]') || s.parentNode.closest('[data-pedido-id="' + id + '"]')) {
          s.value = 'confirmado';
        }
      });
    }, 50);
    return;
  }
  _patchEstadoDelivery(id, nuevoEstado, null);
}

function _patchEstadoDelivery(id, nuevoEstado, fotoUrl) {
  var body = { estado: nuevoEstado };
  if (fotoUrl) body.foto_entrega = fotoUrl;
  fetch(SUPABASE_URL + '/rest/v1/pedidos?id=eq.' + id, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(body)
  }).then(function() {
    showToast(fotoUrl ? '✅ ¡Entrega confirmada con foto!' : 'Estado actualizado: ' + nuevoEstado);
    setTimeout(cargarDelivery, 600);
  });
}

function mostrarModalFotoEntrega(pedidoId) {
  // Eliminar modal anterior si existe
  var oldModal = document.getElementById('modalFotoEntrega');
  if (oldModal) oldModal.remove();

  // Crear el input FUERA del modal para que iOS lo encuentre bien
  var inputEl = document.createElement('input');
  inputEl.type = 'file';
  inputEl.accept = 'image/*';
  inputEl.capture = 'environment';
  inputEl.id = 'fotoEntregaInput';
  inputEl.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
  document.body.appendChild(inputEl);

  var modal = document.createElement('div');
  modal.id = 'modalFotoEntrega';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:flex-end;justify-content:center;padding:0;';
  modal.innerHTML =
    '<div style="background:#fff;border-radius:1.2rem 1.2rem 0 0;padding:1.5rem;width:100%;max-width:480px;box-shadow:0 -4px 30px rgba(0,0,0,.2);font-family:var(--font-body);">' +
      '<div style="width:40px;height:4px;background:#ddd;border-radius:2px;margin:0 auto .8rem;"></div>' +
      '<h3 style="margin:0 0 .4rem;font-size:1.1rem;color:#333;">📸 Foto de entrega</h3>' +
      '<p style="color:#666;font-size:.85rem;margin:0 0 1rem;">Toma una foto como comprobante.</p>' +
      '<div id="fotoEntregaZona" style="display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed #ddd;border-radius:.8rem;padding:1.5rem;gap:.5rem;color:#888;font-size:.9rem;min-height:100px;">' +
        '<i class="fa-solid fa-camera" style="font-size:2.5rem;color:#ccc;"></i>' +
        '<span id="fotoEntregaTexto" style="font-size:.88rem;">Toca el botón de abajo para tomar la foto</span>' +
        '<img id="fotoEntregaPreview" style="display:none;max-width:100%;max-height:160px;border-radius:.6rem;margin-top:.5rem;" />' +
      '</div>' +
      '<button id="btnAbrirCamara" style="width:100%;margin-top:.8rem;padding:.8rem;border:none;border-radius:.7rem;background:#1976d2;color:#fff;font-weight:700;font-size:.95rem;cursor:pointer;font-family:var(--font-body);">📷 Abrir cámara / galería</button>' +
      '<div style="display:flex;gap:.7rem;margin-top:.7rem;">' +
        '<button onclick="cerrarModalFotoEntrega()" style="flex:1;padding:.7rem;border:1.5px solid #ddd;border-radius:.7rem;background:#fff;color:#555;font-weight:700;cursor:pointer;font-family:var(--font-body);">Cancelar</button>' +
        '<button id="btnConfirmarEntrega" style="flex:1;padding:.7rem;border:none;border-radius:.7rem;background:var(--amber,#f59e0b);color:#fff;font-weight:700;cursor:pointer;font-family:var(--font-body);">✅ Confirmar entrega</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);

  // Botón cámara — dispara el input directamente en el mismo click handler
  document.getElementById('btnAbrirCamara').addEventListener('click', function() {
    inputEl.click();
  });

  // Botón confirmar
  document.getElementById('btnConfirmarEntrega').addEventListener('click', function() {
    confirmarEntregaConFoto(pedidoId);
  });

  // Cuando el usuario elige la foto
  inputEl.addEventListener('change', function() {
    var file = inputEl.files && inputEl.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      var preview = document.getElementById('fotoEntregaPreview');
      var texto   = document.getElementById('fotoEntregaTexto');
      var zona    = document.getElementById('fotoEntregaZona');
      var btnCam  = document.getElementById('btnAbrirCamara');
      if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
      if (texto)   { texto.textContent = '✅ ' + (file.name.length > 28 ? file.name.substring(0,25)+'...' : file.name); }
      if (zona)    { zona.style.borderColor = 'var(--amber,#f59e0b)'; }
      if (btnCam)  { btnCam.textContent = '🔄 Cambiar foto'; }
    };
    reader.readAsDataURL(file);
  });
}

function previewFotoEntrega(input) {
  var file = input.files[0];
  if (!file) return;
  // Validate it's an image
  if (!file.type.startsWith('image/')) {
    showToast('⚠ El archivo debe ser una imagen');
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var preview = document.getElementById('fotoEntregaPreview');
    if (!preview) return;
    preview.src = e.target.result;
    preview.style.display = 'block';
    var nameEl = document.getElementById('fotoEntregaTexto');
    var labelEl = document.getElementById('fotoEntregaLabel');
    if (nameEl) nameEl.textContent = '✅ Foto lista — ' + (file.name.length > 25 ? file.name.substring(0,22)+'...' : file.name);
    if (labelEl) labelEl.style.borderColor = 'var(--amber, #f59e0b)';
  };
  reader.onerror = function() { showToast('⚠ Error al leer la imagen'); };
  reader.readAsDataURL(file);
}

function cerrarModalFotoEntrega() {
  var modal = document.getElementById('modalFotoEntrega');
  if (modal) modal.remove();
  var inp = document.getElementById('fotoEntregaInput');
  if (inp) inp.remove();
}

function confirmarEntregaConFoto(pedidoId) {
  var input = document.getElementById('fotoEntregaInput');
  var btn = document.getElementById('btnConfirmarEntrega');
  var file = input && input.files && input.files[0];

  if (!file) {
    showToast('⚠ Debes seleccionar una foto para confirmar la entrega.');
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Subiendo foto...';

  var ext = file.name.split('.').pop() || 'jpg';
  var fileName = 'entrega_' + pedidoId + '_' + Date.now() + '.' + ext;

  fetch(SUPABASE_URL + '/storage/v1/object/entregas/' + fileName, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': file.type,
      'x-upsert': 'true'
    },
    body: file
  })
  .then(function(r) {
    if (!r.ok) throw new Error('Upload failed: ' + r.status);
    var fotoUrl = SUPABASE_URL + '/storage/v1/object/public/entregas/' + fileName;
    cerrarModalFotoEntrega();
    _patchEstadoDelivery(pedidoId, 'entregado', fotoUrl);
  })
  .catch(function(err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = '✅ Confirmar entrega';
    showToast('⚠ Error al subir la foto. Intenta de nuevo.');
  });
}

// ══════════════════════════════════════════════════
// PANEL ADMIN (DUEÑO)
// ══════════════════════════════════════════════════
var ADMIN_PIN = '1234'; // Cambia este PIN por el tuyo
var _adminFiltro = 'todos';
var _adminPedidos = [];

function abrirAdmin() {
  document.getElementById('adminScreen').style.display = '';
  document.body.style.overflow = 'hidden';
  document.getElementById('adminLogin').style.display = '';
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('adminPin').value = '';
  document.getElementById('adminPinError').style.display = 'none';
  setTimeout(function(){ document.getElementById('adminPin').focus(); }, 200);
}

function cerrarAdmin() {
  document.getElementById('adminScreen').style.display = 'none';
  document.body.style.overflow = '';
}

function loginAdmin() {
  var pin = document.getElementById('adminPin').value.trim();
  var errEl = document.getElementById('adminPinError');
  if (pin !== ADMIN_PIN) {
    errEl.textContent = '⚠ PIN incorrecto';
    errEl.style.display = '';
    return;
  }
  document.getElementById('adminLogin').style.display = 'none';
  document.getElementById('adminPanel').style.display = '';
  cargarPedidosAdmin();
}

function filtrarAdmin(filtro) {
  _adminFiltro = filtro;
  document.querySelectorAll('.btn-filtro-admin').forEach(function(b) { b.classList.remove('active'); });
  var btn = document.getElementById('filtroAdmin' + filtro.charAt(0).toUpperCase() + filtro.slice(1));
  if (btn) btn.classList.add('active');
  renderPedidosAdmin();
}

function cargarPedidosAdmin() {
  var lista = document.getElementById('adminLista');
  lista.innerHTML = '<p style="color:var(--warm-gray); text-align:center; padding:2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</p>';
  fetch(SUPABASE_URL + '/rest/v1/pedidos?select=*&order=created_at.desc', {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  })
  .then(function(r){ return r.json(); })
  .then(function(data) {
    _adminPedidos = data || [];
    renderPedidosAdmin();
  })
  .catch(function() {
    lista.innerHTML = '<p style="color:#d9534f; text-align:center; padding:2rem;">Error de conexión</p>';
  });
}

function renderPedidosAdmin() {
  var lista = document.getElementById('adminLista');
  var filtrados = _adminFiltro === 'todos' ? _adminPedidos : _adminPedidos.filter(function(p){ return p.estado === _adminFiltro; });

  if (!filtrados.length) {
    lista.innerHTML = '<p style="color:var(--warm-gray); text-align:center; padding:2rem;">No hay pedidos en esta categoría.</p>';
    return;
  }

  var estadoBgMap    = { pendiente:'#fff3cd', listo:'#d4edda', confirmado:'#cce5ff', entregado:'#e9ecef' };
  var estadoColorMap = { pendiente:'#856404', listo:'#155724', confirmado:'#004085', entregado:'#6c757d' };
  var estadoLabel    = { pendiente: '🧾 Pedido recibido', listo: '👨‍🍳 Preparando', confirmado: '🛵 En camino', entregado: '✅ Entregado' };

  lista.innerHTML = filtrados.map(function(p) {
    var items = p.items ? p.items.map(function(i){ return i.name + ' ×' + i.qty; }).join(', ') : '';
    var fecha = new Date(p.created_at).toLocaleString('es-VE');
    var estado = p.estado || 'pendiente';

    var selectEstado = '<select onchange="cambiarEstadoAdmin(\'' + p.id + '\', this.value)" style="padding:.4rem .7rem; border-radius:.5rem; border:1.5px solid #ddd; font-family:var(--font-body); font-size:.82rem;">' +
      ['pendiente','listo','confirmado','entregado'].map(function(e){
        return '<option value="' + e + '"' + (estado === e ? ' selected' : '') + '>' + (estadoLabel[e]||e) + '</option>';
      }).join('') + '</select>';

    // Botón asignar delivery (solo pedidos delivery)
    var deliveryBtn = p.entrega === 'delivery' && (estado === 'listo' || estado === 'confirmado')
      ? '<button onclick="abrirModalAsignar(\'' + p.id + '\')" style="padding:.4rem .8rem; background:var(--amber); color:#fff; border:none; border-radius:.5rem; font-size:.82rem; font-weight:700; cursor:pointer; font-family:var(--font-body);">🛵 ' + (p.delivery_nombre ? p.delivery_nombre : 'Asignar delivery') + '</button>'
      : '';

    // Botón WhatsApp para retiro en tienda cuando está listo
    var waRetiroBtn = '';
    if (p.entrega === 'retiro' && estado === 'listo' && p.telefono) {
      var telRetiro = p.telefono.replace(/\D/g, '');
      if (telRetiro.length >= 7) {
        var itemsRetiro = p.items ? p.items.map(function(i){ return i.name + ' x' + i.qty; }).join(', ') : '';
        var msgRetiro = '¡Hola! 👋 Tu pedido *#' + p.id.substring(0,8).toUpperCase() + '* de Pan y Miel está *listo para retirar* 🍞\n\n' +
          '📦 ' + itemsRetiro + '\n' +
          '💰 Total: $' + parseFloat(p.total).toFixed(2) + '\n\n' +
          '¡Te esperamos en nuestra tienda! 🏪';
        waRetiroBtn = '<a href="https://wa.me/' + telRetiro + '?text=' + encodeURIComponent(msgRetiro) + '" target="_blank" ' +
          'style="padding:.4rem .8rem; background:#25d366; color:#fff; border-radius:.5rem; font-size:.82rem; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:.3rem; font-family:var(--font-body);">📱 Avisar cliente</a>';
      }
    }

    // Etiqueta tipo de entrega
    var entregaTag = p.entrega === 'retiro'
      ? '<span style="font-size:.75rem; background:#e8f4fd; color:#1a6fa8; padding:.2rem .6rem; border-radius:2rem; font-weight:600;">🏪 Retiro</span>'
      : '<span style="font-size:.75rem; background:#fef3e2; color:#a06000; padding:.2rem .6rem; border-radius:2rem; font-weight:600;">🛵 Delivery</span>';

    return '<div class="admin-card">' +
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:.5rem; flex-wrap:wrap; gap:.4rem;">' +
        '<div style="display:flex; align-items:center; gap:.5rem;">' +
          '<span style="font-weight:800; font-size:1rem; color:var(--ink);">#' + p.id.substring(0,8).toUpperCase() + '</span>' +
          entregaTag +
        '</div>' +
        '<span style="padding:.3rem .8rem; border-radius:2rem; font-size:.78rem; font-weight:700; background:' + (estadoBgMap[estado]||'#eee') + '; color:' + (estadoColorMap[estado]||'#333') + ';">' + (estadoLabel[estado]||estado) + '</span>' +
      '</div>' +
      '<p style="margin:.2rem 0; font-size:.88rem; color:var(--ink);">🍞 ' + items + '</p>' +
      (p.direccion ? '<p style="margin:.2rem 0; font-size:.83rem; color:#666;">📍 ' + p.direccion + '</p>' : '') +
      (p.telefono  ? '<p style="margin:.2rem 0; font-size:.83rem; color:#666;">📞 ' + p.telefono  + '</p>' : '') +
      '<p style="margin:.2rem 0; font-size:.8rem; color:#999;">📅 ' + fecha + ' · <strong>$' + parseFloat(p.total).toFixed(2) + '</strong></p>' +
      (p.delivery_nombre ? '<p style="margin:.2rem 0; font-size:.8rem; color:#666;">🛵 Delivery: <strong>' + p.delivery_nombre + '</strong></p>' : '') +
      (estado === 'entregado' && p.foto_entrega
        ? '<div style="margin:.8rem 0 .4rem;">' +
            '<p style="font-size:.78rem; font-weight:700; color:#555; margin:0 0 .4rem;">📸 Foto de entrega</p>' +
            '<a href="' + p.foto_entrega + '" target="_blank">' +
              '<img src="' + p.foto_entrega + '" ' +
                'style="max-width:100%;max-height:200px;border-radius:.7rem;border:2px solid #d4edda;display:block;cursor:pointer;" ' +
                'alt="Foto de entrega" />' +
            '</a>' +
            '<p style="font-size:.72rem;color:#aaa;margin:.3rem 0 0;">Toca la foto para verla completa</p>' +
          '</div>'
        : (estado === 'entregado' && !p.foto_entrega
            ? '<p style="font-size:.78rem; color:#f0ad4e; margin:.5rem 0 .2rem;">⚠ Sin foto de entrega</p>'
            : '')) +
      '<div style="display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; margin-top:.8rem;">' +
        selectEstado + deliveryBtn + waRetiroBtn +
        (estado === 'entregado'
          ? '<button onclick="borrarPedidoAdmin(\'' + p.id + '\')" ' +
              'style="padding:.4rem .8rem; background:#fff; color:#d9534f; border:1.5px solid #d9534f; border-radius:.5rem; font-size:.82rem; font-weight:700; cursor:pointer; font-family:var(--font-body);">🗑 Borrar</button>'
          : '') +
      '</div>' +
    '</div>';
  }).join('');
}

function cambiarEstadoAdmin(pedidoId, nuevoEstado) {
  fetch(SUPABASE_URL + '/rest/v1/pedidos?id=eq.' + pedidoId, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ estado: nuevoEstado })
  }).then(function() {
    showToast('✓ Estado actualizado: ' + nuevoEstado);
    setTimeout(cargarPedidosAdmin, 500);
  });
}

function borrarPedidoAdmin(pedidoId) {
  if (!confirm('¿Seguro que quieres borrar este pedido? Esta acción no se puede deshacer.')) return;
  fetch(SUPABASE_URL + '/rest/v1/pedidos?id=eq.' + pedidoId, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=minimal'
    }
  }).then(function(r) {
    if (r.ok) {
      showToast('🗑 Pedido eliminado');
      setTimeout(cargarPedidosAdmin, 400);
    } else {
      showToast('⚠ Error al borrar el pedido');
    }
  }).catch(function() { showToast('⚠ Error de conexión'); });
}

// ── ASIGNAR DELIVERY DESDE ADMIN ─────────────────
var _pedidoParaAsignar = null;

function abrirModalAsignar(pedidoId) {
  _pedidoParaAsignar = pedidoId;
  document.getElementById('modalAsignarCodigo').textContent = '#' + pedidoId.substring(0,8).toUpperCase();
  var modalDiv = document.getElementById('modalAsignarDelivery');
  modalDiv.style.display = 'flex';
  var listaEl = document.getElementById('listaDeliveriesModal');
  listaEl.innerHTML = '<p style="text-align:center; color:#999; padding:1rem;"><i class="fa-solid fa-spinner fa-spin"></i></p>';

  // Cargar deliveries Y pedidos activos en paralelo para saber quién está ocupado
  Promise.all([
    fetch(SUPABASE_URL + '/rest/v1/deliveries?activo=eq.true&select=*', {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
    }).then(function(r){ return r.json(); }),
    fetch(SUPABASE_URL + '/rest/v1/pedidos?select=delivery_id&estado=eq.confirmado&delivery_id=not.is.null', {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
    }).then(function(r){ return r.json(); })
  ])
  .then(function(results) {
    var devs = results[0];
    var pedidosActivos = results[1] || [];

    if (!devs || !devs.length) {
      listaEl.innerHTML = '<p style="text-align:center; color:#999;">No hay deliveries registrados.</p>';
      return;
    }

    // IDs de deliveries que tienen pedido en camino
    var ocupados = {};
    pedidosActivos.forEach(function(p){ if (p.delivery_id) ocupados[p.delivery_id] = true; });

    // Separar disponibles y ocupados
    var disponibles = devs.filter(function(d){ return !ocupados[d.id]; });
    var enCamino   = devs.filter(function(d){ return  ocupados[d.id]; });

    var html = '';

    if (disponibles.length) {
      html += '<p style="font-size:.78rem; font-weight:700; color:#555; margin:.3rem 0 .5rem;">✅ Disponibles</p>';
      html += disponibles.map(function(d) {
        return '<button onclick="asignarDeliveryAdmin(\'' + d.id + '\',\'' + d.nombre + '\',\'' + (d.correo||'') + '\')" ' +
          'style="width:100%; padding:.8rem 1rem; background:#faf8f5; border:1.5px solid #d4edda; border-radius:.7rem; text-align:left; cursor:pointer; font-family:var(--font-body); display:flex; align-items:center; gap:.7rem; margin-bottom:.4rem;">' +
          '<span style="font-size:1.4rem;">🛵</span>' +
          '<div><p style="margin:0; font-weight:700; color:var(--ink);">' + d.nombre + '</p>' +
          '<p style="margin:0; font-size:.78rem; color:#4caf50; font-weight:600;">Disponible</p></div>' +
          '</button>';
      }).join('');
    }

    if (enCamino.length) {
      html += '<p style="font-size:.78rem; font-weight:700; color:#555; margin:.8rem 0 .5rem;">🛵 En camino (ocupados)</p>';
      html += enCamino.map(function(d) {
        return '<div style="width:100%; padding:.8rem 1rem; background:#f9f9f9; border:1.5px solid #f0c8c8; border-radius:.7rem; display:flex; align-items:center; gap:.7rem; margin-bottom:.4rem; opacity:.7; box-sizing:border-box;">' +
          '<span style="font-size:1.4rem;">🔴</span>' +
          '<div><p style="margin:0; font-weight:700; color:#999;">' + d.nombre + '</p>' +
          '<p style="margin:0; font-size:.78rem; color:#e57373; font-weight:600;">Tiene pedido activo</p></div>' +
          '</div>';
      }).join('');
    }

    if (!disponibles.length && !enCamino.length) {
      html = '<p style="text-align:center; color:#999;">No hay deliveries registrados.</p>';
    }

    listaEl.innerHTML = html;
  })
  .catch(function() {
    listaEl.innerHTML = '<p style="text-align:center; color:#d9534f;">Error al cargar deliveries.</p>';
  });
}

function cerrarModalAsignar() {
  document.getElementById('modalAsignarDelivery').style.display = 'none';
  _pedidoParaAsignar = null;
}

function asignarDeliveryAdmin(deliveryId, deliveryNombre, deliveryCorreo) {
  if (!_pedidoParaAsignar) return;
  var pedidoId = _pedidoParaAsignar;
  cerrarModalAsignar();

  fetch(SUPABASE_URL + '/rest/v1/pedidos?id=eq.' + pedidoId, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ delivery_id: deliveryId, delivery_nombre: deliveryNombre, estado: 'confirmado' })
  })
  .then(function(r){ return r.json(); })
  .then(function(res) {
    var p = res && res[0] ? res[0] : null;
    showToast('✓ Pedido asignado a ' + deliveryNombre);

    // Enviar correo al delivery elegido
    if (deliveryCorreo && p) {
      enviarCorreoDelivery(deliveryCorreo, deliveryNombre, p);
    } else if (deliveryCorreo && !p) {
      // Buscar pedido si no vino en la respuesta
      fetch(SUPABASE_URL + '/rest/v1/pedidos?id=eq.' + pedidoId + '&select=*', {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
      }).then(function(r){ return r.json(); })
        .then(function(d){ if (d && d[0]) enviarCorreoDelivery(deliveryCorreo, deliveryNombre, d[0]); });
    }
    setTimeout(cargarPedidosAdmin, 500);
  })
  .catch(function() { showToast('⚠ Error al asignar pedido'); });
}

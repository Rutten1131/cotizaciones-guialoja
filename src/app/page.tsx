'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import { FIRMA_CESAR_BASE64, LOGO_OFICIAL_BASE64 } from '@/lib/assets';
import { 
  Building2, 
  UtensilsCrossed, 
  Coffee, 
  Compass, 
  Globe, 
  CheckCircle2, 
  Send, 
  Download, 
  Printer, 
  AlertCircle, 
  FileText, 
  DollarSign, 
  User, 
  ArrowRight, 
  ArrowLeft,
  Camera,
  Trash2
} from 'lucide-react';

interface CupoData {
  ocupados: number;
  limite: number;
}

const DRAFT_KEY = 'guialoja_contrato_draft_v1';

export default function ContratoGeneradorPage() {
  const [activeTab, setActiveTab] = useState<'plan' | 'cliente' | 'pago'>('plan');

  // Selector Maestro
  const [tipoContrato, setTipoContrato] = useState('GUIALOJA-GASTRO-REST');

  // Datos del Cliente (en blanco para producción)
  const [nombreComercial, setNombreComercial] = useState('');
  const [rucCliente, setRucCliente] = useState('');
  const [representanteLegal, setRepresentanteLegal] = useState('');
  const [direccionCliente, setDireccionCliente] = useState('');
  const [cantonCliente, setCantonCliente] = useState('Loja');
  const [whatsappCliente, setWhatsappCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');

  // Campos específicos
  const [subplanIndex, setSubplanIndex] = useState(0);
  const [campoExtra, setCampoExtra] = useState('');
  const [cartaRecogida, setCartaRecogida] = useState(false);
  const [diasEntrega, setDiasEntrega] = useState(5);

  // Fotos de Carta / Menú subidas a Bunny Storage
  const [menuFotos, setMenuFotos] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Liquidación Financiera
  const [conFactura, setConFactura] = useState(true);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');

  // Logo y Firma en base64 para jsPDF
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null);

  // Emisión
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentYear, setCurrentYear] = useState('2026');
  const [fechaHoy, setFechaHoy] = useState('29/10/2026');
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);

  // 1. Cargar fecha, logo y borrador guardado en localStorage al montar
  useEffect(() => {
    const now = new Date();
    setCurrentYear(now.getFullYear().toString());
    setFechaHoy(now.toLocaleDateString('es-EC'));

    // Recuperar borrador de localStorage
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.tipoContrato) setTipoContrato(d.tipoContrato);
        if (typeof d.subplanIndex === 'number') setSubplanIndex(d.subplanIndex);
        if (d.nombreComercial) setNombreComercial(d.nombreComercial);
        if (d.rucCliente) setRucCliente(d.rucCliente);
        if (d.representanteLegal) setRepresentanteLegal(d.representanteLegal);
        if (d.direccionCliente) setDireccionCliente(d.direccionCliente);
        if (d.cantonCliente) setCantonCliente(d.cantonCliente);
        if (d.whatsappCliente) setWhatsappCliente(d.whatsappCliente);
        if (d.emailCliente) setEmailCliente(d.emailCliente);
        if (d.campoExtra) setCampoExtra(d.campoExtra);
        if (typeof d.diasEntrega === 'number') setDiasEntrega(d.diasEntrega);
        if (typeof d.cartaRecogida === 'boolean') setCartaRecogida(d.cartaRecogida);
        if (Array.isArray(d.menuFotos)) setMenuFotos(d.menuFotos);
        if (typeof d.conFactura === 'boolean') setConFactura(d.conFactura);
        if (d.metodoPago) setMetodoPago(d.metodoPago);
      }
    } catch (err) {
      console.warn('No se pudo leer localStorage:', err);
    } finally {
      setIsLoadedFromStorage(true);
    }

    // Cargar logo en base64
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = '/nuevo-logo-agenda.jpg';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setLogoBase64(canvas.toDataURL('image/jpeg'));
      }
    };

    // Cargar firma de César en base64
    const firmaImg = new Image();
    firmaImg.crossOrigin = 'Anonymous';
    firmaImg.src = '/Firma Cesar.png';
    firmaImg.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = firmaImg.width;
      canvas.height = firmaImg.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(firmaImg, 0, 0);
        setFirmaBase64(canvas.toDataURL('image/png'));
      }
    };
  }, []);

  // 2. Guardar automáticamente en localStorage cuando el usuario edite campos
  useEffect(() => {
    if (!isLoadedFromStorage) return; // Evitar sobreescribir antes de leer
    try {
      const draft = {
        tipoContrato,
        subplanIndex,
        nombreComercial,
        rucCliente,
        representanteLegal,
        direccionCliente,
        cantonCliente,
        whatsappCliente,
        emailCliente,
        campoExtra,
        diasEntrega,
        cartaRecogida,
        menuFotos,
        conFactura,
        metodoPago,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (err) {
      console.warn('No se pudo guardar en localStorage:', err);
    }
  }, [
    isLoadedFromStorage,
    tipoContrato,
    subplanIndex,
    nombreComercial,
    rucCliente,
    representanteLegal,
    direccionCliente,
    cantonCliente,
    whatsappCliente,
    emailCliente,
    campoExtra,
    diasEntrega,
    cartaRecogida,
    menuFotos,
    conFactura,
    metodoPago,
  ]);

  // Función para reiniciar/limpiar borrador
  const limpiarFormulario = () => {
    if (confirm('¿Deseas iniciar un nuevo contrato y limpiar los datos actuales?')) {
      localStorage.removeItem(DRAFT_KEY);
      setNombreComercial('');
      setRucCliente('');
      setRepresentanteLegal('');
      setDireccionCliente('');
      setCantonCliente('Loja');
      setWhatsappCliente('');
      setEmailCliente('');
      setCampoExtra('');
      setCartaRecogida(false);
      setMenuFotos([]);
      setSubplanIndex(0);
      setMetodoPago('EFECTIVO');
      setConFactura(true);
      setStatusMsg(null);
      setActiveTab('plan');
    }
  };

  const [cupos, setCupos] = useState<{
    gastro: CupoData;
    hotelesSm: CupoData;
    operadores: CupoData;
  }>({
    gastro: { ocupados: 14, limite: 40 },
    hotelesSm: { ocupados: 6, limite: 20 },
    operadores: { ocupados: 3, limite: 10 }
  });

  useEffect(() => {
    fetch('/api/contratos/cupos')
      .then((res) => res.json())
      .then((data) => {
        if (data.cupos) setCupos(data.cupos);
      })
      .catch(() => {});
  }, []);

  // Configuraciones de las 6 verticales dentro de GuIA Loja
  const configs: Record<string, any> = {
    'GUIALOJA-GASTRO-REST': {
      titulo: 'Gastronomía — Restaurante / Picantería',
      portal: 'QueComerenLoja.com (+ Red GuIA Loja)',
      icon: UtensilsCrossed,
      cupos: cupos.gastro,
      esGastro: true,
      planes: [
        { nombre: 'Mensual Piloto ($10)', precio: 10.00, esPiloto: true },
        { nombre: 'Anual Congelado ($107.80)', precio: 107.80, esPiloto: true },
        { nombre: 'Regular ($40)', precio: 40.00, esPiloto: false },
      ],
      clausula: 'El presente contrato tiene como objeto la incorporación del establecimiento en el portal QueComerenLoja.com, integrando su ficha digital, menú gastronómico, botón directo de pedidos a WhatsApp y posicionamiento en el mapa oficial de GuIA Loja.'
    },
    'GUIALOJA-GASTRO-CAFE': {
      titulo: 'Gastronomía — Cafetería / Panadería / Heladería',
      portal: 'QueComerenLoja.com (+ Red GuIA Loja)',
      icon: Coffee,
      cupos: cupos.gastro,
      esGastro: true,
      planes: [
        { nombre: 'Mensual Piloto ($10)', precio: 10.00, esPiloto: true },
        { nombre: 'Anual Congelado ($107.80)', precio: 107.80, esPiloto: true },
        { nombre: 'Regular ($40)', precio: 40.00, esPiloto: false },
      ],
      clausula: 'El presente contrato tiene como objeto la catalogación del establecimiento en QueComerenLoja.com, destacando especialidades de café, métodos de extracción y repostería artesanal conectada con la red turística y cultural de GuIA Loja.'
    },
    'GUIALOJA-HOTEL-SM': {
      titulo: 'Hoteles — Pequeño (≤ 10 habitaciones)',
      portal: 'AgendaTuristicaLoja.com',
      icon: Building2,
      cupos: cupos.hotelesSm,
      esGastro: false,
      planes: [
        { nombre: 'Mensual Piloto ($25)', precio: 25.00, esPiloto: true },
        { nombre: 'Anual Congelado ($218.80)', precio: 218.80, esPiloto: true },
        { nombre: 'Regular ($35)', precio: 35.00, esPiloto: false },
      ],
      clausula: 'El presente contrato confiere presencia prioritaria en la sección de Hospedaje en AgendaTuristicaLoja.com con enlace directo a reservas por WhatsApp sin comisiones por habitación y articulación con los eventos de la ciudad a través de GuIA Loja.'
    },
    'GUIALOJA-HOTEL-LG': {
      titulo: 'Hoteles — Grande (> 10 habitaciones)',
      portal: 'AgendaTuristicaLoja.com',
      icon: Building2,
      cupos: null,
      esGastro: false,
      planes: [
        { nombre: 'Ficha Estándar ($65/mes)', precio: 65.00, esPiloto: false },
        { nombre: 'Combo Ficha + Bot en su Web ($75/mes)', precio: 75.00, esPiloto: false },
      ],
      clausula: 'El establecimiento dispondrá de vitrina corporativa prioritaria en AgendaTuristicaLoja.com dentro del ecosistema GuIA Loja con integración de reservas directas y opción de bot automatizado para captura continua de huéspedes.'
    },
    'GUIALOJA-TUR-OPE': {
      titulo: 'Operadores Turísticos',
      portal: 'AgendaTuristicaLoja.com',
      icon: Compass,
      cupos: cupos.operadores,
      esGastro: false,
      planes: [
        { nombre: 'Mensual Lanzamiento ($25)', precio: 25.00, esPiloto: true },
        { nombre: 'Anual Congelado ($218.80)', precio: 218.80, esPiloto: true },
      ],
      clausula: 'El presente contrato tiene por objeto la promoción activa de paquetes turísticos, excursiones y rutas guiadas a través de AgendaTuristicaLoja.com en coordinación con los eventos de AgendaCulturalLoja.com y la red GuIA Loja.'
    },
    'GUIALOJA-WEB-200': {
      titulo: 'Web Propia Administrada ($200)',
      portal: 'Infraestructura Web GuIA Loja',
      icon: Globe,
      cupos: null,
      esGastro: false,
      planes: [
        { nombre: '$40 Entrada + $160 Financiado (Renovación $100/año)', precio: 40.00, esPiloto: false },
      ],
      clausula: 'Prestación de servicios para diseño, despliegue, hosting de alta velocidad y administración continua de sitio web profesional con dominio propio para el CLIENTE, sincronizado con la red comercial GuIA Loja.'
    }
  };

  const currentConfig = configs[tipoContrato];
  const currentPlan = currentConfig.planes[subplanIndex] || currentConfig.planes[0];

  const subtotal = currentPlan.precio;
  const iva = conFactura ? Number((subtotal * 0.15).toFixed(2)) : 0.00;
  const baseCobro = Number((subtotal + iva).toFixed(2));
  const recargoPayphone = metodoPago === 'PAYPHONE' ? Number((baseCobro * 0.06).toFixed(2)) : 0.00;
  const totalCobrado = Number((baseCobro + recargoPayphone).toFixed(2));

  const codigoUnico = useMemo(() => {
    return `${tipoContrato}-${currentYear}-028`;
  }, [tipoContrato, currentYear]);

  const handleWhatsappChange = (val: string) => {
    let digits = val.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      digits = '593' + digits.substring(1);
    } else if (digits.length === 9 && !digits.startsWith('593')) {
      digits = '593' + digits;
    }
    setWhatsappCliente(digits);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('codigo_unico', codigoUnico);

      try {
        const res = await fetch('/api/upload/menu', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.url) {
          uploadedUrls.push(data.url);
        }
      } catch (err) {
        console.error('Error al subir imagen:', err);
      }
    }

    setMenuFotos((prev) => [...prev, ...uploadedUrls]);
    setCartaRecogida(true);
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Generador de PDF institucional bajo la marca matriz GUIA LOJA (DIAGRAMACIÓN A4 COMPLETA Y LLENA)
  const generatePdfBase64 = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 16;
    const contentWidth = pageWidth - (margin * 2);

    // =========================================================================
    // 1. HEADER INSTITUCIONAL (#4A0E4E) CON LÍNEA MAGENTA (#E91E63)
    // =========================================================================
    const headerHeight = 20;
    doc.setFillColor(74, 14, 78);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    doc.setFillColor(233, 30, 99);
    doc.rect(0, headerHeight, pageWidth, 1, 'F');

    // Logo oficial síncrono desde assets
    try {
      doc.addImage(LOGO_OFICIAL_BASE64, 'JPEG', margin, 2.8, 14.5, 14.5);
    } catch (e) {
      console.error('Error logo:', e);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('GuIA LOJA', margin + 17, 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(230, 215, 235);
    doc.text('Ecosistema Digital de Loja', margin + 17, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(235, 225, 240);
    doc.text('"Llevamos a Loja y a sus eventos al mundo entero."', pageWidth - margin, 12, { align: 'right' });

    // =========================================================================
    // 2. CABECERA Y METADATOS
    // =========================================================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(74, 14, 78);
    doc.text('CONTRATO PRIVADO DE AFILIACIÓN Y SERVICIOS DIGITALES', pageWidth / 2, 28, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(74, 14, 78);
    doc.text('Ecosistema Digital GuIA Loja', pageWidth / 2, 33, { align: 'center' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, 36, pageWidth - margin, 36);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Loja, ${fechaHoy}  •  Código: ${codigoUnico}`, margin, 41);

    const repTexto = representanteLegal.trim() || '[Representante Legal]';
    const nomTexto = nombreComercial.trim() || '[Nombre Comercial]';
    const rucTexto = rucCliente.trim() || 'S/N';
    const dirTexto = direccionCliente.trim() ? `${direccionCliente} (${cantonCliente})` : `Loja (${cantonCliente})`;
    const wsTexto = whatsappCliente.trim() || 'Sin registrar';

    const paraTexto = `Para: ${repTexto}, Representante Legal — ${nomTexto}`;
    const paraLines = doc.splitTextToSize(paraTexto, contentWidth);
    doc.text(paraLines, margin, 46);

    const paraOffset = paraLines.length * 4.2;
    const introStartY = 47.5 + paraOffset;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const parrafoIntro = `Conste por el presente instrumento privado que celebran por una parte el Ing. César Reyes Jaramillo (C.I. 1102948210), Director General de GuIA Loja, y por otra parte ${repTexto}, en representación legítima de ${nomTexto}, conviniendo en formalizar la afiliación comercial sujeta a las siguientes cláusulas:`;
    const introLines = doc.splitTextToSize(parrafoIntro, contentWidth);
    doc.text(introLines, margin, introStartY);

    let currentY = introStartY + (introLines.length * 4.2) + 4.5;

    // =========================================================================
    // SECCIÓN 1: DATOS DEL ESTABLECIMIENTO
    // =========================================================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(74, 14, 78);
    doc.text('1. Datos del Establecimiento Beneficiario', margin, currentY);

    currentY += 3;
    doc.setFillColor(250, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, currentY, contentWidth, 27, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(51, 65, 85);

    doc.text('Establecimiento:', margin + 4, currentY + 4.8);
    doc.setFont('helvetica', 'bold');
    doc.text(nomTexto, margin + 38, currentY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.text('RUC / Cédula:', margin + 4, currentY + 9.6);
    doc.setFont('helvetica', 'bold');
    doc.text(rucTexto, margin + 38, currentY + 9.6);

    doc.setFont('helvetica', 'normal');
    doc.text('Representante Legal:', margin + 4, currentY + 14.4);
    doc.setFont('helvetica', 'bold');
    doc.text(repTexto, margin + 38, currentY + 14.4);

    doc.setFont('helvetica', 'normal');
    doc.text('Dirección del Local:', margin + 4, currentY + 19.2);
    doc.setFont('helvetica', 'bold');
    doc.text(dirTexto, margin + 38, currentY + 19.2);

    doc.setFont('helvetica', 'normal');
    doc.text('Contacto Oficial:', margin + 4, currentY + 24);
    doc.setFont('helvetica', 'bold');
    doc.text(`WhatsApp: ${wsTexto}`, margin + 38, currentY + 24);

    currentY += 32;

    // =========================================================================
    // SECCIÓN 2: ALCANCE DEL SERVICIO
    // =========================================================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(74, 14, 78);
    doc.text('2. Alcance del Servicio y Límite de Responsabilidad', margin, currentY);

    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(51, 65, 85);
    let objText = `${currentConfig.clausula} El servicio se articula activamente con la red provincial GuIA Loja (integrando los portales QueComerenLoja.com, AgendaTuristicaLoja.com y AgendaCulturalLoja.com), con derivación directa sin comisiones hacia el canal oficial de reservas o WhatsApp del negocio.`;
    if (tipoContrato === 'GUIALOJA-WEB-200' && campoExtra) {
      objText += ` Dominio asignado: ${campoExtra} (Entrega estimada: ${diasEntrega} días hábiles).`;
    }
    const objLines = doc.splitTextToSize(objText, contentWidth);
    doc.text(objLines, margin, currentY);
    currentY += (objLines.length * 4) + 2.5;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.6);
    doc.setTextColor(100, 116, 139);
    const limiteText = 'Límite de alcance: GuIA Loja muestra el negocio cuando coincide con la búsqueda del usuario. No garantiza cantidad de clientes, pedidos, reservas ni posicionamiento en motores externos (Google, etc.).';
    const limiteLines = doc.splitTextToSize(limiteText, contentWidth);
    doc.text(limiteLines, margin, currentY);
    currentY += (limiteLines.length * 3.6) + 3;

    // Reglas Operativas Menú (si es gastro)
    if (currentConfig.esGastro) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(74, 14, 78);
      doc.text('Reglas Operativas de Menú:', margin, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(51, 65, 85);
      const menuText = 'Envío hasta las 10:30 AM (Nombre + Ingredientes). El afiliado revisa la publicación. Incluye reporte mensual de visualizaciones. El afiliado responde al 100% por precios, ingredientes y disponibilidad.';
      const menuLines = doc.splitTextToSize(menuText, contentWidth - 43);
      doc.text(menuLines, margin + 42, currentY);
      currentY += (menuLines.length * 3.6) + 3.5;
    }

    // =========================================================================
    // SECCIÓN 3: ESTRUCTURA DE INVERSIÓN
    // =========================================================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(74, 14, 78);
    doc.text('3. Estructura de Inversión y Condiciones de Pago', margin, currentY);

    currentY += 3;
    const invHeight = metodoPago === 'PAYPHONE' ? 24 : 20;
    doc.setFillColor(250, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, currentY, contentWidth, invHeight, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(51, 65, 85);

    doc.text('Modalidad y Plan:', margin + 4, currentY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(currentPlan.nombre, margin + 38, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal + IVA:', margin + 4, currentY + 10);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${subtotal.toFixed(2)} USD + $${iva.toFixed(2)} IVA (${conFactura ? '15% Factura' : '0% Recibo Simple'})`, margin + 38, currentY + 10);

    if (metodoPago === 'PAYPHONE') {
      doc.setFont('helvetica', 'normal');
      doc.text('Comisión Pasarela:', margin + 4, currentY + 14.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`+$${recargoPayphone.toFixed(2)} USD (PayPhone 6%)`, margin + 38, currentY + 14.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(74, 14, 78);
      doc.text('TOTAL A PAGAR:', margin + 4, currentY + 19.5);
      doc.text(`$${totalCobrado.toFixed(2)} USD (${metodoPago})`, margin + 38, currentY + 19.5);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(74, 14, 78);
      doc.text('TOTAL A PAGAR:', margin + 4, currentY + 15.5);
      doc.text(`$${totalCobrado.toFixed(2)} USD (${metodoPago})`, margin + 38, currentY + 15.5);
    }

    currentY += invHeight + 5;

    // =========================================================================
    // SECCIÓN 4: CONDICIONES LEGALES, CONGELAMIENTO Y LOPDP
    // =========================================================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(74, 14, 78);
    doc.text('4. Validez Electrónica, Vigencia y Protección de Datos', margin, currentY);

    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(51, 65, 85);

    const leg1 = currentPlan.esPiloto
      ? '• Tarifa congelada 2026: La tarifa acordada permanecerá congelada e invariable por el lapso de 12 meses continuos a partir de la emisión del presente acuerdo.'
      : '• Vigencia y renovación: Renovación periódica bajo acuerdo de partes conforme a la vigencia y términos del plan suscrito.';
    const leg1Lines = doc.splitTextToSize(leg1, contentWidth);
    doc.text(leg1Lines, margin, currentY);
    currentY += (leg1Lines.length * 3.7) + 1.8;

    const leg2 = '• Perfeccionamiento legal: Conforme a la Ley de Comercio Electrónico y Firmas de Datos del Ecuador, este instrumento adquiere plena validez jurídica tras su remisión al WhatsApp del cliente y la consiguiente formalización con la palabra "ACEPTADO" acompañada del comprobante de pago.';
    const leg2Lines = doc.splitTextToSize(leg2, contentWidth);
    doc.text(leg2Lines, margin, currentY);
    currentY += (leg2Lines.length * 3.7) + 1.8;

    const leg3 = '• Mora, Retiro y LOPDP: Suspensión automática ante mora superior a 15 días (pérdida de tarifa congelada). Retiro voluntario mediante notificación escrita con 30 días de anticipación por WhatsApp. Tratamiento de datos comerciales autorizado bajo LOPDP (políticas en cesarreyes.com).';
    const leg3Lines = doc.splitTextToSize(leg3, contentWidth);
    doc.text(leg3Lines, margin, currentY);
    currentY += (leg3Lines.length * 3.7) + 5;

    // =========================================================================
    // 5. FIRMAS PERFECTAMENTE AJUSTADAS A SU CONTENIDO Y AL PIE DE PÁGINA
    // =========================================================================
    const sigY = Math.max(currentY, 244);
    const boxWidth = (contentWidth - 8) / 2;
    const boxHeight = 28;

    // Caja Firma César (Emisor)
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(250, 250, 252);
    doc.rect(margin, sigY, boxWidth, boxHeight, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(74, 14, 78);
    doc.text('POR GUIA LOJA / EMISOR:', margin + 4, sigY + 5);

    // Estampado de la FIRMA REAL DE CÉSAR (color y escala natural)
    try {
      doc.addImage(FIRMA_CESAR_BASE64, 'PNG', margin + 4, sigY + 6.5, 28, 12);
    } catch (e) {
      console.error('Error estampar firma:', e);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('Ing. César Reyes Jaramillo', margin + 4, sigY + 20.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text('Director General — GuIA Loja | Firma Digital Estampada', margin + 4, sigY + 24.5);

    // Caja Firma Cliente (CON FONDO CLARO RESTAURADO)
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(250, 250, 252);
    doc.rect(margin + boxWidth + 8, sigY, boxWidth, boxHeight, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(74, 14, 78);
    doc.text('POR EL CLIENTE / BENEFICIARIO:', margin + boxWidth + 12, sigY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(22, 101, 52);
    doc.text(repTexto, margin + boxWidth + 12, sigY + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text('Cierre Legal vía WhatsApp:', margin + boxWidth + 12, sigY + 16.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(15, 118, 110);
    doc.text('[ ACEPTADO ] + Comprobante', margin + boxWidth + 12, sigY + 21);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    doc.setTextColor(100, 116, 139);
    doc.text('Formalización conforme a LOPDP y Ley de Comercio Electrónico', margin + boxWidth + 12, sigY + 25);

    // =========================================================================
    // 6. FOOTER INSTITUCIONAL (EN Y=283)
    // =========================================================================
    const footerY = 283;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text('GuIA Loja — Contrato Oficial de Afiliación y Servicios Digitales | Validez Jurídica Electrónica', margin, footerY + 4.5);
    doc.text('Página 1 de 1', pageWidth - margin, footerY + 4.5, { align: 'right' });

    return doc.output('datauristring');
  };

  const emitirYEnviar = async () => {
    if (!representanteLegal || !nombreComercial || !whatsappCliente) {
      alert('Por favor completa los campos obligatorios (*)');
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const pdfBase64 = generatePdfBase64();

      const payload = {
        codigo_unico: codigoUnico,
        vertical: tipoContrato,
        ecosistema_portal: currentConfig.portal,
        es_piloto: currentPlan.esPiloto,
        nombre_comercial: nombreComercial,
        ruc_cedula: rucCliente,
        representante_legal: representanteLegal,
        direccion: direccionCliente,
        canton: cantonCliente,
        whatsapp: whatsappCliente,
        email: emailCliente,
        modalidad_plan: currentPlan.nombre,
        subtotal: subtotal,
        iva: iva,
        recargo_pasarela: recargoPayphone,
        total_cobrado: totalCobrado,
        metodo_pago: metodoPago,
        dominio_web: campoExtra,
        carta_recogida: cartaRecogida,
        menu_fotos_urls: menuFotos,
        pdf_base64: pdfBase64,
      };

      const res = await fetch('/api/contratos/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setStatusMsg({
          type: 'success',
          text: data.whatsappEnviado
            ? `¡Contrato ${codigoUnico} registrado y enviado exitosamente por WhatsApp con el PDF adjunto!`
            : `Contrato guardado en base de datos. (Aviso WhatsApp: ${data.whatsappError || 'Verifica la instancia Evolution'}).`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: `Error al emitir contrato: ${data.error}`,
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Error de conexión: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const descargarPdfDirecto = () => {
    const dataUri = generatePdfBase64();
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `Contrato_${codigoUnico}.pdf`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-800 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Sobrio */}
        <header className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              GuIA Loja — Emisión de Contratos Digitales
            </h1>
            <p className="text-neutral-500 text-xs sm:text-sm mt-0.5">
              Generación de acuerdo oficial, captura de menú y remisión directa por WhatsApp
            </p>
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={limpiarFormulario}
              className="text-xs font-semibold px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md border border-neutral-300 transition cursor-pointer"
              title="Borra los campos actuales y comienza un contrato nuevo"
            >
              Nuevo Contrato
            </button>
            <span className="font-mono text-xs font-semibold px-3 py-1 bg-neutral-100 border border-neutral-300 text-neutral-700 rounded-md">
              {codigoUnico}
            </span>
          </div>
        </header>

        {/* Notificaciones */}
        {statusMsg && (
          <div className={`p-4 rounded-xl flex items-center gap-3 border ${statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span className="text-sm font-medium">{statusMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* PANEL IZQUIERDO: FORMULARIO EN TABS */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Tabs */}
            <div className="grid grid-cols-3 bg-white p-1.5 rounded-xl border border-neutral-200 shadow-sm gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('plan')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'plan' 
                    ? 'bg-neutral-900 text-white shadow' 
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>1. Tipo y Plan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cliente')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'cliente' 
                    ? 'bg-neutral-900 text-white shadow' 
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <User className="w-4 h-4" />
                <span>2. Datos Cliente</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pago')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'pago' 
                    ? 'bg-neutral-900 text-white shadow' 
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>3. Valores y Cobro</span>
              </button>
            </div>

            {/* Contenido del Tab */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm min-h-[460px] flex flex-col justify-between">
              
              {/* TAB 1: CATEGORÍA Y PLAN */}
              {activeTab === 'plan' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                      Seleccionar Categoría del Negocio
                    </label>
                    <select 
                      value={tipoContrato}
                      onChange={(e) => {
                        setTipoContrato(e.target.value);
                        setSubplanIndex(0);
                      }}
                      className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                    >
                      <option value="GUIALOJA-GASTRO-REST">🍽️ 1. Gastronomía — Restaurante / Picantería</option>
                      <option value="GUIALOJA-GASTRO-CAFE">☕ 2. Gastronomía — Cafetería / Panadería / Heladería</option>
                      <option value="GUIALOJA-HOTEL-SM">🏨 3. Hoteles — Pequeño (≤ 10 habitaciones)</option>
                      <option value="GUIALOJA-HOTEL-LG">🏢 4. Hoteles — Grande (&gt; 10 habitaciones)</option>
                      <option value="GUIALOJA-TUR-OPE">🧭 5. Operadores Turísticos</option>
                      <option value="GUIALOJA-WEB-200">🌐 6. Web Propia Administrada ($200)</option>
                    </select>
                  </div>

                  {currentConfig.cupos && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-100 border border-neutral-300 text-neutral-700 text-xs font-medium">
                      <span>Cupos de Lanzamiento:</span>
                      <span className="font-mono font-bold text-neutral-900">
                        {currentConfig.cupos.ocupados} de {currentConfig.cupos.limite} asignados
                      </span>
                    </div>
                  )}

                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-neutral-700 mb-2">
                      Seleccionar Modalidad de Contratación:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentConfig.planes.map((p: any, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSubplanIndex(idx)}
                          className={`text-left p-3.5 rounded-lg border text-xs transition ${
                            subplanIndex === idx 
                              ? 'bg-neutral-900 text-white border-neutral-900' 
                              : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-neutral-300'
                          }`}
                        >
                          <div className="font-bold">{p.nombre}</div>
                          <div className={`mt-1 font-mono font-bold ${subplanIndex === idx ? 'text-neutral-200' : 'text-neutral-900'}`}>
                            ${p.precio.toFixed(2)} USD
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Captura de Fotos / Archivos (Disponible para todas las categorías) */}
                  <div className="pt-3 border-t border-neutral-200 space-y-2">
                    <label className="block text-xs font-semibold text-neutral-700">
                      {currentConfig.esGastro
                        ? '📸 Captura de Carta / Fotos del Menú:'
                        : tipoContrato.startsWith('GUIALOJA-HOTEL')
                        ? '📸 Fotos del Hotel (Habitaciones, Fachada, Logo):'
                        : tipoContrato === 'GUIALOJA-TUR-OPE'
                        ? '📸 Material Promocional / Fotos de Rutas o Tours:'
                        : '📸 Archivos / Material del Negocio (Logo, Fotos, etc.):'}
                    </label>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-menu-upload"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg border border-neutral-300 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {uploadingImage ? 'Subiendo archivo...' : 'Tomar Foto / Subir Archivo'}
                      </button>
                      <span className="text-[11px] text-neutral-500">
                        {menuFotos.length === 0 ? 'Sin archivos adjuntos' : `${menuFotos.length} archivo(s) guardado(s)`}
                      </span>
                    </div>

                    {menuFotos.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                        {menuFotos.map((url, i) => (
                          <div key={i} className="relative group border border-neutral-300 rounded-lg overflow-hidden bg-neutral-100 aspect-square">
                            <img src={url} alt={`Archivo ${i}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setMenuFotos((prev) => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 p-1 bg-neutral-900/80 text-white rounded-md hover:bg-rose-600 transition"
                              title="Eliminar foto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {tipoContrato === 'GUIALOJA-GASTRO-CAFE' && (
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Especialidad / Métodos de Café:</label>
                      <input 
                        type="text" 
                        value={campoExtra} 
                        onChange={(e) => setCampoExtra(e.target.value)} 
                        placeholder="Ej. Filtrados V60, Café de Origen, Repostería" 
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900" 
                      />
                    </div>
                  )}

                  {tipoContrato === 'GUIALOJA-WEB-200' && (
                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">Dominio solicitado:</label>
                        <input 
                          type="text" 
                          value={campoExtra} 
                          onChange={(e) => setCampoExtra(e.target.value)} 
                          placeholder="minegocioenloja.com" 
                          className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">Días hábiles de entrega:</label>
                        <input 
                          type="number" 
                          value={diasEntrega} 
                          onChange={(e) => setDiasEntrega(Number(e.target.value))} 
                          className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DATOS CLIENTE */}
              {activeTab === 'cliente' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Nombre Comercial del Establecimiento *</label>
                      <input 
                        type="text" 
                        value={nombreComercial} 
                        onChange={(e) => setNombreComercial(e.target.value)} 
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">RUC o Cédula *</label>
                      <input 
                        type="text" 
                        value={rucCliente} 
                        onChange={(e) => setRucCliente(e.target.value)} 
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-xs font-mono text-neutral-900" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Representante Legal / Propietario *</label>
                      <input 
                        type="text" 
                        value={representanteLegal} 
                        onChange={(e) => setRepresentanteLegal(e.target.value)} 
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900" 
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Dirección del Local *</label>
                      <input 
                        type="text" 
                        value={direccionCliente} 
                        onChange={(e) => setDireccionCliente(e.target.value)} 
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">WhatsApp (Para envío del PDF y Aceptación) *</label>
                      <input 
                        type="text" 
                        value={whatsappCliente} 
                        onChange={(e) => handleWhatsappChange(e.target.value)} 
                        placeholder="0991234567" 
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-xs font-mono font-semibold text-neutral-900" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Correo Electrónico</label>
                      <input 
                        type="email" 
                        value={emailCliente} 
                        onChange={(e) => setEmailCliente(e.target.value)} 
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: VALORES Y COBRO */}
              {activeTab === 'pago' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Comprobante de Venta:</label>
                      <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                        <button
                          type="button"
                          onClick={() => setConFactura(true)}
                          className={`py-1.5 text-xs font-semibold rounded-md transition ${conFactura ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
                        >
                          Con Factura (IVA 15%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setConFactura(false)}
                          className={`py-1.5 text-xs font-semibold rounded-md transition ${!conFactura ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
                        >
                          Recibo Simple (0%)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Forma de Pago:</label>
                      <select 
                        value={metodoPago} 
                        onChange={(e) => setMetodoPago(e.target.value)} 
                        className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 rounded-lg p-2 text-xs"
                      >
                        <option value="EFECTIVO">Efectivo / Transferencia Directa</option>
                        <option value="PAYPHONE">Tarjeta de Crédito / Débito (PayPhone +6%)</option>
                        <option value="FINANCIAMIENTO_EXT">Financiamiento Externo (Web Propia)</option>
                      </select>
                    </div>
                  </div>

                  {/* Resumen numérico */}
                  <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-2 text-xs">
                    <div className="flex justify-between text-neutral-600">
                      <span>Precio Base del Plan:</span>
                      <span className="font-mono font-semibold text-neutral-900">${subtotal.toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>IVA ({conFactura ? '15%' : '0%'}):</span>
                      <span className="font-mono text-neutral-900">${iva.toFixed(2)} USD</span>
                    </div>
                    {metodoPago === 'PAYPHONE' && (
                      <div className="flex justify-between text-neutral-600">
                        <span>Recargo Comisión Pasarela (+6%):</span>
                        <span className="font-mono text-neutral-900">+${recargoPayphone.toFixed(2)} USD</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-neutral-200 flex justify-between items-center text-sm">
                      <span className="font-bold text-neutral-900">Total a Cobrar al Cliente:</span>
                      <span className="text-xl font-bold font-mono text-neutral-900">${totalCobrado.toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de navegación */}
              <div className="pt-6 border-t border-neutral-100 flex items-center justify-between gap-3">
                {activeTab !== 'plan' ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'pago' ? 'cliente' : 'plan')}
                    className="py-2 px-3 text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Anterior
                  </button>
                ) : <div />}

                {activeTab !== 'pago' ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'plan' ? 'cliente' : 'pago')}
                    className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 ml-auto cursor-pointer"
                  >
                    Siguiente <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={emitirYEnviar}
                    disabled={loading}
                    className="py-3 px-5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm ml-auto cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {loading ? 'Emitiendo y Enviando Documento...' : 'Emitir Contrato y Enviar al WhatsApp'}
                  </button>
                )}
              </div>

            </div>

            {/* Descarga directa */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={descargarPdfDirecto}
                className="flex-1 py-2 px-3 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-lg border border-neutral-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Descargar Archivo PDF
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-4 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-lg border border-neutral-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir
              </button>
            </div>

          </div>

          {/* PANEL DERECHO: VISTA PREVIA DEL DOCUMENTO A4 — MARCA MATRIZ GUIA LOJA */}
          <div className="lg:col-span-5 sticky top-6">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
              
              <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200 flex items-center justify-between text-xs text-neutral-600 font-medium">
                <span>Vista Previa del Contrato Oficial</span>
                <span className="font-mono text-[11px] text-neutral-500">{codigoUnico}</span>
              </div>

              {/* VISTA PREVIA A4 CON MARCA GUIA LOJA */}
              <div className="bg-white text-neutral-800 text-[11px] leading-relaxed max-h-[82vh] overflow-y-auto shadow-inner">
                
                {/* 1. HEADER MORADO INSTITUCIONAL (#4A0E4E) — MARCA MATRIZ GUIA LOJA */}
                <div className="bg-[#4A0E4E] text-white p-3.5 relative font-sans">
                  <div className="flex items-center justify-between">
                    {/* Logo + GUIA LOJA */}
                    <div className="flex items-center gap-2.5">
                      <img 
                        src="/nuevo-logo-agenda.jpg" 
                        alt="Logo GuIA Loja" 
                        className="w-9 h-9 object-contain rounded-sm bg-white p-0.5 shadow-sm"
                      />
                      <div>
                        <div className="font-bold text-[12px] tracking-wider leading-tight">GuIA LOJA</div>
                        <div className="text-[9px] text-purple-200 tracking-wider">Ecosistema Digital de Loja</div>
                      </div>
                    </div>

                    {/* Lema */}
                    <div className="text-right">
                      <div className="text-[8px] text-purple-100 italic">"Llevamos a Loja y a sus eventos al mundo entero."</div>
                    </div>
                  </div>

                  {/* Franja magenta inferior */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#E91E63]"></div>
                </div>

                {/* 2. CUERPO DEL CONTRATO */}
                <div className="p-5 space-y-3 font-sans">
                  
                  <div className="text-center pt-1">
                    <h2 className="text-[#4A0E4E] font-bold text-xs tracking-wide uppercase">
                      CONTRATO PRIVADO DE AFILIACIÓN Y SERVICIOS DIGITALES
                    </h2>
                    <p className="text-[#4A0E4E] text-[10px] font-medium mt-0.5">
                      Ecosistema Digital GuIA Loja
                    </p>
                    <div className="w-full h-[1px] bg-slate-200 my-2"></div>
                  </div>

                  <div className="text-[10px] space-y-1">
                    <div><strong>Loja,</strong> {fechaHoy}</div>
                    <div className="break-words">
                      <strong>Para:</strong> {representanteLegal.trim() || '[Representante Legal]'}, Representante Legal — <strong>{nombreComercial.trim() || '[Nombre Comercial]'}</strong>
                    </div>
                  </div>

                  <p className="text-justify text-[10px] text-slate-700">
                    Conste por el presente instrumento privado que celebran por una parte el <strong>Ing. César Reyes Jaramillo</strong> (C.I. 1102948210), Director General de GuIA Loja, y por otra parte <strong>{representanteLegal.trim() || '[Representante Legal]'}</strong> por <strong>{nombreComercial.trim() || '[Establecimiento]'}</strong>.
                  </p>

                  <div>
                    <h3 className="text-[#4A0E4E] font-bold text-[10.5px] mb-1">
                      Datos del Establecimiento Beneficiario
                    </h3>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[9.5px] space-y-0.5">
                      <div><strong>Establecimiento:</strong> {nombreComercial.trim() || '—'}</div>
                      <div><strong>RUC:</strong> {rucCliente.trim() || '—'} | <strong>Ciudad:</strong> {cantonCliente}</div>
                      <div><strong>Representante:</strong> {representanteLegal.trim() || '—'}</div>
                      <div><strong>Dirección:</strong> {direccionCliente.trim() || '—'}</div>
                      <div><strong>Contacto:</strong> WhatsApp {whatsappCliente.trim() || '—'}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[#4A0E4E] font-bold text-[10.5px] mb-1">
                      Alcance del Servicio
                    </h3>
                    <p className="text-justify text-[10px] text-slate-700">
                      {currentConfig.clausula} Este servicio se articula con la red GuIA Loja conectando con QueComerenLoja.com, AgendaTuristicaLoja.com y AgendaCulturalLoja.com. Derivación directa sin comisiones hacia el canal oficial del establecimiento.
                    </p>
                    <p className="text-justify text-[9.5px] text-slate-400 italic mt-1">
                      GuIA Loja muestra el establecimiento cuando su oferta coincide con lo que el usuario busca. No garantiza cantidad de clientes, pedidos, reservas ni posición en Google.
                    </p>
                  </div>

                  {currentConfig.esGastro && (
                    <div>
                      <h3 className="text-[#4A0E4E] font-bold text-[10.5px] mb-1">
                        Reglas Operativas de Publicación de Menú
                      </h3>
                      <ul className="text-[9.5px] text-slate-600 space-y-0.5 list-none">
                        <li>• Envío del menú hasta las <strong>10:30 AM</strong>: Nombre del plato + Descripción de ingredientes.</li>
                        <li>• El afiliado verifica la publicación para corregir errores de transcripción.</li>
                        <li>• <strong>Reporte mensual de visualizaciones</strong> incluido en el servicio.</li>
                        <li>• El afiliado responde al 100% por precios, ingredientes y disponibilidad.</li>
                      </ul>
                    </div>
                  )}

                  <div>
                    <h3 className="text-[#4A0E4E] font-bold text-[10.5px] mb-1">
                      Estructura de inversión y condiciones de pago
                    </h3>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[9.5px] space-y-0.5">
                      <div className="font-bold text-slate-900">Modalidad: {currentPlan.nombre}</div>
                      <div>Subtotal: ${subtotal.toFixed(2)} USD | IVA ({conFactura ? '15%' : '0%'}): ${iva.toFixed(2)} USD</div>
                      {metodoPago === 'PAYPHONE' && <div>Recargo Pasarela: ${recargoPayphone.toFixed(2)} USD</div>}
                      <div className="font-bold text-[#4A0E4E] pt-1 border-t border-slate-200 text-[10px]">
                        Total Acordado: ${totalCobrado.toFixed(2)} USD ({metodoPago})
                      </div>
                    </div>
                  </div>

                  {currentPlan.esPiloto && (
                    <div>
                      <h3 className="text-[#4A0E4E] font-bold text-[10.5px] mb-1">
                        Tarifa preferencial congelada (Programa Piloto 2026)
                      </h3>
                      <p className="text-justify text-[10px] text-slate-700">
                        La tarifa acordada se mantendrá congelada e invariable por el plazo de 12 meses a partir de la emisión del presente documento.
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-[#4A0E4E] font-bold text-[10.5px] mb-1">
                      Perfeccionamiento legal y validez electrónica
                    </h3>
                    <p className="text-justify text-slate-500 text-[9.5px]">
                      Validez plena conforme a la Ley de Comercio Electrónico. El cliente formaliza su aceptación respondiendo la palabra <strong>"ACEPTADO"</strong> vía WhatsApp.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-[#4A0E4E] font-bold text-[10.5px] mb-1">
                      Vigencia, Mora y Protección de Datos
                    </h3>
                    <ul className="text-[9.5px] text-slate-600 space-y-0.5 list-none">
                      <li>• <strong>Mora y suspensión:</strong> Más de 15 días de impago → suspensión de ficha y pérdida de tarifa congelada.</li>
                      <li>• <strong>Retiro voluntario:</strong> 30 días de anticipación por aviso escrito vía WhatsApp al número oficial de GuIA Loja.</li>
                      <li>• <strong>Protección de datos (LOPDP):</strong> El afiliado autoriza el uso de sus datos comerciales. Políticas en <span className="text-[#4A0E4E]">cesarreyes.com</span>.</li>
                    </ul>
                  </div>

                  {/* Firmas */}
                  <div className="pt-3 grid grid-cols-2 gap-3 border-t border-slate-200 text-center text-[9.5px]">
                    <div className="border border-slate-300 p-2.5 rounded bg-slate-50 flex flex-col items-center justify-between min-h-[85px]">
                      <div className="text-[8.5px] font-bold text-[#4A0E4E] uppercase w-full text-left">POR GUIA LOJA / EMISOR:</div>
                      <div className="my-1">
                        <img 
                          src="/Firma Cesar.png" 
                          alt="Firma César Reyes" 
                          className="h-10 w-auto object-contain mx-auto"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-[9px]">Ing. César Reyes Jaramillo</div>
                        <div className="text-[7.5px] text-slate-500">Director General — GuIA Loja | Firma Digital Estampada</div>
                      </div>
                    </div>

                    <div className="border border-slate-300 p-2.5 rounded bg-slate-50 flex flex-col justify-between min-h-[85px]">
                      <div className="text-[8.5px] font-bold text-[#4A0E4E] uppercase text-left">POR EL CLIENTE / BENEFICIARIO:</div>
                      <div className="my-auto py-2">
                        <div className="font-bold text-slate-900 text-[10px]">{representanteLegal.trim() || '[Representante Legal]'}</div>
                        <div className="text-[8px] text-slate-500 mt-0.5">Aceptación Digital con:</div>
                        <div className="text-emerald-700 font-bold text-[9px] mt-0.5">[ ACEPTADO ] + Comprobante</div>
                      </div>
                    </div>
                  </div>

                  {/* 3. FOOTER GUIA LOJA */}
                  <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-[9px] text-slate-500">
                    <div>GuIA Loja — Contrato Oficial de Afiliación y Servicios Digitales</div>
                    <div>Página 1</div>
                  </div>

                </div>

              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

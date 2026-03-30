import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ChevronRight, ChevronLeft, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/cx-academy-logo.png";
import maxLogo from "@/assets/max-cx-logo.png";

interface Question {
  id: string;
  question: string;
  options: Array<{ label: string; value: number }>;
}

interface ContactFormData {
  // Sección 1 - Identificación
  nombreCompleto: string;
  cargo: string;
  correoCorporativo: string;
  numeroContacto: string;
  // Sección 2 - Empresa
  nombreEmpresa: string;
  paisCiudad: string;
  sector: string;
  tamanoEmpresa: string;
  // Sección 3 - Contexto CX
  canalesAtencion: string;
  volumenMensual: string;
  existeAreaCX: string;
  mayorRetoCX: string;
  // Sección 4 - Consentimiento
  autorizacionDatos: boolean;
  permisoContacto: boolean;
}

const ratingOptions = [
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
];

const quizData: Question[][] = [
  // Dimensión 1: Estrategia y Gobernanza CX + Dimensión 2 (parcial)
  [
    {
      id: "q1",
      question: "La estrategia de Customer Experience está claramente definida y es conocida por los equipos clave de la organización.",
      options: ratingOptions,
    },
    {
      id: "q2",
      question: "Los objetivos de CX están alineados con los objetivos estratégicos y se revisan periódicamente.",
      options: ratingOptions,
    },
    {
      id: "q3",
      question: "Existe un responsable formal de CX (rol, comité o área) con autoridad para impulsar iniciativas transversales.",
      options: ratingOptions,
    },
    {
      id: "q4",
      question: "Los colaboradores reciben formación continua en habilidades y prácticas relacionadas con la experiencia del cliente.",
      options: ratingOptions,
    },
    {
      id: "q5",
      question: "Los equipos cuentan con autonomía y herramientas para resolver necesidades del cliente en el primer contacto.",
      options: ratingOptions,
    },
  ],
  // Dimensión 2 (continuación) + Dimensión 3: Procesos y Customer Journey
  [
    {
      id: "q6",
      question: "La cultura organizacional promueve comportamientos orientados a la empatía, el servicio y la solución de problemas.",
      options: ratingOptions,
    },
    {
      id: "q7",
      question: "Los procesos de atención están documentados, actualizados y se aplican de manera consistente.",
      options: ratingOptions,
    },
    {
      id: "q8",
      question: "La organización gestiona el Customer Journey de forma integral en todos los canales y etapas.",
      options: ratingOptions,
    },
    {
      id: "q9",
      question: "Los clientes obtienen soluciones rápidas y efectivas a sus necesidades, sin reprocesos innecesarios.",
      options: ratingOptions,
    },
    {
      id: "q10",
      question: "Contamos con herramientas tecnológicas (CRM, VOC, Analytics, etc.) que soportan de manera integrada la gestión de CX.",
      options: ratingOptions,
    },
  ],
  // Dimensión 4: Tecnología, Data & Insights + Dimensión 5: Métricas
  [
    {
      id: "q11",
      question: "La organización utiliza datos e información del cliente para anticipar necesidades y tomar decisiones.",
      options: ratingOptions,
    },
    {
      id: "q12",
      question: "Los equipos cuentan con insights claros, oportunos y accionables para mejorar la experiencia.",
      options: ratingOptions,
    },
    {
      id: "q13",
      question: "Los indicadores de CX (NPS, CSAT, CES u otros) se miden de forma sistemática, se comunican y generan acciones de mejora.",
      options: ratingOptions,
    },
    {
      id: "q14",
      question: "Los resultados de CX muestran una evolución positiva en los últimos años o trimestres.",
      options: ratingOptions,
    },
  ],
];

const sectores = [
  "Banca y Servicios Financieros",
  "Seguros",
  "Telecomunicaciones",
  "Retail / Comercio",
  "Salud",
  "Educación",
  "Tecnología / Software",
  "Manufactura",
  "Energía y Utilities",
  "Transporte y Logística",
  "Gobierno / Sector Público",
  "Hotelería y Turismo",
  "Otro",
];

const tamanosEmpresa = [
  "1-50 empleados",
  "51-200 empleados",
  "201-500 empleados",
  "501-1000 empleados",
  "1001-5000 empleados",
  "Más de 5000 empleados",
];

const canalesAtencionOpciones = [
  "Teléfono",
  "Email",
  "Chat en vivo",
  "WhatsApp",
  "Redes sociales",
  "Presencial",
  "App móvil",
  "Portal web / Autoservicio",
];

const volumenesInteraccion = [
  "Menos de 1,000",
  "1,000 - 5,000",
  "5,001 - 20,000",
  "20,001 - 50,000",
  "50,001 - 100,000",
  "Más de 100,000",
];

export const CXQuizForm = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [contactData, setContactData] = useState<ContactFormData>({
    nombreCompleto: "",
    cargo: "",
    correoCorporativo: "",
    numeroContacto: "",
    nombreEmpresa: "",
    paisCiudad: "",
    sector: "",
    tamanoEmpresa: "",
    canalesAtencion: "",
    volumenMensual: "",
    existeAreaCX: "",
    mayorRetoCX: "",
    autorizacionDatos: false,
    permisoContacto: false,
  });

  const totalQuizPages = quizData.length;
  const totalPages = totalQuizPages + 1; // +1 for contact form
  const currentQuestions = currentPage < totalQuizPages ? quizData[currentPage] : [];
  const progress = ((currentPage + 1) / totalPages) * 100;

  // Create session on first render
  useEffect(() => {
    const createSession = async () => {
      const { data, error } = await supabase
        .from("quiz_sessions")
        .insert({ ultima_seccion: 0, avance_porcentaje: 0, total_secciones: totalPages })
        .select("id")
        .maybeSingle();
      if (!error && data) {
        setSessionId(data.id);
      }
    };
    createSession();
  }, []);

  // Update session progress whenever page changes
  useEffect(() => {
    if (!sessionId) return;
    const avance = Math.round((currentPage / totalPages) * 100);
    supabase
      .from("quiz_sessions")
      .update({
        ultima_seccion: currentPage,
        avance_porcentaje: avance,
        respuestas_parciales: answers,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .then();
  }, [currentPage, sessionId]);

  // Auto-scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentPage, showResults]);

  const handleAnswerChange = (questionId: string, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleContactChange = (field: keyof ContactFormData, value: string | boolean) => {
    setContactData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isPageComplete = () => {
    if (currentPage < totalQuizPages) {
      return currentQuestions.every((q) => answers[q.id] !== undefined);
    }
    return false;
  };

  const isContactFormValid = () => {
    return (
      contactData.nombreCompleto.trim() !== "" &&
      contactData.cargo.trim() !== "" &&
      contactData.correoCorporativo.trim() !== "" &&
      contactData.numeroContacto.trim() !== "" &&
      contactData.nombreEmpresa.trim() !== "" &&
      contactData.paisCiudad.trim() !== "" &&
      contactData.sector !== "" &&
      contactData.tamanoEmpresa !== "" &&
      contactData.autorizacionDatos === true
    );
  };

  const handleNext = () => {
    if (currentPage < totalQuizPages - 1) {
      setCurrentPage((prev) => prev + 1);
    } else if (currentPage === totalQuizPages - 1) {
      setShowContactForm(true);
      setCurrentPage(totalQuizPages);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      if (currentPage === totalQuizPages) {
        setShowContactForm(false);
      }
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isContactFormValid()) return;

    const cxiqIndex = calculateCXIQIndex();
    const maturity = getMaturityLevel(cxiqIndex);
    const quizResponseId = crypto.randomUUID();

    const { error } = await supabase.from("quiz_responses").insert({
      id: quizResponseId,
      nombre_completo: contactData.nombreCompleto,
      cargo: contactData.cargo,
      correo_corporativo: contactData.correoCorporativo,
      numero_contacto: contactData.numeroContacto,
      nombre_empresa: contactData.nombreEmpresa,
      pais_ciudad: contactData.paisCiudad,
      sector: contactData.sector,
      tamano_empresa: contactData.tamanoEmpresa,
      canales_atencion: contactData.canalesAtencion || null,
      volumen_mensual: contactData.volumenMensual || null,
      existe_area_cx: contactData.existeAreaCX || null,
      mayor_reto_cx: contactData.mayorRetoCX || null,
      autorizacion_datos: contactData.autorizacionDatos,
      permiso_contacto: contactData.permisoContacto,
      answers: answers,
      cxiq_index: parseFloat(cxiqIndex.toFixed(1)),
      maturity_level: maturity.nivel,
      maturity_label: maturity.etiqueta,
    });

    if (error) {
      console.error("Error saving quiz response:", error);
      toast.error("Hubo un error al guardar tus respuestas. Intenta de nuevo.");
      return;
    }

    // Mark session as complete
    if (sessionId) {
      await supabase
        .from("quiz_sessions")
        .update({
          estado: "completo",
          avance_porcentaje: 100,
          ultima_seccion: totalPages,
          quiz_response_id: quizResponseId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
    }

    setShowResults(true);
  };

  const calculateScore = () => {
    let total = 0;
    let maxScore = 0;

    quizData.forEach((page) => {
      page.forEach((question) => {
        const answer = answers[question.id];
        if (answer !== undefined) {
          total += answer;
          maxScore += 5;
        }
      });
    });

    return { total, maxScore };
  };

  const getMaturityLevel = (cxiqIndex: number) => {
    if (cxiqIndex >= 8.5) return {
      nivel: 5,
      etiqueta: "Líder",
      descripcion: "CX como ventaja competitiva; datos, cultura y procesos consolidados.",
      interpretacion: "Tu organización ha alcanzado el nivel máximo de madurez en Customer Experience. CX es una ventaja competitiva real, con datos, cultura y procesos completamente consolidados. Continúa innovando para mantener tu liderazgo.",
      color: "text-emerald-500"
    };
    if (cxiqIndex >= 6.5) return {
      nivel: 4,
      etiqueta: "Avanzado",
      descripcion: "Buen nivel de madurez; CX integrado en procesos clave.",
      interpretacion: "Tu organización demuestra capacidades sólidas en Customer Experience, con una integración adecuada entre estrategia, procesos y datos. Aún existen oportunidades en áreas específicas que pueden llevarte al nivel \"Líder\" en los próximos meses.",
      color: "text-primary"
    };
    if (cxiqIndex >= 5.0) return {
      nivel: 3,
      etiqueta: "Intermedio",
      descripcion: "Existen prácticas de CX, pero con brechas claras y poca sistematicidad.",
      interpretacion: "Tu organización cuenta con prácticas de CX establecidas, pero existen brechas importantes que limitan su efectividad. Enfócate en sistematizar procesos y cerrar las brechas identificadas para avanzar al siguiente nivel.",
      color: "text-amber-500"
    };
    if (cxiqIndex >= 2.5) return {
      nivel: 2,
      etiqueta: "Fundacional",
      descripcion: "Se reconocen los elementos de CX, pero sin integración o consistencia.",
      interpretacion: "Tu organización reconoce la importancia del Customer Experience, pero los esfuerzos aún carecen de integración y consistencia. Es momento de formalizar la estrategia y alinear los equipos en torno a objetivos comunes de CX.",
      color: "text-orange-500"
    };
    return {
      nivel: 1,
      etiqueta: "Inicial",
      descripcion: "No existe estructura formal de CX; esfuerzos aislados.",
      interpretacion: "Tu organización se encuentra en una etapa inicial de madurez en CX. No existe una estructura formal y los esfuerzos son aislados. Este es el momento ideal para comenzar a construir las bases de una estrategia de Customer Experience.",
      color: "text-red-500"
    };
  };

  const calculateCXIQIndex = () => {
    const { total, maxScore } = calculateScore();
    const minPossibleScore = 14;
    const adjustedTotal = total - minPossibleScore;
    const adjustedMax = maxScore - minPossibleScore;
    return (adjustedTotal / adjustedMax) * 10;
  };

  const handleRestart = () => {
    setCurrentPage(0);
    setAnswers({});
    setShowResults(false);
    setShowContactForm(false);
    setContactData({
      nombreCompleto: "",
      cargo: "",
      correoCorporativo: "",
      numeroContacto: "",
      nombreEmpresa: "",
      paisCiudad: "",
      sector: "",
      tamanoEmpresa: "",
      canalesAtencion: "",
      volumenMensual: "",
      existeAreaCX: "",
      mayorRetoCX: "",
      autorizacionDatos: false,
      permisoContacto: false,
    });
  };

  if (showResults) {
    const cxiqIndex = calculateCXIQIndex();
    const maturity = getMaturityLevel(cxiqIndex);

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl shadow-2xl animate-in fade-in-50 duration-500 border-primary/20">
          <CardHeader className="text-center space-y-6 pb-8 bg-gradient-to-br from-primary/10 to-transparent">
            <CardTitle className="text-3xl md:text-4xl font-bold text-foreground">
              ¡Gracias, {contactData.nombreCompleto.split(' ')[0]}!
            </CardTitle>
            <p className="text-lg text-muted-foreground">
              Hemos recibido tus datos y tu diagnóstico CX-IQ 2.0 está listo.
            </p>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            <div className="flex justify-center">
              <img 
                src={maxLogo} 
                alt="MAX CX" 
                className="w-48 h-48 object-contain animate-in zoom-in-50 duration-500"
              />
            </div>

            {/* CX-IQ Index Results */}
            <div className="text-center space-y-6 p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
              <div className="space-y-2">
                <p className="text-lg text-muted-foreground">CX-IQ Index</p>
                <p className={cn("text-5xl md:text-6xl font-bold", maturity.color)}>
                  {cxiqIndex.toFixed(1)} <span className="text-2xl text-muted-foreground">/ 10</span>
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-lg text-muted-foreground">Nivel de Madurez</p>
                <div className="flex items-center justify-center gap-3">
                  <span className={cn("text-3xl md:text-4xl font-bold", maturity.color)}>
                    Nivel {maturity.nivel}:
                  </span>
                  <span className={cn("text-3xl md:text-4xl font-bold", maturity.color)}>
                    {maturity.etiqueta}
                  </span>
                </div>
                <p className="text-base text-muted-foreground mt-2">
                  {maturity.descripcion}
                </p>
              </div>

              {/* Maturity Scale Indicator */}
              <div className="pt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Inicial</span>
                  <span>Fundacional</span>
                  <span>Intermedio</span>
                  <span>Avanzado</span>
                  <span>Líder</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 transition-all duration-700"
                    style={{ width: `${(cxiqIndex / 10) * 100}%` }}
                  />
                </div>
              </div>

              {/* Interpretation */}
              <div className="pt-6 border-t border-border/50 mt-6">
                <p className="text-sm font-semibold text-muted-foreground mb-3">Interpretación</p>
                <p className="text-base md:text-lg text-foreground leading-relaxed italic">
                  "{maturity.interpretacion}"
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center space-y-4 p-6 rounded-xl bg-card border border-border/50">
              <p className="text-lg md:text-xl font-semibold text-primary">
                Un especialista de nuestro equipo puede apoyarte
              </p>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Te ofrecemos una lectura más profunda, un benchmark por industria y una hoja de ruta priorizada según tus resultados.
              </p>
            </div>

            <div className="flex flex-col gap-4 pt-6">
              <Button
                onClick={() => window.open('https://calendly.com/thecxacademy/llamada-introduccion-clone', '_blank')}
                className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Agendar una conversación personalizada
              </Button>
              <Button
                onClick={handleRestart}
                variant="outline"
                className="w-full h-14 text-lg border-primary/20 hover:bg-primary/10"
              >
                Realizar nueva evaluación
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Contact Form Page
  if (showContactForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <img src={logo} alt="The CX Academy" className="h-16 md:h-20 object-contain" />
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Paso {currentPage + 1} de {totalPages}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-8 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-start justify-center px-6 pb-12 pt-6">
          <div className="w-full max-w-3xl space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-relaxed">
                Agenda una reunión con uno de nuestros CX Expert
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Para generar tu diagnóstico personalizado, necesitamos algunos datos
              </p>
            </div>

            <div className="space-y-8">
              {/* Sección 1 - Identificación */}
              <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-primary/10 space-y-4">
                <h2 className="text-xl font-semibold text-primary">Identificación</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nombreCompleto">Nombre completo *</Label>
                    <Input
                      id="nombreCompleto"
                      value={contactData.nombreCompleto}
                      onChange={(e) => handleContactChange("nombreCompleto", e.target.value)}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo *</Label>
                    <Input
                      id="cargo"
                      value={contactData.cargo}
                      onChange={(e) => handleContactChange("cargo", e.target.value)}
                      placeholder="Tu cargo en la empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="correoCorporativo">Correo corporativo *</Label>
                    <Input
                      id="correoCorporativo"
                      type="email"
                      value={contactData.correoCorporativo}
                      onChange={(e) => handleContactChange("correoCorporativo", e.target.value)}
                      placeholder="correo@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numeroContacto">Número de contacto móvil *</Label>
                    <Input
                      id="numeroContacto"
                      value={contactData.numeroContacto}
                      onChange={(e) => handleContactChange("numeroContacto", e.target.value)}
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2 - Empresa */}
              <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-primary/10 space-y-4">
                <h2 className="text-xl font-semibold text-primary">Empresa</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nombreEmpresa">Nombre de la empresa *</Label>
                    <Input
                      id="nombreEmpresa"
                      value={contactData.nombreEmpresa}
                      onChange={(e) => handleContactChange("nombreEmpresa", e.target.value)}
                      placeholder="Nombre de tu empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paisCiudad">País / Ciudad *</Label>
                    <Input
                      id="paisCiudad"
                      value={contactData.paisCiudad}
                      onChange={(e) => handleContactChange("paisCiudad", e.target.value)}
                      placeholder="Colombia / Bogotá"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sector">Sector *</Label>
                    <Select
                      value={contactData.sector}
                      onValueChange={(value) => handleContactChange("sector", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectores.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tamanoEmpresa">Tamaño de empresa *</Label>
                    <Select
                      value={contactData.tamanoEmpresa}
                      onValueChange={(value) => handleContactChange("tamanoEmpresa", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tamaño" />
                      </SelectTrigger>
                      <SelectContent>
                        {tamanosEmpresa.map((tamano) => (
                          <SelectItem key={tamano} value={tamano}>
                            {tamano}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Sección 3 - Contexto CX */}
              <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-primary/10 space-y-4">
                <h2 className="text-xl font-semibold text-primary">Contexto CX</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="canalesAtencion">Canales de atención principales</Label>
                    <Select
                      value={contactData.canalesAtencion}
                      onValueChange={(value) => handleContactChange("canalesAtencion", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el canal principal" />
                      </SelectTrigger>
                      <SelectContent>
                        {canalesAtencionOpciones.map((canal) => (
                          <SelectItem key={canal} value={canal}>
                            {canal}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="volumenMensual">Volumen mensual de interacciones</Label>
                    <Select
                      value={contactData.volumenMensual}
                      onValueChange={(value) => handleContactChange("volumenMensual", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rango" />
                      </SelectTrigger>
                      <SelectContent>
                        {volumenesInteraccion.map((volumen) => (
                          <SelectItem key={volumen} value={volumen}>
                            {volumen}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="existeAreaCX">¿Existe un área formal de CX?</Label>
                    <Select
                      value={contactData.existeAreaCX}
                      onValueChange={(value) => handleContactChange("existeAreaCX", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sí, existe un área dedicada</SelectItem>
                        <SelectItem value="parcial">Parcialmente, hay roles pero no un área</SelectItem>
                        <SelectItem value="no">No, no existe formalmente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="mayorRetoCX">Mayor reto de CX actualmente</Label>
                    <Textarea
                      id="mayorRetoCX"
                      value={contactData.mayorRetoCX}
                      onChange={(e) => handleContactChange("mayorRetoCX", e.target.value)}
                      placeholder="Describe brevemente el mayor desafío de CX que enfrenta tu organización..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Sección 4 - Consentimiento */}
              <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-primary/10 space-y-6">
                <h2 className="text-xl font-semibold text-primary">Consentimiento</h2>
                
                {/* Autorización de datos (obligatorio) */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="autorizacionDatos"
                    checked={contactData.autorizacionDatos}
                    onCheckedChange={(checked) => handleContactChange("autorizacionDatos", checked as boolean)}
                    className="mt-1"
                  />
                  <div className="space-y-2">
                    <Label htmlFor="autorizacionDatos" className="text-sm leading-relaxed cursor-pointer">
                      <span className="text-destructive">*</span> Autorizo de manera previa, expresa e informada el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 y sus normas complementarias. Entiendo y acepto que mis datos serán utilizados para: (i) analizar la información de este diagnóstico, (ii) generar reportes relacionados con Customer Experience, (iii) contactarme para compartir resultados, recomendaciones y oportunidades de mejora para mi organización.
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Declaro que conozco mis derechos como titular de datos, entre ellos: conocer, actualizar, rectificar y suprimir mis datos personales. Para más información, consulte nuestra{" "}
                      <a href="#" className="text-primary hover:underline">Política de Tratamiento de Datos Personales</a>.
                    </p>
                  </div>
                </div>

                {/* Permiso de contacto comercial (opcional) */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="permisoContacto"
                    checked={contactData.permisoContacto}
                    onCheckedChange={(checked) => handleContactChange("permisoContacto", checked as boolean)}
                    className="mt-1"
                  />
                  <Label htmlFor="permisoContacto" className="text-sm leading-relaxed cursor-pointer">
                    Acepto recibir comunicaciones relacionadas con diagnósticos, recomendaciones y contenidos de valor sobre Customer Experience, transformación digital y mejores prácticas de servicio.
                  </Label>
                </div>

                {!contactData.autorizacionDatos && (
                  <p className="text-sm text-destructive">
                    * Debes aceptar el tratamiento de datos para ver tus resultados.
                  </p>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center gap-4 pt-8">
              <Button
                onClick={handlePrevious}
                variant="outline"
                size="lg"
                className="px-8 h-14 text-lg border-primary/20 hover:bg-primary/10"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Anterior
              </Button>
              
              <Button
                onClick={handleSubmit}
                size="lg"
                disabled={!isContactFormValid()}
                className="px-8 h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
              >
                Ver mis resultados
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Pages
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background flex flex-col">
      {/* Header with Logo */}
      <div className="p-8 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <img src={logo} alt="The CX Academy" className="h-16 md:h-20 object-contain" />
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Paso {currentPage + 1} de {totalPages}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-center px-6 mb-12">
        <div className="flex items-center gap-3 max-w-2xl w-full">
          {Array.from({ length: totalPages }).map((_, index) => (
            <div key={index} className="flex items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 font-semibold text-sm",
                  index < currentPage
                    ? "bg-primary text-primary-foreground shadow-lg scale-110"
                    : index === currentPage
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg scale-110"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < currentPage ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              {index < totalPages - 1 && (
                <div
                  className={cn(
                    "h-1.5 flex-1 mx-2 transition-all duration-300 rounded-full",
                    index < currentPage ? "bg-primary shadow-sm" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-start justify-center px-6 pb-12">
        <div className="w-full max-w-3xl space-y-12">
          <div className="text-center space-y-4">
            <p className="text-lg font-bold text-muted-foreground">
              {currentPage === 0 ? "Bienvenido a The CX Academy" : "The CX Academy"}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-primary leading-relaxed">
              {currentPage === 0 && "¡Evalúa tu Customer Experience ahora!"}
              {currentPage === 1 && "¡Vas muy bien!"}
              {currentPage === 2 && "¡Ya casi terminas!"}
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              {currentPage === 0 && (
                <>Calcula tu <span className="font-bold text-foreground">CX Score</span> en menos de <span className="font-bold text-foreground">3 minutos</span>, identifica oportunidades de mejora y agenda una <span className="font-bold text-foreground">asesoría estratégica gratuita</span> con nuestros expertos.</>
              )}
              {currentPage === 1 && (
                <>Ya diste el primer paso para descubrir el nivel real de tu Customer Experience. Sigue avanzando para obtener un diagnóstico más preciso.</>
              )}
              {currentPage === 2 && (
                <>Estás a un paso de conocer tu <span className="font-bold text-foreground">CX Score</span> y acceder a una <span className="font-bold text-foreground">asesoría estratégica gratuita</span> con nuestros expertos.</>
              )}
            </p>
          </div>

          <div className="space-y-10">
            {currentQuestions.map((question, index) => {
              const questionNumber = quizData.slice(0, currentPage).reduce((acc, page) => acc + page.length, 0) + index + 1;
              
              return (
                <div
                  key={question.id}
                  className="space-y-5 animate-in fade-in-50 duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-primary/10">
                    <h3 className="text-xl font-semibold text-foreground leading-relaxed">
                      <span className="text-primary font-bold">{questionNumber}.</span> {question.question}
                    </h3>
                  </div>
                  <div className="flex items-center justify-center gap-2 sm:gap-4">
                    <span className="text-xs text-muted-foreground hidden sm:block">En total desacuerdo</span>
                    {question.options.map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        onClick={() => handleAnswerChange(question.id, option.value)}
                        className={cn(
                          "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-200 border-2",
                          answers[question.id] === option.value
                            ? "bg-primary text-primary-foreground border-primary shadow-xl scale-110"
                            : "bg-card text-foreground border-border hover:border-primary hover:scale-105 hover:shadow-lg"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                    <span className="text-xs text-muted-foreground hidden sm:block">Totalmente de acuerdo</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center gap-4 pt-8">
            <Button
              onClick={handlePrevious}
              variant="outline"
              size="lg"
              disabled={currentPage === 0}
              className="px-8 h-14 text-lg disabled:opacity-50 border-primary/20 hover:bg-primary/10"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Anterior
            </Button>
            
            {isPageComplete() && (
              <Button
                onClick={handleNext}
                size="lg"
                className="px-8 h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg animate-in fade-in-50 duration-300"
              >
                {currentPage === totalQuizPages - 1 ? "Continuar" : "Siguiente"}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

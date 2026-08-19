import { StoreEvaluation } from '../types';
import { getCriterionStatus } from './criteria';

export const IVOO_7_EVALUATIONS: StoreEvaluation[] = [
  // 1. IVOO AV. DELICIAS (MARACAIBO) — SANTIAGO (76/100 · BUENO)
  {
    id: 'ivoo-delicias-09-07',
    identifier: 'IVOO DELICIAS MARACAIBO 09.07.2026',
    storeName: 'IVOO Av. Delicias (Maracaibo)',
    brand: 'IVOO',
    brandCategory: 'IVOO',
    city: 'Maracaibo',
    seller: 'Santiago',
    recordingDate: '9 de julio de 2026',
    duration: '11 min 17 seg',
    score: 76,
    level: 'Bueno',
    saleClosed: false,
    contactCaptured: true,
    productEvaluated: 'Televisor Siragon (40" $225 / 43") y Aire Acondicionado Split (18.000 BTU Inverter R32 $590)',
    narrativeSummary:
      'Segunda mejor atención del lote de julio. Santiago (asesor) realizó una asesoría consultiva completa sobre TV y aire acondicionado, con comparación honesta entre marcas y cálculo exacto de un combo con Cashea (inicial de 326 + 12 cuotas de 40). Ofreció apartar la mercancía y entregó su número personal para cerrar al día siguiente. Puntos pendientes: el personal de seguridad no saludó ni a la entrada ni a la salida, y no se intentó un cierre inmediato.',
    criteriaBreakdown: [
      {
        criterionId: 'saludo',
        criterionName: 'Saludo y bienvenida',
        score: 6,
        maxScore: 10,
        observation:
          'El asesor Santiago abordó al cliente de forma natural apenas cruzó hacia la tienda, pero el personal de seguridad no dio la bienvenida ni al entrar ni al salir, pese a que el cliente buscó contacto visual con él.',
        status: getCriterionStatus(6, 10),
      },
      {
        criterionId: 'necesidades',
        criterionName: 'Detección de necesidades',
        score: 7,
        maxScore: 10,
        observation:
          'Preguntó pulgadas de TV y tamaño del cuarto antes de recomendar el aire acondicionado (3,5x3,5 m, opción de 18.000 BTU), aunque no profundizó en el presupuesto total antes de mostrar productos.',
        status: getCriterionStatus(7, 10),
      },
      {
        criterionId: 'conocimiento',
        criterionName: 'Conocimiento de producto',
        score: 13,
        maxScore: 15,
        observation:
          'Explicó con solidez las diferencias entre Siragon, Alwa y Sony, justificando por qué Siragon mantiene mejor relación calidad-precio, y detalló la tecnología Inverter y el refrigerante R32 del aire.',
        status: getCriterionStatus(13, 15),
      },
      {
        criterionId: 'opciones',
        criterionName: 'Presentación de opciones',
        score: 12,
        maxScore: 15,
        observation:
          'Mostró alternativas de TV (40" y 43") y de aire (18 y 24 BTU), armando un combo TV + aire a solicitud del cliente con cálculo conjunto.',
        status: getCriterionStatus(12, 15),
      },
      {
        criterionId: 'cierre',
        criterionName: 'Técnica de venta y cierre',
        score: 8,
        maxScore: 15,
        observation:
          'Calculó el combo completo con cifras exactas, pero no cerró la venta en el momento; ofreció apartar la mercancía para el día siguiente, dejando la decisión pendiente de la esposa del cliente.',
        status: getCriterionStatus(8, 15),
      },
      {
        criterionId: 'financiamiento',
        criterionName: 'Manejo de financiamiento',
        score: 9,
        maxScore: 10,
        observation:
          'Detalló con precisión los niveles de Cashea (0% inicial a 3 cuotas para nivel 6, 20% inicial como alternativa), los umbrales por monto (6, 9 y 12 cuotas) y el procedimiento de terceros con declaración jurada.',
        status: getCriterionStatus(9, 10),
      },
      {
        criterionId: 'actitud',
        criterionName: 'Actitud y amabilidad',
        score: 9,
        maxScore: 10,
        observation:
          'Mantuvo contacto visual con el cliente mientras atendía a otra persona, sin dejarlo desatendido; trato cordial y profesional durante todo el recorrido.',
        status: getCriterionStatus(9, 10),
      },
      {
        criterionId: 'despedida',
        criterionName: 'Despedida y seguimiento',
        score: 8,
        maxScore: 10,
        observation:
          'Se despidió cordialmente y entregó su número personal para coordinar la compra al día siguiente, aunque no propuso enviar una cotización escrita.',
        status: getCriterionStatus(8, 10),
      },
      {
        criterionId: 'proactividad',
        criterionName: 'Proactividad comercial',
        score: 4,
        maxScore: 5,
        observation:
          'Ofreció apartar la mercancía y dio seguimiento proactivo mediante su número personal para cerrar la compra al día siguiente.',
        status: getCriterionStatus(4, 5),
      },
    ],
    strengths: [
      'Asesoría consultiva completa: combo TV + aire calculado con cifras exactas de inicial y cuotas.',
      'Comparación honesta entre marcas (Siragon vs. Alwa vs. Sony) con justificación técnica.',
      'Acompañamiento visual constante al cliente incluso mientras atendía a otra persona.',
      'Entregó su número personal y ofreció apartar mercancía para cerrar al día siguiente.',
    ],
    criticalAreas: [
      'Seguridad no saludó ni a la entrada ni a la salida, generando una primera y última impresión débil.',
      'No se intentó un cierre en el momento pese al alto nivel de interés del cliente.',
      'No se sondeó el presupuesto total antes de iniciar la presentación de productos.',
    ],
    recommendations: [
      'Reforzar el protocolo de bienvenida y despedida del personal de seguridad en todas las tiendas.',
      'Capacitar en cierre asistido cuando el cliente muestra alto interés y ya tiene cifras claras.',
      'Ofrecer siempre el envío de cotización por WhatsApp como respaldo del apartado verbal.',
    ],
    transcript: [
      {
        speaker: 'Mystery Shopper',
        text: 'Buenas tardes, mi nombre es Elías Gordoña, procedo a hacer el recorrido por la tienda IVOO, ubicada en la avenida 15 Delicias, cuando son las 5 y 2 de la tarde del jueves 9 de julio.',
      },
      {
        speaker: 'Ambiente',
        text: '[Narración de apertura del mystery shopper mientras cruza hacia la tienda]',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Hermano, estoy ubicando precios de televisores.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: '¿De cuántas pulgadas estás buscando?',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Estoy interesado entre 40 y 43. ¿Qué tienes disponible?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'Tengo marca Siragon: uno de 40 pulgadas en 225, y uno de 43. Eso es lo que tengo de esa marca.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Y qué otra marca tienes disponible? ¿Ese es más caro que Siragon?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'Ese modelo, a diferencia de Siragon, no es una marca que nosotros respaldamos con garantía propia. Siragon siempre está en promoción, por eso es más económico; si no, tendría mucho más precio. El Alwa está ahorita en 300, el de 40, es más caro.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Ustedes trabajan de la mano con Siragon, entonces.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'Por eso los mejores precios siempre los vas a conseguir acá en Siragon y Sony. Siragon es la principal marca, la que maneja el mejor tipo de pantalla; la calidad de los colores es mucho mejor que Sony, en la parte de los píxeles.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Aquí no tienen Samsung, disculpa.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'No, ahorita no tienen disponible. Tengo otras marcas, como TCL, pero de 32 pulgadas.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Qué nombre es, disculpa?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'Santiago.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Santiago. Con el tema de Cashea, estuve viendo una publicación por Instagram que está con el cero inicial.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'Sí, eso es para nivel 6.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Qué nivel es usted?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'Es mi esposa, ella es nivel 6. Con la opción de cero por ciento inicial sería a tres cuotas, y debe tener crédito suficiente para cubrir la totalidad del producto. Eso era hasta el 30, pero lo extendieron hasta mañana.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Con el cero por ciento inicial, cuál es la otra modalidad?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'La otra modalidad es con el 20 por ciento inicial y tres cuotas. Para optar a más cuotas: factura mayor a 300 dólares, seis cuotas; mayor a 450, nueve cuotas; y mayor a 600, doce cuotas.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Vamos a hacer un cálculo, porque estoy interesado en un televisor y un aire. ¿Qué aire tienes disponible?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'De ventana tengo uno pequeño; de split tengo 18 y 24 mil BTU.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'El cuarto es cuatro por cuatro.',
      },
      {
        speaker: 'Ambiente',
        text: '[Ruido de ambiente y pasos mientras se desplazan por la tienda]',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'El de 18 mil BTU tengo ahorita con tecnología Inverter, refrigerante R32. Este te queda en 590.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Entonces, por lo menos esto más el televisor de 40... ¿cuánto sería el inicial?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'Te voy a hacer el cálculo por las dos cosas: 815 en total. El inicial sería el 40%, que son 326. Con eso sacas el inicial y el resto te queda a 12 cuotas de 40.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Tiene que estar mi esposa presente, me imagino, para eso.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'Sí, ella tiene que venir con su Cashea.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Ustedes están acá hasta las 8? Creo que sería ya para mañana, porque estoy un poquito lejos.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'Para mañana, si quieres, te doy mi número por cualquier cambio, o yo puedo apartarles la mercancía para cuando vengan a facturar. 0424-369-8-99. Coloca Santiago, Ivo.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Y una pregunta, Santiago, ¿sistema de apartado no tienen?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'Solamente en el sentido de que tú facturas la mercancía y puedes dejarla apartada aquí porque no tienes cómo llevártela. Ese es el único apartado que se hace.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Bueno, voy a ver unas cositas allá arriba, creo que hay congeladores, ¿verdad?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'Sí.',
      },
      {
        speaker: 'Ambiente',
        text: '[El cliente se aleja a revisar exhibidores mientras Santiago atiende a otro cliente]',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'El joven Santiago se ha puesto bastante atento, me ha acompañado en el recorrido y ha sido muy específico en la parte de los televisores y los aires. Me alejé un poquito mientras él atiende a una persona, pero me está haciendo seguimiento con la vista.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Santiago, ¿exhibidores tienen disponible?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'Ese modelo tengo, es un pequeñito de 50 litros.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Estoy buscando uno más grandecito.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'No sé cuánto... tiene rato que no llega uno más grande. Congeladores tipo exhibidor tampoco los tienen disponible ahorita.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Cuánto tiempo de garantía tienen por esta marca, por Sunnyview?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'Contamos con un año completo por servicio técnico y reparación. Los primeros 15 días son de prueba: los pruebas en tu casa y si tienen algún defecto, se cambian de inmediato aquí por tienda. Contamos con repuestos originales y servicio técnico especializado.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Bueno, entonces lo que voy a hacer, Santiago, es cuadrar con mi esposo para venir por acá mañana.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Santiago',
        text: 'Aquí tiene que ser el mismo titular del Cashea, porque va a salir el nombre y tiene que coincidir. Sería que me pasen el celular y me den un avance efectivo; las cuotas tienen que ser en bolívares.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Bueno, Santiago, muchísimas gracias. Ya tengo tu número, posiblemente te escriba ahora.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Me estoy retirando de la tienda. El recorrido fue bastante satisfactorio; la tienda está moderadamente con clientes.',
      },
      {
        speaker: 'Seguridad',
        text: '[Al salir de la tienda: El personal de seguridad no dio la bienvenida, estaba entretenido hablando; tampoco al entrar me hizo el gesto de bienvenida ni de saludo]',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Doy por terminado el recorrido en la tienda IVOO Las Delicias.',
      },
    ],
    ambientNotes: 'Audio grabado el 9 de julio de 2026. Duración: 11 min 17 seg. Archivo: IVOO DELICIAS MARACAIBO 09.07.2026.',
    audioDriveId: '1-NHd9Mwj6Gtr5uYe5DvA9ET7aLJDymwr',
    audioUrl: 'https://drive.google.com/file/d/1-NHd9Mwj6Gtr5uYe5DvA9ET7aLJDymwr/view',
    verificationStatus: 'verified',
  },

  // 2. IVOO PUERTO LA CRUZ — LEONERI (64/100 · REGULAR)
  {
    id: 'ivoo-puerto-la-cruz-11-07',
    identifier: 'IVOO PUERTO LA CRUZ 11.07.2026',
    storeName: 'IVOO Puerto La Cruz',
    brand: 'IVOO',
    brandCategory: 'IVOO',
    city: 'Puerto La Cruz',
    seller: 'Leoneri',
    recordingDate: '11 de julio de 2026',
    duration: '5 min 34 seg',
    score: 64,
    level: 'Regular',
    saleClosed: false,
    contactCaptured: true,
    productEvaluated: 'Aires Acondicionados Sunnyview 100% Cobre ($550 / $470 / $412)',
    narrativeSummary:
      'Atención cálida y personalizada centrada en aire acondicionado, con manejo sólido de financiamiento (Cashea nivel 3, divisa y contado). Como la decisión de compra correspondía a la madre de la clienta, ausente en la visita, el asesor entregó proactivamente su número y prometió avisar sobre nuevo inventario. No hubo cierre por la ausencia del decisor, y el nombre del asesor presenta una ambigüedad en el audio.',
    criteriaBreakdown: [
      {
        criterionId: 'saludo',
        criterionName: 'Saludo y bienvenida',
        score: 6,
        maxScore: 10,
        observation:
          'La atención inició de forma directa sobre el producto sin un saludo de bienvenida explícito registrado en el audio, aunque el tono fue cordial desde el primer intercambio.',
        status: getCriterionStatus(6, 10),
      },
      {
        criterionId: 'necesidades',
        criterionName: 'Detección de necesidades',
        score: 5,
        maxScore: 10,
        observation:
          'El asesor respondió a las preguntas de la clienta sobre el tamaño del espacio (4x4 aproximado), pero no indagó proactivamente el uso ni confirmó medidas exactas antes de cotizar.',
        status: getCriterionStatus(5, 10),
      },
      {
        criterionId: 'conocimiento',
        criterionName: 'Conocimiento de producto',
        score: 9,
        maxScore: 15,
        observation:
          'Explicó diferencias entre modelos de aire de ventana y split, mencionando materiales (100% cobre) y precios, aunque sin profundizar en eficiencia energética o garantía.',
        status: getCriterionStatus(9, 15),
      },
      {
        criterionId: 'opciones',
        criterionName: 'Presentación de opciones',
        score: 10,
        maxScore: 15,
        observation:
          'Presentó al menos tres opciones de aire acondicionado en distintos rangos de precio (150, 470 y 550 dólares) y ventana vs. split según el espacio disponible.',
        status: getCriterionStatus(10, 15),
      },
      {
        criterionId: 'cierre',
        criterionName: 'Técnica de venta y cierre',
        score: 6,
        maxScore: 15,
        observation:
          'No hubo cierre porque la decisión final correspondía a la madre de la clienta, ausente en la visita; el asesor aceptó esto sin proponer una alternativa de cierre parcial (reserva o cotización formal).',
        status: getCriterionStatus(6, 15),
      },
      {
        criterionId: 'financiamiento',
        criterionName: 'Manejo de financiamiento',
        score: 8,
        maxScore: 10,
        observation:
          'Explicó precios en divisas, contado y Cashea (nivel 3, 40% inicial + 6 cuotas) con cifras concretas para cada modalidad.',
        status: getCriterionStatus(8, 10),
      },
      {
        criterionId: 'actitud',
        criterionName: 'Actitud y amabilidad',
        score: 9,
        maxScore: 10,
        observation:
          'Trato cálido y cercano ("mi corazón"), con disposición genuina a que la madre de la clienta se beneficiara de la información.',
        status: getCriterionStatus(9, 10),
      },
      {
        criterionId: 'despedida',
        criterionName: 'Despedida y seguimiento',
        score: 7,
        maxScore: 10,
        observation:
          'Entregó su número telefónico para que la madre de la clienta llamara directamente y prometió avisar cuando llegara nuevo inventario a precio más accesible.',
        status: getCriterionStatus(7, 10),
      },
      {
        criterionId: 'proactividad',
        criterionName: 'Proactividad comercial',
        score: 4,
        maxScore: 5,
        observation:
          'Ofreció proactivamente avisar sobre la llegada de nueva mercancía a un precio de referencia (~12 dólares) y facilitó su contacto sin que se lo pidieran.',
        status: getCriterionStatus(4, 5),
      },
    ],
    strengths: [
      'Buen manejo de financiamiento con cifras exactas en tres modalidades (contado, divisa, Cashea).',
      'Proactividad genuina: ofreció seguimiento y aviso de nuevo inventario sin que se lo solicitaran.',
      'Trato cálido y personalizado, generando cercanía con la clienta.',
    ],
    criticalAreas: [
      'No hubo sondeo de necesidades más allá de las preguntas directas de la clienta.',
      'Al no estar presente la decisora final, no se propuso una alternativa de cierre parcial (reserva, cotización formal por escrito).',
    ],
    recommendations: [
      'Enviar cotización formal por WhatsApp cuando el decisor de compra no esté presente, para facilitar el cierre remoto.',
      'Reforzar el sondeo de necesidades con preguntas específicas de uso y presupuesto.',
      'Verificar y estandarizar el registro de nombres del personal para evitar ambigüedades en las evaluaciones.',
    ],
    transcript: [
      {
        speaker: 'Mystery Shopper',
        text: 'Buenas tardes, por acá Oriénis Amaricua. Hoy 11 de julio, a la 1:35 de la tarde, me encuentro en IVOO Puerto La Cruz para hacer el estudio.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Un aproximado de 4x4, porque realmente no lo he medido. También podría ser de ventana.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Leoneri',
        text: 'Por lo menos este tiene un precio de 550 dólares, marca Sunnyview, 100% de cobre. También tienes otro modelo en 470.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Y ustedes tienen descuentos en divisa?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Leoneri',
        text: 'Al contado, en divisa, igual: te quedaría en 470, o en 412 con el descuento.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Y ustedes cuentan con Cashea?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Leoneri',
        text: 'También; creo que es el nivel 3. Te lo podrías llevar con un inicial del 40% y 6 cuotas.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Los otros que me mostraste, de ventana, son súper más grandes; y por el espacio que tengo...',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Leoneri',
        text: 'Como dice el compañero, uno de 12.000 o 18.000 BTU manda más.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Me parece muy bien, la verdad. Lo he buscado para mi mamá, que es la que realmente está interesada; me iré a comprarlo.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Leoneri',
        text: 'Si quieres, me indicas tu nombre y yo le digo a tu mamá que te atendí, para que te busque. Dame tu número.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '[da su número de contacto: 0424-839-0371]',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Leoneri',
        text: 'Se lo das a la señora y va a poner lo que me pida para agregarlo. También, si de repente no se decide ahora, puede pasar más adelante; si agota o llega uno a 12 dólares, te aviso.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Buenísimo, claro.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Leoneri',
        text: 'Leoneri, para que me busques más rápido si necesitas algo.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Muchísimas gracias, mi corazón.',
      },
    ],
    ambientNotes: 'Audio grabado el 11 de julio de 2026. Duración: 5 min 34 seg. Archivo: IVOO PUERTO LA CRUZ 11.07.2026.',
    audioDriveId: '1-NHd9Mwj6Gtr5uYe5DvA9ET7aLJDymwr',
    audioUrl: 'https://drive.google.com/file/d/1-NHd9Mwj6Gtr5uYe5DvA9ET7aLJDymwr/view',
    verificationStatus: 'verified',
  },

  // 3. IVOO CABIMAS (C.C. COSTA MALL, MARACAIBO) — SAMUEL MATOS (60/100 · REGULAR)
  {
    id: 'ivoo-cabimas-08-07',
    identifier: 'IVOO CABIMAS 08.07.2026',
    storeName: 'IVOO Cabimas (C.C. Costa Mall, Maracaibo)',
    brand: 'IVOO',
    brandCategory: 'IVOO',
    city: 'Cabimas',
    seller: 'Samuel Matos',
    recordingDate: '8 de julio de 2026',
    duration: '17 min 50 seg',
    score: 60,
    level: 'Regular',
    saleClosed: false,
    contactCaptured: true,
    productEvaluated: 'Combo Mudanza: Aire Sunnyview 8000 BTU, Nevera ejecutiva ($410 / $359), TV Siragon 43" y 50" 4K ($370)',
    narrativeSummary:
      'El cliente esperó 10 minutos sin atención mientras el personal, incluida la seguridad, permanecía disperso pese a la presencia del gerente de tienda. Una vez atendido por Samuel Matos, la asesoría fue sólida: cálculo correcto de BTU, comparación FHD vs. 4K, financiamiento detallado y entrega proactiva de su número personal. No hubo intento de cierre pese al interés mostrado en varias categorías de producto.',
    criteriaBreakdown: [
      {
        criterionId: 'saludo',
        criterionName: 'Saludo y bienvenida',
        score: 3,
        maxScore: 10,
        observation:
          'El cliente permaneció 10 minutos en la tienda sin ser abordado por ningún asesor; el personal, incluyendo seguridad, estaba disperso conversando o revisando el teléfono a pesar de la presencia del gerente de tienda.',
        status: getCriterionStatus(3, 10),
      },
      {
        criterionId: 'necesidades',
        criterionName: 'Detección de necesidades',
        score: 7,
        maxScore: 10,
        observation:
          'Una vez atendido, Samuel indagó el tamaño del cuarto (3x3 m) para calcular BTU correctamente y preguntó sobre otros productos que el cliente necesitaba (nevera, cocina, TV).',
        status: getCriterionStatus(7, 10),
      },
      {
        criterionId: 'conocimiento',
        criterionName: 'Conocimiento de producto',
        score: 12,
        maxScore: 15,
        observation:
          'Explicó el cálculo de BTU según el tamaño del cuarto, diferenció FHD vs. 4K en televisores y detalló garantía, refrigerante R32 y disponibilidad de repuestos.',
        status: getCriterionStatus(12, 15),
      },
      {
        criterionId: 'opciones',
        criterionName: 'Presentación de opciones',
        score: 9,
        maxScore: 15,
        observation:
          'Cubrió cuatro categorías de producto (aire, nevera, TV, cocina), aunque la cocina no tenía disponibilidad ese día; presentó alternativas de TV de 43" y 50".',
        status: getCriterionStatus(9, 15),
      },
      {
        criterionId: 'cierre',
        criterionName: 'Técnica de venta y cierre',
        score: 3,
        maxScore: 15,
        observation:
          'No se intentó un cierre directo pese a que el cliente mostró interés concreto en varios productos; la visita terminó con el cliente retirándose sin compromiso de compra.',
        status: getCriterionStatus(3, 15),
      },
      {
        criterionId: 'financiamiento',
        criterionName: 'Manejo de financiamiento',
        score: 8,
        maxScore: 10,
        observation:
          'Detalló niveles de Cashea (nivel 5 y 6), diferencias entre 3 y 6 cuotas según el monto, y el descuento del 15% en divisas y bolívares.',
        status: getCriterionStatus(8, 10),
      },
      {
        criterionId: 'actitud',
        criterionName: 'Actitud y amabilidad',
        score: 7,
        maxScore: 10,
        observation:
          'Una vez comprometido con la atención, mostró paciencia y disposición a explicar cada producto en detalle.',
        status: getCriterionStatus(7, 10),
      },
      {
        criterionId: 'despedida',
        criterionName: 'Despedida y seguimiento',
        score: 6,
        maxScore: 10,
        observation:
          'Se despidió cordialmente pero no propuso un seguimiento formal más allá de ofrecer disponibilidad futura.',
        status: getCriterionStatus(6, 10),
      },
      {
        criterionId: 'proactividad',
        criterionName: 'Proactividad comercial',
        score: 5,
        maxScore: 5,
        observation:
          'Ofreció proactivamente su número personal para que el cliente lo contactara ante cualquier búsqueda de producto futura, el gesto más proactivo del lote.',
        status: getCriterionStatus(5, 5),
      },
    ],
    strengths: [
      'Una vez atendido, asesoría técnica sólida: cálculo correcto de BTU según tamaño de cuarto y comparación clara FHD vs. 4K.',
      'Manejo detallado de financiamiento con cifras exactas por nivel de Cashea.',
      'Mayor proactividad del lote: entregó su número personal sin que se lo solicitaran.',
    ],
    criticalAreas: [
      'Recepción muy deficiente: 10 minutos de espera sin atención, con personal (incluida seguridad) disperso pese a la presencia del gerente de tienda.',
      'No hubo intento de cierre pese al interés expresado en múltiples categorías de producto.',
      'Falta de disponibilidad de producto (cocinas) que limitó la venta cruzada.',
    ],
    recommendations: [
      'Establecer un límite máximo de tiempo de espera sin atención (por ejemplo, 2 minutos) y reforzar la supervisión del gerente sobre el piso de ventas.',
      'Capacitar en cierre directo cuando el cliente pregunta por múltiples categorías de producto en la misma visita.',
      'Mejorar la comunicación de disponibilidad de inventario para evitar frustrar solicitudes de combo.',
    ],
    transcript: [
      {
        speaker: 'Mystery Shopper',
        text: 'Buenos días, hoy es 8 de julio del 2026, me encuentro en IVOO Costa Mall, me dispongo a hacer el mystery.',
      },
      {
        speaker: 'Ambiente',
        text: '[Tramo largo sin diálogo audible, correspondiente a los 10 minutos de espera sin atención reportados por el cliente]',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Un aire de 12.000 BTU, ¿tienen?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Samuel Matos',
        text: 'De 12.000 por el momento se nos agotaron; nos llegaron hace dos semanas pero se agotaron, esperamos que lleguen más.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Qué otro me puedes recomendar que sea parecido? Lo busco para un cuarto pequeño, de 3x3.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Samuel Matos',
        text: 'Este de 8.000 BTU es bueno, de la marca Sunnyview, tiene un año de garantía, refrigerante R32.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Un cuarto de 3x3, verdad? A ver si nos sirve.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Samuel Matos',
        text: 'Sí, dependiendo del tamaño del cuarto, uno de 8.000 BTU es suficiente. La capacidad mínima necesaria sería de 5.400 BTU; uno de 8.000 no tiene ningún problema, sobre todo si el cuarto no está hecho de lámina sino de platabanda con cielo raso.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Sabía que necesitaba también una neverita, pero no muy grande.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Samuel Matos',
        text: 'Tenemos una nevera ejecutiva pequeña que sale en 410 dólares por Cashea. En bolívares y en divisa hay un descuento.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Como cuánto por ciento, más o menos?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Samuel Matos',
        text: 'Normalmente, dependiendo del día, ahorita es 15% menos; si cancela en divisas le sale en 359. En bolívares no es mucha diferencia, pero se ahorra algo: 389.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Y una cocinita, porque nos vamos a mudar y no tenemos casi nada; necesito una cocinita y un televisor. Son cuatro cosas: aire, nevera, cocina y televisor.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Samuel Matos',
        text: 'En este caso, cocinas en verdad no nos llegaron esta semana; los que estaban aquí estaban en 190-195, una cocina chiquita de cuatro hornillas con su bata, marca G.P. Cruz. Estamos a la espera de que lleguen la próxima semana.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'No, no, porque lo necesito sencillo, una cocina sencilla. Y el televisor, por lo menos de 50 pulgadas.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Samuel Matos',
        text: 'Tenemos desde la marca Siragon, ha salido bien, muchos han llevado y no ha habido problemas, con un año de garantía por tienda.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Este de cuánto es?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Samuel Matos',
        text: 'Este de 43 pulgadas... ¿lo buscas para la sala o para el cuarto?',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Para el cuarto.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Samuel Matos',
        text: 'Por lo menos de 50 te viene bien. Tenéis tanto Full HD como 4K. Este te trae 370 por Cashea, menos el precio si lo hacéis al contado, y te trae de regalo una base fija.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Esto cuando dice que es inicial, ¿ese también es por Cashea?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Samuel Matos',
        text: 'Por Cashea, en el nivel 5. ¿En qué nivel te contaste?',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Bueno, yo no; mi esposa. Ella está como en el nivel 5 o 4.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Samuel Matos',
        text: 'Ella llega a pasar al nivel 6 hasta el 10 de julio: sería 0 inicial y 3 cuotas, o sea, no paga nada y se lo lleva. Pero de nivel 5, son 54 dólares de inicial y 3 cuotas de 72; o si va por 6 cuotas con un monto de 300 dólares y 40% inicial (120 dólares), quedan 6 cuotas de 30.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Ese es el que me recomiendas ahorita.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Samuel Matos',
        text: 'Es el más económico y es bueno: buena resolución de pantalla, tiene aplicaciones de TV en vivo, y por el tamaño llega a Full HD; el de 50 llega a 4K, que da mayor calidad de imagen y colores, pero de resto es el mismo sistema operativo.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Cómo es el nombre tuyo?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Samuel Matos',
        text: 'Samuel Matos. Si gusta, también te puedo dar mi número personal por si buscas algún modelo o producto; yo te lo busco por acá.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Gracias, Samuel.',
      },
      {
        speaker: 'Ambiente',
        text: '[Otro empleado se acerca brevemente]',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Samuel Matos',
        text: '¿Qué es el nombre tuyo?',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Gerardo.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Me voy retirando... duré 10 minutos en la tienda, la calidad de atención de los asesores no fue la mejor; a los 10 minutos fue que me abordó Samuel Matos, y me explicó bien lo que eran los productos que yo necesitaba. Pero cuando llegué, la recepción del de seguridad no fue tampoco la adecuada: los de seguridad estaban por allá conversando, los asesores de igual manera, unos en las puertas de salida conversando, otros chateando por teléfono. De verdad, la atención, para mi parecer, fue muy pésima, a pesar de que estaba el gerente de la tienda presente.',
      },
    ],
    ambientNotes: 'Audio grabado el 8 de julio de 2026. Duración: 17 min 50 seg. Archivo: IVOO CABIMAS 08.07.2026.',
    audioDriveId: '1-NHd9Mwj6Gtr5uYe5DvA9ET7aLJDymwr',
    audioUrl: 'https://drive.google.com/file/d/1-NHd9Mwj6Gtr5uYe5DvA9ET7aLJDymwr/view',
    verificationStatus: 'verified',
  },

  // 4. IVOO MATURÍN (AV. LA PAZ) — REINA (52/100 · REGULAR)
  {
    id: 'ivoo-maturin-11-07',
    identifier: 'IVOO MATURIN 11.07.2026 (archivo: 18-07)',
    storeName: 'IVOO Maturín (Av. La Paz)',
    brand: 'IVOO',
    brandCategory: 'IVOO',
    city: 'Maturín',
    seller: 'Reina',
    recordingDate: '11 de julio de 2026',
    duration: '10 min 37 seg',
    score: 52,
    level: 'Regular',
    saleClosed: false,
    contactCaptured: true,
    productEvaluated: 'Smart TV 43" ($270 / $236 en divisa, Cashea Nivel 6, Zelle con Declaración Jurada)',
    narrativeSummary:
      'El cliente tuvo que buscar activamente a un asesor durante 3 minutos en una tienda con 6 a 8 clientes sin atender. Reina, una vez localizada, explicó con mucho detalle el financiamiento, incluyendo el procedimiento de declaración jurada para una compra realizada como regalo para un tercero fuera de la ciudad, y entregó su contacto para seguimiento. No hubo cierre por tratarse de una decisión de un tercero ausente.',
    criteriaBreakdown: [
      {
        criterionId: 'saludo',
        criterionName: 'Saludo y bienvenida',
        score: 4,
        maxScore: 10,
        observation:
          'El cliente tuvo que buscar activamente a un asesor durante aproximadamente 3 minutos en medio de 6 a 8 clientes sin que nadie se acercara a ofrecer ayuda.',
        status: getCriterionStatus(4, 10),
      },
      {
        criterionId: 'necesidades',
        criterionName: 'Detección de necesidades',
        score: 4,
        maxScore: 10,
        observation:
          'Reina respondió directamente a las preguntas sobre el televisor de 43" que el cliente ya había elegido, sin sondear previamente el uso o el presupuesto disponible.',
        status: getCriterionStatus(4, 10),
      },
      {
        criterionId: 'conocimiento',
        criterionName: 'Conocimiento de producto',
        score: 7,
        maxScore: 15,
        observation:
          'La conversación se centró casi exclusivamente en financiamiento; no se compararon marcas, tecnologías ni características del televisor más allá del precio.',
        status: getCriterionStatus(7, 15),
      },
      {
        criterionId: 'opciones',
        criterionName: 'Presentación de opciones',
        score: 6,
        maxScore: 15,
        observation:
          'Solo se discutió el modelo de TV de 43" ya identificado por el cliente, sin ofrecer alternativas ni productos complementarios.',
        status: getCriterionStatus(6, 15),
      },
      {
        criterionId: 'cierre',
        criterionName: 'Técnica de venta y cierre',
        score: 4,
        maxScore: 15,
        observation:
          'No hubo cierre; la compra era un regalo para un tercero fuera de la ciudad y Reina no propuso una vía concreta para concretar la operación en esa misma visita.',
        status: getCriterionStatus(4, 15),
      },
      {
        criterionId: 'financiamiento',
        criterionName: 'Manejo de financiamiento',
        score: 9,
        maxScore: 10,
        observation:
          'Explicó con mucho detalle los niveles de Cashea (20% inicial a 3 cuotas vs. 40% inicial a 6 cuotas según el monto), los precios en divisa, bolívar y Zelle, y el procedimiento de declaración jurada para terceros.',
        status: getCriterionStatus(9, 10),
      },
      {
        criterionId: 'actitud',
        criterionName: 'Actitud y amabilidad',
        score: 8,
        maxScore: 10,
        observation:
          'Pese a la demora inicial en ser localizada, mostró disposición genuina y paciencia al explicar el proceso de financiamiento paso a paso.',
        status: getCriterionStatus(8, 10),
      },
      {
        criterionId: 'despedida',
        criterionName: 'Despedida y seguimiento',
        score: 6,
        maxScore: 10,
        observation:
          'Entregó su número para dar seguimiento por WhatsApp, aunque no ofreció enviar cotización formal por escrito.',
        status: getCriterionStatus(6, 10),
      },
      {
        criterionId: 'proactividad',
        criterionName: 'Proactividad comercial',
        score: 4,
        maxScore: 5,
        observation:
          'Ofreció proactivamente su contacto para seguimiento posterior, entendiendo que la decisión final dependía de un tercero.',
        status: getCriterionStatus(4, 5),
      },
    ],
    strengths: [
      'Manejo de financiamiento sobresaliente, incluyendo el procedimiento de terceros (declaración jurada) para compras a nombre de otra persona.',
      'Actitud paciente y clara a pesar de la demora en la atención inicial.',
      'Entrega proactiva de contacto para seguimiento por WhatsApp.',
    ],
    criticalAreas: [
      'Falta de personal disponible: el cliente tuvo que buscar activamente un asesor por 3 minutos en una tienda con 6-8 clientes sin atender.',
      'No se sondearon necesidades de uso ni se presentaron opciones alternativas de producto.',
      'Nota: el audio narra la visita como ocurrida el sábado 11 de julio, mientras que el nombre del archivo original indica 18 de julio; se recomienda verificar la fecha exacta con el equipo de campo.',
    ],
    recommendations: [
      'Asignar un asesor visible cerca de la entrada en horas de alta afluencia para reducir el tiempo de búsqueda del cliente.',
      'Ampliar el sondeo de necesidades más allá del financiamiento, incluyendo comparación de opciones de producto.',
      'Estandarizar el registro de fecha y hora de cada visita para evitar discrepancias entre archivo y contenido.',
    ],
    transcript: [
      {
        speaker: 'Mystery Shopper',
        text: 'Buenas tardes. Me encuentro ahorita entrando a la tienda IVOO, ubicada en la avenida La Paz de la ciudad de Maturín, el día sábado, siendo las 12:30 del día. La tienda está prácticamente con 6 a 8 clientes; por la parte de los TV hay un mayor número de clientes. Ningún tipo de atención aún por parte de algún asesor. Voy a tratar de ubicar un asesor.',
      },
      {
        speaker: 'Ambiente',
        text: '[Transcurren aproximadamente 3 minutos más hasta que el cliente logra ser atendido]',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Disculpa, una pregunta por acá: para este TV de 43 pulgadas, ¿qué financiamiento tienen?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Reina',
        text: '¿Qué nivel eres?',
      },
      {
        speaker: 'Mystery Shopper',
        text: '6.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Reina',
        text: 'Das el 20% y te quedan 3 cuotas; o sea, das hoy 54 dólares y te quedan 3 cuotas de 72. Ya a partir de 300 dólares, das el 40% y te quedan 6 cuotas: 120 dólares iniciales y 6 cuotas de 30.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Y para pagos en divisa?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Reina',
        text: 'Por lo menos este de 270, te quedan 236 en divisas; al contado en bolívar, 256.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Y tienen otro tipo de pago, celes?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Reina',
        text: 'Sí, celes también. Pero, ¿la persona que va a pagar es de fuera?',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Sí, parece que la persona es de fuera.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Reina',
        text: 'De igual manera, si cancela con cel puede hacer la transferencia; la persona que va a recibir el producto acá tiene que firmar una declaración jurada.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Ok, y él hace el pago y yo simplemente me llevo el producto y firmo la declaración.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Reina',
        text: 'Exactamente, y se le aplica el mismo descuento que en divisa, 236.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Bueno, Reina, ¿será que me das tu número?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Reina',
        text: '[da su número: 0416-481-4276]',
      },
      {
        speaker: 'Mystery Shopper',
        text: '[proporciona su nombre para el registro: Clarice Ortiz]',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Reina',
        text: 'Porque él está interesado ahora, pero busca opciones y quiere ver los tipos de pago; cualquier cosa, me escribes por WhatsApp.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Gracias, Reina. Muy buena atención la de la chica, a pesar de que la tuve que buscar.',
      },
    ],
    ambientNotes: 'Audio grabado el 11 de julio de 2026. Duración: 10 min 37 seg. Archivo: IVOO MATURIN 11.07.2026 (archivo: 18-07).',
    audioDriveId: '1-NHd9Mwj6Gtr5uYe5DvA9ET7aLJDymwr',
    audioUrl: 'https://drive.google.com/file/d/1-NHd9Mwj6Gtr5uYe5DvA9ET7aLJDymwr/view',
    verificationStatus: 'verified',
  },

  // 5. IVOO CIUDAD OJEDA — CATHERINE D'AVILA (40/100 · DEFICIENTE)
  {
    id: 'ivoo-ciudad-ojeda-08-07',
    identifier: 'IVOO CIUDAD OJEDA 08.07.2026',
    storeName: 'IVOO Ciudad Ojeda',
    brand: 'IVOO',
    brandCategory: 'IVOO',
    city: 'Ciudad Ojeda',
    seller: "Catherine D'Avila",
    recordingDate: '8 de julio de 2026',
    duration: '6 min 44 seg',
    score: 40,
    level: 'Deficiente',
    saleClosed: false,
    contactCaptured: false,
    productEvaluated: 'Aire Sunnyview ($185 / $172), Nevera gris ($400), TV Siragon 40" ($270)',
    narrativeSummary:
      "La bienvenida del personal de seguridad fue adecuada, pero la asesora Catherine D'Avila mostró, según la propia nota del cliente, poco desenvolvimiento en las explicaciones y no ofreció sugerencias ni detalles de los equipos consultados. Se brindaron precios en divisa y bolívar para aire y nevera, pero sin ningún intento de cierre ni captura de contacto.",
    criteriaBreakdown: [
      {
        criterionId: 'saludo',
        criterionName: 'Saludo y bienvenida',
        score: 6,
        maxScore: 10,
        observation:
          'El personal de seguridad recibió muy bien al cliente ("buenas tardes, pasa adelante"), pero la asesora no mostró la misma disposición al iniciar la atención.',
        status: getCriterionStatus(6, 10),
      },
      {
        criterionId: 'necesidades',
        criterionName: 'Detección de necesidades',
        score: 4,
        maxScore: 10,
        observation:
          'Se preguntó el tamaño del cuarto (3,5x3,5 m) para el aire, pero el cliente mismo tuvo que guiar la conversación producto por producto sin que la asesora indagara más a fondo.',
        status: getCriterionStatus(4, 10),
      },
      {
        criterionId: 'conocimiento',
        criterionName: 'Conocimiento de producto',
        score: 5,
        maxScore: 15,
        observation:
          'Según la propia nota del cliente, la asesora "no tenía mucho desenvolvimiento en la parte de las explicaciones de los equipos" y no ofreció mayor detalle técnico de lo consultado.',
        status: getCriterionStatus(5, 15),
      },
      {
        criterionId: 'opciones',
        criterionName: 'Presentación de opciones',
        score: 6,
        maxScore: 15,
        observation:
          'Mostró un modelo de aire (185-270 según divisa/bolívar) y una nevera (400), pero sin presentar alternativas comparativas ni profundizar en las características de cada una.',
        status: getCriterionStatus(6, 15),
      },
      {
        criterionId: 'cierre',
        criterionName: 'Técnica de venta y cierre',
        score: 2,
        maxScore: 15,
        observation:
          'No hubo ningún intento de cierre ni de generar urgencia; la conversación se limitó a cotizar precios sin avanzar hacia una decisión.',
        status: getCriterionStatus(2, 15),
      },
      {
        criterionId: 'financiamiento',
        criterionName: 'Manejo de financiamiento',
        score: 6,
        maxScore: 10,
        observation:
          'Explicó el descuento por pago en divisas (aproximadamente 172 el aire) y mencionó la garantía por tienda, aunque sin el mismo nivel de detalle en cuotas que otras tiendas del lote.',
        status: getCriterionStatus(6, 10),
      },
      {
        criterionId: 'actitud',
        criterionName: 'Actitud y amabilidad',
        score: 5,
        maxScore: 10,
        observation:
          'Atención funcional pero pasiva; el cliente percibió falta de mayor sugerencia o involucramiento por parte de la asesora.',
        status: getCriterionStatus(5, 10),
      },
      {
        criterionId: 'despedida',
        criterionName: 'Despedida y seguimiento',
        score: 4,
        maxScore: 10,
        observation:
          'Solo se obtuvo el nombre de la asesora al retirarse; no se ofreció ningún mecanismo de seguimiento ni se solicitó el contacto del cliente.',
        status: getCriterionStatus(4, 10),
      },
      {
        criterionId: 'proactividad',
        criterionName: 'Proactividad comercial',
        score: 2,
        maxScore: 5,
        observation:
          'No hubo gestos proactivos más allá de responder lo que el cliente preguntaba directamente.',
        status: getCriterionStatus(2, 5),
      },
    ],
    strengths: [
      'El personal de seguridad ofreció una bienvenida cálida y apropiada en la entrada.',
      'Se brindaron precios concretos en divisa y bolívar para los productos consultados.',
    ],
    criticalAreas: [
      'Conocimiento de producto insuficiente: la propia nota del cliente señala que la asesora no ofreció explicaciones ni sugerencias de valor.',
      'Ningún intento de cierre ni de captura de contacto del cliente.',
      'Falta de proactividad: la atención fue completamente reactiva a las preguntas del cliente.',
    ],
    recommendations: [
      'Reforzar la capacitación técnica de producto para todo el personal de piso, no solo en tiendas de mayor tráfico.',
      'Establecer un guion mínimo de sondeo y cierre que toda asesoría debe cumplir, independientemente del nivel de interés inicial del cliente.',
      'Solicitar siempre el contacto del cliente antes de finalizar la atención.',
    ],
    transcript: [
      {
        speaker: 'Mystery Shopper',
        text: 'Soy Gerardo Rovira, hoy es 8 de julio de 2026, me encuentro en IVOO Ciudad Ojeda.',
      },
      {
        speaker: 'Vendedor',
        speakerName: "Catherine D'Avila",
        text: 'Este [aire] tiene un costo de 185 dólares.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Qué marca es el aire?',
      },
      {
        speaker: 'Vendedor',
        speakerName: "Catherine D'Avila",
        text: 'Sunnyview, tiene un año de garantía por la tienda.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿No te ha llegado uno más pequeño? Yo necesitaba como cuatro cositas: una cocina, una nevera...',
      },
      {
        speaker: 'Vendedor',
        speakerName: "Catherine D'Avila",
        text: 'Esta [nevera] es gris, 400 dólares.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Cuáles son las facilidades de pago?',
      },
      {
        speaker: 'Ambiente',
        text: '[Tramo parcialmente inaudible sobre condiciones de Cashea y contado]',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Si te lo pago en divisa hay un descuento? ¿Como de cuánto?',
      },
      {
        speaker: 'Vendedor',
        speakerName: "Catherine D'Avila",
        text: 'El aire queda en 172. Y para la nevera, el cuarto es más o menos de tres y medio por tres y medio.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Yo necesito un televisor que, más o menos, por el espacio físico del cuarto... ¿qué me recomienda?',
      },
      {
        speaker: 'Vendedor',
        speakerName: "Catherine D'Avila",
        text: 'Siragon, de 40 pulgadas, en 270. La definición es muy buena, tiene 7 días de garantía por cambio directo, aunque es preferible cambiarlo por tienda porque es más fácil que en el mercado.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿No sabe cuándo llegan las cocinas?',
      },
      {
        speaker: 'Vendedor',
        speakerName: "Catherine D'Avila",
        text: 'Dos aires tampoco han llegado, están esperando; así como lleguen, avisamos rapidito.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Cuál es tu nombre?',
      },
      {
        speaker: 'Vendedor',
        speakerName: "Catherine D'Avila",
        text: "Catherine D'Avila.",
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Me pongo a retirarme de la tienda IVOO Ciudad Ojeda; me atendió Catherine D\'Avila. La atención de entrada del personal de seguridad fue muy buena, con desenvolvimiento: "buenas tardes, pasa adelante". Sin embargo, la asesora no tenía mucho desenvolvimiento en la parte de las explicaciones de los equipos ni de lo que tenía que ofrecer; no me ofreció mayor cosa, no me dio mayor sugerencia o detalle de los equipos que le pregunté.',
      },
    ],
    ambientNotes: 'Audio grabado el 8 de julio de 2026. Duración: 6 min 44 seg. Archivo: IVOO CIUDAD OJEDA 08.07.2026.',
    audioDriveId: '1-NHd9Mwj6Gtr5uYe5DvA9ET7aLJDymwr',
    audioUrl: 'https://drive.google.com/file/d/1-NHd9Mwj6Gtr5uYe5DvA9ET7aLJDymwr/view',
    verificationStatus: 'verified',
  },

  // 6. IVOO SAN FRANCISCO — DANIEL GARCÍA (25/100 · DEFICIENTE)
  {
    id: 'ivoo-san-francisco-09-07',
    identifier: 'IVOO SAN FRANCISCO 09.07.2026',
    storeName: 'IVOO San Francisco',
    brand: 'IVOO',
    brandCategory: 'IVOO',
    city: 'San Francisco',
    seller: 'Daniel García',
    recordingDate: '9 de julio de 2026',
    duration: '18 min 44 seg',
    score: 25,
    level: 'Deficiente',
    saleClosed: false,
    contactCaptured: false,
    productEvaluated: 'TV 40" ($225 / $197), Aire 8000 BTU, Nevera exhibición ($3800-$4100)',
    narrativeSummary:
      'El cliente esperó aproximadamente 15 minutos sin ser atendido, mientras el personal permanecía agrupado revisando teléfonos; durante la espera ocurrió además un apagón. Daniel García se involucró solo al final, con información limitada por falta de inventario, y el cliente concluye textualmente que "recorrí toda la tienda sin tener ninguna clase de asesoramiento" y que ni siquiera fue objeto de un intento de venta.',
    criteriaBreakdown: [
      {
        criterionId: 'saludo',
        criterionName: 'Saludo y bienvenida',
        score: 2,
        maxScore: 10,
        observation:
          'El cliente esperó aproximadamente 15 minutos sin ser atendido por ningún asesor, mientras el personal permanecía agrupado revisando teléfonos; durante la espera ocurrió además un apagón en la tienda.',
        status: getCriterionStatus(2, 10),
      },
      {
        criterionId: 'necesidades',
        criterionName: 'Detección de necesidades',
        score: 1,
        maxScore: 10,
        observation:
          'No hubo ningún sondeo; Daniel solo respondió cuando el cliente, después de recorrer toda la tienda, le preguntó directamente por un televisor de 40 pulgadas.',
        status: getCriterionStatus(1, 10),
      },
      {
        criterionId: 'conocimiento',
        criterionName: 'Conocimiento de producto',
        score: 4,
        maxScore: 15,
        observation:
          'La información se limitó a confirmar que "40 pulgadas es lo único que tenemos por el momento", sin ofrecer comparación de marcas ni características técnicas.',
        status: getCriterionStatus(4, 15),
      },
      {
        criterionId: 'opciones',
        criterionName: 'Presentación de opciones',
        score: 3,
        maxScore: 15,
        observation:
          'Prácticamente no hubo opciones que presentar por falta de disponibilidad de inventario (solo un tamaño de TV, un aire, y una nevera de alto costo).',
        status: getCriterionStatus(3, 15),
      },
      {
        criterionId: 'cierre',
        criterionName: 'Técnica de venta y cierre',
        score: 1,
        maxScore: 15,
        observation:
          'No hubo ningún intento de generar interés o cerrar la venta; la interacción fue puramente transaccional e informativa.',
        status: getCriterionStatus(1, 15),
      },
      {
        criterionId: 'financiamiento',
        criterionName: 'Manejo de financiamiento',
        score: 6,
        maxScore: 10,
        observation:
          'A pesar de las fallas de atención, explicó correctamente los umbrales de Cashea (20% inicial a 3 cuotas, 40% a 6 cuotas desde 300 dólares, 9 cuotas desde 450) y el precio en divisa.',
        status: getCriterionStatus(6, 10),
      },
      {
        criterionId: 'actitud',
        criterionName: 'Actitud y amabilidad',
        score: 4,
        maxScore: 10,
        observation:
          'Trato neutro, sin hostilidad, pero sin ninguna calidez ni esfuerzo por compensar la larga espera del cliente.',
        status: getCriterionStatus(4, 10),
      },
      {
        criterionId: 'despedida',
        criterionName: 'Despedida y seguimiento',
        score: 2,
        maxScore: 10,
        observation:
          'Solo se obtuvo su nombre; no hubo ofrecimiento de seguimiento ni disculpa por el tiempo de espera.',
        status: getCriterionStatus(2, 10),
      },
      {
        criterionId: 'proactividad',
        criterionName: 'Proactividad comercial',
        score: 2,
        maxScore: 5,
        observation:
          'No hubo proactividad más allá de responder lo mínimo indispensable a las preguntas del cliente.',
        status: getCriterionStatus(2, 5),
      },
    ],
    strengths: [
      'Manejo correcto de los umbrales de financiamiento de Cashea, con cifras específicas por monto.',
    ],
    criticalAreas: [
      'Falla grave de recepción: 15 minutos de espera sin atención, personal agrupado en teléfonos, y ocurrencia de un apagón sin protocolo de contingencia aparente.',
      'El cliente concluye explícitamente que "recorrí toda la tienda sin tener ninguna clase de asesoramiento" y que ni siquiera fue objeto de un intento de venta.',
      'Falta de inventario disponible en las categorías consultadas (TV, aire, nevera), limitando cualquier posibilidad de opciones.',
    ],
    recommendations: [
      'Intervención prioritaria: esta tienda requiere revisión inmediata de supervisión de piso y protocolo de atención al cliente.',
      'Establecer un protocolo de contingencia ante apagones que no interrumpa la atención al cliente en curso.',
      'Revisar el nivel de inventario disponible para evitar visitas sin opciones reales de compra.',
    ],
    transcript: [
      {
        speaker: 'Mystery Shopper',
        text: 'Mi nombre es Gerardo Rovira, hoy 9 de julio me encuentro en IVOO San Francisco, me dispongo al mystery.',
      },
      {
        speaker: 'Ambiente',
        text: '[Tramo largo sin atención — narrado por el propio cliente]',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Llevo aproximadamente 10 minutos y no he sido atendido por ningún vendedor. En estos momentos se fue la luz. Ningún asesor atiende, todos están mirando los teléfonos, parados conversando todos en un solo grupo.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Han ocurrido prácticamente 15 minutos y todavía no he sido atendido por ningún asesor; me pasan por un lado y no me preguntan nada. Así como yo, hay varios clientes.',
      },
      {
        speaker: 'Ambiente',
        text: '[Finalmente se acerca un asesor]',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Amigo, ando buscando un televisor de 40 pulgadas, ¿qué me puedes recomendar?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Daniel García',
        text: 'Bueno, 40 pulgadas es lo único que tenemos por el momento, son 225 dólares. Se puede pagar con Cashea, ¿utiliza Cashea?',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Sí, mi esposa utiliza Cashea.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Daniel García',
        text: 'Se reflejaría a tres cuotas dependiendo del nivel, sería la inicial. ¿Sabe qué nivel es?',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'El 5.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Daniel García',
        text: 'El 5 pagaría el 20% y se le llevaría el restante a tres cuotas. Para obtener 6 cuotas tendría que pasar el monto de 300 dólares; si pasa de 450, 9 cuotas.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Y si lo pago en divisa, al contado?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Daniel García',
        text: 'Quedan 197 dólares.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'También andaba buscando un aire para el cuarto.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Daniel García',
        text: 'El más grande que tengo de ventana por el momento es de 8.000 BTU.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Y nevera?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Daniel García',
        text: 'Nevera no tengo por el momento; tengo una sola, es simplemente de exhibición, vale entre 3.800 y 4.100 dólares.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Los mismos métodos de pago?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Daniel García',
        text: 'Sí, los mismos; esta se puede llevar a 6 cuotas, y si compra algo más que llegue a 450, a 9 cuotas.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Cómo es el nombre tuyo?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'Daniel García',
        text: 'Daniel García.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Gracias, Daniel. Me dispongo en estos momentos a retirarme de IVOO, la cual recorrí toda la tienda sin tener ninguna clase de asesoramiento, y ni siquiera me han vendido. Me retiro de la tienda, ya que hubo un apagón.',
      },
    ],
    ambientNotes: 'Audio grabado el 9 de julio de 2026. Duración: 18 min 44 seg. Archivo: IVOO SAN FRANCISCO 09.07.2026.',
    audioDriveId: '1-NHd9Mwj6Gtr5uYe5DvA9ET7aLJDymwr',
    audioUrl: 'https://drive.google.com/file/d/1-NHd9Mwj6Gtr5uYe5DvA9ET7aLJDymwr/view',
    verificationStatus: 'verified',
  },

  // 7. IVOO MARACAIBO CENTRO — NO IDENTIFICADO (11/100 · DEFICIENTE)
  {
    id: 'ivoo-maracaibo-centro-10-07',
    identifier: 'IVOO MARACAIBO CENTRO 10.07.2026',
    storeName: 'IVOO Maracaibo Centro',
    brand: 'IVOO',
    brandCategory: 'IVOO',
    city: 'Maracaibo',
    seller: 'No identificado',
    recordingDate: '10 de julio de 2026',
    duration: '13 min 21 seg',
    score: 11,
    level: 'Deficiente',
    saleClosed: false,
    contactCaptured: false,
    productEvaluated: 'Televisores ($145 / $200-$500)',
    narrativeSummary:
      'La peor visita del lote. Tras un intercambio inicial breve sobre precios de televisores, la clienta fue abandonada durante más de 11 minutos confirmados; luego fue abordada brevemente por dos empleados distintos, ninguno de los cuales ofreció una atención real. No se identificó con certeza al personal involucrado, no hubo ningún intento de venta, y la visita constituye prácticamente una pérdida total del lead.',
    criteriaBreakdown: [
      {
        criterionId: 'saludo',
        criterionName: 'Saludo y bienvenida',
        score: 1,
        maxScore: 10,
        observation:
          'No se registró ningún saludo de bienvenida; la clienta fue abordada brevemente y luego abandonada sin ninguna cortesía de cierre.',
        status: getCriterionStatus(1, 10),
      },
      {
        criterionId: 'necesidades',
        criterionName: 'Detección de necesidades',
        score: 1,
        maxScore: 10,
        observation:
          'No hubo ningún sondeo de necesidades más allá de la pregunta inicial de la clienta sobre el precio de un televisor.',
        status: getCriterionStatus(1, 10),
      },
      {
        criterionId: 'conocimiento',
        criterionName: 'Conocimiento de producto',
        score: 2,
        maxScore: 15,
        observation:
          'Solo se mencionaron dos precios de televisores (aproximadamente 390 y 500 dólares) sin ninguna explicación de características o comparación.',
        status: getCriterionStatus(2, 15),
      },
      {
        criterionId: 'opciones',
        criterionName: 'Presentación de opciones',
        score: 1,
        maxScore: 15,
        observation:
          'No se presentó ninguna opción adicional de producto; la interacción se cortó antes de poder avanzar en la asesoría.',
        status: getCriterionStatus(1, 15),
      },
      {
        criterionId: 'cierre',
        criterionName: 'Técnica de venta y cierre',
        score: 0,
        maxScore: 15,
        observation:
          'No hubo ningún intento de venta; la clienta fue abandonada durante más de 11 minutos y la visita terminó sin ninguna gestión comercial.',
        status: getCriterionStatus(0, 15),
      },
      {
        criterionId: 'financiamiento',
        criterionName: 'Manejo de financiamiento',
        score: 3,
        maxScore: 10,
        observation:
          'Se mencionó brevemente el precio en divisa (145) y un umbral de nivel de Cashea (60%), sin mayor desarrollo.',
        status: getCriterionStatus(3, 10),
      },
      {
        criterionId: 'actitud',
        criterionName: 'Actitud y amabilidad',
        score: 1,
        maxScore: 10,
        observation:
          'La propia clienta describe que la primera persona que la atendió "me dejó botada" y que un segundo empleado se presentó y se retiró tras solo dos pasos junto a ella.',
        status: getCriterionStatus(1, 10),
      },
      {
        criterionId: 'despedida',
        criterionName: 'Despedida y seguimiento',
        score: 1,
        maxScore: 10,
        observation:
          'No hubo despedida; la clienta se retiró de la tienda por su propia cuenta sin que ningún asesor la acompañara o se disculpara.',
        status: getCriterionStatus(1, 10),
      },
      {
        criterionId: 'proactividad',
        criterionName: 'Proactividad comercial',
        score: 1,
        maxScore: 5,
        observation:
          'No se observó ningún gesto proactivo en toda la visita.',
        status: getCriterionStatus(1, 5),
      },
    ],
    strengths: [
      'No se identificaron fortalezas significativas en esta visita; fue prácticamente una no-atención.',
    ],
    criticalAreas: [
      'Abandono total del cliente: tras un breve intercambio inicial, la clienta permaneció sin atención durante más de 11 minutos (confirmado mediante revisión adicional del tramo silencioso de la grabación).',
      'Un segundo empleado se acercó, dio su nombre y se retiró tras solo dos pasos, sin intención real de atender.',
      'Ningún dato de contacto ni seguimiento fue ofrecido; la visita constituye prácticamente una pérdida total del lead.',
      'No fue posible identificar con certeza al personal involucrado, lo que dificulta la retroalimentación individual.',
    ],
    recommendations: [
      'Intervención urgente: esta es la peor puntuación del lote y requiere revisión disciplinaria inmediata con el personal de piso de esta tienda.',
      'Implementar un protocolo de "cliente en piso" que asigne responsabilidad clara sobre cualquier persona que ingrese a la tienda.',
      'Identificar y capacitar (o sustituir) al personal involucrado en esta visita específica.',
    ],
    transcript: [
      {
        speaker: 'Mystery Shopper',
        text: 'Buenas tardes, soy Duaivy Rodríguez, voy a comenzar a hacer el mystery aquí en IVOO Centro Maracaibo, esperemos cómo nos va.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'No identificado',
        text: '¿De cuánto lo buscabas?',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Me dijeron que de 200, 250.',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'No identificado',
        text: 'El de 250, este de 200... los que están en el mercado, el de 3.90, el de 250 vale 500.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿De cuánto está el pago de contado en divisa?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'No identificado',
        text: 'En divisa, este le sale en 145.',
      },
      {
        speaker: 'Mystery Shopper',
        text: '¿Y si es por Cashea?',
      },
      {
        speaker: 'Vendedor',
        speakerName: 'No identificado',
        text: 'Eso depende del nivel que sea; tiene que tener un nivel para el 60%.',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'De acuerdo.',
      },
      {
        speaker: 'Ambiente',
        text: '[A partir de este punto, la grabación registra aproximadamente 11 minutos y medio sin ningún diálogo audible. Una revisión adicional del tramo confirmó que se trata de ausencia real de atención y no de un problema técnico de la grabación]',
      },
      {
        speaker: 'Mystery Shopper',
        text: 'Aquí retirándome de la tienda, en vista de que me abordó una muchacha y luego me dejó botada, y me abordó otro chico que me dio su nombre, se presentó y dio dos pasos conmigo y ya. Me voy retirando de la tienda.',
      },
    ],
    ambientNotes: 'Audio grabado el 10 de julio de 2026. Duración: 13 min 21 seg. Archivo: IVOO MARACAIBO CENTRO 10.07.2026.',
    audioDriveId: '1-NHd9Mwj6Gtr5uYe5DvA9ET7aLJDymwr',
    audioUrl: 'https://drive.google.com/file/d/1-NHd9Mwj6Gtr5uYe5DvA9ET7aLJDymwr/view',
    verificationStatus: 'verified',
  },
];

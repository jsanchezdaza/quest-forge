import type { en } from './en'

// Spanish translations. Typed as `typeof en` so a missing or extra key is a
// compile-time error, keeping both dictionaries in sync.
export const es: typeof en = {
  // App
  'app.title': 'QUEST FORGE',
  'app.initializing': 'Iniciando Quest Forge...',

  // Language selector
  'language.en': 'EN',
  'language.es': 'ES',

  // Auth
  'auth.signInButton': 'ENTRAR',
  'auth.signUpButton': 'CREAR CUENTA',
  'auth.signInSuccessTitle': '¡Bienvenido de nuevo!',
  'auth.signInSuccessMessage': 'Sesión iniciada correctamente. ¡Prepárate para la aventura!',
  'auth.signUpSuccessTitle': 'Cuenta creada correctamente',
  'auth.signUpSuccessMessage': '¡Bienvenido a Quest Forge! Ya puedes comenzar tu aventura.',
  'auth.welcomeReturning': 'BIENVENIDO DE NUEVO, AVENTURERO',
  'auth.welcomeNew': 'COMIENZA TU GESTA',
  'auth.toggleToSignUp': '¿NO TIENES CUENTA? REGÍSTRATE',
  'auth.toggleToSignIn': '¿YA TIENES CUENTA? ENTRA',
  'auth.usernameRequiredTitle': 'Nombre de usuario obligatorio',
  'auth.usernameRequiredMessage': 'Introduce un nombre de usuario para continuar',
  'auth.signOut': 'Cerrar sesión',

  // Forms
  'form.emailLabel': 'Correo',
  'form.emailPlaceholder': 'tu.correo@ejemplo.com',
  'form.usernameLabel': 'Nombre de usuario',
  'form.usernamePlaceholder': 'Elige un nombre de usuario',
  'form.passwordLabel': 'Contraseña',
  'form.passwordPlaceholder': 'Tu contraseña',
  'form.characterNameLabel': 'Nombre del personaje',
  'form.characterNamePlaceholder': 'Introduce el nombre de tu personaje',
  'form.backstoryLabel': 'Historia (opcional)',
  'form.backstoryPlaceholder': 'Escribe la historia de tu personaje o genera una con IA...',

  // Shared UI
  'ui.loading': 'Cargando...',
  'ui.cancel': 'Cancelar',
  'ui.confirmChanges': 'Confirmar cambios',

  // Game
  'game.loadingAdventure': 'Cargando tu aventura...',
  'game.welcome': 'BIENVENIDO, {username}',
  'game.newCharacter': 'Nuevo personaje',
  'game.newCharacterShort': 'Nuevo',
  'game.startAdventure': 'COMIENZA TU AVENTURA',
  'game.createCharacterPrompt': 'CREA UN PERSONAJE PARA COMENZAR TU VIAJE EN EL MUNDO DE QUEST FORGE.',
  'game.createCharacter': 'Crear personaje',
  'game.createCharacterTitle': 'Crea tu personaje',
  'game.signedOutTitle': 'Sesión cerrada',
  'game.signedOutMessage': '¡Gracias por jugar! Tu progreso se ha guardado.',
  'game.signOutErrorTitle': 'Error al cerrar sesión',
  'game.signOutErrorMessage': 'No se pudo cerrar la sesión. Inténtalo de nuevo.',
  'game.noActiveSession': 'No hay ninguna partida activa',
  'game.adventureLog': 'Diario de aventura',
  'game.aiCrafting': 'La IA está creando tu historia...',
  'game.whatDoYouChoose': '¿Qué eliges?',
  'game.yourChoice': 'Tu elección:',
  'game.levelUpTitle': '¡Subiste de nivel!',
  'game.levelUpCongrats': '¡Enhorabuena! Has alcanzado el nivel {level}',
  'game.pointsToDistribute': 'Tienes {points} puntos de atributo para repartir',
  'game.levelAndClass': 'Nivel {level} {class}',
  'game.health': 'Salud',
  'game.experience': 'Experiencia',
  'game.inventory': 'Inventario',
  'game.emptyInventory': 'Tu inventario está vacío',
  'game.attributes': 'Atributos',

  // Character creation
  'character.chooseClass': 'Elige tu clase',
  'character.nameRequiredGenerate': 'Primero introduce el nombre del personaje',
  'character.nameRequiredSubmit': 'El nombre del personaje es obligatorio',
  'character.creationFailed': 'No se pudo crear el personaje',
  'character.backstoryFailed': 'No se pudo generar la historia: {error}',
  'character.generating': 'Generando...',
  'character.generateWithAI': 'Generar con IA',
  'character.configureAI': 'Configura la clave de API de OpenRouter para habilitar la generación de historia con IA',

  // Character classes
  'class.warrior.name': 'Guerrero',
  'class.warrior.desc': 'Un poderoso luchador hábil con el combate y las armas',
  'class.warrior.stats': 'Fuerza y Constitución altas',
  'class.mage.name': 'Mago',
  'class.mage.desc': 'Un maestro de la magia arcana y el conocimiento ancestral',
  'class.mage.stats': 'Inteligencia alta',
  'class.rogue.name': 'Pícaro',
  'class.rogue.desc': 'Un astuto ladrón hábil con el sigilo y las dagas',
  'class.rogue.stats': 'Destreza alta',
  'class.cleric.name': 'Clérigo',
  'class.cleric.desc': 'Un sanador divino bendecido con poderes sagrados',
  'class.cleric.stats': 'Sabiduría alta',
  'class.ranger.name': 'Explorador',
  'class.ranger.desc': 'Un experto de la naturaleza, maestro del arco',
  'class.ranger.stats': 'Destreza y Sabiduría altas',
  'class.paladin.name': 'Paladín',
  'class.paladin.desc': 'Un guerrero sagrado, campeón de la justicia y la luz',
  'class.paladin.stats': 'Fuerza y Carisma altos',

  // Stats / attributes
  'stat.strength': 'Fuerza',
  'stat.dexterity': 'Destreza',
  'stat.intelligence': 'Inteligencia',
  'stat.wisdom': 'Sabiduría',
  'stat.constitution': 'Constitución',
  'stat.charisma': 'Carisma',

  // Footer
  'footer.copyright': '© 2025 Quest Forge. Todos los derechos reservados.',
  'footer.author': 'Autor: ',

  // Auth error messages
  'error.loginFailed.title': 'Error de acceso',
  'error.loginFailed.message': 'Correo o contraseña incorrectos. Revisa tus credenciales e inténtalo de nuevo.',
  'error.emailNotConfirmed.title': 'Correo sin confirmar',
  'error.emailNotConfirmed.message': 'Revisa tu correo y haz clic en el enlace de confirmación antes de iniciar sesión.',
  'error.userNotFound.title': 'Usuario no encontrado',
  'error.userNotFound.message': 'No existe ninguna cuenta con este correo. Regístrate primero.',
  'error.weakPassword.title': 'Contraseña débil',
  'error.weakPassword.message': 'La contraseña debe tener al menos 6 caracteres y combinar letras y números.',
  'error.invalidEmail.title': 'Correo no válido',
  'error.invalidEmail.message': 'Introduce una dirección de correo válida.',
  'error.signupDisabled.title': 'Registro deshabilitado',
  'error.signupDisabled.message': 'El registro de nuevos usuarios está deshabilitado actualmente. Contacta con soporte.',
  'error.emailNotAuthorized.title': 'Correo no autorizado',
  'error.emailNotAuthorized.message': 'Este correo no está autorizado para crear una cuenta.',
  'error.tooManyRequests.title': 'Demasiados intentos',
  'error.tooManyRequests.message': 'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.',
  'error.completeRegistration.title': 'Completa el registro',
  'error.completeRegistration.message': 'Tu cuenta existe pero tu perfil está incompleto. Usa el formulario de registro para completarlo con un nombre de usuario.',
  'error.connectionIssue.title': 'Problema de conexión',
  'error.connectionIssue.message': 'No se pudo conectar con el servidor. Comprueba tu conexión a internet e inténtalo de nuevo.',
  'error.authError.title': 'Error de autenticación',
  'error.authError.message': 'Se produjo un error inesperado. Inténtalo de nuevo.',

  // Static narrative (fallback when AI is unavailable)
  'narrative.initial':
    '¡Bienvenido, {name}! Eres {desc}, de pie a las afueras de la pequeña aldea de Millhaven. Nubes oscuras se acumulan en el horizonte y los rumores hablan de sucesos extraños en el bosque cercano. Los aldeanos te miran con esperanza en los ojos, pues saben que está a punto de comenzar una aventura de gran importancia.\n\n¿Qué camino elegirás para empezar tu gesta?',
  'narrative.desc.warrior': 'un poderoso guerrero con espada y escudo',
  'narrative.desc.mage': 'un sabio mago que empuña poderes arcanos',
  'narrative.desc.rogue': 'un astuto pícaro hábil con el sigilo y las dagas',
  'narrative.desc.cleric': 'un devoto clérigo bendecido con magia divina',
  'narrative.desc.ranger': 'un hábil explorador, en armonía con la naturaleza',
  'narrative.desc.paladin': 'un recto paladín, campeón de la justicia',
  'narrative.initialChoice.1': 'Explorar el misterioso sendero del bosque',
  'narrative.initialChoice.2': 'Visitar la taberna local para conseguir información',
  'narrative.initialChoice.3': 'Ir al mercado del pueblo a reunir provisiones',
  'narrative.scene.forest':
    'Te adentras en el misterioso bosque, donde árboles ancestrales susurran secretos de antaño. De repente, oyes un crujido entre los arbustos. Tus instintos de {characterClass} te dicen que el peligro podría acechar cerca...',
  'narrative.scene.tavern':
    'Empujas la pesada puerta de madera de la taberna "El Poni Pisador". El cálido resplandor de la chimenea te da la bienvenida y observas a varios personajes interesantes: una figura encapuchada en un rincón, un mercader contando monedas y el parlanchín tabernero...',
  'narrative.scene.market':
    'El bullicioso mercado del pueblo está lleno de vendedores ofreciendo sus mercancías. Te fijas en un peculiar mercader que vende lo que parecen objetos mágicos, mientras otro vendedor susurra sobre hierbas raras que solo se encuentran en el bosque embrujado...',
  'narrative.scene.default': 'Tu elección te conduce a una nueva aventura...',
  'narrative.choices.forest.1': 'Desenfundar tu arma e investigar el ruido',
  'narrative.choices.forest.2': 'Intentar pasar sigilosamente',
  'narrative.choices.forest.3': 'Gritar para ver quién o qué hay ahí',
  'narrative.choices.tavern.1': 'Acercarte a la figura encapuchada',
  'narrative.choices.tavern.2': 'Hablar con el mercader sobre noticias locales',
  'narrative.choices.tavern.3': 'Preguntar al tabernero por sucesos extraños recientes',
  'narrative.choices.market.1': 'Examinar los objetos mágicos a la venta',
  'narrative.choices.market.2': 'Preguntar por las hierbas del bosque embrujado',
  'narrative.choices.market.3': 'Buscar provisiones básicas de aventurero',
  'narrative.choices.default.1': 'Continuar tu aventura',
  'narrative.choices.default.2': 'Descansar y planear tu siguiente paso',
  'narrative.choices.default.3': 'Buscar consejo entre los lugareños',
  // Keywords used to map a chosen action to a static scene (must appear in the
  // matching choice texts above, in the same language).
  'narrative.keyword.forest': 'bosque',
  'narrative.keyword.tavern': 'taberna',
  'narrative.keyword.market': 'mercado',
  // Instruction appended to AI prompts so generated text matches the UI language.
  'narrative.aiLanguageInstruction': 'Escribe tu respuesta en español.',
}

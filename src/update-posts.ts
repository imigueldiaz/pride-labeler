import { Bot } from '@skyware/bot';
import { BSKY_IDENTIFIER, BSKY_PASSWORD } from './config.js';
import { LABELS } from './constants.js';
import logger from './logger.js';

const bot = new Bot();

// Función auxiliar para extraer el rkey de un URI
function getRkeyFromUri(uri: string): string {
  return uri.split('/').pop() || '';
}

// Función para separar el texto por idiomas
function parseMultilingualText(text: string): Record<string, string> {
  const parts = text.split('|').map(part => part.trim());
  // Asumimos que el orden es siempre: es, en
  return {
    es: parts[0] || '',
    en: parts[1] || ''
  };
}

// Función para comparar textos y detectar cambios por idioma
function detectLanguageChanges(existingText: string, newLabel: typeof LABELS[0]): string[] {
  const existingLangs = parseMultilingualText(existingText);
  const changedLangs: string[] = [];
  
  // Comparar idiomas existentes (es, en)
  for (const lang of ['es', 'en'] as const) {
    const existingTranslation = existingLangs[lang];
    const newTranslation = newLabel.locales.find(l => l.lang === lang)?.name || '';
    if (existingTranslation !== newTranslation) {
      changedLangs.push(lang);
    }
  }
  
  // Añadir nuevos idiomas (de, fr, ja)
  for (const lang of ['de', 'fr', 'ja'] as const) {
    if (newLabel.locales.some(l => l.lang === lang)) {
      changedLangs.push(lang);
    }
  }
  
  return changedLangs;
}

async function main() {
  try {
    // Login
    await bot.login({
      identifier: BSKY_IDENTIFIER,
      password: BSKY_PASSWORD,
    });
    logger.info('Logged in successfully');

    // Get existing posts
    const existingPosts = await bot.profile.getPosts();
    logger.info('Retrieved existing posts');

    // Buscar el post principal existente
    const mainPostText = 'Like the replies to this post to receive labels.';
    const existingMainPost = existingPosts.posts.find(post => post.text === mainPostText);

    let mainPost;
    try {
      if (existingMainPost) {
        logger.info('Found existing main post');
        mainPost = existingMainPost;
      } else {
        logger.info('Creating new main post...');
        mainPost = await bot.post({
          text: mainPostText,
          facets: []
        });
        logger.info('Main post created successfully');
      }
    } catch (error) {
      logger.error('Error with main post: ' + JSON.stringify(error, null, 2));
      throw error;
    }

    // Procesar cada etiqueta
    for (const label of LABELS) {
      const labelNames = label.locales.map((locale) => locale.name).join(' | ');
      
      try {
        // Buscar si existe un post para esta etiqueta
        const existingPost = existingPosts.posts.find(post => 
          post.uri && getRkeyFromUri(post.uri) === label.rkey
        );
        
        if (existingPost) {
          // Detectar qué idiomas han cambiado
          const changedLanguages = detectLanguageChanges(existingPost.text, label);
          
          if (changedLanguages.length > 0) {
            logger.info(`Updating post for ${label.identifier}, detected changes in: ${changedLanguages.join(', ')}`);
            await bot.deletePost(existingPost.uri);
            const post = await mainPost.reply({
              text: labelNames,
              facets: []
            });
            logger.info(`Updated post for label: ${label.identifier}, changed languages: ${changedLanguages.join(', ')}`);
          } else {
            logger.info(`Kept existing post for label: ${label.identifier}, no language changes`);
          }
        } else {
          // Crear nuevo post para la etiqueta
          logger.info(`Creating new post for ${label.identifier}`);
          const post = await mainPost.reply({
            text: labelNames,
            facets: []
          });
          logger.info(`Created new post for label: ${label.identifier} with all languages`);
        }
      } catch (error) {
        logger.error(`Error processing label ${label.identifier}: ` + JSON.stringify(error, null, 2));
        // Continuar con la siguiente etiqueta
        continue;
      }
    }

    // Crear o mantener el post de borrado
    try {
      const deletePostText = 'Like this post to delete all labels.';
      const existingDeletePost = existingPosts.posts.find(post => 
        post.text === deletePostText
      );

      if (!existingDeletePost) {
        logger.info('Creating delete post...');
        await bot.post({ 
          text: deletePostText,
          facets: []
        });
        logger.info('Created delete post');
      } else {
        logger.info('Delete post already exists');
      }
    } catch (error) {
      logger.error('Error with delete post: ' + JSON.stringify(error, null, 2));
    }

    logger.info('Update completed successfully');
    process.exit(0);

  } catch (error) {
    logger.error('Error during update: ' + JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

main();

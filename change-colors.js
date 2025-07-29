import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du fichier actuel en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Définition des couleurs à remplacer
const replacements = [
  { from: '#FF5D14', to: '#8A2BE2' }, // Orange foncé à violet foncé
  { from: '#FF7A40', to: '#9370DB' }  // Orange clair à violet clair
];

// Fonction pour effectuer les remplacements dans le contenu d'un fichier
function replaceColors(content) {
  replacements.forEach(({ from, to }) => {
    // Création d'une expression régulière pour capturer toutes les occurrences (sensible à la casse)
    const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, to);
  });
  return content;
}

// Fonction récursive pour parcourir les répertoires
function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory() && file !== 'node_modules' && file !== '.git') {
      // Si c'est un répertoire (et pas node_modules ou .git), on traite son contenu
      processDirectory(fullPath);
    } else if (stats.isFile() && 
              (fullPath.endsWith('.tsx') || 
               fullPath.endsWith('.ts') || 
               fullPath.endsWith('.css') || 
               fullPath.endsWith('.scss'))) {
      // Si c'est un fichier avec les extensions spécifiées
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        // Vérifier si le fichier contient l'une des couleurs à remplacer
        if (replacements.some(({ from }) => content.includes(from))) {
          console.log(`Modification du fichier: ${fullPath}`);
          const modifiedContent = replaceColors(content);
          fs.writeFileSync(fullPath, modifiedContent, 'utf8');
        }
      } catch (error) {
        console.error(`Erreur lors du traitement du fichier ${fullPath}:`, error);
      }
    }
  });
}

// Point d'entrée - répertoire du projet
const projectDirectory = path.resolve(__dirname);
console.log(`Début du processus de remplacement des couleurs dans: ${projectDirectory}`);
processDirectory(projectDirectory);
console.log('Processus terminé!');

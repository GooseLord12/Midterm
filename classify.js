// ============================================================================
// ActionVault Chatbot — classify.js
// A Node.js chatbot that uses Ollama (localhost:11434) with gemma4:e2b to
// answer questions about ActionVault's features and the action figure
// collecting hobby/market in general.
// ============================================================================

const http = require('http');
const readline = require('readline');

// ---- Configuration ----

const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = 11434;
const MODEL = 'gemma4:e2b';

// ---- ActionVault Domain Knowledge ----
// This system prompt gives the LLM deep context about ActionVault so it can
// answer app-specific questions accurately, while also being knowledgeable
// about action figure collecting in general.

const SYSTEM_PROMPT = `You are ActionVault Assistant, a helpful chatbot for ActionVault — a personal action figure collection manager and wishlist tracker built as a web application.

## About ActionVault

ActionVault helps collectors organize, track, and showcase their action figure collections. It is a client-side web app (HTML/CSS/vanilla JavaScript) that stores all data in the browser's localStorage.

### Core Features
- **Add & Edit Figures**: Users can add action figures with detailed metadata including name, brand, series, year, type, condition, and notes.
- **Photo Upload**: Each figure can have a photo uploaded (resized to max 400px, compressed as JPEG at 0.7 quality to save localStorage space). PNG transparency is preserved.
- **Collection View**: Shows all owned figures in a responsive card grid layout.
- **Wishlist View**: A separate tab for figures the user wants to acquire, with priority levels (High, Medium, Low) and target prices.
- **Mark as Owned**: One-click conversion of a wishlist item to a collection item — switches the view and opens the edit modal so the user can fill in purchase details.
- **Search & Filter**: Real-time text search across name, brand, and series. Dropdown filters for Type and Brand that are dynamically populated from the user's data.
- **Results Count**: Shows "Showing X of Y figures" when filters are active.

### Figure Data Fields
Each figure record stores:
- **name** (required): The figure's name (e.g., "Boba Fett")
- **brand**: The manufacturer (e.g., "Hasbro", "McFarlane Toys", "Bandai", "NECA")
- **series**: The product line (e.g., "Star Wars Black Series", "Marvel Legends", "G.I. Joe Classified")
- **year**: Release year
- **type**: Figure format — one of: 3.75-inch, 6-inch, 12-inch, Statue, Model Kit, Other
- **condition** (collection only): Mint, Near Mint, Good, Fair, or Poor
- **purchasePrice** (collection only): What the user paid
- **currentValue** (collection only): Estimated current market value
- **purchaseDate** (collection only): When it was purchased
- **purchaseLocation** (collection only): Where it was bought (e.g., "Target", "eBay", "Convention")
- **notes**: Free-text field for any additional details
- **image**: An uploaded photo stored as a base64 data URL
- **isWishlist**: Boolean flag that determines if the figure appears in the Collection or Wishlist view
- **priority** (wishlist only): High, Medium, or Low
- **targetPrice** (wishlist only): The maximum the user is willing to pay

### Technical Architecture
- **store.js**: Data persistence layer — wraps localStorage with JSON parse/stringify and provides CRUD operations (getAll, getById, create, update, delete). Applies default values to all records so newer fields are always present even on older data.
- **app.js**: UI logic — handles modal open/close, form submission, view tab switching, search/filter, card rendering, image upload with canvas resizing, and the "Mark as Owned" workflow.
- **index.html**: DOM structure with a landing page, navbar, tab bar, filter bar, card grid, and a modal form overlay.
- **styles.css**: Dark theme (dark blue #1a1a2e / #16213e with red accent #e94560), responsive CSS Grid, animations, and condition/priority badges.
- IDs are generated using Date.now() timestamps.
- No backend server, no database, no user accounts — everything is in the browser.

### Known Limitations
- localStorage has a ~5MB limit; clearing browser data deletes the entire collection.
- No export/import functionality.
- No sorting by name, date, or value.
- No user accounts or cloud sync.
- Images are low-resolution due to localStorage constraints.

## Your Role
You are an expert in both ActionVault and the broader world of action figure collecting. You can:
1. Answer questions about how ActionVault works, its features, and its data model.
2. Help users troubleshoot issues (e.g., storage full, images not loading).
3. Discuss action figure collecting — brands, series, grading/condition, market values, buying/selling tips, storage and display advice.
4. Provide market insight on popular lines like Star Wars Black Series, Marvel Legends, McFarlane DC Multiverse, MAFEX, S.H. Figuarts, NECA, G.I. Joe Classified, Transformers, Masters of the Universe, and more.
5. Explain collecting terminology: MOC (Mint on Card), MIB (Mint in Box), loose, chase variant, exclusive, short-packed, shelf-warming, grail, etc.

Keep answers concise and helpful. If a question is about ActionVault, reference the specific features. If it is about collecting in general, share practical knowledge.`;

// ---- Conversation History ----
// We maintain a rolling history so the model has multi-turn context.

const conversationHistory = [];
const MAX_HISTORY = 20; // Keep last 20 exchanges to avoid context overflow

// ---- Ollama API Call ----
// Sends a chat completion request to the Ollama REST API and streams the
// response token-by-token so the user sees text appear in real time.

function chat(userMessage) {
  return new Promise((resolve, reject) => {
    // Add user message to history
    conversationHistory.push({ role: 'user', content: userMessage });

    // Trim history if it gets too long
    while (conversationHistory.length > MAX_HISTORY * 2) {
      conversationHistory.shift();
    }

    // Build the messages array with system prompt + conversation history
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory
    ];

    const payload = JSON.stringify({
      model: MODEL,
      messages: messages,
      stream: true
    });

    const options = {
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = http.request(options, (res) => {
      let fullResponse = '';
      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString();

        // Ollama streams newline-delimited JSON objects
        const lines = buffer.split('\n');
        // Keep the last (possibly incomplete) line in the buffer
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.message && parsed.message.content) {
              const token = parsed.message.content;
              process.stdout.write(token);
              fullResponse += token;
            }
          } catch (e) {
            // Incomplete JSON chunk — skip
          }
        }
      });

      res.on('end', () => {
        // Process any remaining data in the buffer
        if (buffer.trim()) {
          try {
            const parsed = JSON.parse(buffer);
            if (parsed.message && parsed.message.content) {
              const token = parsed.message.content;
              process.stdout.write(token);
              fullResponse += token;
            }
          } catch (e) {
            // Ignore
          }
        }

        process.stdout.write('\n\n');

        // Add assistant response to history
        conversationHistory.push({ role: 'assistant', content: fullResponse });
        resolve(fullResponse);
      });

      res.on('error', reject);
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.error('\n[Error] Cannot connect to Ollama at http://localhost:11434');
        console.error('Make sure Ollama is running: ollama serve\n');
      } else {
        console.error('\n[Error]', err.message);
      }
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

// ---- Classify Intent (for logging/debugging) ----
// Simple keyword classifier that tags each user message so we can see what
// category of question is being asked. This runs locally — no LLM call needed.

function classifyIntent(message) {
  const lower = message.toLowerCase();

  // ActionVault-specific keywords
  const appKeywords = [
    'actionvault', 'action vault', 'app', 'add figure', 'edit figure',
    'wishlist', 'collection', 'modal', 'filter', 'search', 'localstorage',
    'store.js', 'app.js', 'upload', 'photo', 'image', 'mark as owned',
    'delete figure', 'card', 'grid', 'landing page', 'tab', 'form',
    'condition badge', 'priority badge', 'target price', 'purchase price',
    'current value', 'fig-', 'storage full', 'export', 'import'
  ];

  // Market / valuation keywords
  const marketKeywords = [
    'worth', 'value', 'price', 'market', 'invest', 'sell', 'buy',
    'auction', 'ebay', 'mercari', 'grail', 'rare', 'exclusive',
    'short-packed', 'chase', 'appreciation', 'depreciation', 'flip',
    'retail', 'aftermarket', 'scalp'
  ];

  // Collecting hobby keywords
  const collectingKeywords = [
    'collect', 'display', 'shelf', 'detolf', 'diorama', 'pose',
    'accessory', 'articulation', 'joint', 'mint', 'loose', 'moc', 'mib',
    'nib', 'unbox', 'package', 'blister', 'clamshell', 'storage',
    'protect', 'uv', 'custom', 'kitbash', 'repaint', 'head swap'
  ];

  // Brand/series keywords
  const brandKeywords = [
    'hasbro', 'mattel', 'mcfarlane', 'neca', 'bandai', 'mafex',
    'figuarts', 'figma', 'mezco', 'hot toys', 'sideshow', 'storm',
    'super7', 'jazwares', 'spin master', 'black series', 'marvel legends',
    'classified', 'dc multiverse', 'transformers', 'masters of the universe',
    'motu', 'g.i. joe', 'star wars', 'marvel', 'dc', 'spawn',
    'teenage mutant', 'tmnt', 'power rangers', 'lightning collection'
  ];

  const isApp = appKeywords.some(k => lower.includes(k));
  const isMarket = marketKeywords.some(k => lower.includes(k));
  const isCollecting = collectingKeywords.some(k => lower.includes(k));
  const isBrand = brandKeywords.some(k => lower.includes(k));

  const tags = [];
  if (isApp) tags.push('actionvault');
  if (isMarket) tags.push('market');
  if (isCollecting) tags.push('collecting');
  if (isBrand) tags.push('brands');

  if (tags.length === 0) tags.push('general');

  return tags;
}

// ---- Interactive REPL ----

async function main() {
  console.log('='.repeat(60));
  console.log('  ActionVault Chatbot');
  console.log('  Powered by Ollama (' + MODEL + ')');
  console.log('='.repeat(60));
  console.log();
  console.log('Ask me anything about ActionVault or action figure collecting!');
  console.log('Type "quit" or "exit" to leave.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let closed = false;

  rl.on('close', () => {
    closed = true;
    console.log('\nGoodbye! Happy collecting!');
    process.exit(0);
  });

  const prompt = () => {
    if (closed) return;

    rl.question('You: ', async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      if (trimmed.toLowerCase() === 'quit' || trimmed.toLowerCase() === 'exit') {
        console.log('Goodbye! Happy collecting!');
        rl.close();
        return;
      }

      // Classify and display intent tags
      const tags = classifyIntent(trimmed);
      console.log(`[${tags.join(', ')}]`);
      process.stdout.write('\nAssistant: ');

      try {
        await chat(trimmed);
      } catch (err) {
        // Error already logged in chat()
      }

      prompt();
    });
  };

  prompt();
}

main();

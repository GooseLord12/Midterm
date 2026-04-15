// ============================================================================
// ActionVault Chat Widget — Client-side chat logic
// Sends messages to /api/chat (proxied to Ollama) and streams responses
// into a floating chat panel embedded in the app.
// ============================================================================

(function () {
  var MODEL = 'gemma4:e2b';

  var SYSTEM_PROMPT = 'You are JARVIS, a helpful chatbot for ActionVault \u2014 a personal action figure collection manager and wishlist tracker built as a web application.\n\n' +
    '## About ActionVault\n\n' +
    'ActionVault helps collectors organize, track, and showcase their action figure collections. It is a client-side web app (HTML/CSS/vanilla JavaScript) that stores all data in the browser\'s localStorage.\n\n' +
    '### Core Features\n' +
    '- **Add & Edit Figures**: Users can add action figures with detailed metadata including name, brand, series, year, type, condition, and notes.\n' +
    '- **Photo Upload**: Each figure can have a photo uploaded (resized to max 400px, compressed as JPEG).\n' +
    '- **Collection View**: Shows all owned figures in a responsive card grid layout.\n' +
    '- **Wishlist View**: A separate tab for figures the user wants to acquire, with priority levels (High, Medium, Low) and target prices.\n' +
    '- **Mark as Owned**: One-click conversion of a wishlist item to a collection item.\n' +
    '- **Search & Filter**: Real-time text search across name, brand, and series. Dropdown filters for Type and Brand.\n\n' +
    '### Figure Data Fields\n' +
    'Each figure record stores: name (required), brand, series, year, type (3.75-inch, 6-inch, 12-inch, Statue, Model Kit, Other), condition (Mint, Near Mint, Good, Fair, Poor), purchasePrice, currentValue, purchaseDate, purchaseLocation, notes, image, isWishlist, priority (High, Medium, Low), targetPrice.\n\n' +
    '### Known Limitations\n' +
    '- localStorage has a ~5MB limit; clearing browser data deletes the collection.\n' +
    '- No export/import, no sorting, no user accounts, no cloud sync.\n\n' +
    '## Your Role\n' +
    'You are an expert in both ActionVault and action figure collecting. You can:\n' +
    '1. Answer questions about how ActionVault works.\n' +
    '2. Help troubleshoot issues.\n' +
    '3. Discuss action figure collecting \u2014 brands, series, grading, market values, buying/selling tips, display advice.\n' +
    '4. Explain collecting terminology: MOC, MIB, loose, chase variant, exclusive, short-packed, grail, etc.\n\n' +
    'Keep answers concise and helpful.';

  var conversationHistory = [];
  var MAX_HISTORY = 20;
  var isStreaming = false;

  // ---- DOM References ----

  var chatToggle = document.getElementById('chat-toggle');
  var chatPanel = document.getElementById('chat-panel');
  var chatClose = document.getElementById('chat-close');
  var chatMessages = document.getElementById('chat-messages');
  var chatInput = document.getElementById('chat-input');
  var chatSend = document.getElementById('chat-send');

  // ---- Toggle Chat Panel ----

  chatToggle.addEventListener('click', function () {
    chatPanel.classList.toggle('hidden');
    chatToggle.classList.toggle('chat-toggle-active');
    if (!chatPanel.classList.contains('hidden')) {
      chatInput.focus();
    }
  });

  chatClose.addEventListener('click', function () {
    chatPanel.classList.add('hidden');
    chatToggle.classList.remove('chat-toggle-active');
  });

  // ---- Send Message ----

  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  function sendMessage() {
    var text = chatInput.value.trim();
    if (!text || isStreaming) return;

    // Display user message
    appendMessage('user', text);
    chatInput.value = '';

    // Classify intent and show tag
    var tags = classifyIntent(text);
    appendTag(tags);

    // Stream LLM response
    streamChat(text);
  }

  // ---- Append Messages to Chat ----

  function appendMessage(role, content) {
    var div = document.createElement('div');
    div.className = 'chat-msg chat-msg-' + role;

    var label = document.createElement('span');
    label.className = 'chat-msg-label';
    label.textContent = role === 'user' ? 'You' : 'JARVIS';

    var body = document.createElement('div');
    body.className = 'chat-msg-body';
    body.textContent = content;

    div.appendChild(label);
    div.appendChild(body);
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return body;
  }

  function appendTag(tags) {
    var div = document.createElement('div');
    div.className = 'chat-tag';
    div.textContent = '[' + tags.join(', ') + ']';
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ---- Stream Chat from Ollama via Proxy ----

  function streamChat(userMessage) {
    isStreaming = true;
    chatSend.disabled = true;
    chatInput.disabled = true;

    conversationHistory.push({ role: 'user', content: userMessage });

    // Trim history
    while (conversationHistory.length > MAX_HISTORY * 2) {
      conversationHistory.shift();
    }

    var messages = [{ role: 'system', content: SYSTEM_PROMPT }].concat(conversationHistory);

    // Create assistant message bubble for streaming into
    var assistantBody = appendMessage('assistant', '');
    var fullResponse = '';

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages: messages, stream: true })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Server error: ' + res.status);

        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';

        function read() {
          return reader.read().then(function (result) {
            if (result.done) {
              // Process any remaining buffer
              if (buffer.trim()) {
                processLine(buffer);
              }
              conversationHistory.push({ role: 'assistant', content: fullResponse });
              isStreaming = false;
              chatSend.disabled = false;
              chatInput.disabled = false;
              chatInput.focus();
              return;
            }

            buffer += decoder.decode(result.value, { stream: true });
            var lines = buffer.split('\n');
            buffer = lines.pop();

            for (var i = 0; i < lines.length; i++) {
              processLine(lines[i]);
            }

            return read();
          });
        }

        function processLine(line) {
          if (!line.trim()) return;
          try {
            var parsed = JSON.parse(line);
            if (parsed.message && parsed.message.content) {
              fullResponse += parsed.message.content;
              assistantBody.textContent = fullResponse;
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }
          } catch (e) {
            // Incomplete JSON — skip
          }
        }

        return read();
      })
      .catch(function (err) {
        assistantBody.textContent = 'Error: ' + err.message + '. Make sure Ollama is running.';
        isStreaming = false;
        chatSend.disabled = false;
        chatInput.disabled = false;
      });
  }

  // ---- Intent Classifier (same logic as classify.js) ----

  function classifyIntent(message) {
    var lower = message.toLowerCase();

    var appKeywords = [
      'actionvault', 'action vault', 'app', 'add figure', 'edit figure',
      'wishlist', 'collection', 'modal', 'filter', 'search', 'localstorage',
      'store.js', 'app.js', 'upload', 'photo', 'image', 'mark as owned',
      'delete figure', 'card', 'grid', 'landing page', 'tab', 'form',
      'condition badge', 'priority badge', 'target price', 'purchase price',
      'current value', 'fig-', 'storage full', 'export', 'import'
    ];

    var marketKeywords = [
      'worth', 'value', 'price', 'market', 'invest', 'sell', 'buy',
      'auction', 'ebay', 'mercari', 'grail', 'rare', 'exclusive',
      'short-packed', 'chase', 'appreciation', 'depreciation', 'flip',
      'retail', 'aftermarket', 'scalp'
    ];

    var collectingKeywords = [
      'collect', 'display', 'shelf', 'detolf', 'diorama', 'pose',
      'accessory', 'articulation', 'joint', 'mint', 'loose', 'moc', 'mib',
      'nib', 'unbox', 'package', 'blister', 'clamshell', 'storage',
      'protect', 'uv', 'custom', 'kitbash', 'repaint', 'head swap'
    ];

    var brandKeywords = [
      'hasbro', 'mattel', 'mcfarlane', 'neca', 'bandai', 'mafex',
      'figuarts', 'figma', 'mezco', 'hot toys', 'sideshow', 'storm',
      'super7', 'jazwares', 'spin master', 'black series', 'marvel legends',
      'classified', 'dc multiverse', 'transformers', 'masters of the universe',
      'motu', 'g.i. joe', 'star wars', 'marvel', 'dc', 'spawn',
      'teenage mutant', 'tmnt', 'power rangers', 'lightning collection'
    ];

    var isApp = appKeywords.some(function (k) { return lower.indexOf(k) !== -1; });
    var isMarket = marketKeywords.some(function (k) { return lower.indexOf(k) !== -1; });
    var isCollecting = collectingKeywords.some(function (k) { return lower.indexOf(k) !== -1; });
    var isBrand = brandKeywords.some(function (k) { return lower.indexOf(k) !== -1; });

    var tags = [];
    if (isApp) tags.push('actionvault');
    if (isMarket) tags.push('market');
    if (isCollecting) tags.push('collecting');
    if (isBrand) tags.push('brands');

    if (tags.length === 0) tags.push('general');
    return tags;
  }
})();

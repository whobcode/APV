// APV - AI Integration Module
// Handles all AI-powered features using Cloudflare Workers AI

class AIAssistant {
  constructor() {
    this.isEnabled = false;
    this.explanationQueue = [];
    this.isProcessing = false;
    this.lastExplanation = null;
    this.debounceTimer = null;
  }

  // Enable/disable AI explanations
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Explain a single step
  async explainStep(algorithm, step, context) {
    if (!this.isEnabled) return null;

    try {
      const response = await fetch('/api/explain-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm, step, context })
      });

      if (!response.ok) throw new Error('Failed to get explanation');

      const data = await response.json();
      return data.explanation;
    } catch (error) {
      console.error('AI explanation error:', error);
      return null;
    }
  }

  // Debounced explanation (to avoid too many requests)
  async explainStepDebounced(algorithm, step, context, callback) {
    if (!this.isEnabled) return;

    // Clear previous timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Only explain visit steps (not every frontier addition)
    if (step.type !== 'visit' && step.type !== 'path' && step.type !== 'no-path') {
      return;
    }

    this.debounceTimer = setTimeout(async () => {
      const explanation = await this.explainStep(algorithm, step, context);
      if (explanation && callback) {
        callback(explanation);
      }
    }, 300); // 300ms debounce
  }

  // Parse natural language problem description
  async parseProblem(description, gridSize) {
    try {
      const response = await fetch('/api/parse-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, gridSize })
      });

      if (!response.ok) throw new Error('Failed to parse problem');

      return await response.json();
    } catch (error) {
      console.error('AI parse error:', error);
      return null;
    }
  }

  // Get algorithm recommendation
  async getRecommendation(scenario, hasWeights, gridSize, obstacleCount) {
    try {
      const response = await fetch('/api/recommend-algorithm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, hasWeights, gridSize, obstacleCount })
      });

      if (!response.ok) throw new Error('Failed to get recommendation');

      return await response.json();
    } catch (error) {
      console.error('AI recommendation error:', error);
      return null;
    }
  }

  // Explain an algorithm in detail
  async explainAlgorithm(algorithm) {
    try {
      const response = await fetch('/api/explain-algorithm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm })
      });

      if (!response.ok) throw new Error('Failed to get explanation');

      return await response.json();
    } catch (error) {
      console.error('AI algorithm explanation error:', error);
      return null;
    }
  }
}

// UI Helper Functions
const AIUIHelper = {
  showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.classList.remove('hidden');
    }
  },

  hideLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.classList.add('hidden');
    }
  },

  setExplanation(content) {
    const el = document.getElementById('ai-explanation-content');
    if (el) {
      el.innerHTML = `<p>${content}</p>`;
    }
  },

  showRecommendation(recommendation) {
    const panel = document.getElementById('ai-recommendation-panel');
    const content = document.getElementById('ai-recommendation-content');

    if (panel && content) {
      const algoNames = {
        astar: 'A* Search',
        dijkstra: "Dijkstra's Algorithm",
        bfs: 'Breadth-First Search',
        dfs: 'Depth-First Search',
        greedy: 'Greedy Best-First'
      };

      const recName = algoNames[recommendation.recommended] || recommendation.recommended;
      const altNames = (recommendation.alternatives || [])
        .map(a => algoNames[a] || a)
        .join(', ');

      content.innerHTML = `
        <div class="recommendation-main">
          <strong>Recommended:</strong> ${recName}
        </div>
        <p class="recommendation-reason">${recommendation.reason}</p>
        ${altNames ? `<p class="recommendation-alts"><strong>Alternatives:</strong> ${altNames}</p>` : ''}
        <button class="btn btn-small btn-primary use-recommendation-btn">Use ${recName}</button>
      `;

      panel.classList.remove('hidden');

      // Add click handler for use button
      const useBtn = content.querySelector('.use-recommendation-btn');
      if (useBtn) {
        useBtn.addEventListener('click', () => {
          const select = document.getElementById('algorithm-select');
          if (select) {
            // Map display name back to value
            const valueMap = {
              'A* Search': 'astar',
              "Dijkstra's Algorithm": 'dijkstra',
              'Breadth-First Search': 'bfs',
              'Depth-First Search': 'dfs',
              'Greedy Best-First': 'greedy'
            };
            select.value = valueMap[recName] || recommendation.recommended;
            select.dispatchEvent(new Event('change'));
          }
          panel.classList.add('hidden');
        });
      }
    }
  },

  hideRecommendation() {
    const panel = document.getElementById('ai-recommendation-panel');
    if (panel) {
      panel.classList.add('hidden');
    }
  },

  showModal(title, content) {
    const modal = document.getElementById('ai-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    if (modal && modalTitle && modalBody) {
      modalTitle.textContent = title;
      modalBody.innerHTML = content;
      modal.classList.remove('hidden');
    }
  },

  hideModal() {
    const modal = document.getElementById('ai-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  },

  showModalLoading() {
    const modalBody = document.getElementById('modal-body');
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="ai-loading">
          <div class="ai-spinner"></div>
          <span>Generating explanation...</span>
        </div>
      `;
    }
  }
};

// Export
window.AIAssistant = AIAssistant;
window.AIUIHelper = AIUIHelper;
